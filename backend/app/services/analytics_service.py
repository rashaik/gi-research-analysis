from sqlmodel import Session, select, func
from app.models import ResearchRecord, MortalityData
from typing import List, Dict

def get_temporal_mismatch_stats(session: Session) -> List[Dict]:
    """
    Aggregates PubMed/ClinicalTrials counts and CDC Mortality sums by year.
    Strictly limits data to 1999–2024 to avoid 'drop-to-zero' artifacts.
    """
    
    # We set the limit to 2025 to only include completed data years (up to 2024)
    data_cutoff = 2025
    
    # 1. Aggregate Research Counts (PubMed + ClinicalTrials)
    research_stmt = select(
        ResearchRecord.year, 
        func.count(ResearchRecord.id).label("count")
    ).where(
        ResearchRecord.year < data_cutoff,
        ResearchRecord.year >= 1999
    ).group_by(ResearchRecord.year)
    
    research_results = session.exec(research_stmt).all()

    # 2. Aggregate CDC Mortality Sums
    mortality_stmt = select(
        MortalityData.year, 
        func.sum(MortalityData.deaths).label("total_deaths")
    ).where(
        MortalityData.year < data_cutoff,
        MortalityData.year >= 1999
    ).group_by(MortalityData.year)
    
    mortality_results = session.exec(mortality_stmt).all()

    # 3. Merge results
    stats = {}

    for year, count in research_results:
        stats[year] = {"year": year, "research": count, "deaths": 0}
    
    for year, deaths in mortality_results:
        if year in stats:
            stats[year]["deaths"] = int(deaths) if deaths else 0
        else:
            stats[year] = {"year": year, "research": 0, "deaths": int(deaths) if deaths else 0}

    # 4. Final Sort
    return sorted(stats.values(), key=lambda x: x["year"])

def get_niche_mortality_summary(session: Session) -> List[Dict]:
    """
    Returns a summary of deaths grouped by Cause (Niche) and Year.
    """
    # Cause maps to 'niche' in our triangulation logic
    stmt = select(
        MortalityData.cause,
        MortalityData.year,
        func.sum(MortalityData.deaths).label("total_deaths")
    ).group_by(
        MortalityData.cause,
        MortalityData.year
    ).order_by(MortalityData.year.desc(), MortalityData.cause)

    results = session.exec(stmt).all()
    
    return [
        {"cause": str(r[0]), "year": int(r[1]), "deaths": int(r[2])}
        for r in results
    ]