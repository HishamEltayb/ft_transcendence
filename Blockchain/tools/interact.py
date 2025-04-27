from web3 import Web3, HTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
import json


# ------------------------
# 1. Connect to local node
# ------------------------
print("Connecting to local node...") 
w3 = Web3(HTTPProvider('http://127.0.0.1:8545'))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
accounts = w3.eth.accounts
print("Connected to local node:", w3.is_connected())
print("accounts: ", w3.eth.accounts)
w3.eth.default_account = w3.eth.accounts[0]
print("Default account set to:", w3.eth.default_account)
print("balance:", w3.from_wei(w3.eth.get_balance(w3.eth.default_account), 'ether'), "ETH")

# -------------------------
# 2. load the contract
# -------------------------

with open('contracts/Tournaments.json', 'r') as file:
    contract_data = json.load(file)

abi = contract_data['abi']
contract_address = None
try:
    with open('contracts/contract_address.json', 'r') as file:
        contract_address = json.load(file)
        print("Contract address loaded from file:", contract_address)
except FileNotFoundError:
    print("No contract address found, deploying a new contract.")
contract = w3.eth.contract(address=contract_address, abi=abi)

# ------------------------
# 5. Interact with contract
# ------------------------

# Add tournaments
print("Adding tournaments...")

# Create first tournament and wait
tx_hash = contract.functions.createTournament("Alpha Cup").transact()
print(f"Creating Alpha Cup, tx hash: {tx_hash.hex()}")
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Alpha Cup created in block {tx_receipt.blockNumber}")

# Create second tournament and wait
tx_hash = contract.functions.createTournament("Beta Bash").transact()
print(f"Creating Beta Bash, tx hash: {tx_hash.hex()}")
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Beta Bash created in block {tx_receipt.blockNumber}")

# Now get the tournaments after waiting for transactions to be mined
contract.functions.addPlayer("Alpha Cup", "aken", 0).transact()
# players = contract.functions.getPla
# names = contract.functions.tournaments(0).call()
# print("🎯 Players in Alpha Cup:", players)

# print("Fetching tournaments...")
# print("🎯 Tournaments:", names)