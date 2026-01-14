# -------- Base image --------
FROM python:3.11-slim AS base

# Prevent Python from writing pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Ensure stdout/stderr are unbuffered
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# -------- Dependencies --------
FROM base AS dependencies

# Install build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip, setuptools, wheel to fix jaraco.context vuln
RUN pip install --upgrade pip setuptools wheel

# Copy dependency file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly upgrade jaraco.context to safe version
RUN pip install --upgrade "jaraco.context>=6.1.0"

# -------- Final image --------
FROM base AS final

# Copy installed dependencies from the dependencies stage
COPY --from=dependencies /usr/local /usr/local

# Copy application code
COPY app ./app

# Expose application port
EXPOSE 8000

# Start the ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
