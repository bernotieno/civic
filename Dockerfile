# =============================================================================
# CivicAI Production Dockerfile - Complete Multi-stage Build
# =============================================================================

# Stage 1: Frontend Build
FROM node:18-alpine as frontend-builder

WORKDIR /frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy frontend source
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Python Base with System Dependencies
FROM python:3.11-slim as backend-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Stage 3: Python Dependencies
FROM backend-base as backend-dependencies

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 4: Final Application Image
FROM backend-dependencies as application

# Create non-root user
RUN groupadd -r civicai && useradd -r -g civicai civicai

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/logs /app/frontend-build

# Copy Python application code
COPY --chown=civicai:civicai . .

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=civicai:civicai /frontend/dist /app/frontend-build

# Set proper permissions
RUN chown -R civicai:civicai /app

# Copy and set entrypoint permissions
COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh

# Switch to non-root user
USER civicai

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn"]

# # =============================================================================
# # CivicAI Production Dockerfile - Complete Multi-stage Build
# # =============================================================================

# # Stage 1: Frontend Build
# FROM node:18-alpine as frontend-builder

# WORKDIR /frontend

# # Copy package files
# COPY frontend/package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy frontend source
# COPY frontend/ ./

# # Build the frontend
# RUN npm run build

# # Stage 2: Python Base with System Dependencies
# FROM python:3.11-slim as backend-base

# ENV PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     DEBIAN_FRONTEND=noninteractive \
#     PIP_NO_CACHE_DIR=1 \
#     PIP_DISABLE_PIP_VERSION_CHECK=1

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     libpq-dev \
#     curl \
#     netcat-openbsd \
#     && rm -rf /var/lib/apt/lists/* \
#     && apt-get clean

# # Stage 3: Python Dependencies
# FROM backend-base as backend-dependencies

# WORKDIR /app

# # Copy requirements file
# COPY requirements.txt .

# # Install Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # Stage 4: Final Application Image
# FROM backend-dependencies as application

# # Create non-root user
# RUN groupadd -r civicai && useradd -r -g civicai civicai

# # Create necessary directories
# RUN mkdir -p /app/staticfiles /app/media /app/logs /app/frontend-build

# # Copy Python application code
# COPY --chown=civicai:civicai . .

# # Copy built frontend from frontend-builder stage
# COPY --from=frontend-builder --chown=civicai:civicai /frontend/dist /app/frontend-build

# # Set proper permissions
# RUN chown -R civicai:civicai /app

# # Copy and set entrypoint permissions
# COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh

# # Switch to non-root user
# USER civicai

# # Expose port
# EXPOSE 8000

# # Health check
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#     CMD curl -f http://localhost:8000/api/health/ || exit 1

# # Run entrypoint
# ENTRYPOINT ["/entrypoint.sh"]
# CMD ["gunicorn"]