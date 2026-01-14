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

# Install declared dependencies first
RUN pip install --no-cache-dir -r requirements.txt

# Ensure no vulnerable vendored jaraco.context remains inside setuptools
RUN rm -rf /usr/local/lib/python3.11/site-packages/setuptools/_vendor/jaraco* || true
RUN find /usr/local/lib/python3.11/site-packages -maxdepth 3 -name 'jaraco.context*' -exec rm -rf {} + || true

# Reinstall setuptools cleanly to avoid any stale vendored files
RUN pip uninstall -y setuptools || true
RUN pip install --upgrade --force-reinstall setuptools wheel

# Force-install safe jaraco.context
RUN pip install --upgrade --force-reinstall "jaraco.context>=6.1.0"

# -------- Final image --------
FROM base AS final

# Copy installed dependencies from the dependencies stage
COPY --from=dependencies /usr/local /usr/local

# Extra cleanup in final image: remove any vendored/old jaraco artifacts left inside setuptools
# and force-reinstall safe packages to ensure Trivy will not find the vulnerable metadata.
RUN pip install --upgrade --force-reinstall "jaraco.context>=6.1.0" wheel \
 && rm -rf /usr/local/lib/python3.11/site-packages/setuptools/_vendor/jaraco* || true \
 && rm -rf /usr/local/lib/python3.11/site-packages/setuptools/_vendor/jaraco.context-5.3.0.dist-info || true \
 && find /usr/local/lib/python3.11/site-packages -maxdepth 3 -name 'jaraco.context*' -exec rm -rf {} + || true

# Copy application code
COPY app ./app

# Expose application port
EXPOSE 8000

# Start the ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
