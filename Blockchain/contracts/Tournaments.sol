// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract TournamentDatabase {
    
    struct Player {
        string playerName;
        uint score;
    }

    struct Match {
        string[2] players;
        uint8 matchStatus;
    }

    struct Tournament {
        string tournamentName;
        Player[] players;
        Match[] matches;
    }

    Tournament[] public tournaments;

    function createTournament(string memory _name) public {
        require(!_tournamentExists(_name), "Tournament already exists");

        // Push a new tournament and set its name
        tournaments.push();
        Tournament storage newTournament = tournaments[tournaments.length - 1];  // Access the newly added tournament
        newTournament.tournamentName = _name;
    }

    function addPlayer(string memory _tournamentName, string memory _playerName, uint _score) public {
        uint index = _findTournament(_tournamentName);
        if (!_playerExists(_tournamentName, _playerName))
            tournaments[index].players.push(Player(_playerName, _score));
        else 
        {

        }
    }

    function addMatch(string memory _tournamentName, string memory _player1, string memory _player2, uint8 _status) public {
        uint index = _findTournament(_tournamentName);
        tournaments[index].matches.push(Match([_player1, _player2], _status));
    }

    function getTournament(string memory _tournamentName) public view returns (string memory, uint, uint) {
        require(_tournamentExists(_tournamentName), "Tournament does not exist");
        uint index = _findTournament(_tournamentName);
        Tournament storage t = tournaments[index];
        return (t.tournamentName, t.players.length, t.matches.length);
    }

    function _findTournament(string memory _name) internal view returns (uint) {
        for (uint i = 0; i < tournaments.length; i++) {
            if (keccak256(bytes(tournaments[i].tournamentName)) == keccak256(bytes(_name))) {
                return i;
            }
        }
        return 0;
    }

    function _tournamentExists(string memory _name) internal view returns (bool) {
        for (uint i = 0; i < tournaments.length; i++) {
            if (keccak256(bytes(tournaments[i].tournamentName)) == keccak256(bytes(_name))) {
                return true;
            }
        }
        return false;
    }

    function _playerExists(string memory _Tname, string memory _name) internal view returns (bool) {
        uint index = _findTournament(_Tname);
        Tournament storage t = tournaments[index];
        for (uint i = 0; i < t.players.length; i++) {
            if (keccak256(bytes(t.players[i].playerName)) == keccak256(bytes(_name))) {
                return true;
            }
        }
        return false;
    }

    function _findplayer(string memory _Tournament, string memory _Player) internal view returns (uint)
    {
        require(_tournamentExists(_Tournament), "Tournament does not exist");
        require(_playerExists(_Tournament, _Player), "Player does not exist");
        uint index = _findTournament(_Tournament);
        Tournament storage tournament = tournaments[index];
        for (uint i = 0; i < tournament.players.length; i++){
            if(keccak256(bytes(tournament.players[i].playerName)) == keccak256(bytes(_Player)))
            return i;
        }
        return 0;
    }

    function getPlayer(string memory _Tournament, string memory _Player) public view returns (string memory, uint) {
    uint index = _findplayer(_Tournament, _Player);
    Tournament storage t = tournaments[_findTournament(_Tournament)];
    Player storage p = t.players[index];
    return (p.playerName, p.score);
    }

    function get_Tournaments() public view returns (string[] memory) {
    string[] memory names = new string[](tournaments.length);
    for (uint i = 0; i < tournaments.length; i++) {
        names[i] = tournaments[i].tournamentName;
    }
    return names;
    }

}

