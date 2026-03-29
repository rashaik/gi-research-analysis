#!/bin/sh

# Exit on any error
set -e

echo "--- ⏳ Starting Database Initialization ---"
# 1. Create Tables
python3 -c "from app.database import init_db; init_db()"

echo "--- 📖 Seeding GI Research & CDC Data ---"
# 2. Run your specific seeding scripts
# We use 'python3 -m' to ensure the 'app' package is in the path
python3 -m app.seed_research
python3 -m app.seed_cdc

echo "--- 🚀 Starting FastAPI with 2 Workers ---"
# 3. Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2