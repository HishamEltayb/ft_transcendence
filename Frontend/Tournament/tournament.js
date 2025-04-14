document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Get current user information
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUsername = currentUser.username || 'Player 1';
    
    // DOM Elements
    const homeButton = document.getElementById('homeButton');
    const tournamentButton = document.getElementById('tournamentButton');
    const tournamentSelectionScreen = document.getElementById('tournamentSelectionScreen');
    const playerSelectionScreen = document.getElementById('playerSelectionScreen');
    const tournamentBracketScreen = document.getElementById('tournamentBracketScreen');
    const tournamentResultsScreen = document.getElementById('tournamentResultsScreen');
    
    const fourPlayersBtn = document.getElementById('fourPlayersBtn');
    const eightPlayersBtn = document.getElementById('eightPlayersBtn');
    const returnToDashboardBtn = document.getElementById('returnToDashboardBtn');
    
    const playersInputContainer = document.getElementById('playersInputContainer');
    const playerSelectionTitle = document.getElementById('playerSelectionTitle');
    const startTournamentBtn = document.getElementById('startTournamentBtn');
    const backToSelectionBtn = document.getElementById('backToSelectionBtn');
    
    const bracketContainer = document.getElementById('bracketContainer');
    const playMatchBtn = document.getElementById('playMatchBtn');
    const resetTournamentBtn = document.getElementById('resetTournamentBtn');
    
    const winnerName = document.getElementById('winnerName');
    const newTournamentBtn = document.getElementById('newTournamentBtn');
    const returnHomeBtn = document.getElementById('returnHomeBtn');
    
    // Tournament State
    let tournamentSize = 0; // 4 or 8 players
    let players = [];
    let matches = [];
    let currentRound = 0;
    let selectedMatch = null;
    let tournamentWinner = null;
    let tournamentInProgress = false;
    
    // Initialize the tournament view
    function init() {
        // Set up event listeners
        homeButton.addEventListener('click', returnToDashboard);
        
        fourPlayersBtn.addEventListener('click', () => setupPlayerSelection(4));
        eightPlayersBtn.addEventListener('click', () => setupPlayerSelection(8));
        returnToDashboardBtn.addEventListener('click', returnToDashboard);
        
        startTournamentBtn.addEventListener('click', startTournament);
        backToSelectionBtn.addEventListener('click', backToTournamentSelection);
        
        playMatchBtn.addEventListener('click', playSelectedMatch);
        resetTournamentBtn.addEventListener('click', resetTournament);
        
        newTournamentBtn.addEventListener('click', backToTournamentSelection);
        returnHomeBtn.addEventListener('click', returnToDashboard);
    }
    
    // Return to Dashboard
    function returnToDashboard() {
        window.location.href = '../dashboard.html';
    }
    
    // Setup player selection screen
    function setupPlayerSelection(size) {
        tournamentSize = size;
        playerSelectionTitle.textContent = `Add Players (${size} Total)`;
        
        // Hide tournament selection screen
        tournamentSelectionScreen.style.display = 'none';
        
        // Clear previous player inputs
        playersInputContainer.innerHTML = '';
        
        // Add the current user as the first player (fixed)
        const currentPlayerDiv = document.createElement('div');
        currentPlayerDiv.className = 'playerInput';
        currentPlayerDiv.innerHTML = `
            <label>Player 1:</label>
            <input type="text" value="${currentUsername}" readonly>
        `;
        playersInputContainer.appendChild(currentPlayerDiv);
        
        // Add remaining player inputs
        for (let i = 1; i < size; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'playerInput';
            playerDiv.innerHTML = `
                <label>Player ${i+1}:</label>
                <input type="text" id="player${i+1}" placeholder="Enter player name">
            `;
            playersInputContainer.appendChild(playerDiv);
        }
        
        // Show player selection screen
        playerSelectionScreen.style.display = 'block';
    }
    
    // Start the tournament
    function startTournament() {
        // Collect player names
        players = [currentUsername]; // Current user is always player 1
        
        // Get other players' names from inputs
        for (let i = 1; i < tournamentSize; i++) {
            const playerInput = document.getElementById(`player${i+1}`);
            let playerName = playerInput.value.trim();
            
            // If no name entered, use default name
            if (!playerName) {
                playerName = `Player ${i+1}`;
            }
            
            players.push(playerName);
        }
        
        // Randomize player order (except player 1 who is the current user)
        const userPlayer = players[0];
        const otherPlayers = players.slice(1);
        shuffleArray(otherPlayers);
        players = [userPlayer, ...otherPlayers];
        
        // Create tournament bracket
        createTournamentBracket();
        
        // Save tournament state to localStorage
        saveTournamentState();
        
        // Hide player selection screen
        playerSelectionScreen.style.display = 'none';
        
        // Show tournament bracket screen
        tournamentBracketScreen.style.display = 'block';
        
        // Set tournament as in progress
        tournamentInProgress = true;
    }
    
    // Save tournament state to localStorage
    function saveTournamentState() {
        localStorage.setItem('tournamentState', JSON.stringify({
            players,
            matches,
            tournamentSize,
            currentRound,
            tournamentInProgress
        }));
    }
    
    // Create tournament bracket
    function createTournamentBracket() {
        bracketContainer.innerHTML = '';
        matches = [];
        currentRound = 0;
        selectedMatch = null;
        
        // Calculate number of rounds needed
        const rounds = Math.log2(tournamentSize);
        
        // Create first round matches
        const firstRoundMatches = [];
        for (let i = 0; i < tournamentSize; i += 2) {
            const match = {
                round: 0,
                player1: players[i],
                player2: players[i + 1],
                winner: null,
                completed: false,
                matchId: firstRoundMatches.length
            };
            firstRoundMatches.push(match);
        }
        matches.push(firstRoundMatches);
        
        // Create placeholder matches for subsequent rounds
        for (let round = 1; round < rounds; round++) {
            const roundMatches = [];
            const numMatches = tournamentSize / Math.pow(2, round + 1);
            
            for (let i = 0; i < numMatches; i++) {
                const match = {
                    round: round,
                    player1: null,
                    player2: null,
                    winner: null,
                    completed: false,
                    matchId: roundMatches.length
                };
                roundMatches.push(match);
            }
            matches.push(roundMatches);
        }
        
        // Render the bracket
        renderTournamentBracket();
    }
    
    // Render the tournament bracket
    function renderTournamentBracket() {
        bracketContainer.innerHTML = '';
        
        // Create each round
        matches.forEach((roundMatches, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round';
            roundDiv.innerHTML = `<h4>Round ${roundIndex + 1}</h4>`;
            
            // Create each match in the round
            roundMatches.forEach((match, matchIndex) => {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match';
                matchDiv.setAttribute('data-round', roundIndex);
                matchDiv.setAttribute('data-match', matchIndex);
                
                if (match.completed) {
                    matchDiv.classList.add('completed');
                }
                
                if (selectedMatch && selectedMatch.round === roundIndex && selectedMatch.matchId === matchIndex) {
                    matchDiv.classList.add('selected');
                }
                
                let matchContent = '';
                
                // First player
                if (match.player1) {
                    matchContent += `<div class="player ${match.winner === match.player1 ? 'winner' : ''}">${match.player1}</div>`;
                } else {
                    matchContent += `<div class="player">TBD</div>`;
                }
                
                // VS
                matchContent += `<div class="vs">VS</div>`;
                
                // Second player
                if (match.player2) {
                    matchContent += `<div class="player ${match.winner === match.player2 ? 'winner' : ''}">${match.player2}</div>`;
                } else {
                    matchContent += `<div class="player">TBD</div>`;
                }
                
                matchDiv.innerHTML = matchContent;
                
                // Add click event listener to select a match
                matchDiv.addEventListener('click', () => selectMatch(roundIndex, matchIndex));
                
                roundDiv.appendChild(matchDiv);
            });
            
            bracketContainer.appendChild(roundDiv);
        });
        
        // Enable/disable play button based on match selection
        updatePlayButtonState();
    }
    
    // Select a match
    function selectMatch(roundIndex, matchIndex) {
        const match = matches[roundIndex][matchIndex];
        
        // Can only select matches where both players are assigned and match isn't completed
        if (match.player1 && match.player2 && !match.completed) {
            selectedMatch = { round: roundIndex, matchId: matchIndex };
            renderTournamentBracket();
        } else {
            selectedMatch = null;
            renderTournamentBracket();
        }
    }
    
    // Update play button state
    function updatePlayButtonState() {
        playMatchBtn.disabled = !selectedMatch || 
                               !matches[selectedMatch.round][selectedMatch.matchId].player1 || 
                               !matches[selectedMatch.round][selectedMatch.matchId].player2 ||
                               matches[selectedMatch.round][selectedMatch.matchId].completed;
    }
    
    // Play selected match
    function playSelectedMatch() {
        if (!selectedMatch) return;
        
        const match = matches[selectedMatch.round][selectedMatch.matchId];
        
        // Store player names in localStorage for the game to use
        localStorage.setItem('tournamentMatch', JSON.stringify({
            player1: match.player1,
            player2: match.player2,
            round: selectedMatch.round,
            matchId: selectedMatch.matchId
        }));
        
        // Navigate to the game page
        window.location.href = '../Game/game.html?mode=tournament';
    }
    
    // Complete a match
    window.completeMatch = function(round, matchId, winnerName) {
        console.log("Completing match:", round, matchId, winnerName);
        
        // Check if tournament data is initialized
        if (!matches || matches.length === 0) {
            console.error("Tournament matches not initialized");
            return;
        }
        
        // Check if the round exists
        if (!matches[round]) {
            console.error("Round not found:", round);
            return;
        }
        
        // Check if the match exists
        if (!matches[round][matchId]) {
            console.error("Match not found:", round, matchId);
            return;
        }
        
        // Find the match
        const match = matches[round][matchId];
        
        // Set the winner
        match.winner = winnerName;
        match.completed = true;
        
        // If it's not the final round, update the next match
        if (round < matches.length - 1) {
            const nextRoundMatchId = Math.floor(matchId / 2);
            const nextMatch = matches[round + 1][nextRoundMatchId];
            
            // Determine if this player goes to player1 or player2 slot in the next match
            if (matchId % 2 === 0) {
                nextMatch.player1 = winnerName;
            } else {
                nextMatch.player2 = winnerName;
            }
            
            // Re-render the bracket
            renderTournamentBracket();
        } else {
            // This was the final match
            tournamentWinner = winnerName;
            showTournamentResults();
        }
        
        // Check if all matches in current round are completed
        const allMatchesCompleted = matches[round].every(m => m.completed);
        if (allMatchesCompleted) {
            currentRound++;
        }
    };
    
    // Show tournament results
    function showTournamentResults() {
        winnerName.textContent = tournamentWinner;
        
        // Hide tournament bracket screen
        tournamentBracketScreen.style.display = 'none';
        
        // Show tournament results screen
        tournamentResultsScreen.style.display = 'block';
        
        // Tournament is no longer in progress
        tournamentInProgress = false;
    }
    
    // Reset tournament
    function resetTournament() {
        // Hide all screens
        tournamentBracketScreen.style.display = 'none';
        tournamentResultsScreen.style.display = 'none';
        
        // Show tournament selection screen
        tournamentSelectionScreen.style.display = 'block';
        
        // Reset tournament state
        players = [];
        matches = [];
        currentRound = 0;
        selectedMatch = null;
        tournamentWinner = null;
        tournamentInProgress = false;
    }
    
    // Back to tournament selection
    function backToTournamentSelection() {
        // Hide all screens
        playerSelectionScreen.style.display = 'none';
        tournamentBracketScreen.style.display = 'none';
        tournamentResultsScreen.style.display = 'none';
        
        // Show tournament selection screen
        tournamentSelectionScreen.style.display = 'block';
    }
    
    // Utility function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Check if we're returning from a tournament match
    function checkReturnFromMatch() {
        const urlParams = new URLSearchParams(window.location.search);
        const matchResult = urlParams.get('result');
        
        if (matchResult === 'completed') {
            console.log("Returning from completed match");
            
            // Get match data from localStorage
            const matchData = JSON.parse(localStorage.getItem('tournamentMatchResult') || '{}');
            console.log("Match result data:", matchData);
            
            if (matchData.round !== undefined && matchData.matchId !== undefined && matchData.winner) {
                // Make sure tournament is initialized
                if (!matches || matches.length === 0) {
                    console.log("Tournament not initialized, restoring from localStorage");
                    // Try to restore tournament state from localStorage
                    const savedState = JSON.parse(localStorage.getItem('tournamentState') || '{}');
                    if (savedState.matches && savedState.matches.length > 0) {
                        matches = savedState.matches;
                        players = savedState.players || [];
                        tournamentSize = savedState.tournamentSize || 4;
                        currentRound = savedState.currentRound || 0;
                        tournamentInProgress = true;
                    } else {
                        console.error("Cannot complete match - tournament state not found");
                        return;
                    }
                }
                
                // Process match result
                completeMatch(matchData.round, matchData.matchId, matchData.winner);
                
                // Show tournament bracket screen
                tournamentSelectionScreen.style.display = 'none';
                tournamentBracketScreen.style.display = 'block';
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Clean up localStorage
                localStorage.removeItem('tournamentMatchResult');
            }
        }
    }
    
    // Initialize
    init();
    
    // Check if returning from a match
    checkReturnFromMatch();
});
