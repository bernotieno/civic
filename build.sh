#!/usr/bin/env bash
# =============================================================================
# CivicAI Render Build Script
# =============================================================================

set -o errexit  # Exit on error

echo "🚀 Starting CivicAI build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Setup counties (if not already done)
echo "🏛️ Setting up counties..."
python manage.py setup_counties || echo "Counties already set up"

# Create superuser (optional, for production access)
echo "👤 Creating superuser..."
python manage.py create_civicai_superuser || echo "Superuser already exists"

echo "✅ Build completed successfully!"