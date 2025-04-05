#!/bin/sh

# Create SSL directory
mkdir -p /etc/nginx/ssl/

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=NY/L=NY/O=42/OU=42/CN=localhost"

chmod 600 /etc/nginx/ssl/nginx.key

nginx -g "daemon off;"