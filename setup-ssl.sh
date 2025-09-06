#!/bin/bash
set -e

echo "🔒 SSL Certificate Setup for CivicAI"
echo "===================================="

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain.com>"
    echo "Example: $0 parliamentofkenya.org"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

echo "Setting up SSL for domain: $DOMAIN"
echo "Email: $EMAIL"

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Create directory for SSL certificates
mkdir -p docker/ssl

# Method 1: Use Certbot with standalone mode (if Nginx is not running yet)
echo "🔄 Obtaining SSL certificate..."

# Stop nginx if running
docker-compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Get certificate
sudo certbot certonly \
    --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN \
    --domains www.$DOMAIN

# Copy certificates to docker directory
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/ssl/key.pem

# Set proper permissions
sudo chown $(whoami):$(whoami) docker/ssl/cert.pem docker/ssl/key.pem

echo "✅ SSL certificates installed successfully!"

# Create renewal script
cat > renew-ssl.sh << EOF
#!/bin/bash
# SSL Certificate Renewal Script
set -e

echo "🔄 Renewing SSL certificates..."

# Renew certificates
sudo certbot renew --quiet

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/ssl/key.pem

# Set permissions
sudo chown \$(whoami):\$(whoami) docker/ssl/cert.pem docker/ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx

echo "✅ SSL certificates renewed successfully!"
EOF

chmod +x renew-ssl.sh

# Add to crontab for automatic renewal
(crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd) && ./renew-ssl.sh >> logs/ssl-renewal.log 2>&1") | crontab -

echo "🎉 SSL setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your DNS to point $DOMAIN to your VPS IP"
echo "2. Start your application with: ./deploy.sh"
echo "3. SSL certificates will auto-renew via cron job"
echo ""
echo "📄 Certificate files created:"
echo "  - docker/ssl/cert.pem"
echo "  - docker/ssl/key.pem"
echo "  - renew-ssl.sh (for manual renewal)"
