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
from app.services.runpod_manager import warm_worker, cmd_warm, cmd_status
from app.extract_recent_abstracts import (
    search_pubmed, fetch_abstracts, fetch_clinical_trials, summarize_text
)
from app.database_recent_extracts import CachedSummary, CachedClinicalTrial
from sqlalchemy.dialects.postgresql import insert

import httpx # Recommended: pip install httpx

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
    # Default to the environment variable, fallback to ollama
    llm_backend: str = os.getenv("MEDGEMMA_BACKEND", "ollama")


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
# 🔹 HEALTH
# =========================
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    # Use your existing LLM_PROVIDER variable
    provider = os.getenv("LLM_PROVIDER", "ollama")
    return {
        "status": "online",
        "engine": provider,
        "model": os.getenv("OLLAMA_MODEL", "medgemma-gi")
    }

class StatusResponse(BaseModel):
    stage: str    # "starting_gpu" | "loading_model" | "online" | "offline"
    label: str    # Human-readable label
    ok: bool      
    workers: Dict = {}
    jobs: Dict = {}

@app.get("/api/status", response_model=StatusResponse)
async def runpod_status():
    api_key = os.getenv("RUNPOD_API_KEY")
    endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID", "")
    provider = os.getenv("LLM_PROVIDER", "ollama") # Added this

    # Check provider instead of just checking for keys
    if provider == "ollama":
        return StatusResponse(stage="online", label="Local Engine Online", ok=True)
        
    # 1. Parse Endpoint ID from URL if not explicitly set
    if not endpoint_id:
        full_url = os.getenv("RUNPOD_ENDPOINT", "")
        parts = [p for p in full_url.split("/") if p]
        try:
            v2_idx = parts.index("v2")
            endpoint_id = parts[v2_idx + 1]
        except (ValueError, IndexError):
            pass

    # 2. Fallback for Local/Ollama development
    if not endpoint_id or not api_key:
        return StatusResponse(stage="online", label="Local Engine Online", ok=True)

    # 3. Async call to RunPod Health API
    health_url = f"https://api.runpod.ai/v2/{endpoint_id}/health"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(health_url, headers=headers, timeout=5.0)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        print(f"⚠️ RunPod Health Check Failed: {e}")
        return StatusResponse(stage="starting_gpu", label="Starting GPU...", ok=False)

    # 4. Refined Logic for Stage determination
    workers = data.get("workers", {})
    idle = workers.get("idle", 0)
    ready = workers.get("ready", 0)
    running = workers.get("running", 0)
    initializing = workers.get("initializing", 0)
    throttled = workers.get("throttled", 0)
    unhealthy = workers.get("unhealthy", 0)

    # Priority 1: If we have ready or idle workers, we are online
    if (idle + ready) > 0:
        stage, label = "online", "MedGemma is Online"
    # Priority 2: If we are still initializing
    elif (initializing + throttled) > 0:
        stage, label = "loading_model", "Loading Model..."
    # Priority 3: If everything is unhealthy
    elif unhealthy > 0 and (idle + ready + running) == 0:
        stage, label = "offline", "Backend Offline"
    # Priority 4: Default to starting
    else:
        stage, label = "starting_gpu", "Starting GPU..."

    return StatusResponse(
        stage=stage,
        label=label,
        ok=(stage == "online"),
        workers=workers,
        jobs=data.get("jobs", {})
    )

@app.post("/api/status/warm")
async def trigger_warmup():
    endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID")
    api_key = os.getenv("RUNPOD_API_KEY")
    if not endpoint_id or not api_key:
        raise HTTPException(status_code=500, detail="Missing RUNPOD_ENDPOINT_ID or RUNPOD_API_KEY")

    url = f"https://api.runpod.ai/v2/{endpoint_id}/run"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "input": {
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1,
            "temperature": 0.0
        }
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
        try:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            # Optional: return job id so you can observe it
            return {"status": "pulse_sent", "job": r.json()}
        except httpx.HTTPError as e:
            # If you truly want "fire and forget", you can still return 200 here,
            # but it's better to surface the failure during warmup.
            raise HTTPException(status_code=502, detail=f"Runpod warmup failed: {e}")


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

        print(f"--- 📥 Extraction Engine returned {len(results)} raw records ---")

        final_records = []
        data_dir = "/app/data"
        if not os.path.exists(data_dir):
            data_dir = "data"
        os.makedirs(data_dir, exist_ok=True)

        new_count = 0
        existing_count = 0

        for res in results:
            sid = res.get('pmid') or res.get('nct_id')
            if not sid or sid == "N/A" or sid == "":
                continue

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

            existing = session.exec(
                select(ResearchRecord).where(ResearchRecord.external_id == ext_id)
            ).first()

            if not existing:
                db_record = ResearchRecord(**record_data)
                session.add(db_record)
                final_records.append(db_record)
                new_count += 1
            else:
                final_records.append(existing)
                existing_count += 1

        session.commit()
        print(f"--- ✅ Sync Complete: {new_count} new, {existing_count} existing records ---")
        return {"results": final_records}

    except Exception as e:
        session.rollback()
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


from app.services.paper_service import fetch_pubmed_full_text, fetch_ct_full_text


@app.post("/api/extract/paper")
async def extract_paper(request: dict, session: Session = Depends(get_session)):
    source = request.get("source", "PMID")
    niche = request.get("niche", "Manual_Extract")
    paper_id = str(request.get("id", "")).strip()

    if not paper_id:
        raise HTTPException(status_code=400, detail="Missing ID")

    if source == "PMID" and not paper_id.isdigit():
        raise HTTPException(status_code=400, detail=f"Invalid PMID format: '{paper_id}'. Must be numeric.")
    if source == "NCT" and not paper_id.startswith("NCT"):
        raise HTTPException(status_code=400, detail=f"Invalid NCT ID format: '{paper_id}'. Must start with 'NCT'.")

    try:
        if source == "PMID":
            full_text = fetch_pubmed_full_text(paper_id)
        else:
            full_text = fetch_ct_full_text(paper_id)

        ext_id = f"{source}_{paper_id}"

        data_dir = "/app/data"
        if not os.path.exists(data_dir):
            data_dir = "data"
        os.makedirs(data_dir, exist_ok=True)

        filename = f"{ext_id}_paper.txt"
        file_path = os.path.join(data_dir, filename)

        with open(file_path, 'w') as f:
            f.write(full_text)

        record = session.exec(
            select(ResearchRecord).where(ResearchRecord.external_id == ext_id)
        ).first()

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
        return {
            "external_id": ext_id,
            "title": record.title,
            "source": record.source,
            "full_text": full_text,
            "filename": filename
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔹 EXPLORER APIs
# =========================
@app.get("/api/research/list")
async def list_research(session: Session = Depends(get_session)):
    try:
        results = session.exec(
            select(ResearchRecord).order_by(ResearchRecord.year.desc())
        ).all()

        for record in results:
            if not record.source:
                record.source = (
                    "ClinicalTrials" if "NCT" in record.external_id else "PubMed"
                )

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def extract_pico_section(label: str, text: str) -> str:
    pattern = rf'\*\s*\*\*{label}:\*\*\s*(.*?)(?=\*\s*\*\*|\Z)'
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text[:300]


@app.get("/api/research/{external_id}")
async def get_research_detail(external_id: str, session: Session = Depends(get_session)):
    record = session.exec(
        select(ResearchRecord).where(
            ResearchRecord.external_id == external_id
        )
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if not record.pico_json and record.pico_text:
        text = record.pico_text
        record.pico_json = {
            "P": extract_pico_section("Population", text),
            "I": extract_pico_section("Intervention", text),
            "C": extract_pico_section("Comparison", text),
            "O": extract_pico_section("Outcome", text),
        }

    return record


# =========================
# 🔹 RECORDS BY NICHE
# =========================
@app.get("/api/records")
async def get_records(niche: str, session: Session = Depends(get_session)):
    try:
        results = session.exec(
            select(ResearchRecord)
            .where(ResearchRecord.niche == niche)
            .order_by(ResearchRecord.year.desc())
        ).all()

        return {
            "records": [
                {
                    "external_id": r.external_id,
                    "title": r.title or "",
                    "source": r.source or (
                        "ClinicalTrials" if "NCT" in r.external_id else "PubMed"
                    ),
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔹 SEARCH SOURCE
# =========================
@app.post("/api/search")
async def search_sources(req: SearchRequest, db: Session = Depends(get_session)):
    print(f"\n🚀 SEARCH REQUEST | Query: {req.query} | Sources: {req.sources}")

    current_provider = req.provider or os.getenv("LLM_PROVIDER", "ollama")
    os.environ["LLM_PROVIDER"] = current_provider

    response_data = []

    if "pubmed" in req.sources:
        pubmed_results = []
        try:
            pubmed_ids = search_pubmed(req.query, max_results=req.max_results, year=req.year)
            for p_id in pubmed_ids:
                cached_entry = None if req.bypass_cache else db.query(CachedSummary).filter(
                    CachedSummary.pubmed_id == p_id,
                    CachedSummary.provider == current_provider
                ).first()

                if cached_entry:
                    pubmed_results.append(PaperResult(
                        paper_id=p_id, abstract=cached_entry.abstract,
                        summary=cached_entry.summary, cached=True
                    ))
                    continue

                fetch_results = fetch_abstracts([p_id], year=req.year)
                if not fetch_results:
                    continue
                abstract_data = fetch_results[0]
                abstract = abstract_data["abstract"]
                year = abstract_data["year"]

                try:
                    summary = summarize_text(abstract)
                    if "Error:" not in summary:
                        from sqlalchemy import text as sa_text
                        from datetime import datetime
                        stmt = insert(CachedSummary).values(
                            pubmed_id=p_id, query=req.query, abstract=abstract,
                            summary=summary, provider=current_provider, created_at=datetime.utcnow()
                        )
                        stmt = stmt.on_conflict_do_update(
                            index_elements=['pubmed_id', 'provider'],
                            set_={"summary": summary, "query": req.query, "created_at": datetime.utcnow()}
                        )
                        db.execute(stmt)
                        db.commit()
                except Exception as e:
                    db.rollback()
                    summary = f"System Error: {str(e)}"

                pubmed_results.append(PaperResult(
                    paper_id=p_id, abstract=abstract, summary=summary, year=year, cached=False
                ))
        except Exception as e:
            print(f"❌ PubMed Error: {e}")
        response_data.append({"source": "pubmed", "data": pubmed_results})

    if "clinicaltrials" in req.sources:
        ct_results = []
        try:
            trials = fetch_clinical_trials(req.query, page_size=req.max_results, year=req.year)
            for trial in trials:
                paper_id = trial.get("id")
                abstract = trial.get("abstract")
                if not paper_id or not abstract:
                    continue

                cached_entry = None if req.bypass_cache else db.query(CachedClinicalTrial).filter(
                    CachedClinicalTrial.nct_id == paper_id,
                    CachedClinicalTrial.provider == current_provider
                ).first()

                if cached_entry:
                    ct_results.append(PaperResult(
                        paper_id=paper_id, abstract=cached_entry.abstract,
                        summary=cached_entry.summary, year=trial.get("year", 2024), cached=True
                    ))
                    continue

                try:
                    summary = summarize_text(abstract)
                    if "Error:" not in summary:
                        from datetime import datetime
                        stmt = insert(CachedClinicalTrial).values(
                            nct_id=paper_id, query=req.query, abstract=abstract,
                            summary=summary, provider=current_provider, created_at=datetime.utcnow()
                        )
                        stmt = stmt.on_conflict_do_update(
                            index_elements=['nct_id', 'provider'],
                            set_={"summary": summary, "query": req.query, "created_at": datetime.utcnow()}
                        )
                        db.execute(stmt)
                        db.commit()
                except Exception as e:
                    db.rollback()
                    summary = f"System Error: {str(e)}"

                ct_results.append(PaperResult(
                    paper_id=paper_id, abstract=abstract, summary=summary, year=trial.get("year", 2024), cached=False
                ))
        except Exception as e:
            print(f"❌ ClinicalTrials Error: {e}")
        response_data.append({"source": "clinicaltrials", "data": ct_results})

    return {"results": response_data}


# =========================
# 🔹 BACKGROUND EXTRACTION
# =========================
@app.post("/api/tools/extract-pubmed")
def trigger_pubmed_extraction(pmid: str, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    def worker():
        abs_text = fetch_abstracts([pmid])[0]
        summary = summarize_text(abs_text)
        print(f"Background extraction for {pmid} complete.")

    background_tasks.add_task(worker)
    return {"status": "started", "target": pmid}


# =========================
# 🔹 ROOT
# =========================
@app.get("/")
async def root():
    return {"message": "GI Research Evidence Engine API is Running"}