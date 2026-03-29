# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# System dependencies - Added 'netcat-openbsd' or 'curl' for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY app/ app/

# Copy the data folder from the root of the project into the backend container
COPY ./data /data

# --- NEW: Add Entrypoint Script ---
COPY entrypoint.sh .
# Must be root to chmod, then we switch to appuser
USER root
RUN chmod +x entrypoint.sh

# Create non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Use the script as the entrypoint
ENTRYPOINT ["./entrypoint.sh"]
