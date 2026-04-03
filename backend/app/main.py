import os
import re
import json
import subprocess
from typing import Optional, List, Dict

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Internal Imports
from app.database import init_db, get_session
from app.models import MortalityData, ResearchRecord
from app.services.pubmed import run_pubmed_extraction
from app.services.medgemma import extract_pico
from app.services.analytics_service import get_temporal_mismatch_stats, get_niche_mortality_summary
from app.extract_recent_abstracts import (
    search_pubmed, fetch_abstracts, fetch_clinical_trials, summarize_text
)
from app.database_recent_extracts import CachedSummary, CachedClinicalTrial
from sqlalchemy.dialects.postgresql import insert


# =========================
# 🔹 APP LIFECYCLE
# =========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="GI Research API", lifespan=lifespan)

# =========================
# 🔹 CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://go-research-analysis-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 🔹 SCHEMAS
# =========================
class HealthResponse(BaseModel):
    status: str
    engine: str
    model: str


class ExtractParams(BaseModel):
    niche: Optional[str] = "Lean_MASLD"
    source: Optional[str] = "PubMed"
    max_abstracts: int = 3
    exclude_reviews: bool = True
    year_min: int = 2024
    year_max: int = 2026
    llm_backend: str = "ollama"


class SearchRequest(BaseModel):
    query: str
    max_results: int = 5
    year: Optional[int] = None
    provider: Optional[str] = None
    sources: Optional[List[str]] = ["pubmed"]
    bypass_cache: Optional[bool] = False


class PaperResult(BaseModel):
    paper_id: str
    abstract: str
    summary: str
    year: int
    cached: bool


class SourceResult(BaseModel):
    source: str
    data: List[PaperResult]


# =========================
# 🔹 HEALTH & STATUS
# =========================
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "online",
        "engine": os.getenv("MEDGEMMA_BACKEND", "ollama"),
        "model": os.getenv("OLLAMA_MODEL", "medgemma-gi")
    }

class StatusResponse(BaseModel):
    stage: str    # "starting_gpu" | "loading_model" | "online" | "offline"
    label: str    # Human-readable label shown in the sidebar
    ok: bool      # True only when stage == "online"
    workers: dict = {}
    jobs: dict    = {}

@app.get("/api/status", response_model=StatusResponse)
async def runpod_status():
    endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID", "")
    if not endpoint_id:
        full_url = os.getenv("RUNPOD_ENDPOINT", "")
        parts = [p for p in full_url.split("/") if p]
        try:
            v2_idx = parts.index("v2")
            endpoint_id = parts[v2_idx + 1]
        except (ValueError, IndexError):
            pass

    if not endpoint_id or not os.getenv("RUNPOD_API_KEY"):
        return StatusResponse(stage="online", label="MedGemma is Online", ok=True)

    health_url = f"https://api.runpod.ai/v2/{endpoint_id}/health"
    headers = {"Authorization": f"Bearer {os.getenv('RUNPOD_API_KEY')}", "Content-Type": "application/json"}

    import requests as req
    try:
        r = req.get(health_url, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
    except Exception:
        return StatusResponse(stage="starting_gpu", label="Starting GPU", ok=False)

    workers = data.get("workers", {})
    idle, ready, running = workers.get("idle", 0), workers.get("ready", 0), workers.get("running", 0)
    initializing, throttled, unhealthy = workers.get("initializing", 0), workers.get("throttled", 0), workers.get("unhealthy", 0)

    if (idle + ready + running) > 0: stage, label = "online", "MedGemma is Online"
    elif (initializing + throttled) > 0: stage, label = "loading_model", "Loading Model"
    elif unhealthy > 0: stage, label = "offline", "Backend Offline"
    else: stage, label = "starting_gpu", "Starting GPU"

    return StatusResponse(stage=stage, label=label, ok=(stage == "online"), workers=workers, jobs=data.get("jobs", {}))

# =========================
# 🔹 ANALYTICS
# =========================
@app.get("/api/analytics/temporal-mismatch")
def temporal_mismatch_endpoint(session: Session = Depends(get_session)):
    return get_temporal_mismatch_stats(session)


@app.get("/api/analytics/mortality-summary")
def mortality_summary_endpoint(session: Session = Depends(get_session)):
    return get_niche_mortality_summary(session)


@app.get("/api/stats")
async def get_stats(session: Session = Depends(get_session)):
    try:
        return {
            "cdc_count": session.exec(select(func.count()).select_from(MortalityData)).one(),
            "research_count": session.exec(select(func.count()).select_from(ResearchRecord)).one()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats/timeline")
async def get_timeline_stats(session: Session = Depends(get_session)):
    try:
        mortality_results = session.exec(
            select(MortalityData.year, func.sum(MortalityData.deaths))
            .where(MortalityData.year >= 1999, MortalityData.year <= 2024)
            .group_by(MortalityData.year)
        ).all()

        research_results = session.exec(
            select(ResearchRecord.year, func.count(ResearchRecord.id))
            .group_by(ResearchRecord.year)
        ).all()

        mort_map = {str(int(y)): d for y, d in mortality_results}
        res_map = {str(int(y)): c for y, c in research_results}
        labels = [str(year) for year in range(1999, 2025)]

        return {
            "labels": labels,
            "cdc": [mort_map.get(y, 0) for y in labels],
            "research": [res_map.get(y, 0) for y in labels]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔹 EXTRACTION PIPELINE
# =========================
@app.post("/api/extract/recent")
async def extract_recent(params: ExtractParams, session: Session = Depends(get_session)):
    try:
        results = []
        source_label = "PubMed" if params.source == "PubMed" else "ClinicalTrials"
        
        if params.source == "PubMed":
            pubmed_ids = search_pubmed(params.niche, max_results=params.max_abstracts)
            abstracts = fetch_abstracts(pubmed_ids)
            results = [{"source": "PubMed", "pmid": pid, "abstract": abs_text, "title": f"PubMed {pid}", "year": 2024}
                       for pid, abs_text in zip(pubmed_ids, abstracts)]
        else:
            trials = fetch_clinical_trials(params.niche, page_size=params.max_abstracts)
            results = [{"source": "ClinicalTrials", "nct_id": t["id"], "abstract": t["abstract"], "title": f"Trial {t['id']}", "year": 2024}
                       for t in trials]

        final_records = []
        for res in results:
            sid = res.get('pmid') or res.get('nct_id')
            if not sid: continue

            ext_id = f"{res['source']}_{sid}"
            pico_data = extract_pico(res["abstract"], backend=params.llm_backend)
            
            # Ensure pico_json is a real dict to prevent "Not Synchronized" errors
            pico_json = pico_data if isinstance(pico_data, dict) else {"error": "Invalid Format"}

            record_data = {
                "external_id": ext_id,
                "source": res["source"],
                "title": res["title"],
                "abstract": res["abstract"],
                "niche": params.niche,
                "year": int(res["year"]),
                "pico_json": pico_json,
                "pico_text": str(pico_data)
            }

            existing = session.exec(select(ResearchRecord).where(ResearchRecord.external_id == ext_id)).first()
            if not existing:
                db_record = ResearchRecord(**record_data)
                session.add(db_record)
                final_records.append(db_record)
            else:
                final_records.append(existing)

        session.commit()
        return {"results": final_records}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from app.services.paper_service import fetch_pubmed_full_text, fetch_ct_full_text

@app.post("/api/extract/paper")
async def extract_paper(request: dict, session: Session = Depends(get_session)):
    source = request.get("source", "PMID")
    niche = request.get("niche", "Manual_Extract")
    paper_id = str(request.get("id", "")).strip()

    try:
        full_text = fetch_pubmed_full_text(paper_id) if source == "PMID" else fetch_ct_full_text(paper_id)
        ext_id = f"{source}_{paper_id}"
        
        record = session.exec(select(ResearchRecord).where(ResearchRecord.external_id == ext_id)).first()
        if record:
            record.full_text = full_text
            session.add(record)
        else:
            record = ResearchRecord(
                external_id=ext_id,
                source="PubMed" if source == "PMID" else "ClinicalTrials",
                title=f"Paper {paper_id}",
                abstract="Full text retrieved manually.",
                niche=niche,
                year=2024,
                full_text=full_text
            )
            session.add(record)

        session.commit()
        return {"external_id": ext_id, "title": record.title, "full_text": full_text}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔹 EXPLORER APIs
# =========================

# FIXED: Re-added the exact alias the frontend expects for niches
@app.get("/api/records")
async def get_records_by_niche(niche: str, session: Session = Depends(get_session)):
    """Handles the niche-specific filtering to fix the 404 error."""
    try:
        statement = select(ResearchRecord).where(ResearchRecord.niche == niche).order_by(ResearchRecord.year.desc())
        results = session.exec(statement).all()
        # Return exact structure frontend expects
        return {"records": results} if results else {"records": [], "message": "No matches found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/research/list")
async def list_research(session: Session = Depends(get_session)):
    try:
        results = session.exec(select(ResearchRecord).order_by(ResearchRecord.year.desc())).all()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_pico_section(label: str, text: str) -> str:
    pattern = rf'\*\s*\*\*{label}:\*\*\s*(.*?)(?=\*\s*\*\*|\Z)'
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text[:300]

@app.get("/api/research/{external_id}")
async def get_research_detail(external_id: str, session: Session = Depends(get_session)):
    record = session.exec(select(ResearchRecord).where(ResearchRecord.external_id == external_id)).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Fix for the "Not Synchronized" visual error
    if not record.pico_json and record.pico_text:
        text = record.pico_text
        record.pico_json = {
            "population": extract_pico_section("Population", text),
            "intervention": extract_pico_section("Intervention", text),
            "comparison": extract_pico_section("Comparison", text),
            "outcome": extract_pico_section("Outcome", text),
        }
    return record


# =========================
# 🔹 SEARCH SOURCE
# =========================
@app.post("/api/search")
async def search_sources(req: SearchRequest, db: Session = Depends(get_session)):
    current_provider = req.provider or os.getenv("LLM_PROVIDER", "ollama")
    os.environ["LLM_PROVIDER"] = current_provider
    response_data = []

    if "pubmed" in req.sources:
        pubmed_results = []
        try:
            pubmed_ids = search_pubmed(req.query, max_results=req.max_results, year=req.year)
            for p_id in pubmed_ids:
                fetch_results = fetch_abstracts([p_id], year=req.year)
                if not fetch_results: continue
                abstract_data = fetch_results[0]
                summary = summarize_text(abstract_data["abstract"])
                pubmed_results.append(PaperResult(paper_id=p_id, abstract=abstract_data["abstract"], summary=summary, year=abstract_data["year"], cached=False))
        except Exception: pass
        response_data.append({"source": "pubmed", "data": pubmed_results})

    if "clinicaltrials" in req.sources:
        ct_results = []
        try:
            trials = fetch_clinical_trials(req.query, page_size=req.max_results, year=req.year)
            for trial in trials:
                summary = summarize_text(trial.get("abstract", ""))
                ct_results.append(PaperResult(paper_id=trial["id"], abstract=trial["abstract"], summary=summary, year=trial.get("year", 2024), cached=False))
        except Exception: pass
        response_data.append({"source": "clinicaltrials", "data": ct_results})

    return {"results": response_data}


# =========================
# 🔹 BACKGROUND EXTRACTION
# =========================
@app.post("/api/tools/extract-pubmed")
def trigger_pubmed_extraction(pmid: str, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    def worker():
        abs_text = fetch_abstracts([pmid])[0]
        summarize_text(abs_text)
    background_tasks.add_task(worker)
    return {"status": "started", "target": pmid}


# =========================
# 🔹 ROOT
# =========================
@app.get("/")
async def root():
    return {"message": "GI Research Evidence Engine API is Running"}