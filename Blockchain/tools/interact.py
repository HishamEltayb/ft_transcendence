from web3 import Web3, HTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
from models import Match, Tournament, save_tournament, get_tournaments
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


# Get all tournaments


# Add tournaments
print("Adding tournaments...")
matches = [
    Match("Player 1", "Player 2", 2, 1, "player1"),
    Match("Player 3", "Player 4", 3, 0, "player3"),
    Match("ai", "aken", 5, 0, "ai")
]

save_tournament("dice", matches)
print("Tournaments added successfully.")
tournaments = get_tournaments("dice")
print(tournaments)

