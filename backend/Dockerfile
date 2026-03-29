# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- FIX 1: Application Code Pathing ---
# Instead of app/ app/, copy everything in the current context to /app
# This ensures 'app/' and 'data/' are siblings in the root of the container
COPY . . 

# --- FIX 2: Permissions ---
# Switch to root to handle permissions, then back to appuser
USER root
RUN chmod +x entrypoint.sh && \
    useradd -m appuser && \
    chown -R appuser /app

USER appuser

EXPOSE 8000

# Use the script as the entrypoint
ENTRYPOINT ["./entrypoint.sh"]