#!/bin/sh

set -e # Exit immediately if a command exits with a non-zero status.

python manage.py makemigrations
python manage.py migrate

python manage.py index_users

python manage.py collectstatic --noinput

# Create superuser if DJANGO_SUPERUSER variables are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
fi

# Deploy blockchain contract
echo "Deploying blockchain contract..."
python /app/tournaments/deploy_chain.py

# Start server
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000&

# Wait a bit for Kibana to be up, then create the index pattern
python tools/create_kibana_index_pattern.py

wait