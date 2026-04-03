import os
import requests
import json
import re
from requests.exceptions import ReadTimeout
import time


def _clean_json_output(raw_text: str):
    """
    Extracts and parses JSON safely from LLM output.
    """
    try:
        # If input is already a dict (some APIs return parsed JSON)
        if isinstance(raw_text, dict):
            parsed = raw_text
        else:
            # Find JSON block
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if not match:
                raise ValueError("No JSON found")
            parsed = json.loads(match.group(0))

        # Normalize keys → P/I/C/O
        return {
            "P": parsed.get("P") or parsed.get("population") or "Not available",
            "I": parsed.get("I") or parsed.get("intervention") or "Not available",
            "C": parsed.get("C") or parsed.get("comparison") or "Not available",
            "O": parsed.get("O") or parsed.get("outcome") or "Not available",
        }
    except Exception:
        return {
            "P": "Extraction failed", "I": "Not available", "C": "Not available", "O": "Not available"
        }

def _build_prompt(text: str):
    return f"""You are a clinical research assistant. Extract PICO elements from the abstract below.
Return ONLY valid JSON in this format:
{{
  "P": "...",
  "I": "...",
  "C": "...",
  "O": "..."
}}
Abstract:
{text}"""

def extract_pico(text: str, backend: str = None):
    # 1. Auto-detect Backend
    # If RAILWAY_ENVIRONMENT is set, we are in the cloud -> Use RunPod
    # Otherwise, default to local Ollama
    if not backend:
        if os.getenv("RAILWAY_ENVIRONMENT"):
            backend = "runpod"
        else:
            backend = os.getenv("MEDGEMMA_BACKEND", "ollama")

    prompt = _build_prompt(text)

    # =========================
    # 🔹 RUNPOD vLLM BACKEND (OpenAI Compatible)
    # =========================
    if backend == "runpod":
        # Your specific RunPod endpoint from the screenshot
        url = os.getenv("RUNPOD_ENDPOINT", "https://api.runpod.ai/v2/73o59xybq4qskk/openai/v1/chat/completions")

        # url = os.getenv("RUNPOD_ENDPOINT")  # should be .../openai/v1/chat/completions
        if not url:
            raise ValueError("Missing RUNPOD_ENDPOINT (must include /openai/v1/chat/completions)")

        api_key = os.getenv("RUNPOD_API_KEY")
        if not api_key:
            raise ValueError("Missing RUNPOD_API_KEY")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            # "model": "google/medgemma-4b-it",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 512
        }

        try:
            r = requests.post(url, json=payload, headers=headers, timeout=(10, 600))

        except ReadTimeout:
            time.sleep(2)
            r = requests.post(url, json=payload, headers=headers, timeout=(10, 600))

            r.raise_for_status()
            response_json = r.json()
            content = response_json["choices"][0]["message"]["content"]
            return _clean_json_output(content)

        except Exception as e:
            return {"P": f"RunPod Error: {str(e)}", "I": "N/A", "C": "N/A", "O": "N/A"}

    # =========================
    # 🔹 OLLAMA BACKEND (LOCAL)
    # =========================
    else:
        base_url = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434").rstrip("/")
        url = f"{base_url}/api/generate"
        model_name = os.getenv("OLLAMA_MODEL", "medgemma-gi")

        payload = {
            "model": model_name,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.1}
        }

        try:
            r = requests.post(url, json=payload, timeout=120)
            r.raise_for_status()
            return _clean_json_output(r.json().get("response", ""))
        except Exception as e:
            return {"P": f"Local Ollama Error: {str(e)}", "I": "N/A", "C": "N/A", "O": "N/A"}