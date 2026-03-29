from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, text, JSON


# =========================
# 🔹 CDC Mortality Table
# =========================
class MortalityData(SQLModel, table=True):
    __tablename__ = "mortalitydata"

    id: Optional[int] = Field(default=None, primary_key=True)
    year: int = Field(index=True)
    cause: str
    deaths: int
    rate: Optional[float] = None


# =========================
# 🔹 Research Records Table
# =========================
class ResearchRecord(SQLModel, table=True):
    __tablename__ = "researchrecord"

    id: Optional[int] = Field(default=None, primary_key=True)

    external_id: str = Field(unique=True, index=True)  # PMID_12345 or NCT_XXXX
    source: str = "PubMed"

    title: str
    abstract: str
    niche: str = Field(index=True)
    year: int

    # Legacy (string version)
    pico_text: Optional[str] = None

    # ✅ NEW: structured JSON
    pico_json: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # ✅ NEW: Full Paper Content
    full_text: Optional[str] = None

    # Timestamp
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=text("now()")
        )
    )