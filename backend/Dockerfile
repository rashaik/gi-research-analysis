# Use the full python image (heavier but has all build tools pre-installed)
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Copy the data folder from your project root
COPY data /app/data

# Copy everything from your backend folder
COPY backend /app

# Install dependencies (standard image handles this much better)
RUN pip install --no-cache-dir -r requirements.txt

# Run the seed script and then start the app
CMD ["sh", "-c", "python -m app.seed_research && python app/main.py"]