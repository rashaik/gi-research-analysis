import csv
import os
from sqlmodel import Session, select
from app.database import engine
from app.models import MortalityData

CDC_FILE_PATH = "data/CDC_Mortality_Cleaned_1999_2024.csv"

def seed_cdc():
    print(f"--- 📊 Starting CDC Data Ingestion ---")
    with Session(engine) as session:
        # 1. Prevent double-seeding
        existing = session.exec(select(MortalityData)).first()
        if existing:
            print("--- ✅ CDC data exists. Skipping seed. ---")
            return

        try:
            with open(CDC_FILE_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                error_count = 0 # Track errors silently
                
                for row in reader:
                    try:
                        raw_deaths = row.get('Deaths', '0')
                        clean_deaths = int(float(raw_deaths)) if raw_deaths else 0

                        raw_year = row.get('Year', '0')
                        clean_year = int(float(raw_year)) if raw_year else 0

                        raw_rate = row.get('Crude Rate', '0')
                        if not raw_rate or raw_rate.strip().lower() in ['unreliable', 'suppressed', '']:
                            clean_rate = 0.0
                        else:
                            clean_rate = float(raw_rate)

                        record = MortalityData(
                            year=clean_year,
                            cause=row.get('ICD_10', 'Unknown'),
                            deaths=clean_deaths,
                            rate=clean_rate
                        )
                        
                        session.add(record)
                        count += 1

                        if count % 5000 == 0:
                            session.commit()
                            print(f"--- 📥 Ingested {count} mortality rows... ---")

                    except (ValueError, TypeError):
                        error_count += 1
                        continue
                
                session.commit()
                print(f"✅ Final Result: {count} rows added. ({error_count} malformed rows skipped)")
                
        except Exception as e:
            print(f"❌ Critical Seed Error: {e}")
            session.rollback()

if __name__ == "__main__":
    seed_cdc()