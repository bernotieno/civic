FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make build script executable
RUN chmod +x build.sh

# Set build-time environment variables
ENV SECRET_KEY=build-time-secret-key
ENV DEBUG=false
ENV DATABASE_URL=sqlite:///tmp/build.db
ENV REDIS_URL=redis://localhost:6379

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "start_server.py"]