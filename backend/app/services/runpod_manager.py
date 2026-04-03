#!/usr/bin/env python3
import os
import sys
import time
import argparse
import requests

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY = os.getenv("RUNPOD_API_KEY")
# Default to the OpenAI-style completions endpoint if not provided
RUNPOD_ENDPOINT = os.getenv("RUNPOD_ENDPOINT", "https://api.runpod.ai/v2/73o59xybq4qskk/openai/v1/chat/completions")
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# ── Derive IDs and Base URLs ──────────────────────────────────────────────────
def get_config():
    # Find the endpoint ID within the URL
    parts = RUNPOD_ENDPOINT.split('/')
    try:
        idx = parts.index('v2')
        endpoint_id = parts[idx + 1]
        # Construct the clean base for /health and /runsync
        base_api_url = f"https://api.runpod.ai/v2/{endpoint_id}"
    except (ValueError, IndexError):
        endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID", "unknown")
        base_api_url = f"https://api.runpod.ai/v2/{endpoint_id}"
    
    return endpoint_id, base_api_url

ENDPOINT_ID, BASE_API_URL = get_config()

STAGE_LABELS = {
    "starting_gpu":  "⚡ Starting GPU    …",
    "loading_model": "🧠 Loading Model   …",
    "online":        "✅ MedGemma is Online",
    "offline":       "🔴 Backend Offline",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _check_env():
    if not API_KEY:
        print("[ERROR] Missing RUNPOD_API_KEY environment variable.")
        sys.exit(1)

def get_health() -> dict:
    url = f"{BASE_API_URL}/health"
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        # Fallback for connection issues or timeouts during cold start
        return {"stage": "starting_gpu", "label": STAGE_LABELS["starting_gpu"], "ok": False, "workers": {}}

    workers = data.get("workers", {})
    active_workers = workers.get("idle", 0) + workers.get("ready", 0) + workers.get("running", 0)
    
    if active_workers > 0:
        stage = "online"
    elif workers.get("initializing", 0) > 0 or workers.get("throttled", 0) > 0:
        stage = "loading_model"
    elif workers.get("unhealthy", 0) > 0:
        stage = "offline"
    else:
        stage = "starting_gpu"

    return {
        "stage": stage,
        "label": STAGE_LABELS[stage].strip(),
        "ok": (stage == "online"),
        "workers": workers,
        "jobs": data.get("jobs", {}),
    }

def warm_worker():
    url = f"{BASE_API_URL}/runsync"
    payload = {
        "input": {
            "model": "google/medgemma-4b-it",
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1,
            "temperature": 0,
        }
    }
    print(f"[warm] Sending pulse to {ENDPOINT_ID} to wake worker...")
    try:
        # We use a short timeout here; we don't need the result, just to trigger the alloc
        requests.post(url, json=payload, headers=HEADERS, timeout=5)
    except requests.exceptions.RequestException:
        # Timeouts are expected during the cold start trigger
        pass

# ── CLI Commands ──────────────────────────────────────────────────────────────

def cmd_status():
    _check_env()
    info = get_health()
    print(f"\n{'─'*40}")
    print(f"  Endpoint : {ENDPOINT_ID}")
    print(f"  Status   : {info['label']}")
    print(f"  Workers  : {info['workers']}")
    print(f"{'─'*40}\n")
    sys.exit(0 if info["ok"] else 2)

def cmd_warm(timeout: int = 300, poll_interval: int = 8):
    _check_env()
    start_time = time.time()
    warm_worker()

    print(f"\n[manager] Warming {ENDPOINT_ID} (Timeout: {timeout}s)\n")
    
    prev_stage = None
    while (time.time() - start_time) < timeout:
        info = get_health()
        stage = info["stage"]

        if stage != prev_stage:
            ts = time.strftime("%H:%M:%S")
            print(f"  [{ts}] {STAGE_LABELS[stage]}")
            prev_stage = stage

        if info["ok"]:
            print("\n✅ MedGemma is Online — ready to extract PICO data.\n")
            sys.exit(0)

        time.sleep(poll_interval)

    print(f"\n[manager] Timeout reached. Worker is still initializing.\n")
    sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RunPod MedGemma Manager")
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("status")
    warm_p = sub.add_parser("warm")
    warm_p.add_argument("--timeout", type=int, default=300)
    
    args = parser.parse_args()
    if args.cmd == "status":
        cmd_status()
    elif args.cmd == "warm":
        cmd_warm(timeout=args.timeout)
    else:
        parser.print_help()