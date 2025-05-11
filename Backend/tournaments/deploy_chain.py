from web3 import Web3, HTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
import os
import json


# ------------------------
# 1. Connect to local node
# ------------------------
print("Connecting to local node...") 
w3 = Web3(HTTPProvider('http://blockchain:8545'))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
print("Connected to local node:", w3.is_connected())
print("accounts: ", w3.eth.accounts)
w3.eth.default_account = w3.eth.accounts[0]
print("Default account set to:", w3.eth.default_account)
print("balance:", w3.from_wei(w3.eth.get_balance(w3.eth.default_account), 'ether'), "ETH")


# -------------------------
# 2. load the contract
# -------------------------

with open('/app/tools/Tournaments.json', 'r') as file:
    contract_data = json.load(file)

abi = contract_data['abi']
bytecode = contract_data['bytecode']

try:
    if os.path.exists('/app/tools/contract_address.json'):
        with open('/app/tools/contract_address.json', 'r') as file:
            contract_address = json.load(file)
        if w3.eth.contract(address=contract_address, abi=abi).functions.getTournamentCount().call() >= 0:
            print("Contract already deployed at:", contract_address)
            exit(0)
except Exception as e:
    pass

# ------------------------
# 3. Deploy the contract
# ------------------------
print("Deploying contract...")
Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
tx_hash = Contract.constructor().transact({'gas': 5000000})
print("Transaction hash:", tx_hash.hex())
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
contract = w3.eth.contract(address=tx_receipt.contractAddress, abi=abi)

print("✅ Contract deployed at:", contract.address)

with open('/app/tools/contract_address.json', 'w') as file:
    json.dump(contract.address, file)
print("Contract address saved to contract_address.json")
