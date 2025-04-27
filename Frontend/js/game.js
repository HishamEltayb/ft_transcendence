class PongGame {
    constructor() {
        // Initialize DOM elements
        this.initDOMElements();
        
        // Initialize game state variables
        this.initGameState();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Export functions and variables to window for SPA context
        this.exportToWindow();
    }
    
/********************************************************************************************************
     * DOM ELEMENTS INITIALIZATION
 ********************************************************************************************************/
    initDOMElements() {
        // DOM Elements - Game Elements
        this.startText = document.getElementById('startText');
        this.paddle1 = document.getElementById('paddle1');
        this.paddle2 = document.getElementById('paddle2');
        this.paddle3 = document.getElementById('paddle3');
        this.paddle4 = document.getElementById('paddle4');
        this.ball = document.getElementById('ball');
        this.player1ScoreElement = document.getElementById('player1Score');
        this.player2ScoreElement = document.getElementById('player2Score');
        this.player1NameElement = document.getElementById('player1Name');
        this.player2NameElement = document.getElementById('player2Name');
        this.winScreen = document.getElementById('winScreen');
        this.winnerTextElement = document.getElementById('winnerText');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartButton = document.getElementById('restartButton');
        this.lossSound = document.getElementById('lossSound');
        this.wallSound = document.getElementById('wallSound');
        this.paddleSound = document.getElementById('paddleSound');

// UI Elements
        this.playScreen = document.getElementById('playScreen');
        this.settingsLink = document.getElementById('settingsLink');
        this.howToPlayLink = document.getElementById('howToPlayLink');
        this.settingsScreen = document.getElementById('settingsScreen');
        this.howToPlayScreen = document.getElementById('howToPlayScreen');

// Game Mode Elements
        this.pvpButton = document.getElementById('pvpButton');
        this.pveButton = document.getElementById('pveButton');
        this.multiplayerButton = document.getElementById('multiplayerButton');
        this.player2Controls = document.getElementById('player2Controls');
        this.winScoreSelect = document.getElementById('winScore');
        this.ballSpeedSelect = document.getElementById('ballSpeedSelect');
        this.aiDifficultySelect = document.getElementById('aiDifficultySelect');
        this.player1NameInput = document.getElementById('player1NameInput');
        this.player2NameInput = document.getElementById('player2NameInput');
        this.team1NameInput = document.getElementById('team1NameInput');
        this.team2NameInput = document.getElementById('team2NameInput');
        this.saveSettingsButton = document.getElementById('saveSettingsButton');
        this.backFromHowToPlayButton = document.getElementById('backFromHowToPlayButton');
        this.paddleSizeSelect = document.getElementById('paddleSize');
        this.backgroundSelect = document.getElementById('backgroundSelect');
        this.videoBackground = document.querySelector('.gameArea .video-background');
        this.teamNameSettings = document.querySelectorAll('.setting-team');
        this.sizeWarningScreen = document.getElementById('sizeWarningScreen');
        this.gameArea = document.querySelector('.gameArea');
        
        // Create Cancel/Exit button
        this.createCancelButton();
    }

/********************************************************************************************************
     * GAME STATE INITIALIZATION
 ********************************************************************************************************/
    initGameState() {
        // Game settings 
        this.currentBackground = 'classic'; // Default background
        this.paddleSizeMultiplier = 1; // Default paddle size multiplier

        // Multiplayer variables
        this.isMultiplayerMode = false;
        this.lastPaddleHit = null; // Track which paddle last hit the ball
        this.team1Name = "Left Team";
        this.team2Name = "Right Team";
        this.team1Score = 0;
        this.team2Score = 0;
        
// Core Game Variables
        this.gameRunning = false;
        this.gameOver = false;
        this.keysPressed = {};
        this.lastTime = null;

// Responsive scaling variables
        this.scaleX = 1;       // Horizontal scale factor
        this.scaleY = 1;       // Vertical scale factor

// Paddle Variables
        this.paddle1Speed = 0;
        this.paddle1Y = 0;
        this.paddle2Speed = 0;
        this.paddle2Y = 0;
        this.paddle3Speed = 0;
        this.paddle3Y = 0;
        this.paddle4Speed = 0;
        this.paddle4Y = 0;

// Ball Variables
        this.ballX = 0;
        this.ballY = 0;
        this.ballSpeedX = 5; // Default higher speed
        this.ballSpeedY = 5; // Default higher speed
        this.initialBallSpeed = 5; // Store initial ball speed for resets
        this.ballLastX = 0; // Track previous position for improved collision
        this.ballLastY = 0; // Track previous position for improved collision

// Score and Player Variables
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Name = "Player 1"; // Default player names
        this.player2Name = "Player 2"; // Default player names
        this.pointsToWin = 5; // Default points to win

        // Collision detection
        this.collisionProcessedThisFrame = false;

// AI Mode Variables
window.isAIMode = false; // Make isAIMode global to ensure it's accessible everywhere
        this.isAIMode = window.isAIMode; // Local reference
        this.lastAIUpdateTime = 0; // Track last time AI updated its perception
        this.aiPerceptionBallX = 0; // What the AI "sees" (not actual ball position)
        this.aiPerceptionBallY = 0;
        this.aiPerceptionBallSpeedX = 0;
        this.aiPerceptionBallSpeedY = 0;
        this.currentAIDifficulty = 'medium'; // Default difficulty

// AI Behavior Parameters - these will be set based on difficulty
        this.aiMistakeChance = 0.02;        // Chance of AI misperceiving the ball
        this.aiErrorMargin = 0.05;          // Paddle targeting precision (smaller = more accurate)
        this.aiReactionDelay = 1000;        // AI updates its perception once per second
        this.aiReturnToMiddleSpeed = 0.15;  // How quickly AI returns to center
        this.aiCenteringProbability = 0.3;  // How often AI tries to center itself
        this.aiPredictionAccuracy = 0.9;    // How accurately AI predicts bounces (0-1)

// AI Difficulty Presets
        this.aiDifficultySettings = {
  easy: {
    mistakeChance: 0.35,
    errorMargin: 0.35,
    reactionDelay: 1000, // 1 second as per requirements
    returnToMiddleSpeed: 0.05,
    centeringProbability: 0.2,
    predictionAccuracy: 0.5
  },
  medium: {
    mistakeChance: 0.15,
    errorMargin: 0.15,
    reactionDelay: 1000, // 1 second as per requirements
    returnToMiddleSpeed: 0.3,
    centeringProbability: 0.6,
    predictionAccuracy: 0.8
  },
  hard: {
    mistakeChance: 0.05,
    errorMargin: 0.05,
    reactionDelay: 1000, // 1 second as per requirements
    returnToMiddleSpeed: 0.7,
    centeringProbability: 0.9,
    predictionAccuracy: 0.95
  },
};

// AI Control State - simulating keyboard input
        this.aiKeyState = {
  'ArrowUp': false,
  'ArrowDown': false
};

// AI Tracking Variables
        this.lastBallHitX = 0;           // Track where ball was last hit
        this.shouldReturnToCenter = false; // Flag to indicate if AI should return to center
        
        // Physics Constants
        this.paddleAcceleration = 1;
        this.paddleDeceleration = 1;
        this.maxPaddleSpeed = 8; // Maximum paddle speed
        this.speedIncreaseFactor = 1.05; // 5% speed increase per paddle hit
        this.maxSpeed = 15; // Prevent excessive speed
        
        // Game Dimensions
        // Reference dimensions (what the game was originally designed for)
        // Now using 16:9 ratio
        this.REFERENCE_WIDTH = 960;
        this.REFERENCE_HEIGHT = 540;
        
        // Actual dimensions that will be updated based on current game area size
        this.gameWidth = this.REFERENCE_WIDTH;
        this.gameHeight = this.REFERENCE_HEIGHT;
        
        // Minimum dimensions for gameplay
        this.MIN_GAME_WIDTH = 320; // px
        this.MIN_GAME_HEIGHT = 180; // px
    }
    
    /********************************************************************************************************
     * EVENT LISTENERS INITIALIZATION
     ********************************************************************************************************/
    initEventListeners() {
        // Set up window load event
        window.addEventListener('load', this.onWindowLoad.bind(this));
        
        // Direct access to settings and how to play
        this.settingsLink.addEventListener('click', () => {
            this.hideAllScreens();
            this.settingsScreen.style.display = 'block';
            
            // Always show AI settings
            const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
            if (aiDifficultyContainer) {
                aiDifficultyContainer.style.display = 'block';
            }
        });

        this.howToPlayLink.addEventListener('click', () => {
            this.hideAllScreens();
            this.howToPlayScreen.style.display = 'block';
        });

        // Game Mode buttons with simpler direct start
        this.pvpButton.addEventListener('click', () => {
            // Use the new setGameMode function to set up PVP properly
            this.setGameMode('pvp');
            
            // Hide all screens
            this.hideAllScreens();
            
            // Apply current settings
            this.applySettings();
            
            // Reset and start the game immediately
            this.resetGame();
            this.startGame();
        });

        this.pveButton.addEventListener('click', () => {
            // Use the new setGameMode function to set up AI mode properly
            this.setGameMode('ai');
            
            // Hide all screens
            this.hideAllScreens();
            
            // Apply current settings
            this.applySettings();
            
            // Reset and start the game immediately
            this.resetGame();
            this.startGame();
        });

        // Log multiplayer button to check if it exists
        console.log("Multiplayer button exists:", !!this.multiplayerButton);
        if (this.multiplayerButton) {
            console.log("Adding click listener to multiplayer button");
        } else {
            console.error("MULTIPLAYER BUTTON NOT FOUND!");
            // Try to find it directly
            const directMultiplayerBtn = document.getElementById('multiplayerButton');
            console.log("Direct lookup multiplayer button:", directMultiplayerBtn);
            if (directMultiplayerBtn) {
                console.log("Found via direct lookup, reassigning");
                this.multiplayerButton = directMultiplayerBtn;
            }
        }

        // Add event listener for multiplayer button with extra force for green paddles
        if (this.multiplayerButton) {
            this.multiplayerButton.addEventListener('click', () => {
                console.log("MULTIPLAYER BUTTON CLICKED!");
                // Use the new setGameMode function to set up multiplayer properly
                this.setGameMode('multiplayer');
                
                // Hide all screens
                this.hideAllScreens();
                
                // Apply current settings
                this.applySettings();
                
                // Reset and start the game immediately
                this.resetGame();
                this.startGame();
            });
        }

        // Settings screen save button
        this.saveSettingsButton.addEventListener('click', () => {
            // Save settings but don't start the game yet
            this.applySettings();
            
            // Go back to game selection
            this.hideAllScreens();
            document.querySelector('.gameSelection').style.display = 'block';
        });

        // Back button from How to Play screen
        this.backFromHowToPlayButton.addEventListener('click', () => {
            this.hideAllScreens();
            document.querySelector('.gameSelection').style.display = 'block';
        });

        // Event listener for the restart button
        this.restartButton.addEventListener('click', () => {
            this.winScreen.style.display = 'none';
            this.isMultiplayerMode = false;
            this.resetGame();
            
            // Return to the game selection screen
            this.hideAllScreens();
            document.querySelector('.gameSelection').style.display = 'block';
            
            // Reset the lastTime variable to ensure the game loop starts fresh
            this.lastTime = null;
        });
        
        // Set up a periodic check to ensure isAIMode stays in sync
        setInterval(this.syncAIMode.bind(this), 1000);
    }
    
    // Window load event handler
    onWindowLoad() {
  // Initialize video state - ensure it's paused if not visible
        if (this.videoBackground) {
    // Make sure z-index is low by default
            this.videoBackground.style.zIndex = '-1000';
    
    // Pause the video initially
            const videoElement = this.videoBackground.querySelector('video');
    if (videoElement) {
      videoElement.pause();
      
      // Add event listeners to monitor video state
                videoElement.addEventListener('play', () => {});
                videoElement.addEventListener('pause', () => {});
    }
  } else {
    console.error('Video background not found on load');
  }
  
  // Make sure backgroundSelect reflects the default
        if (this.backgroundSelect) {
            this.backgroundSelect.value = 'classic';
  }
  
  // Set default background to classic
        this.currentBackground = 'classic';
  
  // Update game dimensions before initializing positions
        this.updateGameDimensions();
        this.initializePositions();
  
  // Apply settings which will ensure proper video state
        this.applySettings();
  
  // Check window size on load
        this.checkWindowSize();
  
  // Try to get logged-in user for player1 name
        const loggedInUser = this.getLoggedInUser();
  if (loggedInUser) {
            this.player1Name = loggedInUser.username;
            if (this.player1NameInput) {
                this.player1NameInput.value = this.player1Name;
    }
  }
  
  // Set default player names on initial load
        this.player1NameElement.textContent = this.player1Name;
        this.player2NameElement.textContent = "Player 2";
  
  // Hide all screens, don't select any button by default
        this.hideAllScreens();
  
  // Make sure the video is off by default
        this.toggleVideoBackground();
  
  // Add a global keydown listener for starting the game
        window.addEventListener('keydown', (e) => {
    // Only trigger if start text is visible and game isn't running
            if (this.startText.style.display === 'block' && !this.gameRunning && !this.gameOver) {
                this.startGame();
    }
  });
  
  // Set up regular game controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    /********************************************************************************************************
     * HELPER FUNCTIONS
     ********************************************************************************************************/
    // Get logged-in user data
    getLoggedInUser() {
        // Check if we have a user in localStorage
        const userData = localStorage.getItem('userData');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.username) {
                    return user;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        return null;
    }
    
    // Sync AI mode with global variable
    syncAIMode() {
        this.isAIMode = window.isAIMode;
    }
    
    // Export to window object for access from other contexts
    exportToWindow() {
        // Game state
        window.gameRunning = this.gameRunning;
        window.gameOver = this.gameOver;
        window.keysPressed = this.keysPressed;
        window.paddleSizeMultiplier = this.paddleSizeMultiplier;
        window.currentBackground = this.currentBackground;
        
        // Game control functions
        window.startGame = this.startGame.bind(this);
        window.resetGame = this.resetGame.bind(this);
        window.pauseGame = this.pauseGame.bind(this);
        window.resumeGame = this.resumeGame.bind(this);
        window.applySettings = this.applySettings.bind(this);
        window.handleKeyDown = this.handleKeyDown.bind(this);
        window.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Paddle movement functions
        window.updatePaddle1 = this.updatePaddle1.bind(this);
        window.updatePaddle2 = this.updatePaddle2.bind(this);
        window.updatePaddle3 = this.updatePaddle3.bind(this);
        window.updatePaddle4 = this.updatePaddle4.bind(this);
        
        // AI functions
        window.updateAIDecisions = this.updateAIDecisions.bind(this);
        
        // Game setup functions
        window.updateGameDimensions = this.updateGameDimensions.bind(this);
        window.initializePositions = this.initializePositions.bind(this);
        window.checkWindowSize = this.checkWindowSize.bind(this);
        window.ensureElementsInBounds = this.ensureElementsInBounds.bind(this);
        window.toggleVideoBackground = this.toggleVideoBackground.bind(this);
        window.updatePaddleSizes = this.updatePaddleSizes.bind(this);
        window.updatePaddleVisibility = this.updatePaddleVisibility.bind(this);
}

/********************************************************************************************************
 * UI NAVIGATION FUNCTIONS
 ********************************************************************************************************/
// Helper function to hide all screens
    hideAllScreens() {
  // Hide all screens and UI elements
        const screens = [this.playScreen, this.settingsScreen, this.howToPlayScreen, this.startText, this.winScreen];
  screens.forEach(screen => {
    if (screen) screen.style.display = 'none';
  });
  
  // Also hide the game selection
  const gameSelection = document.querySelector('.gameSelection');
  if (gameSelection) gameSelection.style.display = 'none';
        
        // Hide the cancel button when returning to screens
        const cancelButton = document.getElementById('cancelGameButton');
        if (cancelButton) {
            cancelButton.style.display = 'none';
        }
}

// Helper function retained for compatibility but no longer needed
    setNavButtonsEnabled(enabled) {
  // Navigation buttons removed from the UI
  // This function is kept as a no-op for backward compatibility
}

/********************************************************************************************************
     * KEYBOARD HANDLING
     ********************************************************************************************************/
    // Main key press handler that manages both starting the game and in-game controls
    handleKeyDown(e) {
        // ESC key is now handled by gameLoader.js - don't handle it here
        if (e.key === 'Escape') {
            return;
        }

        // Check if game should be started with any key
        if (this.startText.style.display === 'block' && !this.gameRunning && !this.gameOver) {
            this.startGame();
            return;
        }
        
        // Regular in-game controls
        this.keysPressed[e.key] = true;
    }

    handleKeyUp(e) {
        this.keysPressed[e.key] = false;
    }
    
    /********************************************************************************************************
     * GAME CONTROL FUNCTIONS
     ********************************************************************************************************/
    // Main Game Loop using requestAnimationFrame with delta time
    gameLoop(timestamp) {
        if (!this.gameRunning) {
            return; // Exit if game is not running
        }
            
        if (this.lastTime === null) {
            this.lastTime = timestamp;
        }
            
        const deltaTime = (timestamp - this.lastTime) / 16.67; // Normalize to 60fps baseline
        
        // Update game objects
        this.updatePaddle1(deltaTime);
        this.updatePaddle2(deltaTime);
        this.updatePaddle3(deltaTime);
        this.updatePaddle4(deltaTime);
        this.moveBall(deltaTime);
        
        this.lastTime = timestamp;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Helper function to play a sound with error handling
    playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error("Error playing sound:", error);
            });
        }
    }

    // Update the scoreboard with current scores
    updateScoreboard() {
        if (this.isMultiplayerMode) {
            this.player1ScoreElement.textContent = this.team1Score;
            this.player2ScoreElement.textContent = this.team2Score;
        } else {
            this.player1ScoreElement.textContent = this.player1Score;
            this.player2ScoreElement.textContent = this.player2Score;
        }
    }

    // Reset the ball position and speed
    resetBall() {
        // Reset ball position and speed
        this.ballX = this.gameWidth / 2 - this.ball.clientWidth / 2; // Ball in the middle horizontally
        this.ballY = Math.random() * (this.gameHeight - this.ball.clientHeight); // Random Y position within bounds
        
        // Store previous position for collision detection
        this.ballLastX = this.ballX;
        this.ballLastY = this.ballY;
        
        // Use the configured initial ball speed but with random direction
        this.ballSpeedX = Math.random() > 0.5 ? this.initialBallSpeed : -this.initialBallSpeed;
        // Randomly choose an up or down initial direction with configured speed
        this.ballSpeedY = Math.random() > 0.5 ? this.initialBallSpeed : -this.initialBallSpeed;
        
        // Ensure the vertical speed is a bit lower than horizontal for better gameplay
        this.ballSpeedY *= 0.5;
        
        // Update ball position
        this.ball.style.left = this.ballX + 'px';
        this.ball.style.top = this.ballY + 'px';
        
        // Make sure ball is visible and game is running
        this.ball.style.display = 'block';
        
        // Make sure the game stays running
        this.gameRunning = true;
    }

    // Reset the entire game state - updated for new settings
    resetGame() {
        // Reset scores
        this.player1Score = 0;
        this.player2Score = 0;
        this.team1Score = 0;
        this.team2Score = 0;
        this.updateScoreboard();
        
        // First clear any disabled state
        this.paddle1.classList.remove('paddle-disabled');
        this.paddle2.classList.remove('paddle-disabled');
        this.paddle3.classList.remove('paddle-disabled');
        this.paddle4.classList.remove('paddle-disabled');
        
        // Reset paddles and ball
        this.initializePositions();
        
        // Reset speeds
        this.paddle1Speed = 0;
        this.paddle2Speed = 0;
        this.paddle3Speed = 0;
        this.paddle4Speed = 0;
        this.ballSpeedX = this.initialBallSpeed;
        this.ballSpeedY = this.initialBallSpeed * 0.5;
        
        // Reset game state
        this.gameRunning = false;
        this.gameOver = false;
        this.collisionProcessedThisFrame = false;
        
        // In multiplayer mode, set proper initial paddle states
        if (this.isMultiplayerMode) {
            // Initialize the lastPaddleHit tracker
            this.lastPaddleHit = {
                leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
                rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
            };
            
            // Apply visual states
            this.paddle3.classList.add('paddle-disabled');
            this.paddle4.classList.add('paddle-disabled');
        } else {
            this.lastPaddleHit = null;
        }
        
        // Update player names display (ensuring they're always visible)
        this.updatePlayerNames();
        
        // Hide the ball until game starts
        this.ball.style.display = 'none';
        
        // Explicitly update paddle visibility
        this.updatePaddleVisibility();
        
        // Apply background based on settings
        this.toggleVideoBackground();
        
        // Reset last time to ensure game loop functions properly on restart
        this.lastTime = null;
    }

    // Start the game: hide all screens, show ball, disable nav buttons, and resume game loop
    startGame() {
        // First check if the window is large enough
        if (!this.checkWindowSize()) {
            // Don't start the game if window is too small
            return;
        }
        
        // Ensure elements are in bounds before starting
        this.ensureElementsInBounds();
        
        this.startText.style.display = 'none';
        this.ball.style.display = 'block';
        this.resetBall();
        this.gameRunning = true;
        this.gameOver = false;
        this.setNavButtonsEnabled(false);
        
        // Show the exit game button only when game is actually running
        const cancelButton = document.getElementById('cancelGameButton');
        if (cancelButton) {
            cancelButton.style.display = 'block';
        }
        
        // Always reset lastTime to ensure a fresh game loop start
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Function to display the win screen
    showWinScreen(winnerName) {
        this.gameRunning = false;
        this.gameOver = true;
        this.ball.style.display = 'none';
        
        // Hide the cancel button when game is over
        const cancelButton = document.getElementById('cancelGameButton');
        if (cancelButton) {
            cancelButton.style.display = 'none';
        }
        
        this.winnerTextElement.textContent = `${winnerName} Wins!`;
        
        if (this.isMultiplayerMode) {
            this.finalScoreElement.textContent = `${this.team1Score} - ${this.team2Score}`;
        } else {
            this.finalScoreElement.textContent = `${this.player1Score} - ${this.player2Score}`;
        }
        
        // Show normal win screen with buttons
        this.winScreen.style.display = 'block';
        
        // Re-enable navigation buttons when game is over
        this.setNavButtonsEnabled(true);
    }
    
    // Function to update the game dimensions and scale factors
    updateGameDimensions() {
        // Store previous dimensions to calculate scaling ratio
        const prevWidth = this.gameWidth;
        const prevHeight = this.gameHeight;
        
        // Get the actual dimensions of the game area
        const newWidth = this.gameArea.clientWidth;
        const newHeight = this.gameArea.clientHeight;
        
        // Calculate scale factors relative to reference dimensions
        const newScaleX = newWidth / this.REFERENCE_WIDTH;
        const newScaleY = newHeight / this.REFERENCE_HEIGHT;
        
        // Calculate scaling ratios between old and new dimensions
        const widthRatio = newWidth / prevWidth;
        const heightRatio = newHeight / prevHeight;
        
        // Update global variables
        this.gameWidth = newWidth;
        this.gameHeight = newHeight;
        this.scaleX = newScaleX;
        this.scaleY = newScaleY;
        
        if (this.gameRunning) {
            // Properly scale paddle positions
            this.paddle1Y = Math.min(this.gameHeight - this.paddle1.clientHeight, this.paddle1Y * heightRatio);
            this.paddle2Y = Math.min(this.gameHeight - this.paddle2.clientHeight, this.paddle2Y * heightRatio);
            this.paddle3Y = Math.min(this.gameHeight - this.paddle3.clientHeight, this.paddle3Y * heightRatio);
            this.paddle4Y = Math.min(this.gameHeight - this.paddle4.clientHeight, this.paddle4Y * heightRatio);
            
            // Scale ball position
            this.ballX = Math.min(this.gameWidth - this.ball.clientWidth, this.ballX * widthRatio);
            this.ballY = Math.min(this.gameHeight - this.ball.clientHeight, this.ballY * heightRatio);
            
            // Apply the new positions
            this.paddle1.style.top = this.paddle1Y + 'px';
            this.paddle2.style.top = this.paddle2Y + 'px';
            this.paddle3.style.top = this.paddle3Y + 'px';
            this.paddle4.style.top = this.paddle4Y + 'px';
            this.ball.style.left = this.ballX + 'px';
            this.ball.style.top = this.ballY + 'px';
            
            // Make sure the ball's previous position is also scaled for accurate collision detection
            this.ballLastX = this.ballLastX * widthRatio;
            this.ballLastY = this.ballLastY * heightRatio;
        } else {
            // If game is not running, just reset positions
            this.initializePositions();
        }
        
        // Ensure the resize doesn't break things by forcing a checkWindowSize
        this.checkWindowSize();
    }
    
    // Function to check if window size is adequate for gameplay
    checkWindowSize() {
        const gameAreaWidth = this.gameArea.clientWidth;
        const gameAreaHeight = this.gameArea.clientHeight;
        
        if (gameAreaWidth < this.MIN_GAME_WIDTH || gameAreaHeight < this.MIN_GAME_HEIGHT) {
            // Show warning and pause game if it's running
            this.sizeWarningScreen.style.display = 'block';
            if (this.gameRunning) {
                this.gameRunning = false;
            }
            return false;
        } else {
            // Hide warning and allow game to run
            this.sizeWarningScreen.style.display = 'none';
            
            // Important: Make sure paddles haven't gone out of bounds after resize
            this.ensureElementsInBounds();
            return true;
        }
    }

    // Function to ensure all game elements stay within bounds after resize
    ensureElementsInBounds() {
        // Check and fix paddle positions
        if (this.paddle1Y < 0) this.paddle1Y = 0;
        if (this.paddle2Y < 0) this.paddle2Y = 0;
        if (this.paddle3Y < 0) this.paddle3Y = 0;
        if (this.paddle4Y < 0) this.paddle4Y = 0;
        
        const maxPaddle1Y = this.gameHeight - this.paddle1.clientHeight;
        const maxPaddle2Y = this.gameHeight - this.paddle2.clientHeight;
        const maxPaddle3Y = this.gameHeight - this.paddle3.clientHeight;
        const maxPaddle4Y = this.gameHeight - this.paddle4.clientHeight;
        
        if (this.paddle1Y > maxPaddle1Y) this.paddle1Y = maxPaddle1Y;
        if (this.paddle2Y > maxPaddle2Y) this.paddle2Y = maxPaddle2Y;
        if (this.paddle3Y > maxPaddle3Y) this.paddle3Y = maxPaddle3Y;
        if (this.paddle4Y > maxPaddle4Y) this.paddle4Y = maxPaddle4Y;
        
        // Apply corrected positions
        this.paddle1.style.top = this.paddle1Y + 'px';
        this.paddle2.style.top = this.paddle2Y + 'px';
        this.paddle3.style.top = this.paddle3Y + 'px';
        this.paddle4.style.top = this.paddle4Y + 'px';
        
        // Check and fix ball position
        if (this.ballX < 0) this.ballX = 0;
        if (this.ballY < 0) this.ballY = 0;
        
        const maxBallX = this.gameWidth - this.ball.clientWidth;
        const maxBallY = this.gameHeight - this.ball.clientHeight;
        
        if (this.ballX > maxBallX) this.ballX = maxBallX;
        if (this.ballY > maxBallY) this.ballY = maxBallY;
        
        // Apply corrected positions
        this.ball.style.left = this.ballX + 'px';
        this.ball.style.top = this.ballY + 'px';
    }
    
    // Initialize paddle and ball positions
    initializePositions() {
        // Get the current dimensions of the game area
        this.gameWidth = this.gameArea.clientWidth;
        this.gameHeight = this.gameArea.clientHeight;
        
        // Update scale factors based on current dimensions
        this.scaleX = this.gameWidth / this.REFERENCE_WIDTH;
        this.scaleY = this.gameHeight / this.REFERENCE_HEIGHT;
        
        // Set the paddle width based on the game area width (responsive)
        const paddleWidth = Math.max(Math.round(0.01 * this.gameWidth), 6); // at least 6px wide
        this.paddle1.style.width = paddleWidth + 'px';
        this.paddle2.style.width = paddleWidth + 'px';
        this.paddle3.style.width = paddleWidth + 'px';
        this.paddle4.style.width = paddleWidth + 'px';
        
        // Apply the paddle height based on size multiplier (as percentage)
        const paddleHeight = 15 * this.paddleSizeMultiplier + '%'; // 15% is the base height
        this.paddle1.style.height = paddleHeight;
        this.paddle2.style.height = paddleHeight;
        this.paddle3.style.height = paddleHeight;
        this.paddle4.style.height = paddleHeight;

        // Calculate Y positions for paddles
        if (this.isMultiplayerMode) {
            // Position paddles 1 and 2 in their respective quarters
            this.paddle1Y = this.gameHeight * 0.25 - this.paddle1.clientHeight / 2;
            this.paddle2Y = this.gameHeight * 0.25 - this.paddle2.clientHeight / 2;
            
            // Calculate the Y positions for paddles 3 and 4, but don't set them directly
            // The CSS will position these paddles
            this.paddle3Y = this.gameHeight * 0.75 - this.paddle3.clientHeight / 2;
            this.paddle4Y = this.gameHeight * 0.75 - this.paddle4.clientHeight / 2;
            
            // Just set left/right for paddles 1 and 2
            this.paddle1.style.left = '0px';
            this.paddle2.style.right = '0px';
            this.paddle2.style.left = '';
            
            // Just show multiplar paddles without positioning
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            this.paddle3.style.cssText = 'display: block !important;';
            this.paddle4.style.cssText = 'display: block !important;';
            
            console.log('Multiplayer mode: Showing all paddles');
            
            // Initialize paddle states: paddle1 and paddle2 active, paddle3 and paddle4 disabled
            this.paddle1.classList.remove('paddle-disabled');
            this.paddle2.classList.remove('paddle-disabled');
            this.paddle3.classList.add('paddle-disabled');
            this.paddle4.classList.add('paddle-disabled');
            
            // Set lastPaddleHit for proper initialization
            this.lastPaddleHit = {
                leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
                rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
            };
            
            // Update game area CSS class
            this.gameArea.classList.add('isMultiplayerMode');
        } else {
            // Standard 2-player positioning
            this.paddle1Y = this.gameHeight / 2 - this.paddle1.clientHeight / 2;
            this.paddle2Y = this.gameHeight / 2 - this.paddle2.clientHeight / 2;
            
            // Position left and right paddles
            this.paddle1.style.left = '0px';
            this.paddle2.style.right = '0px';
            this.paddle2.style.left = '';
            
            // Hide multiplayer paddles in normal mode
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            this.paddle3.style.cssText = 'display: none !important;';
            this.paddle4.style.cssText = 'display: none !important;';
            
            // Make sure standard paddles are not disabled
            this.paddle1.classList.remove('paddle-disabled');
            this.paddle2.classList.remove('paddle-disabled');
            
            // Remove game area CSS class
            this.gameArea.classList.remove('isMultiplayerMode');
            
            console.log('Standard mode: Hiding paddles 3 and 4');
        }
        
        // Set the ball size based on the game area (responsive)
        const ballSize = Math.max(Math.round(0.02 * Math.min(this.gameWidth, this.gameHeight)), 8); // at least 8px
        this.ball.style.width = ballSize + 'px';
        this.ball.style.height = ballSize + 'px';
        
        // IMPORTANT: Calculate ball position AFTER updating its size
        // We need to account for the ball's dimensions to center it properly
        this.ballX = this.gameWidth / 2 - this.ball.clientWidth / 2;
        this.ballY = this.gameHeight / 2 - this.ball.clientHeight / 2;
        
        // Set previous position same as current for smooth collision detection
        this.ballLastX = this.ballX;
        this.ballLastY = this.ballY;

        // Apply positions
        this.paddle1.style.top = this.paddle1Y + 'px';
        this.paddle2.style.top = this.paddle2Y + 'px';
        this.paddle3.style.top = this.paddle3Y + 'px';
        this.paddle4.style.top = this.paddle4Y + 'px';
        
        this.ball.style.left = this.ballX + 'px';
        this.ball.style.top = this.ballY + 'px';
        
        // Reset speeds to ensure consistent gameplay
        this.paddle1Speed = 0;
        this.paddle2Speed = 0;
        this.paddle3Speed = 0;
        this.paddle4Speed = 0;
        
        // Make sure elements are within bounds
        this.ensureElementsInBounds();
        
        // Apply background based on settings
        this.toggleVideoBackground();
    }

/********************************************************************************************************
 * SETTINGS FUNCTIONS
 ********************************************************************************************************/
// Apply current settings
    applySettings() {
        this.pointsToWin = parseInt(this.winScoreSelect.value);
        this.initialBallSpeed = parseInt(this.ballSpeedSelect.value);
        this.ballSpeedX = Math.sign(this.ballSpeedX) * this.initialBallSpeed; // Preserve direction
        this.ballSpeedY = Math.sign(this.ballSpeedY) * this.initialBallSpeed; // Preserve direction
        this.player1Name = this.player1NameInput.value || "Player 1";
        this.player2Name = this.isAIMode ? "AI" : (this.player2NameInput.value || "Player 2");
  
  // Handle team names for multiplayer mode
        if (this.isMultiplayerMode) {
            this.team1Name = this.team1NameInput.value || "Left Team";
            this.team2Name = this.team2NameInput.value || "Right Team";
    
    // Update player names to reflect teams in multiplayer
            this.player1NameElement.textContent = this.team1Name;
            this.player2NameElement.textContent = this.team2Name;
    
    // Show team name settings
            this.teamNameSettings.forEach(setting => {
      setting.style.display = 'block';
    });
  } else {
    // Hide team name settings in regular modes
            this.teamNameSettings.forEach(setting => {
      setting.style.display = 'none';
    });
    
    // Regular player names display
            this.player1NameElement.textContent = this.player1Name;
            this.player2NameElement.textContent = this.player2Name;
  }
  
  // Apply new settings
        if (this.paddleSizeSelect) {
            const paddleSize = this.paddleSizeSelect.value;
    switch (paddleSize) {
      case 'small':
                    this.paddleSizeMultiplier = 0.7; // 70% of normal size
        break;
      case 'large':
                    this.paddleSizeMultiplier = 1.5; // 150% of normal size
        break;
      case 'normal':
      default:
                    this.paddleSizeMultiplier = 1.0; // Normal size
        break;
    }
    // Update paddle sizes immediately
            this.updatePaddleSizes();
  }
  
        if (this.backgroundSelect) {
            this.currentBackground = this.backgroundSelect.value;
    // Toggle video background based on setting
            this.toggleVideoBackground();
  }
  
  // Always apply AI difficulty settings regardless of mode
        if (this.aiDifficultySelect) {
            this.currentAIDifficulty = this.aiDifficultySelect.value;
            const settings = this.aiDifficultySettings[this.currentAIDifficulty];
    
    // Apply the difficulty settings
            this.aiMistakeChance = settings.mistakeChance;
            this.aiErrorMargin = settings.errorMargin;
            this.aiReactionDelay = settings.reactionDelay;
            this.aiReturnToMiddleSpeed = settings.returnToMiddleSpeed;
            this.aiCenteringProbability = settings.centeringProbability;
            this.aiPredictionAccuracy = settings.predictionAccuracy;
    
    // Update AI name to reflect difficulty if in AI mode
            if (this.isAIMode) {
                this.player2Name = `AI (${this.currentAIDifficulty.charAt(0).toUpperCase() + this.currentAIDifficulty.slice(1)})`;
    }
  }
  
  // Update display
        this.updateScoreboard();
  
  // Always show AI difficulty settings regardless of mode
  const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
  if (aiDifficultyContainer) {
    aiDifficultyContainer.style.display = 'block';
  }
}

// Function to update paddle sizes based on size multiplier
    updatePaddleSizes() {
  // Get base height (% of game area height)
  const baseHeight = 15; // 15% of game area height
  
  // Calculate new height as percentage
        const newHeightPercentage = baseHeight * this.paddleSizeMultiplier;
  
  // Apply to paddles
        if (this.paddle1 && this.paddle2 && this.paddle3 && this.paddle4) {
            this.paddle1.style.height = newHeightPercentage + '%';
            this.paddle2.style.height = newHeightPercentage + '%';
            this.paddle3.style.height = newHeightPercentage + '%';
            this.paddle4.style.height = newHeightPercentage + '%';
    
    // Reposition paddles to center them vertically
            this.resetPaddlePositions();
  }
}

// Function to reset paddle positions (used after size change)
    resetPaddlePositions() {
        if (this.paddle1 && this.paddle2 && this.paddle3 && this.paddle4) {
    // Calculate positions to center paddles vertically
            this.paddle1Y = this.gameHeight / 2 - this.paddle1.clientHeight / 2;
            this.paddle2Y = this.gameHeight / 2 - this.paddle2.clientHeight / 2;
            this.paddle3Y = this.gameHeight / 2 - this.paddle3.clientHeight / 2;
            this.paddle4Y = this.gameHeight / 2 - this.paddle4.clientHeight / 2;
    
    // Apply positions
            this.paddle1.style.top = this.paddle1Y + 'px';
            this.paddle2.style.top = this.paddle2Y + 'px';
            this.paddle3.style.top = this.paddle3Y + 'px';
            this.paddle4.style.top = this.paddle4Y + 'px';
        }
    }
    
    // Function to toggle video background based on settings and pause/play accordingly
    toggleVideoBackground() {
        // Make sure we're targeting the video inside the game area
        const gameAreaVideoBackground = document.querySelector('.gameArea .video-background');
        
        if (gameAreaVideoBackground) {
            const videoElement = gameAreaVideoBackground.querySelector('video');
            
            if (this.currentBackground === 'video') {
                // Set z-index to make video visible
                gameAreaVideoBackground.style.zIndex = '1';
                
                // Play the video when it becomes visible
                if (videoElement) {
                    videoElement.play().catch(err => {
                        console.error('Error playing video:', err);
                    });
                }
            } else {
                // Set z-index to hide video behind everything
                gameAreaVideoBackground.style.zIndex = '-1000';
                
                // Pause the video when it's hidden to save resources
                if (videoElement) {
                    videoElement.pause();
                }
            }
        } else {
            console.error('Game area video background element not found');
        }
    }
    
    // Function to update paddle visibility based on game mode
    updatePaddleVisibility() {
        // Always remove the disabled class from all paddles first
        this.paddle1.classList.remove('paddle-disabled');
        this.paddle2.classList.remove('paddle-disabled');
        this.paddle3.classList.remove('paddle-disabled');
        this.paddle4.classList.remove('paddle-disabled');
        
        // Update game area class for CSS targeting
        if (this.isMultiplayerMode) {
            this.gameArea.classList.add('isMultiplayerMode');
        } else {
            this.gameArea.classList.remove('isMultiplayerMode');
        }
        
        if (!this.isMultiplayerMode) {
            // Explicitly hide multiplayer paddles with !important to override any other styles
            this.paddle3.style.cssText = 'display: none !important;';
            this.paddle4.style.cssText = 'display: none !important;';
            
            // Make sure regular paddles are visible
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            
            // Reset last paddle hit
            this.lastPaddleHit = null;
            
            console.log('updatePaddleVisibility: Hiding paddles 3 and 4 in non-multiplayer mode');
        } else {
            // Show all paddles in multiplayer mode
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            
            // Just show the multiplayer paddles without positioning them
            this.paddle3.style.cssText = 'display: block !important;';
            this.paddle4.style.cssText = 'display: block !important;';
            
            console.log('updatePaddleVisibility: Showing all paddles in multiplayer mode');
            console.log('Paddle 3 style:', this.paddle3.style.cssText);
            console.log('Paddle 4 style:', this.paddle4.style.cssText);
            
            // Initialize proper lastPaddleHit if not already set
            if (!this.lastPaddleHit) {
                this.lastPaddleHit = {
                    leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
                    rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
                };
            }
            
            // Apply disabled class to the appropriate paddles based on lastPaddleHit
            if (this.lastPaddleHit.leftSide === 'paddle1') {
                this.paddle1.classList.add('paddle-disabled');
            } else {
                this.paddle3.classList.add('paddle-disabled');
            }
            
            if (this.lastPaddleHit.rightSide === 'paddle2') {
                this.paddle2.classList.add('paddle-disabled');
  } else {
                this.paddle4.classList.add('paddle-disabled');
            }
        }
    }
    
    // Function to explicitly set the game mode
    setGameMode(mode) {
        // First, ensure the game is not running
        console.log("===== SETTING GAME MODE TO:", mode, " =====");
        
        this.gameRunning = false;
        this.gameOver = false;
        
        // Clear any previous game state
        this.previousGameState = null;
        
        // Reset scores
        this.player1Score = 0;
        this.player2Score = 0;
        this.team1Score = 0;
        this.team2Score = 0;
        
        // Reset paddle classes and visibility first
        this.paddle1.classList.remove('paddle-disabled');
        this.paddle2.classList.remove('paddle-disabled');
        this.paddle3.classList.remove('paddle-disabled');
        this.paddle4.classList.remove('paddle-disabled');
        
        // Set the mode flags
        if (mode === 'multiplayer') {
            console.log("MULTIPLAYER MODE ACTIVATED - Debug info:");
            console.log("- paddle3 element:", this.paddle3);
            console.log("- paddle4 element:", this.paddle4);
            
            // Set multiplayer flags
            window.isAIMode = false;
            this.isAIMode = false;
            this.isMultiplayerMode = true;
            
            // Update game area CSS class
            this.gameArea.classList.add('isMultiplayerMode');
            console.log("- Added isMultiplayerMode class to gameArea");
            
            // Get current dimensions
            const gameWidth = this.gameArea.offsetWidth;
            const gameHeight = this.gameArea.offsetHeight;
            
            // Ensure paddles are properly sized
            const paddleWidth = Math.max(Math.round(0.01 * gameWidth), 6);
            this.paddle1.style.width = paddleWidth + 'px';
            this.paddle2.style.width = paddleWidth + 'px';
            this.paddle3.style.width = paddleWidth + 'px';
            this.paddle4.style.width = paddleWidth + 'px';
            
            // Apply paddle height based on size multiplier
            const paddleHeight = 15 * this.paddleSizeMultiplier + '%';
            this.paddle1.style.height = paddleHeight;
            this.paddle2.style.height = paddleHeight;
            this.paddle3.style.height = paddleHeight;
            this.paddle4.style.height = paddleHeight;
            
            // Position paddles 1 and 2
            this.paddle1.style.left = '0px';
            this.paddle2.style.right = '0px';
            this.paddle2.style.left = '';
            
            // Simply show paddles 3 and 4 without positioning
            console.log("- Setting paddle3 and paddle4 to display:block");
            this.paddle3.style.cssText = 'display: block !important;';
            this.paddle4.style.cssText = 'display: block !important;';
            
            console.log("- After setting cssText, paddle3.style.display =", this.paddle3.style.display);
            
            // Force a reflow to ensure CSS is applied
            this.paddle3.offsetHeight;
            this.paddle4.offsetHeight;
            
            // Verify visibility
            console.log('4-Player Mode activated');
            console.log('- Paddle 3 computed display:', window.getComputedStyle(this.paddle3).display);
            console.log('- Paddle 4 computed display:', window.getComputedStyle(this.paddle4).display);
            
            // Set lastPaddleHit to initialize paddle1 and paddle2 as active
            this.lastPaddleHit = {
                leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
                rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
            };
            
            // Disable the appropriate paddles
            this.paddle3.classList.add('paddle-disabled');
            this.paddle4.classList.add('paddle-disabled');
            
            // One more check to ensure these are visible
            setTimeout(() => {
                console.log("TIMEOUT CHECK - paddle display values:");
                console.log("- paddle3 display:", window.getComputedStyle(this.paddle3).display);
                console.log("- paddle4 display:", window.getComputedStyle(this.paddle4).display);
                console.log("- gameArea has isMultiplayerMode class:", this.gameArea.classList.contains('isMultiplayerMode'));
            }, 100);
        }
        else if (mode === 'ai') {
            // Set AI mode flags
            window.isAIMode = true;
            this.isAIMode = true;
            this.isMultiplayerMode = false;
            
            // Update game area CSS class
            this.gameArea.classList.remove('isMultiplayerMode');
            
            // Hide multiplayer paddles without positioning
            this.paddle3.style.cssText = 'display: none !important;';
            this.paddle4.style.cssText = 'display: none !important;';
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            
            // Reset lastPaddleHit
            this.lastPaddleHit = null;
            
            // Initialize AI variables
            this.aiPerceptionBallX = this.ballX;
            this.aiPerceptionBallY = this.ballY;
            this.aiPerceptionBallSpeedX = this.ballSpeedX;
            this.aiPerceptionBallSpeedY = this.ballSpeedY;
            this.lastAIUpdateTime = Date.now();
            
            console.log('AI Mode activated');
            console.log('AI Difficulty:', this.currentAIDifficulty);
        } 
        else { // pvp mode
            // Set PvP mode flags
            window.isAIMode = false;
            this.isAIMode = false;
            this.isMultiplayerMode = false;
            
            // Update game area CSS class
            this.gameArea.classList.remove('isMultiplayerMode');
            
            // Hide multiplayer paddles without positioning
            this.paddle3.style.cssText = 'display: none !important;';
            this.paddle4.style.cssText = 'display: none !important;';
            this.paddle1.style.display = 'block';
            this.paddle2.style.display = 'block';
            
            // Reset lastPaddleHit
            this.lastPaddleHit = null;
            
            console.log('PvP Mode activated');
        }
        
        // Update player names
        this.updatePlayerNames();
        
        // Initialize positions based on the new mode
        this.initializePositions();
        
        // Update paddle visibility based on current game mode
        this.updatePaddleVisibility();
        
        // Log the current mode for debugging
        console.log('Game mode set to:', mode);
        console.log('isAIMode:', this.isAIMode);
        console.log('isMultiplayerMode:', this.isMultiplayerMode);
    }

    // Helper function to update player names based on game mode
    updatePlayerNames() {
        if (this.isMultiplayerMode) {
            this.player1NameElement.textContent = this.team1Name;
            this.player2NameElement.textContent = this.team2Name;
        } else {
            this.player1NameElement.textContent = this.player1Name;
            this.player2NameElement.textContent = this.isAIMode ? "AI" : this.player2Name;
        }
}

/********************************************************************************************************
 * PADDLE MOVEMENT FUNCTIONS
 ********************************************************************************************************/
    updatePaddle1(deltaTime) {
        // Check if paddle is disabled in multiplayer mode
        const isDisabled = this.isMultiplayerMode && this.lastPaddleHit && this.lastPaddleHit.leftSide === 'paddle1';
  
  if (!isDisabled) {
    // Player 1 controls (W/S keys)
            if (this.keysPressed['w'] || this.keysPressed['W']) {
                this.paddle1Speed -= this.paddleAcceleration;
            } else if (this.keysPressed['s'] || this.keysPressed['S']) {
                this.paddle1Speed += this.paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
                if (this.paddle1Speed > 0) this.paddle1Speed = Math.max(0, this.paddle1Speed - this.paddleDeceleration);
                if (this.paddle1Speed < 0) this.paddle1Speed = Math.min(0, this.paddle1Speed + this.paddleDeceleration);
    }

    // Clamp paddle speed to maximum
            this.paddle1Speed = Math.max(-this.maxPaddleSpeed, Math.min(this.maxPaddleSpeed, this.paddle1Speed));
  } else {
    // Slowly decelerate if disabled
            if (this.paddle1Speed > 0) this.paddle1Speed = Math.max(0, this.paddle1Speed - this.paddleDeceleration);
            if (this.paddle1Speed < 0) this.paddle1Speed = Math.min(0, this.paddle1Speed + this.paddleDeceleration);
  }
  
  // Scale paddle speed based on game area height
  // This makes movement feel consistent regardless of screen size
        const effectiveSpeed = this.paddle1Speed * this.scaleY * deltaTime;
  
  // Update position
        this.paddle1Y += effectiveSpeed;
  
  // Boundary checks - keep paddle within the game area
        if (this.paddle1Y < 0) {
            this.paddle1Y = 0;
            this.paddle1Speed = 0;
        }
        if (this.paddle1Y > this.gameHeight - this.paddle1.clientHeight) {
            this.paddle1Y = this.gameHeight - this.paddle1.clientHeight;
            this.paddle1Speed = 0;
        }
        
        this.paddle1.style.top = this.paddle1Y + 'px';
    }

    updatePaddle2(deltaTime) {
  // Handle AI mode separately
        if (this.isAIMode) {
    // Use existing AI logic
            this.updateAIDecisions();
    
    // Apply the AI's simulated key presses to control the paddle
            if (this.aiKeyState['ArrowUp']) {
                this.paddle2Speed = Math.max(this.paddle2Speed - this.paddleAcceleration * deltaTime, -this.maxPaddleSpeed);
            } else if (this.aiKeyState['ArrowDown']) {
                this.paddle2Speed = Math.min(this.paddle2Speed + this.paddleAcceleration * deltaTime, this.maxPaddleSpeed);
    } else {
      // Apply natural deceleration when AI isn't pressing a key
                if (this.paddle2Speed > 0) {
                    this.paddle2Speed = Math.max(0, this.paddle2Speed - this.paddleDeceleration * deltaTime);
                } else if (this.paddle2Speed < 0) {
                    this.paddle2Speed = Math.min(0, this.paddle2Speed + this.paddleDeceleration * deltaTime);
      }
    }
  } else {
    // Check if paddle is disabled in multiplayer mode
            const isDisabled = this.isMultiplayerMode && this.lastPaddleHit && this.lastPaddleHit.rightSide === 'paddle2';
    
    if (!isDisabled) {
      // Player 2 controls (Arrow keys)
                if (this.keysPressed['ArrowUp']) {
                    this.paddle2Speed -= this.paddleAcceleration;
                } else if (this.keysPressed['ArrowDown']) {
                    this.paddle2Speed += this.paddleAcceleration;
      } else {
        // Apply deceleration when no keys are pressed
                    if (this.paddle2Speed > 0) this.paddle2Speed = Math.max(0, this.paddle2Speed - this.paddleDeceleration);
                    if (this.paddle2Speed < 0) this.paddle2Speed = Math.min(0, this.paddle2Speed + this.paddleDeceleration);
      }
    } else {
      // Slowly decelerate if disabled
                if (this.paddle2Speed > 0) this.paddle2Speed = Math.max(0, this.paddle2Speed - this.paddleDeceleration);
                if (this.paddle2Speed < 0) this.paddle2Speed = Math.min(0, this.paddle2Speed + this.paddleDeceleration);
    }
  }
  
  // Clamp paddle speed to maximum
        this.paddle2Speed = Math.max(-this.maxPaddleSpeed, Math.min(this.maxPaddleSpeed, this.paddle2Speed));
  
  // Scale paddle speed based on game area height 
  // This makes movement feel consistent regardless of screen size
        const effectiveSpeed = this.paddle2Speed * this.scaleY * deltaTime;
  
  // Update position
        this.paddle2Y += effectiveSpeed;
  
  // Boundary checks
        if (this.paddle2Y < 0) {
            this.paddle2Y = 0;
            this.paddle2Speed = 0;
        }
        if (this.paddle2Y > this.gameHeight - this.paddle2.clientHeight) {
            this.paddle2Y = this.gameHeight - this.paddle2.clientHeight;
            this.paddle2Speed = 0;
        }
        
        this.paddle2.style.top = this.paddle2Y + 'px';
}

// Function to handle paddle3 movement (Player 3, left side, E/D keys)
    updatePaddle3(deltaTime) {
        if (!this.isMultiplayerMode) return; // Only active in multiplayer mode
  
  // Only control if not disabled in multiplayer mode
        const isDisabled = this.lastPaddleHit && this.lastPaddleHit.leftSide === 'paddle3';
  
  if (!isDisabled) {
    // Player 3 controls (E/D keys)
            if (this.keysPressed['e'] || this.keysPressed['E']) {
                this.paddle3Speed -= this.paddleAcceleration;
            } else if (this.keysPressed['d'] || this.keysPressed['D']) {
                this.paddle3Speed += this.paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
                if (this.paddle3Speed > 0) this.paddle3Speed = Math.max(0, this.paddle3Speed - this.paddleDeceleration);
                if (this.paddle3Speed < 0) this.paddle3Speed = Math.min(0, this.paddle3Speed + this.paddleDeceleration);
    }

    // Clamp paddle speed to maximum
            this.paddle3Speed = Math.max(-this.maxPaddleSpeed, Math.min(this.maxPaddleSpeed, this.paddle3Speed));
  } else {
    // Slowly decelerate if disabled
            if (this.paddle3Speed > 0) this.paddle3Speed = Math.max(0, this.paddle3Speed - this.paddleDeceleration);
            if (this.paddle3Speed < 0) this.paddle3Speed = Math.min(0, this.paddle3Speed + this.paddleDeceleration);
  }
  
  // Scale paddle speed based on game area height
        const effectiveSpeed = this.paddle3Speed * this.scaleY * deltaTime;
  
  // Update position
        this.paddle3Y += effectiveSpeed;
  
  // Boundary checks
        if (this.paddle3Y < 0) {
            this.paddle3Y = 0;
            this.paddle3Speed = 0;
        }
        if (this.paddle3Y > this.gameHeight - this.paddle3.clientHeight) {
            this.paddle3Y = this.gameHeight - this.paddle3.clientHeight;
            this.paddle3Speed = 0;
        }
        
        this.paddle3.style.top = this.paddle3Y + 'px';
}

// Function to handle paddle4 movement (Player 4, right side, I/K keys)
    updatePaddle4(deltaTime) {
        if (!this.isMultiplayerMode) return; // Only active in multiplayer mode
  
  // Only control if not disabled in multiplayer mode
        const isDisabled = this.lastPaddleHit && this.lastPaddleHit.rightSide === 'paddle4';
  
  if (!isDisabled) {
    // Player 4 controls (I/K keys)
            if (this.keysPressed['i'] || this.keysPressed['I']) {
                this.paddle4Speed -= this.paddleAcceleration;
            } else if (this.keysPressed['k'] || this.keysPressed['K']) {
                this.paddle4Speed += this.paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
                if (this.paddle4Speed > 0) this.paddle4Speed = Math.max(0, this.paddle4Speed - this.paddleDeceleration);
                if (this.paddle4Speed < 0) this.paddle4Speed = Math.min(0, this.paddle4Speed + this.paddleDeceleration);
    }

    // Clamp paddle speed to maximum
            this.paddle4Speed = Math.max(-this.maxPaddleSpeed, Math.min(this.maxPaddleSpeed, this.paddle4Speed));
  } else {
    // Slowly decelerate if disabled
            if (this.paddle4Speed > 0) this.paddle4Speed = Math.max(0, this.paddle4Speed - this.paddleDeceleration);
            if (this.paddle4Speed < 0) this.paddle4Speed = Math.min(0, this.paddle4Speed + this.paddleDeceleration);
  }
  
  // Scale paddle speed based on game area height
        const effectiveSpeed = this.paddle4Speed * this.scaleY * deltaTime;
  
  // Update position
        this.paddle4Y += effectiveSpeed;
  
  // Boundary checks
        if (this.paddle4Y < 0) {
            this.paddle4Y = 0;
            this.paddle4Speed = 0;
        }
        if (this.paddle4Y > this.gameHeight - this.paddle4.clientHeight) {
            this.paddle4Y = this.gameHeight - this.paddle4.clientHeight;
            this.paddle4Speed = 0;
        }
        
        this.paddle4.style.top = this.paddle4Y + 'px';
}

/********************************************************************************************************
 * AI LOGIC FUNCTIONS
 ********************************************************************************************************/
// AI Controller function - handles AI decision making
    updateAIDecisions() {
  // Check if ball was just hit (to activate return to center behavior)
        if (this.ballSpeedX < 0 && this.aiPerceptionBallSpeedX > 0) {
            this.shouldReturnToCenter = true;
            this.lastBallHitX = this.ballX; // Mark where ball was when it changed direction
  }
  
  // Reset key states at the beginning of each frame - this simulates keyboard input
        this.aiKeyState['ArrowUp'] = false;
        this.aiKeyState['ArrowDown'] = false;
  
  // Update AI's perception of the ball based on reaction delay
  // The AI can only refresh its view of the game once per second
  const currentTime = Date.now();
  
  // Only update perception once per second as per requirements
        if (currentTime - this.lastAIUpdateTime > this.aiReactionDelay) {
    // Update AI's perception of the ball
            this.aiPerceptionBallX = this.ballX;
            this.aiPerceptionBallY = this.ballY;
            this.aiPerceptionBallSpeedX = this.ballSpeedX;
            this.aiPerceptionBallSpeedY = this.ballSpeedY;
            this.lastAIUpdateTime = currentTime;
    
    // AI makes mistakes based on difficulty
            if (Math.random() < this.aiMistakeChance) {
      // Intentionally misjudge ball direction or speed (makes AI more human-like)
                this.aiPerceptionBallSpeedY *= -0.8 + Math.random() * 0.4;
    }
  }
  
  // Get the center position of the paddle
        const centerPosition = this.gameHeight / 2 - this.paddle2.clientHeight / 2;
        const paddleCenter = this.paddle2Y + this.paddle2.clientHeight / 2;
        const centerDifference = centerPosition - this.paddle2Y;
        const distanceFromCenter = Math.abs(paddleCenter - this.gameHeight / 2);
  
  // AGGRESSIVE BEHAVIOR: Move to intercept the ball if it's coming toward the AI
        if (this.aiPerceptionBallSpeedX > 0) {
    // Calculate time until ball reaches paddle
            const distanceToTravel = this.gameWidth - this.paddle2.clientWidth - this.ball.clientWidth - this.aiPerceptionBallX;
            const timeToImpact = distanceToTravel / Math.max(0.1, this.aiPerceptionBallSpeedX); // Avoid division by zero
    
    // Predict where ball will be vertically with multiple bounce calculation
            let predictedY = this.predictBallPosition(this.aiPerceptionBallX, this.aiPerceptionBallY, 
                                            this.aiPerceptionBallSpeedX, this.aiPerceptionBallSpeedY, 
                                        distanceToTravel);
    
    // Add prediction errors based on difficulty
            if (Math.random() > this.aiPredictionAccuracy) {
                const errorAmount = (1 - this.aiPredictionAccuracy) * this.gameHeight * 0.3;
      predictedY += (Math.random() * 2 - 1) * errorAmount;
    }
    
    // Calculate dynamic error margin (smaller for hard difficulty)
            const distanceFactor = Math.min(1, distanceToTravel / this.gameWidth);
            const dynamicErrorMargin = this.paddle2.clientHeight * (this.aiErrorMargin * (0.3 + 0.7 * distanceFactor));
    
    // Calculate difference between predicted ball position and paddle position
            const predictedBallCenter = predictedY + this.ball.clientHeight / 2;
    const difference = predictedBallCenter - paddleCenter;
    
    // Intercept the ball with higher precision for harder difficulties
    if (Math.abs(difference) > dynamicErrorMargin) {
                this.aiKeyState[difference > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
    }
    
    // Reset center flag when actively tracking ball
            this.shouldReturnToCenter = false;
  } 
  // RETURN TO CENTER: After hitting ball or when ball is moving away
        else if (this.aiPerceptionBallSpeedX < 0) {
    // Hard difficulty AI should aggressively return to center
            const shouldCenter = Math.random() < this.aiReturnToMiddleSpeed;
    
    // If we should center and we're not already centered
    if (shouldCenter && distanceFromCenter > 10) {
                this.aiKeyState[paddleCenter > this.gameHeight / 2 ? 'ArrowUp' : 'ArrowDown'] = true;
    }
  }
  
  // For medium/hard difficulty, occasionally predict and move based on expected return trajectory
        if (this.aiPerceptionBallSpeedX < 0 && this.currentAIDifficulty !== 'easy') {
            const proactiveChance = this.currentAIDifficulty === 'hard' ? 0.7 : 0.3;
    
    if (Math.random() < proactiveChance) {
      // Try to predict where the ball might come back
      // This simulates a more experienced player anticipating the return
                const playerPaddleX = this.paddle1.clientWidth;
                const bounceX = Math.max(playerPaddleX, this.aiPerceptionBallX - Math.abs(this.aiPerceptionBallSpeedX) * 15);
      
      // Simple prediction of return trajectory
                let expectedReturnY = this.aiPerceptionBallY + (this.aiPerceptionBallSpeedY * 
                                   (this.gameWidth / Math.max(1, Math.abs(this.aiPerceptionBallSpeedX))));
      
      // Keep within game bounds
                expectedReturnY = Math.max(0, Math.min(this.gameHeight - this.ball.clientHeight, expectedReturnY));
      
      // Move slightly toward the expected return position
                const returnDiff = (expectedReturnY + this.ball.clientHeight/2) - paddleCenter;
      
      // Only move if we're far from the predicted position and not already moving to center
                if (Math.abs(returnDiff) > this.gameHeight/4 && !this.aiKeyState['ArrowUp'] && !this.aiKeyState['ArrowDown']) {
                    this.aiKeyState[returnDiff > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
      }
    }
  }
}

// Helper function to predict ball position with multiple bounces
    predictBallPosition(startX, startY, speedX, speedY, distanceX) {
  let currentX = startX;
  let currentY = startY;
  let currentSpeedY = speedY;
        const effectiveHeight = this.gameHeight - this.ball.clientHeight;
  
  // Calculate how far the ball will travel horizontally
  const timeSteps = Math.min(100, Math.ceil(distanceX / Math.max(0.1, speedX)));
  const stepSizeX = distanceX / timeSteps;
  
  // Simulate ball movement with bounces
  for (let i = 0; i < timeSteps; i++) {
    // Move ball
    currentX += stepSizeX;
    currentY += currentSpeedY * (stepSizeX / speedX);
    
    // Check for bounces
    if (currentY < 0) {
      currentY = -currentY; // Bounce off top
      currentSpeedY = -currentSpeedY;
    } else if (currentY > effectiveHeight) {
      currentY = effectiveHeight - (currentY - effectiveHeight); // Bounce off bottom
      currentSpeedY = -currentSpeedY;
    }
  }
  
  return currentY;
}

/********************************************************************************************************
 * BALL PHYSICS AND COLLISION DETECTION
 ********************************************************************************************************/
    moveBall(deltaTime) {
  // Store previous position for collision detection
        this.ballLastX = this.ballX;
        this.ballLastY = this.ballY;
  
  // Scale ball speed based on game area dimensions
  // This makes ball movement feel consistent regardless of screen size
        const effectiveSpeedX = this.ballSpeedX * this.scaleX * deltaTime;
        const effectiveSpeedY = this.ballSpeedY * this.scaleY * deltaTime;
  
        this.ballX += effectiveSpeedX;
        this.ballY += effectiveSpeedY;

  // Reset collision flag at the start of each frame
        this.collisionProcessedThisFrame = false;

  // Top collision: snap to top and reverse vertical velocity
        if (this.ballY <= 0) {
            this.ballY = 3;
            this.ballSpeedY = -this.ballSpeedY;
    // FIX: Add a small random horizontal adjustment to prevent infinite top bouncing
            this.ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(this.ballSpeedX);
            this.playSound(this.wallSound);
  }
  // Bottom collision: snap to bottom and reverse vertical velocity
        else if (this.ballY >= this.gameHeight - this.ball.clientHeight) {
            this.ballY = this.gameHeight - this.ball.clientHeight - 3;
            this.ballSpeedY = -this.ballSpeedY;
    // FIX: Add a small random horizontal adjustment to prevent infinite bottom bouncing
            this.ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(this.ballSpeedX);
            this.playSound(this.wallSound);
  }

  // Get the actual left paddle edge position - more accurate after resize
        const paddle1Right = this.paddle1.clientWidth;
  
  // Left paddles collision detection (paddle1 and paddle3)
  // First, check if the ball is moving left (toward left paddles)
        if (this.ballSpeedX < 0) {
    // Check for active paddle first, then disabled paddle
            if (this.isMultiplayerMode && this.lastPaddleHit) {
      // Determine which paddle is active and which is disabled
                const activePaddle = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle1 : this.paddle3;
                const activePaddleY = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle1Y : this.paddle3Y;
                const activePaddleId = this.lastPaddleHit.leftSide === 'paddle3' ? 'paddle1' : 'paddle3';
                
                const disabledPaddle = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle3 : this.paddle1;
                const disabledPaddleY = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle3Y : this.paddle1Y;
                const disabledPaddleId = this.lastPaddleHit.leftSide === 'paddle3' ? 'paddle3' : 'paddle1';
      
      // Check active paddle first
                this.checkLeftPaddleCollision(activePaddle, activePaddleY, paddle1Right, activePaddleId);
      
      // Only check disabled paddle if no collision has been processed yet
                if (!this.collisionProcessedThisFrame) {
                    this.checkLeftPaddleCollision(disabledPaddle, disabledPaddleY, paddle1Right, disabledPaddleId);
      }
    } else {
      // Standard single player mode
                this.checkLeftPaddleCollision(this.paddle1, this.paddle1Y, paddle1Right, 'paddle1');
    }
  }

  // Get the actual right paddle position - more accurate after resize
        const rightPaddleLeft = this.gameWidth - this.paddle2.clientWidth;
  
  // Right paddles collision detection (paddle2 and paddle4)
  // Check if the ball is moving right (toward right paddles)
        if (this.ballSpeedX > 0) {
    // Check for active paddle first, then disabled paddle
            if (this.isMultiplayerMode && this.lastPaddleHit) {
      // Determine which paddle is active and which is disabled
                const activePaddle = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle2 : this.paddle4;
                const activePaddleY = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle2Y : this.paddle4Y;
                const activePaddleId = this.lastPaddleHit.rightSide === 'paddle4' ? 'paddle2' : 'paddle4';
                
                const disabledPaddle = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle4 : this.paddle2;
                const disabledPaddleY = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle4Y : this.paddle2Y;
                const disabledPaddleId = this.lastPaddleHit.rightSide === 'paddle4' ? 'paddle4' : 'paddle2';
      
      // Check active paddle first
                this.checkRightPaddleCollision(activePaddle, activePaddleY, rightPaddleLeft, activePaddleId);
      
      // Only check disabled paddle if no collision has been processed yet
                if (!this.collisionProcessedThisFrame) {
                    this.checkRightPaddleCollision(disabledPaddle, disabledPaddleY, rightPaddleLeft, disabledPaddleId);
      }
    } else {
      // Standard single player mode
                this.checkRightPaddleCollision(this.paddle2, this.paddle2Y, rightPaddleLeft, 'paddle2');
    }
  }

  // Out-of-bounds (scoring conditions)
        if (this.ballX <= 0) {
            if (this.isMultiplayerMode) {
                this.team2Score++;
    } else {
                this.player2Score++;
    }
            this.playSound(this.lossSound);
            this.updateScoreboard();
    
    // Check for win condition
            if ((this.isMultiplayerMode && this.team2Score >= this.pointsToWin) || 
                (!this.isMultiplayerMode && this.player2Score >= this.pointsToWin)) {
                if (this.isMultiplayerMode) {
                    this.showWinScreen(this.team2Name);
      } else {
                    this.showWinScreen(this.player2Name);
      }
    } else {
                this.resetBall();
    }
    return;
  }
  
        if (this.ballX >= this.gameWidth - this.ball.clientWidth) {
            if (this.isMultiplayerMode) {
                this.team1Score++;
    } else {
                this.player1Score++;
    }
            this.playSound(this.lossSound);
            this.updateScoreboard();
    
    // Check for win condition
            if ((this.isMultiplayerMode && this.team1Score >= this.pointsToWin) || 
                (!this.isMultiplayerMode && this.player1Score >= this.pointsToWin)) {
                if (this.isMultiplayerMode) {
                    this.showWinScreen(this.team1Name);
      } else {
                    this.showWinScreen(this.player1Name);
      }
    } else {
                this.resetBall();
    }
    return;
  }

  // Update ball position on screen
        this.ball.style.left = this.ballX + 'px';
        this.ball.style.top = this.ballY + 'px';
}

/********************************************************************************************************
 * BALL PHYSICS HELPERS
 ********************************************************************************************************/
// Function to adjust the ball's direction and speed after it hits a paddle
    adjustBallDirection(paddleY, paddleHeight, isLeftPaddle, paddleId = null) {
  // Calculate the vertical center of the paddle
  const paddleCenter = paddleY + paddleHeight / 2;

  // Calculate the vertical center of the ball
        const ballCenter = this.ballY + this.ball.clientHeight / 2;

  // Determine how far the ball's center is from the paddle's center
  const relativeIntersectY = ballCenter - paddleCenter;

  // Normalize the intersection value to a range of -1 to 1
  const normalizedRelativeIntersectionY = relativeIntersectY / (paddleHeight / 2);

  // Define the maximum bounce angle (45 degrees or π/4 radians)
  const maxBounceAngle = Math.PI / 4;

  // Calculate the bounce angle based on where the ball hit the paddle
  const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

  // Calculate the current speed of the ball using the Pythagorean theorem
        let speed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);

  // Increase the ball's speed by a factor, but cap it at the maximum speed
        speed = Math.min(speed * this.speedIncreaseFactor, this.maxSpeed);

  // Adjust the ball's horizontal speed based on the paddle side and bounce angle
        this.ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);

  // Adjust the ball's vertical speed based on the bounce angle
        this.ballSpeedY = speed * Math.sin(bounceAngle);
  
        if (Math.abs(this.ballSpeedY) < 0.5) {
    // If vertical speed is very low, add a small random adjustment
            this.ballSpeedY += (Math.random() * 2 - 1) * speed * 0.1;
  }
  
  // Also add a tiny random factor to horizontal speed to vary gameplay
        this.ballSpeedX += (Math.random() * 2 - 1) * speed * 0.05;

  // If in multiplayer mode, handle tag-team mechanics
        if (this.isMultiplayerMode && paddleId) {
    // Update the last paddle hit for the appropriate side
    if (paddleId === 'paddle1' || paddleId === 'paddle3') {
      // Left side paddle hit
                this.lastPaddleHit.leftSide = paddleId;
    } else if (paddleId === 'paddle2' || paddleId === 'paddle4') {
      // Right side paddle hit
                this.lastPaddleHit.rightSide = paddleId;
    }
    
    // Apply visual cue to show which paddle is disabled
            this.resetPaddleVisuals();
  }

  // Play a sound effect to indicate the ball hit the paddle
        this.playSound(this.paddleSound);
}

// Function to reset paddle visuals (update disabled state)
    resetPaddleVisuals() {
  // Check if we're in multiplayer mode
        if (!this.isMultiplayerMode || !this.lastPaddleHit) return;
  
  // Reset visual appearance of all paddles
        this.paddle1.classList.remove('paddle-disabled');
        this.paddle2.classList.remove('paddle-disabled');
        this.paddle3.classList.remove('paddle-disabled');
        this.paddle4.classList.remove('paddle-disabled');
  
  // Apply disabled visual based on lastPaddleHit
  // For left side
        if (this.lastPaddleHit.leftSide === 'paddle1') {
            this.paddle1.classList.add('paddle-disabled');
        } else if (this.lastPaddleHit.leftSide === 'paddle3') {
            this.paddle3.classList.add('paddle-disabled');
  }
  
  // For right side
        if (this.lastPaddleHit.rightSide === 'paddle2') {
            this.paddle2.classList.add('paddle-disabled');
        } else if (this.lastPaddleHit.rightSide === 'paddle4') {
            this.paddle4.classList.add('paddle-disabled');
  }
}

// Helper function to check collision with left paddles
    checkLeftPaddleCollision(paddle, paddleY, paddleRight, paddleId) {
  // Skip collision check if we've already processed a collision this frame
        if (this.collisionProcessedThisFrame) return false;
  
  // Skip collision check for disabled paddles in multiplayer mode
        if (this.isMultiplayerMode) {
    // For left side (paddle1 and paddle3)
    // Skip if this paddle matches the last hit paddle for the left side
            if (paddleId === this.lastPaddleHit.leftSide) {
      return false;
    }
  }
  
  // Trajectory-based collision detection for left paddle
  // Only check if the ball was to the right of the paddle in the last frame
  // and now is at or to the left of the paddle's right edge
        if (this.ballX <= paddleRight && this.ballLastX > paddleRight) {
    // Calculate the y position at the time of intersection using linear interpolation
            const ratio = (paddleRight - this.ballLastX) / (this.ballX - this.ballLastX);
            const intersectY = this.ballLastY + ratio * (this.ballY - this.ballLastY);
    
    // Check if this y position is within the paddle's height bounds
            if (intersectY + this.ball.clientHeight >= paddleY &&
        intersectY <= paddleY + paddle.clientHeight) {
      // Valid collision - set ball position to the edge of paddle
                this.ballX = paddleRight;
                this.adjustBallDirection(paddleY, paddle.clientHeight, true, paddleId);
                this.collisionProcessedThisFrame = true;
      return true;
    }
  }
  // Backup collision check for slower balls or edge cases
  else if (
            this.ballX <= paddleRight + 2 && // Add small buffer for resize issues
            this.ballX + this.ball.clientWidth >= 0 && // Make sure ball isn't completely past paddle
            this.ballY + this.ball.clientHeight >= paddleY - 2 && // Add small buffer
            this.ballY <= paddleY + paddle.clientHeight + 2 // Add small buffer
        ) {
            this.ballX = paddleRight; // Snap to paddle edge
            this.adjustBallDirection(paddleY, paddle.clientHeight, true, paddleId);
            this.collisionProcessedThisFrame = true;
    return true;
  }
  
  return false;
}

// Helper function to check collision with right paddles
    checkRightPaddleCollision(paddle, paddleY, paddleLeft, paddleId) {
  // Skip collision check if we've already processed a collision this frame
        if (this.collisionProcessedThisFrame) return false;
  
  // Skip collision check for disabled paddles in multiplayer mode
        if (this.isMultiplayerMode) {
    // For right side (paddle2, paddle4)
    // Skip if this paddle matches the last hit paddle for the right side
            if (paddleId === this.lastPaddleHit.rightSide) {
      return false;
    }
  }
  
  // Trajectory-based collision detection
  // Only check if the ball was to the left of the paddle in the last frame
  // and now is at or beyond the paddle's left edge
        if (this.ballX + this.ball.clientWidth >= paddleLeft && this.ballLastX + this.ball.clientWidth < paddleLeft) {
    // Calculate the y position at the time of intersection using linear interpolation
            const ratio = (paddleLeft - (this.ballLastX + this.ball.clientWidth)) / 
                        ((this.ballX + this.ball.clientWidth) - (this.ballLastX + this.ball.clientWidth));
            const intersectY = this.ballLastY + ratio * (this.ballY - this.ballLastY);
    
    // Check if this y position is within the paddle's height bounds
            if (intersectY + this.ball.clientHeight >= paddleY &&
        intersectY <= paddleY + paddle.clientHeight) {
      // Valid collision - set ball position to the edge of paddle
                this.ballX = paddleLeft - this.ball.clientWidth;
                this.adjustBallDirection(paddleY, paddle.clientHeight, false, paddleId);
                this.collisionProcessedThisFrame = true;
      return true;
    }
  }
  // Backup collision check for slower balls or edge cases
  else if (
            this.ballX + this.ball.clientWidth >= paddleLeft - 2 && // Add small buffer for resize issues
            this.ballX < paddleLeft + paddle.clientWidth && // Make sure ball isn't completely past paddle
            this.ballY + this.ball.clientHeight >= paddleY - 2 && // Add small buffer
            this.ballY <= paddleY + paddle.clientHeight + 2 // Add small buffer
        ) {
            this.ballX = paddleLeft - this.ball.clientWidth; // Snap to paddle edge
            this.adjustBallDirection(paddleY, paddle.clientHeight, false, paddleId);
            this.collisionProcessedThisFrame = true;
    return true;
  }
  
  return false;
}

    // Pause the game - enhanced to support Escape key functionality
    pauseGame() {
        if (!this.gameRunning) return; // Already paused
        
        this.gameRunning = false;
        this.previousGameState = {
            ballDisplay: this.ball.style.display,
            wasPaused: true
        };
        
        // Hide the ball during pause
        this.ball.style.display = 'none';
        
        // Make sure cancel button is visible when paused
        const cancelButton = document.getElementById('cancelGameButton');
        if (cancelButton) {
            cancelButton.style.display = 'block';
        }
        
        console.log('Game paused');
    }
    
    // Resume the game - called when coming back from pause
    resumeGame() {
        if (this.gameRunning) return; // Already running
        
        // Only resume if we were previously running
        if (this.previousGameState && this.previousGameState.wasPaused) {
            this.gameRunning = true;
            
            // Restore ball display
            this.ball.style.display = this.previousGameState.ballDisplay || 'block';
            
            // Make sure cancel button is visible when game is running
            const cancelButton = document.getElementById('cancelGameButton');
            if (cancelButton) {
                cancelButton.style.display = 'block';
            }
            
            // Reset the time to avoid huge jumps
            this.lastTime = null;
            
            // Restart the game loop
            requestAnimationFrame(this.gameLoop.bind(this));
            
            console.log('Game resumed');
        }
    }

    // Create a cancel button that appears during gameplay
    createCancelButton() {
        // Check if button already exists
        if (document.getElementById('cancelGameButton')) {
            return;
        }
        
        // Create the button
        const cancelButton = document.createElement('button');
        cancelButton.id = 'cancelGameButton';
        cancelButton.className = 'cancelGameButton';
        cancelButton.textContent = 'X';
        
        // Style the button - refined design to match game theme
        cancelButton.style.position = 'absolute';
        cancelButton.style.top = '10px';
        cancelButton.style.left = '10px';
        cancelButton.style.zIndex = '100';
        cancelButton.style.backgroundColor = 'rgba(10, 10, 10, 0.9)'; // Darker background
        cancelButton.style.color = '#D4AF37'; // More subtle gold color
        cancelButton.style.border = '1px solid #D4AF37'; // Thinner, more subtle border
        cancelButton.style.borderRadius = '6px'; // Slightly more square
        cancelButton.style.width = '32px';
        cancelButton.style.height = '32px';
        cancelButton.style.padding = '0';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.fontFamily = 'Arial, sans-serif';
        cancelButton.style.fontSize = '16px';
        cancelButton.style.display = 'none'; // Hidden by default
        cancelButton.style.lineHeight = '30px'; // Center the X vertically
        cancelButton.style.fontWeight = 'bold';
        cancelButton.style.textAlign = 'center';
        cancelButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)'; // Subtle shadow
        cancelButton.style.textShadow = '0 1px 1px rgba(0, 0, 0, 0.6)'; // Subtle text shadow
        
        // Add hover effect with enhanced interaction
        cancelButton.onmouseover = function() {
            this.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
            this.style.color = '#FFD700'; // Brighter gold on hover
            this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 8px rgba(212, 175, 55, 0.3)';
            this.style.transform = 'translateY(-1px)';
            this.style.transition = 'all 0.2s ease';
        };
        
        cancelButton.onmouseout = function() {
            this.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
            this.style.color = '#D4AF37'; // Back to subtle gold
            this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
            this.style.transform = 'translateY(0)';
            this.style.transition = 'all 0.2s ease';
        };
        
        // Add active/click effect
        cancelButton.onmousedown = function() {
            this.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
            this.style.transform = 'translateY(1px)';
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        };
        
        cancelButton.onmouseup = function() {
            this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 8px rgba(212, 175, 55, 0.3)';
            this.style.transform = 'translateY(-1px)';
            this.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
        };
        
        // Add the button to the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(cancelButton);
            
            // Add event listener
            cancelButton.addEventListener('click', () => {
                // Call the stopGame method if available in the gameLoader
                if (window.gameLoader && typeof window.gameLoader.stopGame === 'function') {
                    window.gameLoader.stopGame();
                } else {
                    // Fallback to basic reset functionality
                    this.gameRunning = false;
                    this.resetGame();
                    this.hideAllScreens();
                    
                    const gameSelection = document.querySelector('.gameSelection');
                    if (gameSelection) {
                        gameSelection.style.display = 'block';
                    }
                }
            });
        }
    }
}

// Create the game instance
const game = new PongGame();

// This forces the script to be loaded properly when dynamically loaded
// It makes the existing code work with our class-based version
window.addEventListener('load', () => {
    console.log('Pong game loaded and initialized');
});