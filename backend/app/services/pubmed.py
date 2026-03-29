import requests
import xml.etree.ElementTree as ET
import ollama
from ..models import ResearchRecord
from .medgemma import extract_pico

def run_pubmed_extraction(niche="Lean_MASLD", limit=3):
    """
    Queries PubMed for specific GI niches and returns structured metadata.
    """
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    
    # Map niches to specific MeSH terms or keywords
    query_map = {
        "Lean_MASLD": "Lean MASLD OR 'Lean NAFLD'",
        "MASH_Fibrosis": "MASH Fibrosis OR 'NASH Fibrosis'",
        "HCC": "Hepatocellular Carcinoma AND 'Metabolic Dysfunction'"
    }
    
    search_params = {
        "db": "pubmed",
        "term": query_map.get(niche, niche),
        "retmax": limit,
        "retmode": "json"
    }
    
    # 1. Search for IDs
    r = requests.get(search_url, params=search_params)
    id_list = r.json().get("esearchresult", {}).get("idlist", [])
    
    if not id_list:
        return []

    # 2. Fetch Details
    fetch_params = {
        "db": "pubmed",
        "id": ",".join(id_list),
        "retmode": "xml"
    }
    r_fetch = requests.get(fetch_url, params=fetch_params)
    root = ET.fromstring(r_fetch.content)
    
    articles = []
    for article in root.findall(".//PubmedArticle"):
        pmid = article.find(".//PMID").text
        title = article.find(".//ArticleTitle").text
        
        # Extract Abstract Text
        abstract_parts = article.findall(".//AbstractText")
        abstract_text = " ".join([part.text for part in abstract_parts if part.text])
        
        # Extract Year
        year_el = article.find(".//PubDate/Year")
        year = year_el.text if year_el is not None else "2024"
        
        articles.append({
            "pmid": pmid,
            "title": title,
            "abstract": abstract_text,
            "year": year
        })
        
    return articles

def extract_pico(abstract_text):
    """
    Uses local MedGemma-4B to extract PICO features from an abstract.
    """
    if not abstract_text:
        return "No abstract available for PICO extraction."
        
    prompt = f"""
    You are a medical research assistant. Extract the PICO criteria from this abstract:
    {abstract_text}
    
    Format:
    Population: [Details]
    Intervention: [Details]
    Comparison: [Details]
    Outcome: [Details]
    """
    
    try:
        response = ollama.generate(model='medgemma:4b', prompt=prompt)
        return response['response']
    except Exception as e:
        return f"MedGemma Error: {str(e)}"