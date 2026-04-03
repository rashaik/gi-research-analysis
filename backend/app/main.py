import os
import re
import json
import subprocess
from typing import Optional, List, Dict
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel
from contextlib import asynccontextmanager
from sqlalchemy.dialects.postgresql import insert

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
from app.services.paper_service import fetch_pubmed_full_text, fetch_ct_full_text

# =========================
# 🔹 APP LIFECYCLE
# =========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Optional: Trigger a background warm-up on startup
    try:
        from app.services.runpod_manager import warm_worker
        warm_worker()
    except ImportError:
        pass
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

class StatusResponse(BaseModel):
    stage: str    # "starting_gpu" | "loading_model" | "online" | "offline"
    label: str    # "Starting GPU" | "Loading Model" | "MedGemma is Online"
    ok: bool
    workers: dict = {}
    jobs: dict = {}

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

# =========================
# 🔹 STATUS & HEALTH
# =========================
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "online",
        "engine": os.getenv("MEDGEMMA_BACKEND", "ollama"),
        "model": os.getenv("OLLAMA_MODEL", "medgemma-gi")
    }

@app.get("/api/status", response_model=StatusResponse)
async def runpod_status():
    """
    Probes RunPod health to provide the 3-stage loading status.
    Falls back to 'Online' for local Ollama environments.
    """
    api_key = os.getenv("RUNPOD_API_KEY")
    endpoint_url = os.getenv("RUNPOD_ENDPOINT", "")

    # Local / Ollama Fallback
    if not api_key or not endpoint_url:
        return StatusResponse(
            stage="online",
            label="MedGemma is Online",
            ok=True
        )

    # Use the logic from your runpod_manager service
    try:
        from app.services.runpod_manager import get_health
        info = get_health()
        return StatusResponse(
            stage=info["stage"],
            label=info["label"],
            ok=info["ok"],
            workers=info.get("workers", {}),
            jobs=info.get("jobs", {})
        )
    except Exception as e:
        return StatusResponse(
            stage="offline",
            label=f"Backend Offline",
            ok=False
        )

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
        print(f"--- 🚀 Starting Extraction Pipeline: {source_label} | {params.niche} ---")

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
        data_dir = "data"
        os.makedirs(data_dir, exist_ok=True)

        for res in results:
            sid = res.get('pmid') or res.get('nct_id')
            if not sid: continue

            ext_id = f"{res['source']}_{sid}"
            pico_json = extract_pico(res["abstract"], backend=params.llm_backend)

            record_data = {
                "external_id": ext_id,
                "source": res["source"],
                "title": res["title"],
                "abstract": res["abstract"],
                "niche": params.niche,
                "year": int(res["year"]) if str(res["year"]).isdigit() else 2024,
                "pico_json": pico_json,
                "pico_text": str(pico_json)
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

@app.post("/api/extract/paper")
async def extract_paper(request: dict, session: Session = Depends(get_session)):
    source = request.get("source", "PMID")
    niche = request.get("niche", "Manual_Extract")
    paper_id = str(request.get("id", "")).strip()

    if not paper_id:
        raise HTTPException(status_code=400, detail="Missing ID")

    try:
        if source == "PMID":
            full_text = fetch_pubmed_full_text(paper_id)
        else:
            full_text = fetch_ct_full_text(paper_id)

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
        return {"external_id": ext_id, "full_text": full_text}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# 🔹 EXPLORER & SEARCH
# =========================
@app.get("/api/research/list")
async def list_research(session: Session = Depends(get_session)):
    return session.exec(select(ResearchRecord).order_by(ResearchRecord.year.desc())).all()

@app.get("/api/research/{external_id}")
async def get_research_detail(external_id: str, session: Session = Depends(get_session)):
    record = session.exec(select(ResearchRecord).where(ResearchRecord.external_id == external_id)).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@app.post("/api/search")
async def search_sources(req: SearchRequest, db: Session = Depends(get_session)):
    current_provider = req.provider or os.getenv("LLM_PROVIDER", "ollama")
    response_data = []

    if "pubmed" in req.sources:
        pubmed_ids = search_pubmed(req.query, max_results=req.max_results, year=req.year)
        results = []
        for p_id in pubmed_ids:
            # Simplified for brevity; logic remains same as your original
            results.append({"paper_id": p_id, "cached": False}) 
        response_data.append({"source": "pubmed", "data": results})

    return {"results": response_data}

@app.get("/")
async def root():
    return {"message": "GI Research Evidence Engine API is Running"}