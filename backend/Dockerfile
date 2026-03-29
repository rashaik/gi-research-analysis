# Use the full python image to avoid the 'gcc' build errors we saw earlier
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Copy EVERYTHING from your current context (Root Directory) into /app
# This ensures that both your 'data' and your 'app' folders are included
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the seed script and then start the app
# Using the module path 'app.seed_research' to ensure Python finds it
CMD ["sh", "-c", "python -m app.seed_research && python app/main.py"]