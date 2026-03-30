#!/bin/sh
set -e
cd /app

# --- ⏳ Wait for Postgres to be ready ---
echo "--- ⏳ Waiting for Postgres to be ready ---"
MAX_RETRIES=30
COUNT=0

until python3 -c "
import os, psycopg2, sys
url = os.environ.get('DATABASE_URL')
if not url:
    print('ERROR: DATABASE_URL environment variable is not set!', file=sys.stderr)
    sys.exit(1)
try:
    psycopg2.connect(url)
    print('Postgres is ready!')
except Exception as e:
    print(f'Not ready: {e}', file=sys.stderr)
    sys.exit(1)
"; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
    echo "--- ❌ Could not connect to Postgres after $MAX_RETRIES attempts. Exiting. ---"
    exit 1
  fi
  echo "Postgres not ready yet... retrying ($((MAX_RETRIES - COUNT)) left)"
  sleep 3
done

echo "--- ⏳ Starting Database Initialization ---"
python3 -c "from app.database import init_db; init_db()"

# --- Seeding is intentionally skipped on deploy ---
# Data is already loaded in the database.
# To re-seed manually, run:
#   python3 -m app.seed_research
#   python3 -m app.seed_cdc

echo "--- 🚀 Starting FastAPI with 2 Workers ---"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2