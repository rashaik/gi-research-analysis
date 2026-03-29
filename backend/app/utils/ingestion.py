import pandas as pd
import json
import os
import numpy as np
from sqlmodel import Session, select
from app.models import MortalityData, ResearchRecord

def load_initial_data(session: Session):
    """
    Ingests local CSV and JSONL files into the database.
    Designed to be idempotent (won't duplicate data if run multiple times).
    """

    # --- 1. Ingest CDC Mortality CSV ---
    cdc_path = os.getenv("CDC_CSV", "/data/CDC_Mortality_Cleaned_1999_2024.csv")
    
    if os.path.exists(cdc_path):
        # Check if already ingested
        if session.exec(select(MortalityData)).first() is None:
            print(f"--- 📊 Ingesting CDC data from {cdc_path} ---")
            
            # Load and replace NaN with None for SQL compatibility
            df = pd.read_csv(cdc_path).replace({np.nan: None})
            
            for _, row in df.iterrows():
                # Explicit mapping prevents the 'double precision' syntax error
                record = MortalityData(
                    year=int(row['Year']),
                    icd_10=str(row['ICD_10']),
                    deaths=float(row['Deaths']) if row['Deaths'] is not None else 0.0,
                    population=float(row['Population']) if row['Population'] is not None else 0.0,
                    age_group=str(row['Age_Group']) if row['Age_Group'] is not None else None
                )
                session.add(record)
            
            session.commit()
            print("✅ CDC Mortality ingestion complete.")
        else:
            print("ℹ️ CDC data already exists in database. Skipping.")
    else:
        print(f"⚠️ CDC file not found at {cdc_path}")


    # --- 2. Ingest Cached PubMed PICO Results ---
    pico_path = os.getenv("PUBMED_PICO_JSONL", "/data/pubmed_pico_results.jsonl")
    
    if os.path.exists(pico_path):
        # Check if already ingested
        if session.exec(select(ResearchRecord)).first() is None:
            print(f"--- 🧪 Ingesting cached PICO records from {pico_path} ---")
            
            with open(pico_path, 'r') as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        meta = data.get("metadata", {})
                        
                        # Extract year from the result (PubMed usually returns 'year')
                        year_val = data.get("year") or meta.get("year", 2000)
                        
                        record = ResearchRecord(
                            external_id=str(data.get('request_id', data.get('pmid'))),
                            source=meta.get("source", "PubMed"),
                            title=data.get("title", "Cached Record"),
                            abstract=data.get("abstract", ""),
                            niche=meta.get("niche", "Unknown"),
                            year=int(year_val),
                            pico_text=data.get("pico_extraction", "No extraction found")
                        )
                        session.add(record)
                    except (json.JSONDecodeError, KeyError) as e:
                        print(f"⚠️ Skipping malformed JSONL line: {e}")
            
            session.commit()
            print("✅ PubMed PICO ingestion complete.")
        else:
            print("ℹ️ Research records already exist in database. Skipping.")
    else:
        print(f"ℹ️ No PICO cache found at {pico_path}")