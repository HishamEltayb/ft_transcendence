// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Tornaments_database {
    struct Match {
        string Player1Name;
        string Player2Name;
        uint256 Player1Score;
        uint256 Player2Score;
        string Winner;
    }
    struct Tournament {
        string name;
        string Winner;
        uint256 id;
        Match[] matches;
    }

    Tournament[] public tournaments;
    uint256 public tournamentCount;

    constructor() {
        tournamentCount = 0;
    }

    function createTournament(string memory _name, Match[] memory _matches) public {
        // require(tournamentCount < 3, "Maximum number of tournaments reached");
        Tournament storage newTournament = tournaments.push();
        newTournament.name = _name;
        string memory winner = "";
        for (uint i = 0; i < _matches.length; i++) {
            Match storage m = newTournament.matches.push();
            m.Player1Name = _matches[i].Player1Name;
            m.Player2Name = _matches[i].Player2Name;
            m.Player1Score = _matches[i].Player1Score;
            m.Player2Score = _matches[i].Player2Score;
            m.Winner = _matches[i].Winner;
            winner = _matches[i].Winner;
        }
        // Assigning the tournament ID
        newTournament.id = tournamentCount;
        newTournament.Winner = winner;
        tournamentCount++;
    }
    function getTournaments(string memory _name) public view returns (Tournament[] memory) {
        Tournament[] memory result = new Tournament[](tournamentCount);
        uint256 count = 0;
        for (uint256 i = 0; i < tournamentCount; i++) {
            if (keccak256(abi.encodePacked(tournaments[i].name)) == keccak256(abi.encodePacked(_name))) {
                result[count] = tournaments[i];
                count++;
            }
        }
        // Resize the array to the actual number of tournaments found
        assembly {
            mstore(result, count)
        }
        return result;
    }

    function getTournament(uint256 _id) public view returns (Tournament memory) {
        require(_id < tournamentCount, "Tournament does not exist");
        return tournaments[_id];
    }

    function getTournamentCount() public view returns (uint256) {
        return tournamentCount;
    }
}
