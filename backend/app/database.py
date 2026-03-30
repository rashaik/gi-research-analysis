from sqlmodel import create_engine, SQLModel, Session
import os
import time
from sqlalchemy.exc import OperationalError

# IMPORTANT: You must import your models here so the Metadata registry sees them
from app.models import MortalityData, ResearchRecord
from app.database_recent_extracts import CachedSummary, CachedClinicalTrial

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Please set it in your Render environment settings."
    )

# Render sometimes provides postgres:// URLs — SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    """
    Initializes the database once before the workers start.
    """
    retries = 10
    while retries > 0:
        try:
            # SQLModel checks if tables exist before creating (checkfirst=True)
            SQLModel.metadata.create_all(engine)
            print("--- ✅ Database tables verified/created successfully ---")
            break
        except OperationalError:
            retries -= 1
            print(f"Postgres not ready yet... retrying ({retries} left)")
            time.sleep(2)
    else:
        print("--- ❌ Could not connect to Postgres. ---")

def get_session():
    with Session(engine) as session:
        yield session