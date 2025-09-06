#!/bin/bash
set -e

echo "🚀 CivicAI Production Deployment Script"
echo "======================================="

# Setup environment if not exists
if [ ! -f .env.production ]; then
    echo "🔧 Creating environment file..."
    ./setup-env.sh
    echo "⚠️  Edit .env.production with your domain and API keys, then run ./deploy.sh again"
    exit 0
fi

# Check if required environment variables are set
source .env.production
if [ -z "$SECRET_KEY" ]; then
    echo "❌ Error: SECRET_KEY not set in .env.production"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: DB_PASSWORD not set in .env.production"
    exit 1
fi

echo "✅ Environment configuration validated"

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test the application
echo "🧪 Testing application..."
if curl -f http://localhost/api/health/ > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your application at: http://localhost"
    echo "🔧 Admin interface: http://localhost/admin/"
    echo "📚 API Documentation: http://localhost/api/schema/swagger-ui/"
else
    echo "❌ Application health check failed"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs web
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart: docker-compose -f docker-compose.prod.yml restart"