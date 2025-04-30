FROM nginx:alpine

RUN apk add --no-cache openssl

COPY conf/nginx.conf /etc/nginx/nginx.conf

COPY tools/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
