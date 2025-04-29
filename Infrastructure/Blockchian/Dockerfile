FROM alpine:3.18

RUN apk update && apk add geth git curl bash python3 py3-pip vim openssh

RUN mkdir -p /go/src/github.com/ethereum

RUN mkdir -p /etc/ethereum/Pong

RUN mkdir -p /etc/ethereum/project



COPY conf/genesis.json /etc/ethereum/Pong/genesis.json

COPY deploy.py /etc/ethereum/Pong/deploy.py

COPY requirements.txt /etc/ethereum/Pong/requirements.txt

COPY password.txt /etc/ethereum/Pong/password.txt

COPY n.sh /etc/ethereum/Pong/n.sh

RUN pip3 install -r /etc/ethereum/Pong/requirements.txt

RUN chmod +r /etc/ethereum/Pong/genesis.json /etc/ethereum/Pong/deploy.py

EXPOSE 8551

