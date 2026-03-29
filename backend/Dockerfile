# 1. Use a slim Python base to keep things fast
FROM python:3.11-slim

# 2. Install system tools required for PICO extraction & DB libs
RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the internal container directory
WORKDIR /app

# 4. Copy the data folder (now that you've moved it into /backend)
COPY ./data /data

# 5. Copy the rest of the backend code
COPY . .

# 6. Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 7. Seed the database AND start the server
CMD python -m app.seed_research && python app/main.py