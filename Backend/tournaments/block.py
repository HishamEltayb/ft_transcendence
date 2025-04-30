from web3 import Web3, HTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
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
# print("Connecting to local node...") 

# -------------------------
# 2. load the contract
# -------------------------

def init_account():
    """
    Initializes the account for the blockchain.
    :return: Web3 instance
    """
    w3 = Web3(HTTPProvider('http://blockchain:8545'))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    print("Connected to local node:", w3.is_connected())
    print("accounts: ", w3.eth.accounts)
    w3.eth.default_account = w3.eth.accounts[0]
    print("Default account set to:", w3.eth.default_account)
    print("balance:", w3.from_wei(w3.eth.get_balance(w3.eth.default_account), 'ether'), "ETH")
    return w3

def load_contract():
    """
    Loads the contract from the blockchain.
    :return: Contract object
    """

    w3 = init_account()
    with open('/app/contract/Tournaments.json', 'r') as file:
        contract_data = json.load(file)

    abi = contract_data['abi']
    contract_address = None
    try:
        with open('/app/contract/contract_address.json', 'r') as file:
            contract_address = json.load(file)
            print("Contract address loaded from file:", contract_address)
    except FileNotFoundError:
        print("No contract address found, deploying a new contract.")
    return w3.eth.contract(address=contract_address, abi=abi)



def save_tournament(tournament_name: str, matches: list):
    """
    Adds a tournament to the blockchain.
    :param tournament_name: Name of the tournament
    :param tournament_id: ID of the tournament
    :param players: List of players
    :param matches: List of matches
    :return: Tournament ID
    """
    # Get the current tournament count
    w3 = init_account()
    contract = load_contract()
    # count = contract.functions.getTournamentCount().call()
    # print("Tournament count:", count)

    # Create a new tournament
    # print("name: ", tournament_name, count)
    m = []
    for match in matches:
        a = Match(
            Player1Name=match["Player1Name"],  # Make sure casing matches contract ABI
            Player2Name=match["Player2Name"],
            Player1Score=match["Player1Score"],
            Player2Score=match["Player2Score"],
            Winner=match["Winner"]
            )
        m.append(a)
        # print("Match:", a)

    # tournament = Tournament(tournament_name, count, m)

    # Add the tournament to the blockchain
    tx_hash = contract.functions.createTournament(
        tournament_name,
        matches
    ).transact()
    w3.eth.wait_for_transaction_receipt(tx_hash)
    # print("Tournament added successfully.")

    # Print the updated tournament count
    t = contract.functions.getTournamentCount().call()
    # print("Tournament count after adding:", t)
    return t
    

def get_tournaments(name: str) -> list:
    """
    Gets a tournament from the blockchain.
    :param name: Name of the tournament
    :return: a list of match arrays
    """
    # Get the tournaments ralated to the tournament name
    result = []
    contract = load_contract()
    tournaments = contract.functions.getTournaments(name).call()
    for tournament in tournaments:
        result.append(
        {
            "tournament_id": tournament[2],
            "winner": tournament[1],
            "matches": [
                {
                    "matchType": "Tournament", 
                    "Player1Name": match[0],
                    "Player2Name": match[1],
                    "Player1Score": match[2],
                    "Player2Score": match[3],
                    "Winner": match[4]
                } for match in tournament[3] ]
        }
        )
    return result
