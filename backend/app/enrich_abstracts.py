import json
import os
import re
import logging
from sqlmodel import Session, select
from app.database import engine
from app.models import ResearchRecord

# Silence SQLAlchemy
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# Check for both local and container data paths
if os.path.exists("/data/pubmed_batch.jsonl"):
    DATA_DIR = "/data"
else:
    DATA_DIR = "data"

PUBMED_BATCH = os.path.join(DATA_DIR, "pubmed_batch.jsonl")
CT_BATCH = os.path.join(DATA_DIR, "ct_batch.jsonl")

def parse_prompt(prompt):
    """
    Extracts Title and Abstract from the MedGemma prompt.
    Same logic as in seed_research.py.
    """
    title = ""
    abstract = ""
    
    # Try to find Title: and Abstract: using regex
    title_match = re.search(r"Title:\s*(.*?)(?:\n|Abstract:|$)", prompt, re.IGNORECASE | re.DOTALL)
    abstract_match = re.search(r"Abstract:\s*(.*)", prompt, re.IGNORECASE | re.DOTALL)
    
    if title_match:
        title = title_match.group(1).strip()
    if abstract_match:
        abstract = abstract_match.group(1).strip()
        
    return title, abstract

def enrich_database():
    print("--- 🩺 Starting Abstract Enrichment ---")
    
    # 1. Load Batch Data into Memory
    batch_lookup = {}
    batch_files = [PUBMED_BATCH, CT_BATCH]
    
    for path in batch_files:
        if not os.path.exists(path):
            print(f"⚠️ Batch file not found: {path}")
            continue
        
        print(f"📖 Reading {path}...")
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    req_id = data.get('request_id')
                    prompt = data.get('prompt', '')
                    if req_id and prompt:
                        title, abstract = parse_prompt(prompt)
                        batch_lookup[req_id] = {"title": title, "abstract": abstract}
                except:
                    continue

    if not batch_lookup:
        print("❌ No batch data loaded from /data or data/. Aborting.")
        return

    # 2. Update Database
    with Session(engine) as session:
        # Both placeholders used in various versions of the seed script
        placeholder = "Abstract processed in PICO text."
        
        # We query all records, checking for the placeholder or empty abstracts
        records = session.exec(
            select(ResearchRecord).where(ResearchRecord.abstract == placeholder)
        ).all()
        
        print(f"🔍 Found {len(records)} records requiring enrichment.")
        update_count = 0
        
        for record in records:
            info = batch_lookup.get(record.external_id)
            if info:
                # Only update if we found real content
                if info['abstract']:
                    record.abstract = info['abstract']
                    # Also update title if it's the generic one
                    if record.title.startswith("Research Record"):
                        record.title = info['title']
                    
                    session.add(record)
                    update_count += 1
            
            if update_count % 100 == 0 and update_count > 0:
                session.commit()
                print(f"    ✅ Updated {update_count} records...")

        session.commit()
        print(f"🏁 Enrichment complete. Updated {update_count} records.")

if __name__ == "__main__":
    enrich_database()
