# Use a stable Python 3.12 base
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (including libpq for Postgres and curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code and data (ensuring .jsonl files in /data are included)
COPY . .

# --- CRITICAL FIX: Script Execution ---
# We use root temporarily to ensure the script is executable and line endings are fixed
USER root

# This 'sed' command is a lifesaver—it removes hidden Windows carriage returns 
# that often break entrypoint scripts on Linux servers.
RUN sed -i 's/\r$//' entrypoint.sh && \
    chmod +x entrypoint.sh && \
    useradd -m appuser && \
    chown -R appuser /app

# Switch to non-root user for production security
USER appuser

# Document that the app listens on 8000 (standard for FastAPI)
EXPOSE 8000

# Use the explicit shell execution to avoid "Exec format error"
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]