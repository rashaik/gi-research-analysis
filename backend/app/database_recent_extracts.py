from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, Text, DateTime
import sqlalchemy as sa

# -----------------------------
# PUBMED TABLE
# -----------------------------
class CachedSummary(SQLModel, table=True):
    __tablename__ = "pubmed_summaries"

    # Both columns together form the Unique Identity
    pubmed_id: str = Field(primary_key=True, index=True)
    provider: str = Field(primary_key=True, index=True) 
    
    query: Optional[str] = Field(index=True)
    abstract: str = Field(sa_column=Column(Text))
    summary: str = Field(sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow, 
        sa_column=Column(DateTime, default=sa.func.now())
    )

# -----------------------------
# CLINICAL TRIALS TABLE
# -----------------------------
class CachedClinicalTrial(SQLModel, table=True):
    __tablename__ = "clinical_trials_summaries"

    nct_id: str = Field(primary_key=True, index=True)
    provider: str = Field(primary_key=True, index=True)

    query: Optional[str] = Field(index=True)
    abstract: str = Field(sa_column=Column(Text))
    summary: str = Field(sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow, 
        sa_column=Column(DateTime, default=sa.func.now())
    )
