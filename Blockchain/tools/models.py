from web3 import Web3, HTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
import hashlib
import json


class Match:
    Player1Name: str
    Player2Name: str
    Player1Score: int
    Player2Score: int
    Winner: str

    def __init__(self, Player1Name: str, Player2Name: str, Player1Score: int, Player2Score: int, Winner: str):
        self.Player1Name = Player1Name
        self.Player2Name = Player2Name
        self.Player1Score = Player1Score
        self.Player2Score = Player2Score
        self.Winner = Winner
    def __str__(self):
        return f"Match({self.Player1Name}, {self.Player2Name}, {self.Player1Score}, {self.Player2Score}, {self.Winner})"

class Tournament:
    tournament_name: str
    tournament_id: int
    matches: list

    def __init__(self, tournament_name: str, tournament_id: int, matches: list):
        self.tournament_name = tournament_name
        self.tournament_id = tournament_id
        self.matches = matches

    def __str__(self):
        return f"Tournament({self.tournament_name}, {self.tournament_id}, {self.matches})"

# ------------------------
# 1. Connect to local node
# ------------------------
print("Connecting to local node...") 
w3 = Web3(HTTPProvider('http://192.168.0.5:8545'))
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


def save_tournament(tournament_name: str, matches: list):
    """
    Adds a tournament to the blockchain.
    :param tournament_name: Name of the tournament
    :param tournament_id: ID of the tournament
    :param players: List of players
    :param matches: List of matches
    :return: None
    """
    # Get the current tournament count
    count = contract.functions.getTournamentCount().call()
    print("Tournament count:", count)

    # Create a new tournament
    tournament = Tournament(tournament_name, count, matches)

    # Add the tournament to the blockchain
    tx_hash = contract.functions.createTournament(
        tournament.tournament_name,
        [match.__dict__ for match in tournament.matches]
    ).transact()
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print("Tournament added successfully.")

    # Print the updated tournament count
    t = contract.functions.getTournamentCount().call()
    print("Tournament count after adding:", t)
    

def get_tournaments(name: str):
    """
    Gets a tournament from the blockchain.
    :param name: Name of the tournament
    :return: List of tournaments
    """
    # Get the tournaments ralated to the tournament name
    tournaments = contract.functions.getTournaments(name).call()
    print("Tournaments:", tournaments)
    return tournaments
