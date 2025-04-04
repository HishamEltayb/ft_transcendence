FROM nginx:alpine

RUN apk add --no-cache openssl

COPY Infrastructure/nginx/conf/nginx.conf /etc/nginx/nginx.conf

COPY Infrastructure/nginx/tools/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /usr/share/nginx/html

COPY Frontend/ /usr/share/nginx/html/

ENTRYPOINT ["/entrypoint.sh"]
