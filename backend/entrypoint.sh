#!/bin/sh

# Exit on any error
set -e

echo "--- ⏳ Starting Database Initialization ---"

# This will use the 10-retry loop you built in database.py 
# to wait for Postgres to be fully 'Ready for Query'
python3 -c "from app.database import init_db; init_db()"

echo "--- 🚀 Starting FastAPI with 2 Workers ---"

# exec ensures signals (like docker stop) reach uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

