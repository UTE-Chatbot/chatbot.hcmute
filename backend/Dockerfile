FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including ICU for PyICU and Cairo for pycairo
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    pkg-config \
    libicu-dev \
    libcairo2-dev \
    libgirepository1.0-dev \
    libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8386

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8386"]
