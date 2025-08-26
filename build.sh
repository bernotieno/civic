#!/bin/bash

# Build script for Render.com deployment
set -o errexit  # exit on error

echo "🚀 Starting CivicAI build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Setup counties data
echo "🏛️ Setting up counties data..."
python manage.py setup_counties

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
python manage.py create_civicai_superuser

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"