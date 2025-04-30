#!/bin/bash

geth --identity Pong --datadir /etc/ethereum/Pong init /etc/genesis.json

geth account new --password /run/secrets/password 

# Start Geth node in the background
geth --dev  --datadir /etc/ethereum/Pong --password /run/secrets/password --nodiscover  --http --http.addr "0.0.0.0" --http.vhosts '*' --allow-insecure-unlock --http.corsdomain "*" --http.api "personal,eth,net,web3,txpool" --authrpc.vhosts=*
