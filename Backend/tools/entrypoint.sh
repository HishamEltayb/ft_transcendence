#!/bin/sh


python manage.py migrate

# Create superuser if DJANGO_SUPERUSER variables are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
fi


# Start server
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
