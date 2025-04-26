// gameLoader.js - Handles loading and initializing the game in SPA context

class GameLoader {
    constructor() {
        this.isGameInitialized = false;
        this.initializeListeners();
    }
    
    initializeListeners() {
        // Listen for when the game page is loaded into the SPA
        document.addEventListener('gamePageLoaded', this.loadGame.bind(this));
        
        // Also listen for SPA navigation to reinitialize if needed
        document.addEventListener('appInitialized', () => {
            if (window.location.pathname.includes('/game') && !this.isGameInitialized) {
                this.loadGame();
            }
        });
    }
    
    loadGame() {
        // Reset initialization state to make sure everything gets set up correctly
        this.isGameInitialized = false;
        
        // First, ensure all buttons exist and are accessible
        this.waitForGameButtons(() => {
            // Set up global keysPressed object to track keyboard input
            if (!window.keysPressed) {
                window.keysPressed = {};
            }
            
            // Set up keyboard event listeners (remove existing first to avoid duplicates)
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
            
            // Make sure isAIMode is initialized globally
            if (typeof window.isAIMode === 'undefined') {
                window.isAIMode = false;
            }
            
            // Check if game.js is already loaded
            if (typeof window.applySettings === 'function') {
    
                this.setupDirectButtonHandlers();
                this.ensureGameElementsAreVisible();
                this.isGameInitialized = true;
            } else {
                // Load game.js dynamically
                const script = document.createElement('script');
                script.src = './js/game.js';
                script.type = 'text/javascript';
                
                // When script loads, set up direct event handlers for buttons
                script.onload = () => {
        
                    // We need a longer delay to ensure everything is processed
                    setTimeout(() => {
                        this.setupDirectButtonHandlers();
                        this.ensureGameElementsAreVisible();
                        this.isGameInitialized = true;
                    }, 300);
                };
                
                document.body.appendChild(script);
            }
        });
    }
    
    // Handle keyboard input for paddle movement
    handleKeyDown(e) {
        // Update global keysPressed object
        window.keysPressed = window.keysPressed || {};
        window.keysPressed[e.key] = true;
        
        // Check if game should be started with any key when start text is displayed
        const startText = document.getElementById('startText');
        if (startText && startText.style.display === 'block' && 
            typeof window.startGame === 'function' && 
            !window.gameRunning && !window.gameOver) {

            window.startGame();
        }
    }
    
    handleKeyUp(e) {
        // Update global keysPressed object
        window.keysPressed = window.keysPressed || {};
        window.keysPressed[e.key] = false;
    }
    
    // Make sure game elements are sized correctly
    ensureGameElementsAreVisible() {
        // Force recalculation of dimensions
        if (typeof window.updateGameDimensions === 'function') {
            window.updateGameDimensions();
        }
        if (typeof window.initializePositions === 'function') {
            window.initializePositions();
        }
    }
    
    setupDirectButtonHandlers() {
        
        // Verify we have the main game buttons before proceeding
        const pvpButton = document.getElementById('pvpButton');
        const pveButton = document.getElementById('pveButton');
        const multiplayerButton = document.getElementById('multiplayerButton');
        
        if (!pvpButton || !pveButton) {
            console.error('Game buttons not found, cannot set up handlers!');

            // Try again after a delay
            setTimeout(() => this.setupDirectButtonHandlers(), 200);
            return;
        }
        
        // Direct setup of button handlers without relying on the game.js event listeners
        const setupButton = (id, action) => {
            const button = document.getElementById(id);
            if (button) {
                // First remove any existing listeners
                const oldButton = button;
                const newButton = button.cloneNode(true);
                if (oldButton.parentNode) {
                    oldButton.parentNode.replaceChild(newButton, oldButton);
                } else {
                    console.error(`Button ${id} has no parent node!`);
                    return;
                }
                // Add both click and touch events for better mobile compatibility
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
        
                    action();
                });
                newButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
        
                    action();
                });
            } else {
                console.error(`Button with id ${id} not found`);
            }
        };
        // Execute button setup immediately
        // PVP Button
        setupButton('pvpButton', () => {
            
            // Use the setGameMode function if available, otherwise fallback
            if (typeof window.setGameMode === 'function') {
                window.setGameMode('pvp');
            } else {
                // Set global flags directly (fallback)
                window.isAIMode = false;
                window.isMultiplayerMode = false;
            }
            
            this.hideAllScreens();
            this.applySettings(false);
            this.resetGame();
            this.startGame();
        });
        // PVE (AI) Button
        setupButton('pveButton', () => {
            
            // Use the setGameMode function if available, otherwise fallback
            if (typeof window.setGameMode === 'function') {
                window.setGameMode('ai');
            } else {
                // Set global flags directly (fallback)
                window.isAIMode = true;
                window.isMultiplayerMode = false;
            }
            
            this.hideAllScreens();
            this.applySettings(true);
            this.resetGame();
            this.startGame();
        });
        // Multiplayer Button
        setupButton('multiplayerButton', () => {
            
            // Use the setGameMode function if available, otherwise fallback
            if (typeof window.setGameMode === 'function') {
                window.setGameMode('multiplayer');
            } else {
                // Set global flags directly (fallback)
                window.isAIMode = false;
                window.isMultiplayerMode = true;
            }
            
            this.hideAllScreens();
            this.applySettings(false);
            this.resetGame();
            this.startGame();
        });
        // Settings Link
        setupButton('settingsLink', () => {
            this.hideAllScreens();
            const settingsScreen = document.getElementById('settingsScreen');
            if (settingsScreen) settingsScreen.style.display = 'block';
        });
        // How to Play Link
        setupButton('howToPlayLink', () => {
            this.hideAllScreens();
            const howToPlayScreen = document.getElementById('howToPlayScreen');
            if (howToPlayScreen) howToPlayScreen.style.display = 'block';
        });
        // Save Settings Button
        setupButton('saveSettingsButton', () => {
            
            // Apply settings based on current values
            const isAIMode = window.isAIMode || false;
            this.applySettings(isAIMode);
            
            // Go back to game selection - do NOT start the game
            this.hideAllScreens();
            const gameSelection = document.querySelector('.gameSelection');
            if (gameSelection) gameSelection.style.display = 'block';
        });
        // Back from How to Play Button
        setupButton('backFromHowToPlayButton', () => {
            this.hideAllScreens();
            const gameSelection = document.querySelector('.gameSelection');
            if (gameSelection) gameSelection.style.display = 'block';
        });
        // Restart Button
        setupButton('restartButton', () => {
            const winScreen = document.getElementById('winScreen');
            if (winScreen) winScreen.style.display = 'none';
            
            // Reset game mode to default PVP
            if (typeof window.setGameMode === 'function') {
                window.setGameMode('pvp');
            } else {
                // Set global flags directly (fallback)
                window.isAIMode = false;
                window.isMultiplayerMode = false;
            }
            
            this.resetGame();
            this.hideAllScreens();
            
            const gameSelection = document.querySelector('.gameSelection');
            if (gameSelection) gameSelection.style.display = 'block';
        });
        // No delay needed here as we now handle the delay at the loadGame level
    }
    // Helper functions to support button actions
    hideAllScreens() {
        const screens = [
            document.getElementById('playScreen'),
            document.getElementById('settingsScreen'),
            document.getElementById('howToPlayScreen'),
            document.getElementById('startText'),
            document.getElementById('winScreen')
        ];
        screens.forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
        const gameSelection = document.querySelector('.gameSelection');
        if (gameSelection) gameSelection.style.display = 'none';
    }
    applySettings(isAIMode) {
        // IMPORTANT: Store AI mode in both global and local variables to ensure consistency
        window.isAIMode = isAIMode;
        
        // Check if we're in multiplayer mode (don't change it if we are)
        const isMultiplayerMode = window.isMultiplayerMode || false;
        
        // Make sure the AI difficulty container is always visible
        const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
        if (aiDifficultyContainer) {
            aiDifficultyContainer.style.display = 'block';
        }
        
        // Update team name settings visibility based on multiplayer mode
        const teamNameSettings = document.querySelectorAll('.setting-team');
        teamNameSettings.forEach(setting => {
            setting.style.display = isMultiplayerMode ? 'block' : 'none';
        });
        
        // Update AI name based on difficulty level
        this.updateAINameBasedOnDifficulty();
        
        // Call the existing applySettings function if available
        if (typeof window.applySettings === 'function') {
            // Double check that isAIMode is set correctly before applying settings
            window.isAIMode = isAIMode;
            window.applySettings();
            
            // Force the AI difficulty container to be visible even after applySettings
            if (aiDifficultyContainer) {
                setTimeout(() => {
                    aiDifficultyContainer.style.display = 'block';
                }, 50);
            }
            
            // Second update to make sure AI name is correct after window.applySettings()
            setTimeout(() => this.updateAINameBasedOnDifficulty(), 100);
        } else {
            console.error('applySettings function not available');
            // Fallback to basic settings
            const player1NameInput = document.getElementById('player1NameInput');
            const player2NameInput = document.getElementById('player2NameInput');
            const player1NameElement = document.getElementById('player1Name');
            const player2NameElement = document.getElementById('player2Name');
            
            if (player1NameElement && player1NameInput) {
                player1NameElement.textContent = player1NameInput.value || "Player 1";
            }
            
            // Set AI name based on difficulty if in AI mode
            this.updateAINameBasedOnDifficulty();
        }
    }
    
    resetGame() {
        if (typeof window.resetGame === 'function') {
            window.resetGame();
        } else {
            console.error('resetGame function not available');
        }
    }
    
    startGame() {
        if (typeof window.startGame === 'function') {
            window.startGame();
        } else {
            console.error('startGame function not available');
        }
    }
    
    // Wait for DOM elements to be available
    waitForGameButtons(callback) {
        const pvpButton = document.getElementById('pvpButton');
        const pveButton = document.getElementById('pveButton');
        const multiplayerButton = document.getElementById('multiplayerButton');
        
        if (pvpButton && pveButton) {
            callback();
        } else {
            setTimeout(() => this.waitForGameButtons(callback), 100);
        }
    }
    
    // Set AI name based on the selected difficulty
    updateAINameBasedOnDifficulty() {
        // Only update if we're in AI mode
        if (!window.isAIMode) return;
        
        const aiDifficultySelect = document.getElementById('aiDifficultySelect');
        const player2NameElement = document.getElementById('player2Name');
        
        if (aiDifficultySelect && player2NameElement) {
            const difficulty = aiDifficultySelect.value;
            const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            player2NameElement.textContent = `AI (${difficultyName})`;

        } else {
            console.error('Could not update AI name, elements not found');
        }
    }
}

// Initialize the loader
const gameLoader = new GameLoader();

export default gameLoader;
