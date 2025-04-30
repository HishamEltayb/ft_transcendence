#!/bin/bash



geth --identity Pong --datadir /etc/ethereum/Pong init /etc/genesis.json

geth account new --password /etc/password.txt 


# Start Geth node in the background
geth --dev  --datadir /etc/ethereum/Pong --password /etc/password.txt --nodiscover  --http --http.addr "0.0.0.0" --http.vhosts '*' --allow-insecure-unlock --http.corsdomain "*" --http.api "personal,eth,net,web3,txpool" --authrpc.vhosts=*

# geth --dev  --datadir /etc/ethereum/Pong --password /etc/password.txt --nodiscover  --http --http.addr "0.0.0.0" --allow-insecure-unlock --http.corsdomain "*" --http.api "personal,eth,net,web3,txpool" --authrpc.vhosts=*