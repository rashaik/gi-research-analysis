import json
import os
import logging
import re
from sqlmodel import Session, select
from app.database import engine
from app.models import ResearchRecord

# --- SILENCE THE CHATTER ---
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# Path adjustments for Docker environment
PUBMED_JSONL = "data/pubmed_pico_results.jsonl"
CT_JSONL = "data/ct_pico_results.jsonl"
PUBMED_BATCH = "data/pubmed_batch.jsonl"
CT_BATCH = "data/ct_batch.jsonl"

def parse_prompt(prompt):
    """
    Extracts Title and Abstract from the MedGemma prompt.
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

def load_batch_data():
    """
    Loads abstracts and titles from the batch files into a lookup dictionary.
    """
    lookup = {}
    batch_files = [PUBMED_BATCH, CT_BATCH]
    
    for path in batch_files:
        if not os.path.exists(path):
            continue
        
        print(f"📖 Pre-loading batch data from {path}...")
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    req_id = data.get('request_id')
                    prompt = data.get('prompt', '')
                    if req_id and prompt:
                        title, abstract = parse_prompt(prompt)
                        lookup[req_id] = {"title": title, "abstract": abstract}
                except:
                    continue
    return lookup

def seed_from_jsonl():
    print("--- 🔬 Starting Research Corpus Import ---")
    
    batch_lookup = load_batch_data()
    
    files_to_import = [
        {"path": PUBMED_JSONL, "source": "PubMed"},
        {"path": CT_JSONL, "source": "ClinicalTrials"}
    ]

    with Session(engine) as session:
        for file_info in files_to_import:
            path = file_info["path"]
            source = file_info["source"]

            if not os.path.exists(path):
                print(f"⚠️ Skipping {source}: File not found at {path}")
                continue

            print(f"📂 Processing {source}...")
            count = 0
            
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line: continue
                    
                    try:
                        data = json.loads(line)
                        meta = data.get('metadata', {})
                        ext_id = data.get('request_id')
                        
                        if not ext_id: continue

                        # 1. Faster Duplicate Check
                        existing = session.exec(
                            select(ResearchRecord).where(ResearchRecord.external_id == str(ext_id))
                        ).first()
                        if existing: 
                            continue

                        # 2. Enrich from batch_lookup if needed
                        batch_info = batch_lookup.get(ext_id, {})
                        final_title = data.get('title') or batch_info.get('title') or f"Research Record {ext_id}"
                        final_abstract = data.get('abstract') or batch_info.get('abstract') or "Abstract processed in PICO text."

                        # 3. Year Formatting Logic
                        raw_year = meta.get('year', '2024')
                        try:
                            clean_year = int(float(raw_year))
                        except (ValueError, TypeError):
                            clean_year = 2024

                        # 4. Create Model Instance
                        record = ResearchRecord(
                            external_id=str(ext_id),
                            source=meta.get('source', source),
                            title=final_title,
                            abstract=final_abstract,
                            niche=meta.get('niche', 'GI_General'),
                            year=clean_year,
                            pico_text=data.get('pico_text', ''),
                            pico_json=data.get('pico_json') # Assuming it might be in results
                        )
                        
                        session.add(record)
                        count += 1
                        
                        if count % 250 == 0:
                            try:
                                session.commit()
                                print(f"    📥 {source}: {count} records indexed...")
                            except Exception as e:
                                session.rollback()
                                if "duplicate key" not in str(e).lower():
                                    print(f"⚠️ Batch commit error (handled): {e}")
                                
                    except Exception as e:
                        continue

            try:
                session.commit()
                print(f"✅ Successfully imported {count} records from {source}.")
            except Exception as e:
                session.rollback()
                print(f"ℹ️ Final commit for {source} skipped or partially completed.")

    print("--- 🏁 JSONL Import Complete ---")

if __name__ == "__main__":
    seed_from_jsonl()