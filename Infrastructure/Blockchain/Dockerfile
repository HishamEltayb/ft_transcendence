FROM alpine:latest

RUN apk update && apk add geth bash

RUN mkdir -p /etc/ethereum/Pong

COPY conf/genesis.json /etc/genesis.json

COPY tools/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]