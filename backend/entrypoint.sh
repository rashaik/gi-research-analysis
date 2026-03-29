#!/bin/sh

# Exit on any error
set -e

# --- FIX: Ensure we are in the correct directory ---
cd /app

echo "--- ⏳ Starting Database Initialization ---"
# 1. Create Tables
python3 -c "from app.database import init_db; init_db()"

echo "--- 📖 Seeding GI Research & CDC Data ---"
# 2. Run seeding with explicit module paths
# Using 'python3 -m' is correct, but 'cd /app' makes it reliable
python3 -m app.seed_research
python3 -m app.seed_cdc

echo "--- 🚀 Starting FastAPI with 2 Workers ---"
# 3. Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2