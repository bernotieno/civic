#!/bin/bash

# Production startup script for local testing
set -e

echo "🚀 Starting CivicAI in production mode..."

# Set production environment
export ENVIRONMENT=production
export DJANGO_SETTINGS_MODULE=civicAI.settings.production

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Using default PostgreSQL connection."
    export DATABASE_URL="postgresql://civicai_user:2222@localhost:5432/civicai_db"
fi

if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL not set. Using default Redis connection."
    export REDIS_URL="redis://127.0.0.1:6379/1"
fi

if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY not set. Using development key (NOT FOR PRODUCTION!)"
    export SECRET_KEY="zxo0-y!fou*_60p+6qu8c)=n207b@75^9s@x6$rf!334lcfqs("
fi

# Set other required variables
export DEBUG=False
export ALLOWED_HOSTS="localhost,127.0.0.1"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️ Running migrations..."
python manage.py migrate

echo "🏛️ Setting up counties..."
python manage.py setup_counties

echo "👤 Creating superuser..."
python manage.py create_civicai_superuser

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "🌐 Starting server..."
echo "Backend will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/api/docs/"
echo "Admin Panel: http://localhost:8000/admin/"

gunicorn civicAI.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120