FROM alpine:latest

RUN apk update && apk add geth bash

RUN mkdir -p /go/src/github.com/ethereum

RUN mkdir -p /etc/ethereum/Pong

COPY conf/genesis.json /etc/genesis.json

COPY conf/password.txt /etc/password.txt

COPY tools/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh


CMD ["/entrypoint.sh"]