/**
 * Pong Game Implementation
 * A class-based implementation of the classic Pong game with multiple game modes
 */

class PongGame {
    constructor() {
        // Game state
        this.userName = null;
        this.gameRunning = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game elements
        this.gameArea = null;
        this.ball = null;
        this.paddle1 = null;
        this.paddle2 = null;
        this.paddle3 = null;
        this.paddle4 = null;
        this.player1Score = null;
        this.player2Score = null;
        this.player1Name = null;
        this.player2Name = null;
        
        // Game mode flags
        this.isAIMode = false;
        this.isMultiplayerMode = false;
        this.isTournamentMode = false;
        
        // Tournament variables
        this.tournamentPlayers = [];
        this.currentTournamentMatch = 0;
        this.tournamentWinners = [];
        
        // Game settings
        this.winScore = 3;
        this.initialBallSpeedX = 3;
        this.initialBallSpeedY = 3;
        this.ballSpeedX = this.initialBallSpeedX;
        this.ballSpeedY = this.initialBallSpeedY;
        this.ballSpeedMultiplier = 1.05;
        this.aiDifficulty = 'medium';
        this.paddleSizeClass = 'normal';
        
        // Paddle positions and sizes
        this.paddle1Y = 0;
        this.paddle2Y = 0;
        this.paddle3Y = 0;
        this.paddle4Y = 0;
        this.paddleHeight = 0;
        this.paddleWidth = 0;
        this.gameWidth = 0;
        this.gameHeight = 0;
        
        // Paddle movement
        this.paddle1Speed = 0;
        this.paddle2Speed = 0;
        this.paddle3Speed = 0;
        this.paddle4Speed = 0;
        this.paddleMaxSpeed = 5;
        this.aiReactionDelay = 0;
        this.aiPredictionAccuracy = 0.8;
        this.aiRandomOffset = 20;
        
        // Active paddles for multiplayer mode
        this.paddle1Active = true;
        this.paddle2Active = true;
        this.paddle3Active = true;
        this.paddle4Active = true;
        
        // Object to track pressed keys
        this.keysPressed = {};
        
        // Sound effects
        this.paddleSound = null;
        this.wallSound = null;
        this.lossSound = null;
        
        // Animation frame ID for canceling
        this.animationFrameId = null;
        
        // Prepare match data for backend submission
        this.matchObj = {
            player1Name: '',
            player2Name: '',
            player1Score: 0,
            player2Score: 0,
            winner: '',
            matchType: ''
        };
        
        // Array of matches for tournament mode
        this.tournamentArr = [];
        
        // Add new properties for better collision detection
        this.ballLastX = 0;
        this.ballLastY = 0;
        this.collisionProcessedThisFrame = false;
        this.lastPaddleHit = {
            leftSide: 'paddle1',
            rightSide: 'paddle2'
        };
        
        // Add physics constants
        this.paddleAcceleration = 0.5;
        this.paddleDeceleration = 0.3;
        this.maxPaddleSpeed = 5;
        this.speedIncreaseFactor = 1.05;
        this.maxSpeed = 10;
        
        // Add scaling factors for consistent movement
        this.scaleX = 1;
        this.scaleY = 1;
        
        // AI-related variables
        this.lastAIUpdateTime = null;
        this.aiTargetY = undefined;
        this.aiPredictedY = undefined;
        this.aiTargetOffset = 0;
    }
    
    /**
     * Initialize the game when the document is ready
     */
    init(userName, submitMatchFn, submitTournamentFn) {
        // store callbacks for submitting results
        this.userName = userName ? userName : 'PLAYER 1';

        this.submitMatch = submitMatchFn;
        this.submitTournament = submitTournamentFn;
        
        // Get game elements
        this.gameArea = document.querySelector('.gameArea');
        this.ball = document.getElementById('ball');
        this.paddle1 = document.getElementById('paddle1');
        this.paddle2 = document.getElementById('paddle2');
        this.paddle3 = document.getElementById('paddle3');
        this.paddle4 = document.getElementById('paddle4');
        this.player1Score = document.getElementById('player1Score');
        this.player2Score = document.getElementById('player2Score');
        this.player1Name = document.getElementById('player1Name');
        this.player2Name = document.getElementById('player2Name');
        
        // Load sound effects
        this.paddleSound = document.getElementById('paddleSound');
        this.wallSound = document.getElementById('wallSound');
        this.lossSound = document.getElementById('lossSound');
        
        // I add code to hide and pause the video background by default
        const videoBgInit = document.getElementById('videoBackground');
        if (videoBgInit) {
            videoBgInit.style.display = 'none';
            videoBgInit.style.zIndex = '-1';
            if (videoBgInit.pause) {
                videoBgInit.pause();
                videoBgInit.currentTime = 0;
            }
        }
        
        // Initialize game dimensions
        this.updateGameDimensions();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize positions
        this.initializePositions();
        
        // Set initial paddle sizes
        this.updatePaddleSizes();
        
        // Set initial player names
        this.updatePlayerNames();
        
        // Check window size
        this.checkWindowSize();
    }
    
    /**
     * Set up event listeners for menu buttons and game controls
     */
    setupEventListeners() {
        console.log('Setting up event listeners');
        // Bind event handlers to this instance
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Check window size on resize
        window.addEventListener('resize', () => {
            this.updateGameDimensions();
            this.checkWindowSize();
            // Reset positions to keep everything in bounds
            if (!this.gameRunning) {
                this.initializePositions();
            }
        });
        
        // Game mode buttons
        const pvpButton = document.getElementById('pvpButton');
        console.log('setupEventListeners - pvpButton:', pvpButton);
        if (pvpButton) {
            pvpButton.addEventListener('click', () => {
                console.log('PVP button clicked from setupEventListeners');
                // On 1 VS 1, set Player 1's name to current user and Player 2's name to RANDOM
                this.player1Name.textContent = this.userName;
                this.player2Name.textContent = 'RANDOM';
                this.setGameMode('pvp');
            });
        } else {
            console.error('pvpButton not found in DOM');
        }
        
        const pveButton = document.getElementById('pveButton');
        console.log('setupEventListeners - pveButton:', pveButton);
        if (pveButton) {
            pveButton.addEventListener('click', () => {
                console.log('PVE button clicked from setupEventListeners');
                // On 1 VS AI, set Player 1's name to current user and Player 2's name to AI
                this.player1Name.textContent = this.userName;
                this.player2Name.textContent = 'AI';
                this.setGameMode('ai');
            });
        } else {
            console.error('pveButton not found in DOM');
        }
        
        const multiplayerButton = document.getElementById('multiplayerButton');
        console.log('setupEventListeners - multiplayerButton:', multiplayerButton);
        if (multiplayerButton) {
            multiplayerButton.addEventListener('click', () => {
                console.log('Multiplayer button clicked from setupEventListeners');
                this.player1Name.textContent = "TEAM 1";
                this.player2Name.textContent = 'TEAM 2';
                this.setGameMode('multiplayer');
            });
        } else {
            console.error('multiplayerButton not found in DOM');
        }
        
        const tournamentButton = document.getElementById('tournamentButton');
        console.log('setupEventListeners - tournamentButton:', tournamentButton);
        if (tournamentButton) {
            tournamentButton.addEventListener('click', () => {
                console.log('Tournament button clicked from setupEventListeners');
                this.setGameMode('tournament');
            });
        } else {
            console.error('tournamentButton not found in DOM');
        }
        
        // Settings and How to Play buttons
        document.getElementById('settingsButton').addEventListener('click', () => {
            // Clear active state from all bottom buttons
            const bottomButtons = document.querySelectorAll('.bottom-buttons .game-btn');
            bottomButtons.forEach(btn => btn.classList.remove('active'));
            
            // Set active state for the settings button
            document.getElementById('settingsButton').classList.add('active');
            
            this.hideGameButtons();
            document.getElementById('settingsScreen').style.display = 'block';
        });
        
        document.getElementById('howToPlayButton').addEventListener('click', () => {
            // Clear active state from all bottom buttons
            const bottomButtons = document.querySelectorAll('.bottom-buttons .game-btn');
            bottomButtons.forEach(btn => btn.classList.remove('active'));
            
            // Set active state for the how to play button
            document.getElementById('howToPlayButton').classList.add('active');
            
            this.hideGameButtons();
            document.getElementById('howToPlayScreen').style.display = 'block';
        });
        
        // Save settings button
        document.getElementById('saveSettingsButton').addEventListener('click', () => {
            this.applySettings();
            document.getElementById('settingsScreen').style.display = 'none';
            this.showGameButtons();
        });
        
        // Back buttons
        document.getElementById('backButton').addEventListener('click', () => this.backToMenu());
        document.getElementById('backFromHowToPlayButton').addEventListener('click', () => this.backToMenu());
        document.getElementById('backFromTournamentButton').addEventListener('click', () => this.backToMenu());
        
        // Tournament buttons
        document.getElementById('startTournamentButton').addEventListener('click', () => this.startTournament());
        
        // Game over buttons
        document.getElementById('menuButton').addEventListener('click', () => {
            this.resetGame();
            this.backToMenu();
        });
        
        document.getElementById('nextMatchButton').addEventListener('click', () => {
            document.getElementById('winScreen').style.display = 'none';
            this.setupNextTournamentMatch();
        });
    }
    
    /**
     * Hide the game buttons when starting a game
     */
    hideGameButtons() {
        document.querySelector('.top-buttons').style.display = 'none';
        document.querySelector('.bottom-buttons').style.display = 'none';
    }
    
    /**
     * Show the game buttons when returning to menu
     */
    showGameButtons() {
        document.querySelector('.top-buttons').style.display = 'flex';
        document.querySelector('.bottom-buttons').style.display = 'flex';
        
        // Also handle bottom buttons active state
        const bottomButtons = document.querySelectorAll('.bottom-buttons .game-btn');
        bottomButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    /**
     * Handle key down events for paddle movement
     */
    handleKeyDown(e) {
        // Press Escape to go back to the menu and reset game
        if (e.key === 'Escape') {
            this.resetGame();
            this.backToMenu();
            return;
        }
        this.keysPressed[e.key] = true;
        
        // Check if game should be started with any key when start text is displayed
        const startText = document.getElementById('startText');
        if (startText && startText.style.display === 'block' && 
            !this.gameRunning && !this.gameOver) {
            this.startGame();
        }
    }
    
    /**
     * Handle key up events for paddle movement
     */
    handleKeyUp(e) {
        this.keysPressed[e.key] = false;
    }
    
    /**
     * Update game dimensions based on current window size
     */
    updateGameDimensions() {
        if (!this.gameArea) return;
        
        // Get dimensions from the computed style
        const gameAreaStyle = window.getComputedStyle(this.gameArea);
        this.gameWidth = parseFloat(gameAreaStyle.width);
        this.gameHeight = parseFloat(gameAreaStyle.height);
        
        // Update paddle dimensions
        this.paddleHeight = this.gameHeight * 0.15; // 15% of game height
        this.paddleWidth = this.gameWidth * 0.01;   // 1% of game width
        
        // Update net position
        const net = document.querySelector('.net');
        if (net) {
            net.style.height = `${this.gameHeight}px`;
            net.style.width = '2px';
            net.style.left = `${this.gameWidth / 2}px`;
            net.style.position = 'absolute';
            net.style.background = 'rgba(255, 215, 0, 0.5)';
        }
        
        // Calculate scaling factors for consistent movement
        this.scaleX = this.gameWidth / 800; // Base width of 800px
        this.scaleY = this.gameHeight / 600; // Base height of 600px
        
        // Set ball size based on game area (responsive)
        const ballSize = Math.max(Math.round(0.02 * Math.min(this.gameWidth, this.gameHeight)), 8);
        this.ball.style.width = `${ballSize}px`;
        this.ball.style.height = `${ballSize}px`;
        
        // Store previous position for smooth collision detection
        this.ballLastX = parseFloat(this.ball.style.left);
        this.ballLastY = parseFloat(this.ball.style.top);
    }
    
    /**
     * Initialize positions of paddles and ball
     */
    initializePositions() {
        if (!this.gameArea || !this.ball || !this.paddle1 || !this.paddle2) return;
        
        // Position paddles at the center of their respective sides
        this.paddle1Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle2Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle3Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle4Y = this.gameHeight / 2 - this.paddleHeight / 2;
        
        // Update paddle positions in DOM
        this.paddle1.style.height = `${this.paddleHeight}px`;
        this.paddle1.style.width = `${this.paddleWidth}px`;
        this.paddle1.style.top = `${this.paddle1Y}px`;
        
        this.paddle2.style.height = `${this.paddleHeight}px`;
        this.paddle2.style.width = `${this.paddleWidth}px`;
        this.paddle2.style.top = `${this.paddle2Y}px`;
        
        this.paddle3.style.height = `${this.paddleHeight}px`;
        this.paddle3.style.width = `${this.paddleWidth}px`;
        this.paddle3.style.top = `${this.paddle3Y}px`;
        
        this.paddle4.style.height = `${this.paddleHeight}px`;
        this.paddle4.style.width = `${this.paddleWidth}px`;
        this.paddle4.style.top = `${this.paddle4Y}px`;
        
        // Position ball in the center
        this.ball.style.left = `${this.gameWidth / 2 - parseFloat(this.ball.style.width) / 2}px`;
        this.ball.style.top = `${this.gameHeight / 2 - parseFloat(this.ball.style.height) / 2}px`;
    }
    
    /**
     * Check if window is too small and show warning
     */
    checkWindowSize() {
        const minWidth = 480;
        const minHeight = 320;
        
        if (this.gameWidth < minWidth || this.gameHeight < minHeight) {
            document.getElementById('sizeWarningScreen').style.display = 'block';
        } else {
            document.getElementById('sizeWarningScreen').style.display = 'none';
        }
    }
    
    /**
     * Go back to the main menu
     */
    backToMenu() {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.style.display = 'none';
        });
        
        // Show game buttons
        this.showGameButtons();
        
        // Reset player names to defaults when returning to menu
        this.player1Name.textContent = 'PLAYER 1';
        this.player2Name.textContent = 'PLAYER 2';
        
        // Reset game state if needed
        this.gameRunning = false;
        this.gameOver = false;
    }
    
    /**
     * Set the game mode and initialize accordingly
     */
    setGameMode(mode) {
        this.isAIMode = false;
        this.isMultiplayerMode = false;
        this.isTournamentMode = false;
        
        // Remove active class from all mode buttons
        const modeButtons = document.querySelectorAll('.top-buttons .game-btn');
        modeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to the clicked button
        let activeButton;
        
        switch (mode) {
            case 'pvp':
                // Player vs Player mode
                console.log('Setting PvP mode');
                activeButton = document.getElementById('pvpButton');
                break;
                
            case 'ai':
                // Player vs AI mode
                this.isAIMode = true;
                console.log('Setting AI mode');
                activeButton = document.getElementById('pveButton');
                break;
                
            case 'multiplayer':
                // 4 player mode
                this.isMultiplayerMode = true;
                console.log('Setting Multiplayer mode');
                activeButton = document.getElementById('multiplayerButton');
                break;
                
            case 'tournament':
                // Tournament mode
                this.isTournamentMode = true;
                console.log('Setting Tournament mode');
                activeButton = document.getElementById('tournamentButton');
                // Show tournament setup
                document.getElementById('tournamentScreen').style.display = 'block';
                this.hideGameButtons();
                // Auto-fill and lock Player 1 input to current user
                const p1Input = document.getElementById('tournament-p1');
                if (p1Input) {
                    p1Input.value = this.userName;
                    p1Input.readOnly = true;
                }
                return; // Don't start game yet, wait for tournament setup
        }
        
        // Add active class to the selected button
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // For non-tournament modes, start the game directly
        this.hideGameButtons();
        this.resetGame();
        document.getElementById('startText').style.display = 'block';
    }
    
    /**
     * Reset the game state
     */
    resetGame() {
        // Reset scores
        this.player1Score.textContent = '0';
        this.player2Score.textContent = '0';
        
        // Reset ball speed
        this.ballSpeedX = this.initialBallSpeedX;
        this.ballSpeedY = this.initialBallSpeedY;
        
        // Reset positions
        this.initializePositions();
        this.resetBall();
        this.resetPaddlePositions();
        
        // Reset paddle activity for multiplayer mode
        this.paddle1Active = true;
        this.paddle2Active = true;
        this.paddle3Active = true;
        this.paddle4Active = true;
        
        // Reset paddle visuals
        this.resetPaddleVisuals();
        
        // Update paddle visibility based on game mode
        this.updatePaddleVisibility();
        
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset game state
        this.gameRunning = false;
        this.gameOver = false;
    }
    
    /**
     * Start the game
     */
    startGame() {
        // Hide the start text
        document.getElementById('startText').style.display = 'none';
        
        // Start the game loop
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
        
        console.log('Game started');
    }
    
    /**
     * Reset the ball to the center
     */
    resetBall() {
        // Position ball in the center
        const ballSize = parseFloat(window.getComputedStyle(this.ball).width);
        this.ball.style.left = `${this.gameWidth / 2 - ballSize / 2}px`;
        this.ball.style.top = `${this.gameHeight / 2 - ballSize / 2}px`;
        
        // Random direction for X (left or right)
        this.ballSpeedX = Math.random() > 0.5 ? this.initialBallSpeedX : -this.initialBallSpeedX;
        
        // Random direction for Y (up or down)
        this.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * this.initialBallSpeedY;
    }
    
    /**
     * Reset paddle positions to the center
     */
    resetPaddlePositions() {
        this.paddle1Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle2Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle3Y = this.gameHeight / 2 - this.paddleHeight / 2;
        this.paddle4Y = this.gameHeight / 2 - this.paddleHeight / 2;
        
        // Update paddle positions in DOM
        this.paddle1.style.top = `${this.paddle1Y}px`;
        this.paddle2.style.top = `${this.paddle2Y}px`;
        this.paddle3.style.top = `${this.paddle3Y}px`;
        this.paddle4.style.top = `${this.paddle4Y}px`;
    }
    
    /**
     * Reset paddle visuals (remove disabled class and reset opacity)
     */
    resetPaddleVisuals() {
        // Reset all paddles to full opacity
        this.paddle1.style.opacity = '1';
        this.paddle2.style.opacity = '1';
        this.paddle3.style.opacity = '1';
        this.paddle4.style.opacity = '1';
        
        // Remove disabled class from all paddles
        this.paddle1.classList.remove('paddle-disabled');
        this.paddle2.classList.remove('paddle-disabled');
        this.paddle3.classList.remove('paddle-disabled');
        this.paddle4.classList.remove('paddle-disabled');
        
        // Set opacity for disabled paddles in multiplayer mode
        if (this.isMultiplayerMode) {
            if (this.lastPaddleHit.leftSide === 'paddle1') {
                this.paddle1.style.opacity = '0.3';
                this.paddle1.classList.add('paddle-disabled');
            } else if (this.lastPaddleHit.leftSide === 'paddle3') {
                this.paddle3.style.opacity = '0.3';
                this.paddle3.classList.add('paddle-disabled');
            }
            
            if (this.lastPaddleHit.rightSide === 'paddle2') {
                this.paddle2.style.opacity = '0.3';
                this.paddle2.classList.add('paddle-disabled');
            } else if (this.lastPaddleHit.rightSide === 'paddle4') {
                this.paddle4.style.opacity = '0.3';
                this.paddle4.classList.add('paddle-disabled');
            }
        }
    }
    
    /**
     * Update paddle visibility based on game mode
     */
    updatePaddleVisibility() {
        // Always show paddle 1 and 2
        this.paddle1.style.display = 'block';
        this.paddle2.style.display = 'block';
        
        // Show paddle 3 and 4 only in multiplayer mode
        if (this.isMultiplayerMode) {
            this.paddle3.style.display = 'block';
            this.paddle4.style.display = 'block';
            
            // Position paddles for multiplayer mode
            // Left side: paddle1 in first quarter, paddle3 in last quarter
            this.paddle1.style.left = '0px';
            this.paddle3.style.left = '0px';
            this.paddle1.style.top = `${this.gameHeight * 0.75 - this.paddleHeight / 2}px`;
            this.paddle3.style.top = `${this.gameHeight * 0.25 - this.paddleHeight / 2}px`;
            
            // Right side: paddle2 in first quarter, paddle4 in last quarter
            this.paddle2.style.right = '0px';
            this.paddle4.style.right = '0px';
            this.paddle2.style.top = `${this.gameHeight * 0.25 - this.paddleHeight / 2}px`;
            this.paddle4.style.top = `${this.gameHeight * 0.75 - this.paddleHeight / 2}px`;
            
            // Update paddle positions
            this.paddle1Y = this.gameHeight * 0.75 - this.paddleHeight / 2;
            this.paddle2Y = this.gameHeight * 0.25 - this.paddleHeight / 2;
            this.paddle3Y = this.gameHeight * 0.25 - this.paddleHeight / 2;
            this.paddle4Y = this.gameHeight * 0.75 - this.paddleHeight / 2;
        } else {
            this.paddle3.style.display = 'none';
            this.paddle4.style.display = 'none';
            
            // Position paddles for single player mode
            this.paddle1.style.left = '0px';
            this.paddle2.style.right = '0px';
            this.paddle1.style.top = `${this.paddle1Y}px`;
            this.paddle2.style.top = `${this.paddle2Y}px`;
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        // Calculate delta time for smooth animation
        this.deltaTime = (timestamp - this.lastTime) / 1000; // in seconds
        this.lastTime = timestamp;
        
        // Cap delta time to prevent large jumps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        
        // Update paddle positions based on input
        this.updatePaddle1(this.deltaTime);
        
        // Update second paddle based on game mode
        if (this.isAIMode) {
            this.updateAIDecisions();
        } else {
            this.updatePaddle2(this.deltaTime);
        }
        
        // Update paddles 3 and 4 in multiplayer mode
        if (this.isMultiplayerMode) {
            this.updatePaddle3(this.deltaTime);
            this.updatePaddle4(this.deltaTime);
        }
        
        // Move the ball
        this.moveBall(this.deltaTime);
        
        // Continue the game loop if the game is running
        if (this.gameRunning) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
        }
    }
    
    /**
     * Update paddle 1 position (left paddle - W/S keys)
     */
    updatePaddle1(deltaTime) {
        // Check if paddle is active in multiplayer mode
        if (this.isMultiplayerMode && !this.paddle1Active) return;
        
        this.paddle1Speed = 0;
        
        // W key - move up
        if (this.keysPressed['w'] || this.keysPressed['W']) {
            this.paddle1Speed = -this.paddleMaxSpeed;
        }
        
        // S key - move down
        if (this.keysPressed['s'] || this.keysPressed['S']) {
            this.paddle1Speed = this.paddleMaxSpeed;
        }
        
        // Update paddle position
        this.paddle1Y += this.paddle1Speed * deltaTime * 60;
        
        // Clamp position to game boundaries
        this.paddle1Y = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddle1Y));
        
        // Update DOM
        this.paddle1.style.top = `${this.paddle1Y}px`;
    }
    
    /**
     * Update paddle 2 position (right paddle - Arrow keys)
     */
    updatePaddle2(deltaTime) {
        // Check if paddle is active in multiplayer mode
        if (this.isMultiplayerMode && !this.paddle2Active) return;
        
        this.paddle2Speed = 0;
        
        // Arrow Up - move up
        if (this.keysPressed['ArrowUp']) {
            this.paddle2Speed = -this.paddleMaxSpeed;
        }
        
        // Arrow Down - move down
        if (this.keysPressed['ArrowDown']) {
            this.paddle2Speed = this.paddleMaxSpeed;
        }
        
        // Update paddle position
        this.paddle2Y += this.paddle2Speed * deltaTime * 60;
        
        // Clamp position to game boundaries
        this.paddle2Y = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddle2Y));
        
        // Update DOM
        this.paddle2.style.top = `${this.paddle2Y}px`;
    }
    
    /**
     * Update paddle 3 position (left paddle team - E/D keys)
     */
    updatePaddle3(deltaTime) {
        // Check if paddle is active in multiplayer mode
        if (!this.paddle3Active) return;
        
        this.paddle3Speed = 0;
        
        // E key - move up
        if (this.keysPressed['e'] || this.keysPressed['E']) {
            this.paddle3Speed = -this.paddleMaxSpeed;
        }
        
        // D key - move down
        if (this.keysPressed['d'] || this.keysPressed['D']) {
            this.paddle3Speed = this.paddleMaxSpeed;
        }
        
        // Update paddle position
        this.paddle3Y += this.paddle3Speed * deltaTime * 60;
        
        // Clamp position to game boundaries
        this.paddle3Y = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddle3Y));
        
        // Update DOM
        this.paddle3.style.top = `${this.paddle3Y}px`;
    }
    
    /**
     * Update paddle 4 position (right paddle team - I/K keys)
     */
    updatePaddle4(deltaTime) {
        // Check if paddle is active in multiplayer mode
        if (!this.paddle4Active) return;
        
        this.paddle4Speed = 0;
        
        // I key - move up
        if (this.keysPressed['i'] || this.keysPressed['I']) {
            this.paddle4Speed = -this.paddleMaxSpeed;
        }
        
        // K key - move down
        if (this.keysPressed['k'] || this.keysPressed['K']) {
            this.paddle4Speed = this.paddleMaxSpeed;
        }
        
        // Update paddle position
        this.paddle4Y += this.paddle4Speed * deltaTime * 60;
        
        // Clamp position to game boundaries
        this.paddle4Y = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddle4Y));
        
        // Update DOM
        this.paddle4.style.top = `${this.paddle4Y}px`;
    }
    
    /**
     * Move the ball and check for collisions
     */
    moveBall(deltaTime) {
        // Store previous position for collision detection
        this.ballLastX = parseFloat(this.ball.style.left);
        this.ballLastY = parseFloat(this.ball.style.top);
        
        // Scale ball speed based on game area dimensions
        const effectiveSpeedX = this.ballSpeedX * this.scaleX * deltaTime * 60;
        const effectiveSpeedY = this.ballSpeedY * this.scaleY * deltaTime * 60;
        
        let ballLeft = this.ballLastX + effectiveSpeedX;
        let ballTop = this.ballLastY + effectiveSpeedY;
        const ballSize = parseFloat(this.ball.style.width);
        
        // Reset collision flag at the start of each frame
        this.collisionProcessedThisFrame = false;
        
        // Top collision: snap to top and reverse vertical velocity
        if (ballTop <= 0) {
            ballTop = 3;
            this.ballSpeedY = -this.ballSpeedY;
            // Add a small random horizontal adjustment to prevent infinite top bouncing
            this.ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(this.ballSpeedX);
            this.playSound('wall');
        }
        // Bottom collision: snap to bottom and reverse vertical velocity
        else if (ballTop >= this.gameHeight - ballSize) {
            ballTop = this.gameHeight - ballSize - 3;
            this.ballSpeedY = -this.ballSpeedY;
            // Add a small random horizontal adjustment to prevent infinite bottom bouncing
            this.ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(this.ballSpeedX);
            this.playSound('wall');
        }
        
        // Get the actual paddle edge positions
        const paddle1Right = this.paddleWidth;
        const rightPaddleLeft = this.gameWidth - this.paddleWidth;
        
        // Left paddles collision detection
        if (this.ballSpeedX < 0) {
            // Check for active paddle first, then disabled paddle
            if (this.isMultiplayerMode) {
                // Determine which paddle is active and which is disabled
                const activePaddle = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle1 : this.paddle3;
                const activePaddleY = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle1Y : this.paddle3Y;
                const activePaddleId = this.lastPaddleHit.leftSide === 'paddle3' ? 1 : 3;
                
                const disabledPaddle = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle3 : this.paddle1;
                const disabledPaddleY = this.lastPaddleHit.leftSide === 'paddle3' ? this.paddle3Y : this.paddle1Y;
                const disabledPaddleId = this.lastPaddleHit.leftSide === 'paddle3' ? 3 : 1;
                
                // Check active paddle first
                if (this.checkLeftPaddleCollision(activePaddle, activePaddleY, paddle1Right, activePaddleId)) {
                    ballLeft = paddle1Right;
                }
                // Only check disabled paddle if no collision has been processed yet
                else if (!this.collisionProcessedThisFrame && 
                         this.checkLeftPaddleCollision(disabledPaddle, disabledPaddleY, paddle1Right, disabledPaddleId)) {
                    ballLeft = paddle1Right;
                }
            } else {
                // Standard single player mode
                if (this.checkLeftPaddleCollision(this.paddle1, this.paddle1Y, paddle1Right, 1)) {
                    ballLeft = paddle1Right;
                }
            }
        }
        
        // Right paddles collision detection
        if (this.ballSpeedX > 0) {
            // Check for active paddle first, then disabled paddle
            if (this.isMultiplayerMode) {
                // Determine which paddle is active and which is disabled
                const activePaddle = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle2 : this.paddle4;
                const activePaddleY = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle2Y : this.paddle4Y;
                const activePaddleId = this.lastPaddleHit.rightSide === 'paddle4' ? 2 : 4;
                
                const disabledPaddle = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle4 : this.paddle2;
                const disabledPaddleY = this.lastPaddleHit.rightSide === 'paddle4' ? this.paddle4Y : this.paddle2Y;
                const disabledPaddleId = this.lastPaddleHit.rightSide === 'paddle4' ? 4 : 2;
                
                // Check active paddle first
                if (this.checkRightPaddleCollision(activePaddle, activePaddleY, rightPaddleLeft, activePaddleId)) {
                    ballLeft = rightPaddleLeft - ballSize;
                }
                // Only check disabled paddle if no collision has been processed yet
                else if (!this.collisionProcessedThisFrame && 
                         this.checkRightPaddleCollision(disabledPaddle, disabledPaddleY, rightPaddleLeft, disabledPaddleId)) {
                    ballLeft = rightPaddleLeft - ballSize;
                }
            } else {
                // Standard single player mode
                if (this.checkRightPaddleCollision(this.paddle2, this.paddle2Y, rightPaddleLeft, 2)) {
                    ballLeft = rightPaddleLeft - ballSize;
                }
            }
        }
        
        // Out-of-bounds (scoring conditions)
        if (ballLeft <= 0) {
            this.player2Score.textContent = parseInt(this.player2Score.textContent) + 1;
            this.resetBall();
            this.playSound('loss');
            
            if (parseInt(this.player2Score.textContent) >= this.winScore) {
                this.showWinScreen(this.player2Name.textContent);
            }
            return;
        }
        
        if (ballLeft + ballSize >= this.gameWidth) {
            this.player1Score.textContent = parseInt(this.player1Score.textContent) + 1;
            this.resetBall();
            this.playSound('loss');
            
            if (parseInt(this.player1Score.textContent) >= this.winScore) {
                this.showWinScreen(this.player1Name.textContent);
            }
            return;
        }
        
        // Update ball position
        this.ball.style.left = `${ballLeft}px`;
        this.ball.style.top = `${ballTop}px`;
    }
    
    /**
     * Check collision with left paddle
     */
    checkLeftPaddleCollision(paddle, paddleY, paddleRight, paddleId) {
        // Skip collision check if we've already processed a collision this frame
        if (this.collisionProcessedThisFrame) return false;
        
        // Skip collision check for disabled paddles in multiplayer mode
        if (this.isMultiplayerMode) {
            if (paddleId === 1 && this.lastPaddleHit.leftSide === 'paddle1') return false;
            if (paddleId === 3 && this.lastPaddleHit.leftSide === 'paddle3') return false;
        }
        
        // Trajectory-based collision detection
        if (this.ballLastX > paddleRight && parseFloat(this.ball.style.left) <= paddleRight) {
            // Calculate the y position at the time of intersection using linear interpolation
            const ratio = (paddleRight - this.ballLastX) / (parseFloat(this.ball.style.left) - this.ballLastX);
            const intersectY = this.ballLastY + ratio * (parseFloat(this.ball.style.top) - this.ballLastY);
            
            // Check if this y position is within the paddle's height bounds
            if (intersectY + parseFloat(this.ball.style.height) >= paddleY &&
                intersectY <= paddleY + this.paddleHeight) {
                this.adjustBallDirection(paddleY, this.paddleHeight, true, paddleId);
                this.collisionProcessedThisFrame = true;
                return true;
            }
        }
        // Backup collision check for slower balls or edge cases
        else if (parseFloat(this.ball.style.left) <= paddleRight + 2 &&
                 parseFloat(this.ball.style.left) + parseFloat(this.ball.style.width) >= 0 &&
                 parseFloat(this.ball.style.top) + parseFloat(this.ball.style.height) >= paddleY - 2 &&
                 parseFloat(this.ball.style.top) <= paddleY + this.paddleHeight + 2) {
            this.adjustBallDirection(paddleY, this.paddleHeight, true, paddleId);
            this.collisionProcessedThisFrame = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Check collision with right paddle
     */
    checkRightPaddleCollision(paddle, paddleY, paddleLeft, paddleId) {
        // Skip collision check if we've already processed a collision this frame
        if (this.collisionProcessedThisFrame) return false;
        
        // Skip collision check for disabled paddles in multiplayer mode
        if (this.isMultiplayerMode) {
            if (paddleId === 2 && this.lastPaddleHit.rightSide === 'paddle2') return false;
            if (paddleId === 4 && this.lastPaddleHit.rightSide === 'paddle4') return false;
        }
        
        const ballWidth = parseFloat(this.ball.style.width);
        const ballLeft = parseFloat(this.ball.style.left);
        
        // Trajectory-based collision detection - check if ball's right edge crosses paddle's left edge
        if (this.ballLastX + ballWidth < paddleLeft && ballLeft + ballWidth >= paddleLeft) {
            // Calculate the y position at the time of intersection using linear interpolation
            const ratio = (paddleLeft - (this.ballLastX + ballWidth)) /
                         ((ballLeft + ballWidth) - (this.ballLastX + ballWidth));
            const intersectY = this.ballLastY + ratio * (parseFloat(this.ball.style.top) - this.ballLastY);
            
            // Check if this y position is within the paddle's height bounds
            if (intersectY + parseFloat(this.ball.style.height) >= paddleY &&
                intersectY <= paddleY + this.paddleHeight) {
                // Set ball position so its right edge exactly touches the paddle's left edge
                this.ball.style.left = `${paddleLeft - ballWidth}px`;
                this.adjustBallDirection(paddleY, this.paddleHeight, false, paddleId);
                this.collisionProcessedThisFrame = true;
                return true;
            }
        }
        // Backup collision check for slower balls or edge cases
        else if (ballLeft + ballWidth >= paddleLeft - 2 &&
                 ballLeft < paddleLeft + this.paddleWidth &&
                 parseFloat(this.ball.style.top) + parseFloat(this.ball.style.height) >= paddleY - 2 &&
                 parseFloat(this.ball.style.top) <= paddleY + this.paddleHeight + 2) {
            // Set ball position so its right edge exactly touches the paddle's left edge
            this.ball.style.left = `${paddleLeft - ballWidth}px`;
            this.adjustBallDirection(paddleY, this.paddleHeight, false, paddleId);
            this.collisionProcessedThisFrame = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Adjust ball direction based on where it hit the paddle
     */
    adjustBallDirection(paddleY, paddleHeight, isLeftPaddle, paddleId) {
        const ballTop = parseFloat(this.ball.style.top);
        const ballSize = parseFloat(this.ball.style.width);
        const ballCenter = ballTop + ballSize / 2;
        
        // Calculate relative hit position (-0.5 to 0.5)
        const relativeIntersect = (ballCenter - (paddleY + paddleHeight / 2)) / (paddleHeight / 2);
        
        // Calculate angle (-45 to 45 degrees in radians)
        const bounceAngle = relativeIntersect * (Math.PI / 4);
        
        // Calculate the current speed of the ball
        let speed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);
        
        // Increase the ball's speed by a factor, but cap it at the maximum speed
        speed = Math.min(speed * this.speedIncreaseFactor, this.maxSpeed);
        
        // Adjust the ball's horizontal speed based on the paddle side and bounce angle
        this.ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);
        
        // Adjust the ball's vertical speed based on the bounce angle
        this.ballSpeedY = speed * Math.sin(bounceAngle);
        
        // Add small random variations to prevent predictable patterns
        if (Math.abs(this.ballSpeedY) < 0.5) {
            this.ballSpeedY += (Math.random() * 2 - 1) * speed * 0.1;
        }
        this.ballSpeedX += (Math.random() * 2 - 1) * speed * 0.05;
        
        // If in multiplayer mode, handle tag-team mechanics
        if (this.isMultiplayerMode && paddleId) {
            // Update the last paddle hit for the appropriate side
            if (paddleId === 1 || paddleId === 3) {
                this.lastPaddleHit.leftSide = paddleId === 1 ? 'paddle1' : 'paddle3';
            } else if (paddleId === 2 || paddleId === 4) {
                this.lastPaddleHit.rightSide = paddleId === 2 ? 'paddle2' : 'paddle4';
            }
            
            // Apply visual cue to show which paddle is disabled
            this.resetPaddleVisuals();
        }
        
        // Play a sound effect to indicate the ball hit the paddle
        this.playSound('paddle');
    }
    
    /**
     * Show the win screen with the winner's name
     */
    showWinScreen(winnerName) {
        // Stop the game
        this.gameRunning = false;
        this.gameOver = true;
        
        // Update win screen content
        document.getElementById('winnerText').textContent = `${winnerName} Wins!`;
        document.getElementById('finalScore').textContent = 
            `${this.player1Score.textContent} - ${this.player2Score.textContent}`;
        
        // Capture this match data into matchObj
        this.fillMatchObj(winnerName);
        console.log('Match result:', this.matchObj);
        
        // Tournament logic: record and show next match button
        if (this.isTournamentMode) {
            // Record this match after populating matchObj
            this.tournamentArr.push({ ...this.matchObj });
            if (this.currentTournamentMatch < 3) {
                document.getElementById('nextMatchButton').style.display = 'inline-block';
            } else {
                // Final completed: submit and clear
                this.submitTournament(this.tournamentArr);
                this.tournamentArr = [];
                this.tournamentWinners = [];
                document.getElementById('nextMatchButton').style.display = 'none';
            }
        } else {
            document.getElementById('nextMatchButton').style.display = 'none';
        }
        
        // Show the win screen
        document.getElementById('winScreen').style.display = 'block';
        
        // Submit single match if not in tournament, then clear matchObj
        if (!this.isTournamentMode) {
            this.submitMatch(this.matchObj);
            this.matchObj = { player1Name: '', player2Name: '', player1Score: 0, player2Score: 0, winner: '', matchType: '' };
        }
    }
    
    /**
     * Populate the matchObj with the current match data
     * @param {string} winnerName - the name of the match winner
     */
    fillMatchObj(winnerName) {
        this.matchObj.player1Name  = this.player1Name.textContent;
        this.matchObj.player2Name  = this.player2Name.textContent;
        this.matchObj.player1Score = parseInt(this.player1Score.textContent, 10);
        this.matchObj.player2Score = parseInt(this.player2Score.textContent, 10);
        this.matchObj.winner       = winnerName;
        // Determine match type
        this.matchObj.matchType = this.getMatchType();
    }

    getMatchType() {
      switch (true) {
        case this.isTournamentMode:
          return 'tournament';
        case this.isAIMode:
          return '1 vs AI';
        case this.isMultiplayerMode:
          return 'multiplayer';
        default:
          return '1 vs 1';
      }
    }

    /**
     * Get the winner from a match object
     * @param {Object} match - a match record
     * @returns {string} the winner's name or empty string
     */
    getWinnerName(match) {
      return match && match.winner ? match.winner : '';
    }

    /**
     * Play a sound effect
     */
    playSound(sound) {
        switch (sound) {
            case 'paddle':
                if (this.paddleSound) {
                    this.paddleSound.currentTime = 0;
                    this.paddleSound.play().catch(e => console.log("Error playing sound:", e));
                }
                break;
            case 'wall':
                if (this.wallSound) {
                    this.wallSound.currentTime = 0;
                    this.wallSound.play().catch(e => console.log("Error playing sound:", e));
                }
                break;
            case 'loss':
                if (this.lossSound) {
                    this.lossSound.currentTime = 0;
                    this.lossSound.play().catch(e => console.log("Error playing sound:", e));
                }
                break;
        }
    }
    
    /**
     * Update AI decisions for controlling the paddle
     */
    updateAIDecisions() {
        // Skip if not in AI mode
        if (!this.isAIMode) return;
        
        // Only update AI decisions once per second
        const currentTime = Date.now();
        if (!this.lastAIUpdateTime) {
            this.lastAIUpdateTime = currentTime;
        }
        
        // Calculate time since last update (in seconds)
        const timeSinceLastUpdate = (currentTime - this.lastAIUpdateTime) / 1000;
        
        // Only make new decisions once per second
        if (timeSinceLastUpdate >= 1) {
            // Store current ball position for AI decision making
            const ballStyle = window.getComputedStyle(this.ball);
            const ballLeft = parseFloat(ballStyle.left);
            const ballTop = parseFloat(ballStyle.top);
            const ballSize = parseFloat(ballStyle.width);
            const ballCenterY = ballTop + ballSize / 2;
            
            // Set difficulty parameters
            switch (this.aiDifficulty) {
                case 'easy':
                    this.aiPredictionAccuracy = 0.3; // 30% accuracy
                    this.aiRandomOffset = 50; // Larger random offset
                    this.paddle2Speed = this.paddleMaxSpeed * 0.4; // 40% speed
                    this.aiTargetOffset = 30; // Intentionally miss more often
                    break;
                    
                case 'medium':
                    this.aiPredictionAccuracy = 0.6; // 60% accuracy
                    this.aiRandomOffset = 20; // Medium random offset
                    this.paddle2Speed = this.paddleMaxSpeed * 0.7; // 70% speed
                    this.aiTargetOffset = 15; // Occasionally miss
                    break;
                    
                case 'hard':
                    this.aiPredictionAccuracy = 0.9; // 90% accuracy
                    this.aiRandomOffset = 10; // Small random offset
                    this.paddle2Speed = this.paddleMaxSpeed * 0.9; // 90% speed
                    this.aiTargetOffset = 5; // Rarely miss
                    break;
            }
            
            // Only calculate new target if ball is moving towards AI paddle
            if (this.ballSpeedX > 0) {
                // Predict where ball will be when it reaches the paddle
                const distanceX = this.gameWidth - ballLeft - ballSize - this.paddleWidth;
                
                // Predict Y position
                this.aiPredictedY = this.predictBallPosition(
                    ballLeft, 
                    ballTop, 
                    this.ballSpeedX, 
                    this.ballSpeedY, 
                    distanceX
                );
                
                // Add randomness based on difficulty
                this.aiPredictedY += (Math.random() * 2 - 1) * this.aiRandomOffset;
                
                // Add intentional offset based on difficulty
                if (Math.random() > this.aiPredictionAccuracy) {
                    // Occasionally move away from the ball
                    this.aiPredictedY += (Math.random() > 0.5 ? 1 : -1) * this.aiTargetOffset;
                }
                
                // Store the calculated target position
                this.aiTargetY = this.aiPredictedY - this.paddleHeight / 2;
                
                // Clamp target position to game boundaries
                this.aiTargetY = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.aiTargetY));
            } else {
                // When ball is moving away, gradually return to center
                this.aiTargetY = (this.gameHeight - this.paddleHeight) / 2;
            }
            
            // Update last AI update time
            this.lastAIUpdateTime = currentTime;
        }
        
        // Move paddle towards the target position (smooth movement)
        if (this.aiTargetY !== undefined) {
            const paddleCenterY = this.paddle2Y + this.paddleHeight / 2;
            const targetCenterY = this.aiTargetY + this.paddleHeight / 2;
            
            // Only move if the paddle is not very close to the target
            if (Math.abs(paddleCenterY - targetCenterY) > this.paddleHeight / 10) {
                // Move towards target at constant speed
                if (paddleCenterY < targetCenterY) {
                    // Move down
                    this.paddle2Y += this.paddle2Speed * this.deltaTime * 60;
                } else {
                    // Move up
                    this.paddle2Y -= this.paddle2Speed * this.deltaTime * 60;
                }
                
                // Clamp position to game boundaries
                this.paddle2Y = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddle2Y));
            }
            
            // Update DOM
            this.paddle2.style.top = `${this.paddle2Y}px`;
        }
    }
    
    /**
     * Predict ball position after traveling a certain distance
     */
    predictBallPosition(startX, startY, speedX, speedY, distanceX) {
        const ballSize = parseFloat(window.getComputedStyle(this.ball).width);
        
        // Time to travel distanceX
        const timeSteps = distanceX / speedX;
        
        // Calculate final Y position
        let predictedY = startY + speedY * timeSteps;
        
        // Adjust for bounces off top and bottom
        const effectiveHeight = this.gameHeight - ballSize;
        
        // Calculate number of bounces and final position
        if (predictedY < 0 || predictedY > effectiveHeight) {
            // Get position relative to top or bottom edge
            const bouncePos = (predictedY < 0) ? -predictedY : 2 * effectiveHeight - predictedY;
            
            // Get position within the bounds (0 to effectiveHeight)
            let normalizedPos = bouncePos % (2 * effectiveHeight);
            
            // Adjust if needed
            if (normalizedPos > effectiveHeight) {
                normalizedPos = 2 * effectiveHeight - normalizedPos;
            }
            
            predictedY = normalizedPos;
        }
        
        return predictedY + ballSize / 2; // Return center Y
    }
    
    /**
     * Start a tournament with 4 players
     */
    startTournament() {
        // Get player names from inputs
        this.tournamentPlayers = [
            document.getElementById('tournament-p1').value || 'Player 1',
            document.getElementById('tournament-p2').value || 'Player 2',
            document.getElementById('tournament-p3').value || 'Player 3',
            document.getElementById('tournament-p4').value || 'Player 4'
        ];
        
        // Reset tournament state
        this.currentTournamentMatch = 0;
        this.tournamentWinners = [];
        
        // Update bracket display
        document.getElementById('semi1Player1').textContent = this.tournamentPlayers[0];
        document.getElementById('semi1Player2').textContent = this.tournamentPlayers[1];
        document.getElementById('semi2Player1').textContent = this.tournamentPlayers[2];
        document.getElementById('semi2Player2').textContent = this.tournamentPlayers[3];
        document.getElementById('finalPlayer1').textContent = 'TBD';
        document.getElementById('finalPlayer2').textContent = 'TBD';
        
        // Start first match
        this.setupNextTournamentMatch();
    }
    
    /**
     * Set up the next match in the tournament
     */
    setupNextTournamentMatch() {
        // Hide tournament screen
        document.getElementById('tournamentScreen').style.display = 'none';
        
        // Determine which match to play
        if (this.currentTournamentMatch === 0) {
            // First semifinal
            document.getElementById('tournamentAnnouncement').textContent = 
                `Semifinal 1: ${this.tournamentPlayers[0]} vs ${this.tournamentPlayers[1]}`;
            
            // Set player names for the match
            this.player1Name.textContent = this.tournamentPlayers[0];
            this.player2Name.textContent = this.tournamentPlayers[1];
            
        } else if (this.currentTournamentMatch === 1) {
            // Second semifinal
            document.getElementById('tournamentAnnouncement').textContent = 
                `Semifinal 2: ${this.tournamentPlayers[2]} vs ${this.tournamentPlayers[3]}`;
            
            // Set player names for the match
            this.player1Name.textContent = this.tournamentPlayers[2];
            this.player2Name.textContent = this.tournamentPlayers[3];
            
        } else if (this.currentTournamentMatch === 2) {
            // Final match - announce based on stored tournamentArr winners
            const winner1 = this.getWinnerName(this.tournamentArr[0]);
            const winner2 = this.getWinnerName(this.tournamentArr[1]);
            document.getElementById('tournamentAnnouncement').textContent =
                `Final: ${winner1} vs ${winner2}`;
            // Update bracket display
            document.getElementById('finalPlayer1').textContent = winner1;
            document.getElementById('finalPlayer2').textContent = winner2;
            // Set player names for the match
            this.player1Name.textContent = winner1;
            this.player2Name.textContent = winner2;
        }
        
        // Increment match counter
        this.currentTournamentMatch++;
        
        // Show tournament announcement briefly, then start the game
        document.getElementById('tournamentAnnouncement').style.display = 'block';
        
        // Reset game for the new match
        this.resetGame();
        
        // Start the match after a short delay
        setTimeout(() => {
            document.getElementById('tournamentAnnouncement').style.display = 'none';
            document.getElementById('startText').style.display = 'block';
        }, 2000);
    }
    
    /**
     * Apply settings from the settings screen
     */
    applySettings() {
        // Get win score setting
        const winScoreSelect = document.getElementById('winScore');
        this.winScore = parseInt(winScoreSelect.value);
        
        // Get ball speed setting
        const ballSpeedSelect = document.getElementById('ballSpeedSelect');
        const speedValue = parseInt(ballSpeedSelect.value);
        this.initialBallSpeedX = speedValue;
        this.initialBallSpeedY = speedValue * 0.4;
        
        // Get paddle size setting
        const paddleSizeSelect = document.getElementById('paddleSize');
        this.paddleSizeClass = paddleSizeSelect.value;
        this.updatePaddleSizes();
        
        // Get AI difficulty setting
        const aiDifficultySelect = document.getElementById('aiDifficultySelect');
        this.aiDifficulty = aiDifficultySelect.value;
        
        // Get player names
        const player1NameInput = document.getElementById('player1NameInput');
        const player2NameInput = document.getElementById('player2NameInput');
        
        // Override stored username if Player 1 name is set in settings
        if (player1NameInput.value) {
            this.userName = player1NameInput.value;
            this.player1Name.textContent = this.userName;
        }
        
        if (player2NameInput.value) {
            this.player2Name.textContent = player2NameInput.value;
        }
        
        // If in AI mode, update player 2 name based on difficulty
        if (this.isAIMode) {
            const difficultyName = this.aiDifficulty.charAt(0).toUpperCase() + this.aiDifficulty.slice(1);
            this.player2Name.textContent = `AI (${difficultyName})`;
        }
        
        // Apply team names for multiplayer mode
        if (this.isMultiplayerMode) {
            const team1NameInput = document.getElementById('team1NameInput');
            const team2NameInput = document.getElementById('team2NameInput');
            
            if (team1NameInput.value) {
                this.player1Name.textContent = team1NameInput.value;
            } else {
                this.player1Name.textContent = 'Left Team';
            }
            
            if (team2NameInput.value) {
                this.player2Name.textContent = team2NameInput.value;
            } else {
                this.player2Name.textContent = 'Right Team';
            }
        }
        
        // Apply background setting
        const backgroundSelect = document.getElementById('backgroundSelect');
        const videoBg = document.getElementById('videoBackground');
        if (backgroundSelect.value === 'video') {
            videoBg.style.display = 'block';
            videoBg.style.zIndex = '-1';
            videoBg.play().catch(e => console.log('Error playing video background:', e));
        } else {
            videoBg.pause();
            videoBg.currentTime = 0;
            videoBg.style.display = 'none';
        }
    }
    
    /**
     * Update paddle sizes based on settings
     */
    updatePaddleSizes() {
        // Remove existing size classes
        this.paddle1.classList.remove('paddle-small', 'paddle-normal', 'paddle-large');
        this.paddle2.classList.remove('paddle-small', 'paddle-normal', 'paddle-large');
        this.paddle3.classList.remove('paddle-small', 'paddle-normal', 'paddle-large');
        this.paddle4.classList.remove('paddle-small', 'paddle-normal', 'paddle-large');
        
        // Add selected size class
        this.paddle1.classList.add(`paddle-${this.paddleSizeClass}`);
        this.paddle2.classList.add(`paddle-${this.paddleSizeClass}`);
        this.paddle3.classList.add(`paddle-${this.paddleSizeClass}`);
        this.paddle4.classList.add(`paddle-${this.paddleSizeClass}`);
        
        // Adjust paddle height based on setting
        switch (this.paddleSizeClass) {
            case 'small':
                this.paddleHeight = this.gameHeight * 0.1; // 10% of game height
                break;
                
            case 'normal':
                this.paddleHeight = this.gameHeight * 0.15; // 15% of game height
                break;
                
            case 'large':
                this.paddleHeight = this.gameHeight * 0.2; // 20% of game height
                break;
        }
        
        // Update paddle dimensions
        this.paddle1.style.height = `${this.paddleHeight}px`;
        this.paddle2.style.height = `${this.paddleHeight}px`;
        this.paddle3.style.height = `${this.paddleHeight}px`;
        this.paddle4.style.height = `${this.paddleHeight}px`;
    }
    
    /**
     * Update player names display
     */
    updatePlayerNames() {
        // Get player names from settings inputs
        const player1NameInput = document.getElementById('player1NameInput');
        const player2NameInput = document.getElementById('player2NameInput');
        
        // Set default names if inputs are empty
        if (!player1NameInput.value) {
            player1NameInput.value = 'Player 1';
        }
        
        if (!player2NameInput.value) {
            player2NameInput.value = 'Player 2';
        }
        
        // Update display
        this.player1Name.textContent = player1NameInput.value;
        this.player2Name.textContent = player2NameInput.value;
    }
}

// Export a singleton PongGame instance for app import
const game = new PongGame();

export default game;
