import os
import requests
import json
from typing import List, Dict, Optional
from xml.etree import ElementTree

# ---------------------------------------------------
# 🔹 ENVIRONMENT-AWARE ROUTING
# ---------------------------------------------------

def get_available_providers():
    """Returns providers based on environment."""
    if os.getenv("RAILWAY_ENVIRONMENT"):
        return ["runpod", "groq"]
    return ["ollama", "runpod", "groq"]

def summarize_text(text: str, provider: str = None) -> str:
    """
    Summarizes text using the selected provider.
    If no provider is passed, it defaults based on environment.
    """
    available = get_available_providers()
    
    # Defaulting logic if provider is missing or invalid for env
    if not provider or provider not in available:
        provider = "runpod" if os.getenv("RAILWAY_ENVIRONMENT") else "ollama"

    if provider == "runpod":
        return summarize_runpod(text)
    elif provider == "groq":
        return summarize_groq(text)
    else:
        return summarize_ollama(text)

# --- Prompts ---
PICO_SYSTEM_PROMPT = "You are a medical research analyst skilled in evidence-based medicine."
PICO_USER_PROMPT = """\
Extract the PICO elements from the following abstract and return them in this exact format:

P (Population): <who was studied>
I (Intervention): <what was applied>
C (Comparison): <comparator used>
O (Outcome): <primary findings>

Abstract:
{text}
"""

# ---------------------------------------------------
# 🔹 PROVIDERS
# ---------------------------------------------------

def summarize_runpod(text: str) -> str:
    url = os.getenv("RUNPOD_ENDPOINT", "https://api.runpod.ai/v2/73o59xybq4qskk/openai/v1/chat/completions")
    api_key = os.getenv("RUNPOD_API_KEY")
    if not api_key: return "Error: RUNPOD_API_KEY missing"

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "google/medgemma-4b-it",
        "messages": [
            {"role": "system", "content": PICO_SYSTEM_PROMPT},
            {"role": "user", "content": PICO_USER_PROMPT.format(text=text)}
        ],
        "temperature": 0.1, "max_tokens": 512
    }
    try:
        r = requests.post(url, json=payload, timeout=120)
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e: return f"RunPod Error: {str(e)}"

def summarize_ollama(text: str) -> str:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    url = f"{host}/v1/chat/completions"
    payload = {
        "model": os.getenv("OLLAMA_MODEL", "medgemma-gi"),
        "messages": [
            {"role": "system", "content": PICO_SYSTEM_PROMPT},
            {"role": "user", "content": PICO_USER_PROMPT.format(text=text)}
        ],
        "temperature": 0.2
    }
    try:
        r = requests.post(url, json=payload, timeout=60)
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e: return f"Ollama Error: {str(e)}"

def summarize_groq(text: str) -> str:
    import httpx
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key: return "Error: GROQ_API_KEY missing"
    try:
        with httpx.Client() as client:
            g = Groq(api_key=api_key, http_client=client)
            res = g.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "system", "content": PICO_SYSTEM_PROMPT},
                          {"role": "user", "content": PICO_USER_PROMPT.format(text=text)}],
                temperature=0.2
            )
            return res.choices[0].message.content
    except Exception as e: return f"Groq Error: {str(e)}"

# ---------------------------------------------------
# 🔹 PUBMED API LOGIC
# ---------------------------------------------------
import os
import requests
import time
from xml.etree import ElementTree
from typing import List, Optional

NCBI_API_KEY = os.getenv("NCBI_API_KEY") 

def search_pubmed(query: str, max_results: int = 5, year: Optional[int] = None) -> List[str]:
    """Search PubMed and return list of PubMed IDs with precise year filtering."""
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"

    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "xml",
        "sort": "pub_date",
    }

    if year:
        params["mindate"] = f"{year}/01/01"
        params["maxdate"] = f"{year}/12/31"
        params["datetype"] = "pdat"
        params["term"] = f"({query}) AND {year}[PDAT]"

    # ✅ This now works because NCBI_API_KEY is defined above
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY

    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        root = ElementTree.fromstring(resp.content)
    except Exception as e:
        print(f"❌ PubMed search error: {e}")
        return []

    ids = [id_elem.text for id_elem in root.findall(".//Id")]
    print(f"🔍 PubMed search returned {len(ids)} IDs for year {year} for query: '{query}'")
    
    return ids

def fetch_abstracts(pubmed_ids: List[str], year: Optional[int] = None) -> List[Dict]:
    """Fetch abstracts and years for a list of PubMed IDs."""
    if not pubmed_ids:
        print("⚠️ fetch_abstracts called with empty ID list.")
        return []
 
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

    # We send all IDs at once to avoid multiple hits to the server (prevents 429)
    params = {
        "db": "pubmed",
        "id": ",".join(pubmed_ids),
        "retmode": "xml",
    }
    
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY
 
    try:
        # Small sleep to be polite to the NCBI servers
        time.sleep(0.35)
        resp = requests.get(url, params=params, timeout=15)
        
        # 🔹 Better 429 Handling
        if resp.status_code == 429:
            print("❌ Rate limit hit (429). Waiting 2 seconds...")
            time.sleep(2)
            resp = requests.get(url, params=params, timeout=15)
            
        resp.raise_for_status()
        root = ElementTree.fromstring(resp.content)
    except Exception as e:
        print(f"❌ PubMed fetch error: {e}")
        return []
 
    results = []
    for article in root.findall(".//PubmedArticle"):
        abstract_texts = [t.text for t in article.findall(".//AbstractText")]
        abstract = " ".join([t for t in abstract_texts if t]) if abstract_texts else "No abstract."
 
        # Year extraction with fallback chain
        article_year = 2024
        year_elem = article.find(".//PubDate/Year")
        if year_elem is None:
            year_elem = article.find(".//ArticleDate/Year")
            
        if year_elem is not None:
            try:
                article_year = int(year_elem.text)
            except (ValueError, TypeError):
                pass
 
        # 🔹 IMPROVED YEAR GUARD: Allows future years (e.g., 2026 research when searching 2025)
        if year and article_year < year:
            print(f"⚠️ Skipping older article: {article_year} (Target was {year}+)")
            continue
 
        results.append({
            "abstract": abstract,
            "year": article_year
        })
 
    print(f"📄 Successfully processed {len(results)} abstracts from PubMed.")
    return results

# ---------------------------------------------------
# 🔹 CLINICAL TRIALS V2 API LOGIC
# ---------------------------------------------------

CT_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def fetch_clinical_trials(
    query: str,
    page_size: int = 5,
    max_pages: int = 1,
    year: Optional[int] = None
) -> List[Dict]:
    """
    Fetch clinical trials from ClinicalTrials.gov v2 API with optional year filtering.
    Returns: [{ "id": str, "abstract": str, "year": int }]
    """
    if not query:
        raise ValueError("Query parameter is required.")

    all_trials: List[Dict] = []
    next_page_token: Optional[str] = None

    # Build query with optional year filter
    ct_query = query
    if year:
        ct_query = f"({query}) AND AREA[StartDate] RANGE[{year}-01-01, {year}-12-31]"

    for _ in range(max_pages):
        params = {
            "query.term": ct_query,
            "pageSize": min(page_size, 100),
            "sort": "LastUpdatePostDate:desc",  # Sort by latest
        }
        if next_page_token:
            params["pageToken"] = next_page_token

        try:
            response = requests.get(CT_BASE_URL, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"❌ ClinicalTrials API error: {e}")
            break

        studies = data.get("studies", [])
        for study in studies:
            protocol = study.get("protocolSection", {})
            identification = protocol.get("identificationModule", {})
            description = protocol.get("descriptionModule", {})
            status = protocol.get("statusModule", {})

            nct_id = identification.get("nctId")
            summary = description.get("briefSummary")

            # Extract year from startDateStruct — use separate variable to avoid
            # shadowing the `year` function parameter
            trial_year = 2024
            start_date_str = status.get("startDateStruct", {}).get("date")
            if start_date_str:
                # Format is usually YYYY-MM or YYYY-MM-DD
                try:
                    trial_year = int(start_date_str[:4])
                except ValueError:
                    pass

            if not nct_id or not summary:
                continue

            all_trials.append({
                "id": nct_id,
                "abstract": summary.strip(),
                "year": trial_year
            })

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

    print(f"🏥 Fetched {len(all_trials)} clinical trials for query: '{query}'")
    return all_trials
