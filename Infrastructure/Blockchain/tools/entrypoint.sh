#!/bin/bash

# Clean up any existing data that might cause conflicts
rm -rf /etc/ethereum/Pong/geth

# Initialize the blockchain with genesis configuration
echo "Initializing blockchain with genesis configuration..."
geth --identity Pong --datadir /etc/ethereum/Pong init /etc/genesis.json

# Create a new account
echo "Creating new account..."
geth account new --password /run/secrets/password --datadir /etc/ethereum/Pong

# Get the first account to use as etherbase (miner)
ETHER_BASE=$(geth --datadir /etc/ethereum/Pong account list | head -n 1 | grep -o '0x[0-9a-fA-F]\+')
echo "Using account $ETHER_BASE for mining"

# Start Geth node with proper configuration (NOT in dev mode)
echo "Starting Geth node..."
geth --datadir /etc/ethereum/Pong \
  --password /run/secrets/password \
  --nodiscover \
  --http \
  --http.addr "0.0.0.0" \
  --http.vhosts '*' \
  --allow-insecure-unlock \
  --http.corsdomain "*" \
  --http.api "personal,eth,net,web3,txpool" \
  --authrpc.vhosts=* \
  --mine \
  --unlock="$ETHER_BASE" \
  --miner.etherbase="$ETHER_BASE" \
  --networkid 987
