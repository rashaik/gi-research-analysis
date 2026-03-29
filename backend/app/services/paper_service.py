import os
import requests
import xml.etree.ElementTree as ET
from typing import Optional, List, Dict, Any

NCBI_API_KEY = os.getenv("NCBI_API_KEY", "")
FULL_TEXT_CHAR_LIMIT = int(os.getenv("FULL_TEXT_CHAR_LIMIT", 5000))

# Niche → PubMed search terms mapping
NICHE_QUERY_MAP = {
    "MASLD": "MASLD",
    "MASH": "MASH OR metabolic steatohepatitis",
    "HCC": "hepatocellular carcinoma",
    "Lean NAFLD": "lean NAFLD",
    "Fibrosis": "liver fibrosis",
    "Cirrhosis": "liver cirrhosis",
    "Metabolic Syndrome": "metabolic syndrome",
}


# ---------------------------------------------------
# 🔹 PUBLIC API — matched to ExtractCompletePaper.jsx
# ---------------------------------------------------

def get_available_ids(source: str, niche: Optional[str] = None) -> List[str]:
    """
    Returns a list of record IDs for the given source and niche.
    Called by GET /api/records?source=&niche=
    """
    if source == "pubmed":
        return _search_pubmed_ids(niche)
    elif source == "clinicaltrials":
        return _search_ct_ids(niche)
    else:
        return []


def extract_full_paper(source: str, record_id: str) -> Dict[str, Any]:
    """
    Returns a structured dict matching the shape expected by ExtractCompletePaper.jsx:
    {
        "record_id": str,
        "title": str,
        "authors": list[str],
        "year": int | None,
        "full_text": str,
        "pico": str | None,
        "url": str | None,
    }
    Called by POST /api/extract-full
    """
    if source == "pubmed":
        return _extract_pubmed(record_id)
    elif source == "clinicaltrials":
        return _extract_ct(record_id)
    else:
        return _error_response(record_id, f"Unknown source: {source}")


# ---------------------------------------------------
# 🔹 RECORD ID LOOKUP
# ---------------------------------------------------

def _search_pubmed_ids(niche: Optional[str], max_results: int = 20) -> List[str]:
    """Search PubMed for IDs matching the niche topic."""
    query = NICHE_QUERY_MAP.get(niche, niche) if niche else "MASLD OR MASH OR NAFLD"
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "pub_date",
    }
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY

    try:
        res = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            params=params,
            timeout=15,
        )
        res.raise_for_status()
        ids = res.json().get("esearchresult", {}).get("idlist", [])
        print(f"🔍 PubMed ID lookup ({niche}): {len(ids)} results")
        return ids
    except Exception as e:
        print(f"❌ PubMed ID search failed: {e}")
        return []


def _search_ct_ids(niche: Optional[str], max_results: int = 20) -> List[str]:
    """Search ClinicalTrials.gov for NCT IDs matching the niche topic."""
    query = NICHE_QUERY_MAP.get(niche, niche) if niche else "MASLD OR MASH OR NAFLD"
    params = {
        "query.term": query,
        "pageSize": max_results,
        "sort": "LastUpdatePostDate:desc",
    }

    try:
        res = requests.get(
            "https://clinicaltrials.gov/api/v2/studies",
            params=params,
            timeout=15,
        )
        res.raise_for_status()
        studies = res.json().get("studies", [])
        ids = [
            s.get("protocolSection", {})
             .get("identificationModule", {})
             .get("nctId")
            for s in studies
        ]
        ids = [i for i in ids if i]
        print(f"🔍 ClinicalTriials ID lookup ({niche}): {len(ids)} results")
        return ids
    except Exception as e:
        print(f"❌ ClinicalTrials ID search failed: {e}")
        return []


# ---------------------------------------------------
# 🔹 PUBMED FULL EXTRACTION
# ---------------------------------------------------

def _extract_pubmed(pmid: str) -> Dict[str, Any]:
    """Fetches metadata + full text for a PubMed ID."""
    metadata = _fetch_pubmed_metadata(pmid)
    pmc_id = _resolve_pmc_id(pmid)

    if pmc_id:
        full_text = _fetch_pmc_body(pmid, pmc_id)
    else:
        full_text = _fetch_pubmed_abstract_fallback(pmid, metadata)

    return {
        "record_id": pmid,
        "title": metadata.get("title"),
        "authors": metadata.get("authors", []),
        "year": metadata.get("year"),
        "full_text": full_text,
        "pico": None,  # Populated downstream by LLM if needed
        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
    }


def _fetch_pubmed_metadata(pmid: str) -> Dict[str, Any]:
    """Extracts title, authors, and year from a PubMed XML record."""
    params = {"db": "pubmed", "id": pmid, "retmode": "xml"}
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY

    try:
        res = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
            params=params,
            timeout=15,
        )
        res.raise_for_status()
        root = ET.fromstring(res.content)
    except Exception as e:
        print(f"❌ PubMed metadata fetch failed for {pmid}: {e}")
        return {}

    # Title
    title_elem = root.find(".//ArticleTitle")
    title = "".join(title_elem.itertext()).strip() if title_elem is not None else None

    # Authors — Last + ForeName
    authors = []
    for author in root.findall(".//Author"):
        last = author.findtext("LastName", "")
        fore = author.findtext("ForeName", "")
        name = f"{fore} {last}".strip()
        if name:
            authors.append(name)

    # Year — prefer PubDate/Year, fall back to ArticleDate/Year
    year = None
    for path in [".//PubDate/Year", ".//ArticleDate/Year"]:
        elem = root.find(path)
        if elem is not None:
            try:
                year = int(elem.text)
                break
            except (ValueError, TypeError):
                pass

    # Abstract — store for fallback use
    abstract_nodes = root.findall(".//AbstractText")
    abstract_parts = []
    for node in abstract_nodes:
        label = node.get("Label")
        text = ("".join(node.itertext())).strip()
        if label:
            abstract_parts.append(f"{label}: {text}")
        elif text:
            abstract_parts.append(text)
    abstract = "\n\n".join(abstract_parts) if abstract_parts else None

    return {"title": title, "authors": authors, "year": year, "abstract": abstract}


def _resolve_pmc_id(pmid: str) -> Optional[str]:
    """Looks up whether a PubMed ID has a corresponding PMC Open Access ID."""
    params = {"dbfrom": "pubmed", "id": pmid, "retmode": "json"}
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY

    try:
        res = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi",
            params=params,
            timeout=15,
        )
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        print(f"⚠️  PMC ID lookup failed for PMID {pmid}: {e}")
        return None

    for linkset in data.get("linksets", []):
        for db in linkset.get("linksetdb", []):
            if db.get("dbto") == "pmc":
                links = db.get("links", [])
                if links:
                    print(f"✅ Resolved PMID {pmid} → PMC ID {links[0]}")
                    return str(links[0])
    return None


def _fetch_pmc_body(pmid: str, pmc_id: str) -> str:
    """Fetches and extracts body text from a PMC Open Access article."""
    params = {"db": "pmc", "id": pmc_id}
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY

    try:
        res = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
            params=params,
            timeout=30,
        )
        res.raise_for_status()
        root = ET.fromstring(res.content)
    except Exception as e:
        return f"PMC fetch failed for PMID {pmid} / PMC {pmc_id}: {str(e)}"

    body = root.find(".//body")
    if body is not None:
        text = "".join(body.itertext()).strip()
        truncated = len(text) > FULL_TEXT_CHAR_LIMIT
        excerpt = text[:FULL_TEXT_CHAR_LIMIT]
        suffix = "\n\n[Truncated — full text available on PubMed Central]" if truncated else ""
        return f"Retrieved via PMC ID: {pmc_id}\n\n{excerpt}{suffix}"
    else:
        return (
            f"PMC ID {pmc_id} found but full-text body is restricted or non-standard. "
            f"Abstract returned as fallback."
        )


def _fetch_pubmed_abstract_fallback(pmid: str, metadata: Dict[str, Any]) -> str:
    """Returns the abstract from already-fetched metadata, or re-fetches if missing."""
    abstract = metadata.get("abstract")
    if abstract:
        return (
            f"Full paper not available in Open Access subset (no PMC ID).\n"
            f"Returning detailed abstract for PMID {pmid}:\n\n{abstract}"
        )
    return f"No abstract available for PMID {pmid}."


# ---------------------------------------------------
# 🔹 CLINICAL TRIALS FULL EXTRACTION
# ---------------------------------------------------

def _extract_ct(nct_id: str) -> Dict[str, Any]:
    """Fetches metadata + full protocol text for a ClinicalTrials NCT ID."""
    try:
        res = requests.get(
            f"https://clinicaltrials.gov/api/v2/studies/{nct_id}",
            timeout=15,
        )
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        return _error_response(nct_id, f"ClinicalTrials fetch failed: {str(e)}")

    protocol = data.get("protocolSection", {})
    identification = protocol.get("identificationModule", {})
    status_module = protocol.get("statusModule", {})
    description_module = protocol.get("descriptionModule", {})
    eligibility_module = protocol.get("eligibilityModule", {})
    contacts_module = protocol.get("contactsLocationsModule", {})
    design_module = protocol.get("designModule", {})

    # Title
    title = identification.get("briefTitle") or identification.get("officialTitle")

    # Sponsors as stand-in for authors
    sponsor = (
        protocol.get("sponsorCollaboratorsModule", {})
        .get("leadSponsor", {})
        .get("name")
    )
    authors = [sponsor] if sponsor else []

    # Year
    year = None
    start_date = status_module.get("startDateStruct", {}).get("date", "")
    if start_date:
        try:
            year = int(start_date[:4])
        except (ValueError, TypeError):
            pass

    # Full text body
    overall_status = status_module.get("overallStatus", "Unknown")
    phases = design_module.get("phases", [])
    phase_str = ", ".join(phases) if phases else "Not specified"
    description = description_module.get("detailedDescription", "No detailed description available.").strip()
    eligibility = eligibility_module.get("eligibilityCriteria", "No eligibility criteria available.").strip()

    contacts = contacts_module.get("centralContacts", [])
    if contacts:
        c = contacts[0]
        contact_str = f"{c.get('name', 'N/A')} | {c.get('phone', 'N/A')} | {c.get('email', 'N/A')}"
    else:
        contact_str = "Contacts not listed."

    full_text = (
        f"STATUS: {overall_status}  |  PHASE: {phase_str}\n\n"
        f"STUDY DESCRIPTION:\n{description}\n\n"
        f"ELIGIBILITY CRITERIA:\n{eligibility}\n\n"
        f"REGISTRATION CONTACTS:\n{contact_str}"
    )

    return {
        "record_id": nct_id,
        "title": title,
        "authors": authors,
        "year": year,
        "full_text": full_text,
        "pico": None,
        "url": f"https://clinicaltrials.gov/study/{nct_id}",
    }


# ---------------------------------------------------
# 🔹 HELPERS
# ---------------------------------------------------

def _error_response(record_id: str, message: str) -> Dict[str, Any]:
    """Returns a safe error-shaped response so the frontend never crashes."""
    return {
        "record_id": record_id,
        "title": None,
        "authors": [],
        "year": None,
        "full_text": message,
        "pico": None,
        "url": None,
    }

def fetch_pubmed_full_text(pmid: str) -> str:
    """Backwards-compatible alias — returns full_text string."""
    return _extract_pubmed(pmid)["full_text"]
 
 
def fetch_ct_full_text(nct_id: str) -> str:
    """Backwards-compatible alias — returns full_text string."""
    return _extract_ct(nct_id)["full_text"]