user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream backend
    upstream backend {
        server web:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name parliamentofkenya.org www.parliamentofkenya.org;
        
        # Allow Let's Encrypt challenges
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name parliamentofkenya.org www.parliamentofkenya.org;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;" always;

        # Root directory for frontend
        root /app/frontend-build;
        index index.html;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Admin routes
        location /admin/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # WebSocket support for real-time features
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }

        # Static files
        location /static/ {
            alias /app/staticfiles/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files
        location /media/ {
            alias /app/media/;
            expires 7d;
            add_header Cache-Control "public";
        }

        # Frontend routes (SPA)
        location / {
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}








# #!/bin/bash
# set -e

# # Wait for database
# echo "Waiting for database..."
# while ! nc -z db 5432; do
#   sleep 1
# done
# echo "Database started"

# # Wait for Redis
# echo "Waiting for Redis..."
# while ! nc -z redis 6379; do
#   sleep 1
# done
# echo "Redis started"

# # Run migrations
# echo "Running database migrations..."
# python manage.py migrate --noinput

# # Collect static files
# echo "Collecting static files..."
# python manage.py collectstatic --noinput --clear

# # Setup counties if needed
# echo "Setting up counties..."
# python manage.py setup_counties

# # Create superuser if needed
# if [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
#     echo "Creating superuser..."
#     python manage.py shell -c "
# from apps.users.models import CustomUser
# if not CustomUser.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
#     CustomUser.objects.create_superuser(
#         email='$DJANGO_SUPERUSER_EMAIL',
#         password='$DJANGO_SUPERUSER_PASSWORD',
#         name='Admin User',
#         national_id='12345678'
#     )
#     print('Superuser created')
# else:
#     print('Superuser already exists')
# "
# fi

# # Execute the command
# case "$1" in
#     gunicorn)
#         echo "Starting Gunicorn server..."
#         exec gunicorn civicAI.wsgi:application \
#             --bind 0.0.0.0:8000 \
#             --workers 4 \
#             --worker-class gevent \
#             --worker-connections 1000 \
#             --max-requests 1000 \
#             --max-requests-jitter 100 \
#             --timeout 120 \
#             --keep-alive 5 \
#             --access-logfile /app/logs/gunicorn-access.log \
#             --error-logfile /app/logs/gunicorn-error.log \
#             --log-level info
#         ;;
#     celery)
#         echo "Starting Celery worker..."
#         exec celery -A civicAI worker \
#             --loglevel=info \
#             --concurrency=4 \
#             --logfile=/app/logs/celery-worker.log
#         ;;
#     celery-beat)
#         echo "Starting Celery beat..."
#         exec celery -A civicAI beat \
#             --loglevel=info \
#             --logfile=/app/logs/celery-beat.log
#         ;;
#     *)
#         exec "$@"
#         ;;
# esac