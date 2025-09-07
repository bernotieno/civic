#!/bin/bash
set -e

# Wait for database
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database started"

# Wait for Redis
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis started"

# Run migrations
echo "Running database migrations..."

python manage.py migrate --noinput

# Setup counties if needed
echo "Setting up counties..."
python manage.py setup_counties

# Execute the command
case "$1" in
    gunicorn)
        echo "Starting Gunicorn server..."
        exec gunicorn civicAI.wsgi:application \
            --bind 0.0.0.0:8000 \
            --workers 4 \
            --worker-class gevent \
            --worker-connections 1000 \
            --max-requests 1000 \
            --max-requests-jitter 100 \
            --timeout 120 \
            --keep-alive 5 \
            --access-logfile /app/logs/gunicorn-access.log \
            --error-logfile /app/logs/gunicorn-error.log \
            --log-level info
        ;;
    celery)
        echo "Starting Celery worker..."
        exec celery -A civicAI worker \
            --loglevel=info \
            --concurrency=4 \
            --logfile=/app/logs/celery-worker.log
        ;;
    celery-beat)
        echo "Starting Celery beat..."
        exec celery -A civicAI beat \
            --loglevel=info \
            --logfile=/app/logs/celery-beat.log
        ;;
    *)
        exec "$@"
        ;;
esac


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
