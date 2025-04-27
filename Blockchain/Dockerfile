FROM alpine:latest

# RUN apk update && apk add geth git curl bash python3 py3-pip vim openssh
RUN apk update && apk add geth bash

RUN mkdir -p /go/src/github.com/ethereum

RUN mkdir -p /etc/ethereum/Pong


COPY conf/genesis.json /etc/genesis.json

# COPY deploy.py /deploy.py

# COPY requirements.txt /requirements.txt

COPY conf/password.txt /etc/password.txt

COPY tools/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh
RUN chmod +r /etc/genesis.json
RUN chmod +r /etc/password.txt

# RUN pip3 install -r /etc/ethereum/Pong/requirements.txt

# Install initial genesis and chain data


CMD ["/entrypoint.sh"]