FROM python:3.11-slim

# Install system dependencies
RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy data from the root project folder
COPY data /app/data

# Copy backend code from the backend folder into the current workdir (/app)
COPY backend /app

RUN pip install --no-cache-dir -r requirements.txt

# Seed and start using the new paths
CMD python -m app.seed_research && python app/main.py