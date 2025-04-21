/********************************************************************************************************
 * DOM ELEMENTS AND GAME VARIABLES
 ********************************************************************************************************/
// DOM Elements
const startText = document.getElementById('startText');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const ball = document.getElementById('ball');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');
const player1NameElement = document.getElementById('player1Name');
const player2NameElement = document.getElementById('player2Name');
const winScreen = document.getElementById('winScreen');
const winnerTextElement = document.getElementById('winnerText');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const lossSound = document.getElementById('lossSound');
const wallSound = document.getElementById('wallSound');
const paddleSound = document.getElementById('paddleSound');

// UI Elements
const playScreen = document.getElementById('playScreen');
const settingsLink = document.getElementById('settingsLink');
const howToPlayLink = document.getElementById('howToPlayLink');
const settingsScreen = document.getElementById('settingsScreen');
const howToPlayScreen = document.getElementById('howToPlayScreen');

// Game Mode Elements
const pvpButton = document.getElementById('pvpButton');
const pveButton = document.getElementById('pveButton');
const player2Controls = document.getElementById('player2Controls');
const winScoreSelect = document.getElementById('winScore');
const ballSpeedSelect = document.getElementById('ballSpeedSelect');
const aiDifficultySelect = document.getElementById('aiDifficultySelect');
const player1NameInput = document.getElementById('player1NameInput');
const player2NameInput = document.getElementById('player2NameInput');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const backFromHowToPlayButton = document.getElementById('backFromHowToPlayButton');

// Add new global variables for the new settings
let currentBackground = 'classic'; // Default background
let paddleSizeMultiplier = 1; // Default paddle size multiplier

// DOM Elements - add new elements
const paddleSizeSelect = document.getElementById('paddleSize');
const backgroundSelect = document.getElementById('backgroundSelect');
const videoBackground = document.querySelector('.gameArea .video-background');

/********************************************************************************************************
 * GAME STATE VARIABLES
 ********************************************************************************************************/
// Core Game Variables
let gameRunning = false;
let gameOver = false;
let keysPressed = {};
let lastTime = null;

// Responsive scaling variables
let gameArea = document.querySelector('.gameArea');
let scaleX = 1;       // Horizontal scale factor
let scaleY = 1;       // Vertical scale factor

// Paddle Variables
let paddle1Speed = 0;
let paddle1Y = 0;
let paddle2Speed = 0;
let paddle2Y = 0;

// Ball Variables
let ballX = 0;
let ballY = 0;
let ballSpeedX = 5; // Default higher speed
let ballSpeedY = 5; // Default higher speed
let initialBallSpeed = 5; // Store initial ball speed for resets
let ballLastX = 0; // Track previous position for improved collision
let ballLastY = 0; // Track previous position for improved collision

// Score and Player Variables
let player1Score = 0;
let player2Score = 0;
let player1Name = "Player 1"; // Default player names
let player2Name = "Player 2"; // Default player names
let pointsToWin = 5; // Default points to win

// Function to get logged-in user data
function getLoggedInUser() {
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

/********************************************************************************************************
 * GAME CONSTANTS
 ********************************************************************************************************/
// Physics Constants
const paddleAcceleration = 1;
const paddleDeceleration = 1;
const maxPaddleSpeed = 8; // Maximum paddle speed
const speedIncreaseFactor = 1.05; // 5% speed increase per paddle hit
const maxSpeed = 15; // Prevent excessive speed

// Game Dimensions
// Reference dimensions (what the game was originally designed for)
// Now using 16:9 ratio
const REFERENCE_WIDTH = 960;
const REFERENCE_HEIGHT = 540;

// Actual dimensions that will be updated based on current game area size
let gameWidth = REFERENCE_WIDTH;
let gameHeight = REFERENCE_HEIGHT;

// Function to update the game dimensions and scale factors
function updateGameDimensions() {
  // Store previous dimensions to calculate scaling ratio
  const prevWidth = gameWidth;
  const prevHeight = gameHeight;
  
  // Get the actual dimensions of the game area
  const newWidth = gameArea.clientWidth;
  const newHeight = gameArea.clientHeight;
  
  // Calculate scale factors relative to reference dimensions
  const newScaleX = newWidth / REFERENCE_WIDTH;
  const newScaleY = newHeight / REFERENCE_HEIGHT;
  
  // Calculate scaling ratios between old and new dimensions
  const widthRatio = newWidth / prevWidth;
  const heightRatio = newHeight / prevHeight;
  
  // Update global variables
  gameWidth = newWidth;
  gameHeight = newHeight;
  scaleX = newScaleX;
  scaleY = newScaleY;
  
  if (gameRunning) {
    // Properly scale paddle positions
    paddle1Y = Math.min(gameHeight - paddle1.clientHeight, paddle1Y * heightRatio);
    paddle2Y = Math.min(gameHeight - paddle2.clientHeight, paddle2Y * heightRatio);
    
    // Scale ball position
    ballX = Math.min(gameWidth - ball.clientWidth, ballX * widthRatio);
    ballY = Math.min(gameHeight - ball.clientHeight, ballY * heightRatio);
    
    // Apply the new positions
    paddle1.style.top = paddle1Y + 'px';
    paddle2.style.top = paddle2Y + 'px';
    ball.style.left = ballX + 'px';
    ball.style.top = ballY + 'px';
    
    // Make sure the ball's previous position is also scaled for accurate collision detection
    ballLastX = ballLastX * widthRatio;
    ballLastY = ballLastY * heightRatio;
  } else {
    // If game is not running, just reset positions
    initializePositions();
  }
  
  // Ensure the resize doesn't break things by forcing a checkWindowSize
  checkWindowSize();
}

/********************************************************************************************************
 * AI CONFIGURATION
 ********************************************************************************************************/
// AI Mode Variables
window.isAIMode = false; // Make isAIMode global to ensure it's accessible everywhere
let isAIMode = window.isAIMode; // Local reference
let lastAIUpdateTime = 0; // Track last time AI updated its perception
let aiPerceptionBallX = 0; // What the AI "sees" (not actual ball position)
let aiPerceptionBallY = 0;
let aiPerceptionBallSpeedX = 0;
let aiPerceptionBallSpeedY = 0;
let currentAIDifficulty = 'medium'; // Default difficulty

// AI Behavior Parameters - these will be set based on difficulty
let aiMistakeChance = 0.02;        // Chance of AI misperceiving the ball
let aiErrorMargin = 0.05;          // Paddle targeting precision (smaller = more accurate)
let aiReactionDelay = 1000;        // AI updates its perception once per second
let aiReturnToMiddleSpeed = 0.15;  // How quickly AI returns to center
let aiCenteringProbability = 0.3;  // How often AI tries to center itself
let aiPredictionAccuracy = 0.9;    // How accurately AI predicts bounces (0-1)

// AI Difficulty Presets
const aiDifficultySettings = {
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
let aiKeyState = {
  'ArrowUp': false,
  'ArrowDown': false
};

// AI Tracking Variables
let lastBallHitX = 0;           // Track where ball was last hit
let shouldReturnToCenter = false; // Flag to indicate if AI should return to center

/********************************************************************************************************
 * INITIALIZATION AND SETUP
 ********************************************************************************************************/
// Initialize paddle and ball positions
function initializePositions() {
  // Get the current dimensions of the game area
  gameWidth = gameArea.clientWidth;
  gameHeight = gameArea.clientHeight;
  
  // Update scale factors based on current dimensions
  scaleX = gameWidth / REFERENCE_WIDTH;
  scaleY = gameHeight / REFERENCE_HEIGHT;
  
  // Position paddles at the center of the game area vertically
  paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
  paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
  
  // Set the paddle width based on the game area width (responsive)
  const paddleWidth = Math.max(Math.round(0.01 * gameWidth), 6); // at least 6px wide
  paddle1.style.width = paddleWidth + 'px';
  paddle2.style.width = paddleWidth + 'px';
  
  // Apply the paddle height based on size multiplier (as percentage)
  const paddleHeight = 15 * paddleSizeMultiplier + '%'; // 15% is the base height
  paddle1.style.height = paddleHeight;
  paddle2.style.height = paddleHeight;
  
  // Set the ball size based on the game area (responsive)
  const ballSize = Math.max(Math.round(0.02 * Math.min(gameWidth, gameHeight)), 8); // at least 8px
  ball.style.width = ballSize + 'px';
  ball.style.height = ballSize + 'px';
  
  // IMPORTANT: Calculate ball position AFTER updating its size
  // We need to account for the ball's dimensions to center it properly
  ballX = gameWidth / 2 - ball.clientWidth / 2;
  ballY = gameHeight / 2 - ball.clientHeight / 2;
  
  // Set previous position same as current for smooth collision detection
  ballLastX = ballX;
  ballLastY = ballY;

  // Apply positions to DOM elements
  paddle1.style.left = '0px'; // Ensure paddle1 is at left edge
  paddle2.style.right = '0px'; // Ensure paddle2 is at right edge
  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
  
  // Reset speeds to ensure consistent gameplay
  paddle1Speed = 0;
  paddle2Speed = 0;
  
  // Ensure all elements are visible
  paddle1.style.display = 'block';
  paddle2.style.display = 'block';
  
  // Ball display is controlled separately based on game state
  
  // Make sure elements are within bounds
  ensureElementsInBounds();
  
  // Apply background based on settings
  toggleVideoBackground();
}

// Get reference to size warning screen
const sizeWarningScreen = document.getElementById('sizeWarningScreen');

// Minimum dimensions for gameplay
const MIN_GAME_WIDTH = 320; // px
const MIN_GAME_HEIGHT = 180; // px

// Function to check if window size is adequate for gameplay
function checkWindowSize() {
  const gameAreaWidth = gameArea.clientWidth;
  const gameAreaHeight = gameArea.clientHeight;
  
  if (gameAreaWidth < MIN_GAME_WIDTH || gameAreaHeight < MIN_GAME_HEIGHT) {
    // Show warning and pause game if it's running
    sizeWarningScreen.style.display = 'block';
    if (gameRunning) {
      gameRunning = false;
    }
    return false;
  } else {
    // Hide warning and allow game to run
    sizeWarningScreen.style.display = 'none';
    
    // Important: Make sure paddles haven't gone out of bounds after resize
    ensureElementsInBounds();
    return true;
  }
}

// New function to ensure all game elements stay within bounds after resize
function ensureElementsInBounds() {
  // Check and fix paddle positions
  if (paddle1Y < 0) paddle1Y = 0;
  if (paddle2Y < 0) paddle2Y = 0;
  
  const maxPaddle1Y = gameHeight - paddle1.clientHeight;
  const maxPaddle2Y = gameHeight - paddle2.clientHeight;
  
  if (paddle1Y > maxPaddle1Y) paddle1Y = maxPaddle1Y;
  if (paddle2Y > maxPaddle2Y) paddle2Y = maxPaddle2Y;
  
  // Apply corrected positions
  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';
  
  // Check and fix ball position
  if (ballX < 0) ballX = 0;
  if (ballY < 0) ballY = 0;
  
  const maxBallX = gameWidth - ball.clientWidth;
  const maxBallY = gameHeight - ball.clientHeight;
  
  if (ballX > maxBallX) ballX = maxBallX;
  if (ballY > maxBallY) ballY = maxBallY;
  
  // Apply corrected positions
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Window load event - initialize everything - add event listeners for new settings
window.addEventListener('load', () => {
  // Initialize video state - ensure it's paused if not visible
  const videoBackground = document.querySelector('.gameArea .video-background');
  if (videoBackground) {
    console.log('Video background found, setting initial state');
    
    // Make sure z-index is low by default
    videoBackground.style.zIndex = '-1000';
    
    // Pause the video initially
    const videoElement = videoBackground.querySelector('video');
    if (videoElement) {
      videoElement.pause();
      
      // Add event listeners to monitor video state
      videoElement.addEventListener('play', () => {
        console.log('Video started playing');
      });
      
      videoElement.addEventListener('pause', () => {
        console.log('Video paused');
      });
    }
  } else {
    console.error('Video background not found on load');
  }
  
  // Make sure backgroundSelect reflects the default
  if (backgroundSelect) {
    backgroundSelect.value = 'classic';
  }
  
  // Set default background to classic
  currentBackground = 'classic';
  
  // Update game dimensions before initializing positions
  updateGameDimensions();
  initializePositions();
  
  // Apply settings which will ensure proper video state
  applySettings();
  
  // Check window size on load
  checkWindowSize();
  
  // Try to get logged-in user for player1 name
  const loggedInUser = getLoggedInUser();
  if (loggedInUser) {
    player1Name = loggedInUser.username;
    if (player1NameInput) {
      player1NameInput.value = player1Name;
    }
  }
  
  // Set default player names on initial load
  player1NameElement.textContent = player1Name;
  player2NameElement.textContent = "Player 2";
  
  // Hide all screens, don't select any button by default
  hideAllScreens();
  
  // Make sure the video is off by default
  toggleVideoBackground();
  
  // Add a global keydown listener for starting the game
  window.addEventListener('keydown', function(e) {
    // Only trigger if start text is visible and game isn't running
    if (startText.style.display === 'block' && !gameRunning && !gameOver) {
      console.log("Global key handler - starting game!");
      startGame();
    }
  });
  
  // Set up regular game controls
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Export functions to window for access from other contexts
  window.toggleVideoBackground = toggleVideoBackground;
  window.updatePaddleSizes = updatePaddleSizes;
});

// Main key press handler that manages both starting the game and in-game controls
function handleKeyDown(e) {
  // Check if game should be started with any key
  if (startText.style.display === 'block' && !gameRunning && !gameOver) {
    console.log("Handling key press to start game:", e.key);
    startGame();
    return;
  }
  
  // Regular in-game controls
  keysPressed[e.key] = true;
  console.log('Key pressed:', e.key, 'keysPressed state:', keysPressed);
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
  console.log('Key released:', e.key);
}

/********************************************************************************************************
 * UI NAVIGATION FUNCTIONS
 ********************************************************************************************************/
// Helper function to hide all screens
function hideAllScreens() {
  // Hide all screens and UI elements
  const screens = [playScreen, settingsScreen, howToPlayScreen, startText, winScreen];
  screens.forEach(screen => {
    if (screen) screen.style.display = 'none';
  });
  
  // Also hide the game selection
  const gameSelection = document.querySelector('.gameSelection');
  if (gameSelection) gameSelection.style.display = 'none';
}

// Helper function retained for compatibility but no longer needed
function setNavButtonsEnabled(enabled) {
  // Navigation buttons removed from the UI
  // This function is kept as a no-op for backward compatibility
  console.log('Navigation disabled state set to:', !enabled);
}

/********************************************************************************************************
 * EVENT LISTENERS
 ********************************************************************************************************/
// Direct access to settings and how to play
settingsLink.addEventListener('click', () => {
  hideAllScreens();
  settingsScreen.style.display = 'block';
  
  // Always show AI settings
  const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
  if (aiDifficultyContainer) {
    aiDifficultyContainer.style.display = 'block';
  }
});

howToPlayLink.addEventListener('click', () => {
  hideAllScreens();
  howToPlayScreen.style.display = 'block';
});

// Game Mode buttons with simpler direct start
pvpButton.addEventListener('click', () => {
  console.log('PVP button clicked');
  window.isAIMode = false;
  isAIMode = false; // Set both local and global
  console.log('PVP mode selected, isAIMode set to:', isAIMode);
  hideAllScreens();
  
  // Apply current settings
  applySettings();
  
  // Reset and start the game immediately
  resetGame();
  startGame();
});

pveButton.addEventListener('click', () => {
  console.log('PVE button clicked');
  window.isAIMode = true;
  isAIMode = true; // Set both local and global
  console.log('AI mode selected, isAIMode set to:', isAIMode);
  hideAllScreens();
  
  // Apply current settings
  applySettings();
  
  // Reset and start the game immediately
  resetGame();
  startGame();
});

// Settings screen save button
saveSettingsButton.addEventListener('click', () => {
  // Save settings but don't start the game yet
  applySettings();
  
  // Go back to game selection
  hideAllScreens();
  document.querySelector('.gameSelection').style.display = 'block';
});

// Back button from How to Play screen
backFromHowToPlayButton.addEventListener('click', () => {
  hideAllScreens();
  document.querySelector('.gameSelection').style.display = 'block';
});

// Event listener for the restart button
restartButton.addEventListener('click', () => {
  winScreen.style.display = 'none';
  resetGame();
  
  // Return to the game selection screen
  hideAllScreens();
  document.querySelector('.gameSelection').style.display = 'block';
  
  // Reset the lastTime variable to ensure the game loop starts fresh
  lastTime = null;
});

/********************************************************************************************************
 * SETTINGS FUNCTIONS
 ********************************************************************************************************/
// Apply current settings
function applySettings() {
  console.log('applySettings() called, isAIMode:', isAIMode);
  pointsToWin = parseInt(winScoreSelect.value);
  initialBallSpeed = parseInt(ballSpeedSelect.value);
  ballSpeedX = Math.sign(ballSpeedX) * initialBallSpeed; // Preserve direction
  ballSpeedY = Math.sign(ballSpeedY) * initialBallSpeed; // Preserve direction
  player1Name = player1NameInput.value || "Player 1";
  player2Name = isAIMode ? "AI" : (player2NameInput.value || "Player 2");
  
  // Apply new settings
  if (paddleSizeSelect) {
    const paddleSize = paddleSizeSelect.value;
    switch (paddleSize) {
      case 'small':
        paddleSizeMultiplier = 0.7; // 70% of normal size
        break;
      case 'large':
        paddleSizeMultiplier = 1.5; // 150% of normal size
        break;
      case 'normal':
      default:
        paddleSizeMultiplier = 1.0; // Normal size
        break;
    }
    // Update paddle sizes immediately
    updatePaddleSizes();
  }
  
  if (backgroundSelect) {
    currentBackground = backgroundSelect.value;
    console.log('Background changed to:', currentBackground);
    // Toggle video background based on setting
    toggleVideoBackground();
  }
  
  // Always apply AI difficulty settings regardless of mode
  if (aiDifficultySelect) {
    currentAIDifficulty = aiDifficultySelect.value;
    const settings = aiDifficultySettings[currentAIDifficulty];
    
    // Apply the difficulty settings
    aiMistakeChance = settings.mistakeChance;
    aiErrorMargin = settings.errorMargin;
    aiReactionDelay = settings.reactionDelay;
    aiReturnToMiddleSpeed = settings.returnToMiddleSpeed;
    aiCenteringProbability = settings.centeringProbability;
    aiPredictionAccuracy = settings.predictionAccuracy;
    
    // Update AI name to reflect difficulty if in AI mode
    if (isAIMode) {
      player2Name = `AI (${currentAIDifficulty.charAt(0).toUpperCase() + currentAIDifficulty.slice(1)})`;
    }
  }
  
  // Update display
  player1NameElement.textContent = player1Name;
  player2NameElement.textContent = player2Name;
  
  // Always show AI difficulty settings regardless of mode
  const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
  if (aiDifficultyContainer) {
    aiDifficultyContainer.style.display = 'block';
  }
}

// Function to update paddle sizes based on size multiplier
function updatePaddleSizes() {
  // Get base height (% of game area height)
  const baseHeight = 15; // 15% of game area height
  
  // Calculate new height as percentage
  const newHeightPercentage = baseHeight * paddleSizeMultiplier;
  
  // Apply to paddles
  if (paddle1 && paddle2) {
    paddle1.style.height = newHeightPercentage + '%';
    paddle2.style.height = newHeightPercentage + '%';
    
    // Reposition paddles to center them vertically
    resetPaddlePositions();
  }
}

// Function to reset paddle positions (used after size change)
function resetPaddlePositions() {
  if (paddle1 && paddle2) {
    // Calculate positions to center paddles vertically
    paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
    paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
    
    // Apply positions
    paddle1.style.top = paddle1Y + 'px';
    paddle2.style.top = paddle2Y + 'px';
  }
}

/********************************************************************************************************
 * GAME CONTROL FUNCTIONS
 ********************************************************************************************************/
// Main Game Loop using requestAnimationFrame with delta time
function gameLoop(timestamp) {
  if (!gameRunning) {
    return; // Exit if game is not running
  }
    
  if (lastTime === null) {
    lastTime = timestamp;
  }
    
  const deltaTime = (timestamp - lastTime) / 16.67; // Normalize to 60fps baseline
  
  // Update game objects
  updatePaddle1(deltaTime);
  updatePaddle2(deltaTime);
  moveBall(deltaTime);
  
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

// Helper function to play a sound with error handling
function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.error("Error playing sound:", error);
    });
  }
}

// Update the scoreboard with current scores
function updateScoreboard() {
  player1ScoreElement.textContent = player1Score;
  player2ScoreElement.textContent = player2Score;
}

// Reset the ball position and speed
function resetBall() {
  // Reset ball position and speed
  ballX = gameWidth / 2 - ball.clientWidth / 2; // Ball in the middle horizontally
  ballY = Math.random() * (gameHeight - ball.clientHeight); // Random Y position within bounds
  
  // Store previous position for collision detection
  ballLastX = ballX;
  ballLastY = ballY;
  
  // Use the configured initial ball speed but with random direction
  ballSpeedX = Math.random() > 0.5 ? initialBallSpeed : -initialBallSpeed;
  // Randomly choose an up or down initial direction with configured speed
  ballSpeedY = Math.random() > 0.5 ? initialBallSpeed : -initialBallSpeed;
  
  // Ensure the vertical speed is a bit lower than horizontal for better gameplay
  ballSpeedY *= 0.5;
  
  // Update ball position
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
  
  // Make sure ball is visible and game is running
  ball.style.display = 'block';
  
  // Make sure the game stays running
  gameRunning = true;
}

// Reset the entire game state - updated for new settings
function resetGame() {
  // Reset scores
  player1Score = 0;
  player2Score = 0;
  updateScoreboard();
  
  // Reset paddles and ball
  initializePositions();
  
  // Reset speeds
  paddle1Speed = 0;
  paddle2Speed = 0;
  ballSpeedX = initialBallSpeed;
  ballSpeedY = initialBallSpeed * 0.5;
  
  // Reset game state
  gameRunning = false;
  gameOver = false;
  
  // Update player names display (ensuring they're always visible)
  player1NameElement.textContent = player1Name || "Player 1";
  player2NameElement.textContent = player2Name || "Player 2";
  
  // Hide the ball until game starts
  ball.style.display = 'none';
  
  // Apply background based on settings
  toggleVideoBackground();
  
  // Reset last time to ensure game loop functions properly on restart
  lastTime = null;
}

// Start the game: hide all screens, show ball, disable nav buttons, and resume game loop
function startGame() {
  // First check if the window is large enough
  if (!checkWindowSize()) {
    // Don't start the game if window is too small
    return;
  }
  
  // Ensure elements are in bounds before starting
  ensureElementsInBounds();
  
  startText.style.display = 'none';
  ball.style.display = 'block';
  resetBall();
  gameRunning = true;
  gameOver = false;
  setNavButtonsEnabled(false);
  
  console.log("Game started! Ball visible, game running set to true");
  
  // Always reset lastTime to ensure a fresh game loop start
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
  console.log("Game loop started with requestAnimationFrame");
}

// Function to display the win screen
function showWinScreen(winnerName) {
  gameRunning = false;
  gameOver = true;
  ball.style.display = 'none';
  
  winnerTextElement.textContent = `${winnerName} Wins!`;
  finalScoreElement.textContent = `${player1Score} - ${player2Score}`;
  
  // Show normal win screen with buttons
  winScreen.style.display = 'block';
  
  // Re-enable navigation buttons when game is over
  setNavButtonsEnabled(true);
}

/********************************************************************************************************
 * PADDLE MOVEMENT FUNCTIONS
 ********************************************************************************************************/
function updatePaddle1(deltaTime) {
  // Player 1 controls (W/S keys)
  if (keysPressed['w'] || keysPressed['W']) {
    paddle1Speed -= paddleAcceleration;
  } else if (keysPressed['s'] || keysPressed['S']) {
    paddle1Speed += paddleAcceleration;
  } else {
    // Apply deceleration when no keys are pressed
    if (paddle1Speed > 0) paddle1Speed = Math.max(0, paddle1Speed - paddleDeceleration);
    if (paddle1Speed < 0) paddle1Speed = Math.min(0, paddle1Speed + paddleDeceleration);
  }

  // Clamp paddle speed to maximum
  paddle1Speed = Math.max(-maxPaddleSpeed, Math.min(maxPaddleSpeed, paddle1Speed));
  
  // Scale paddle speed based on game area height
  // This makes movement feel consistent regardless of screen size
  const effectiveSpeed = paddle1Speed * scaleY * deltaTime;
  
  // Update position
  paddle1Y += effectiveSpeed;
  
  // Boundary checks - keep paddle within the game area
  if (paddle1Y < 0) {
    paddle1Y = 0;
    paddle1Speed = 0;
  }
  if (paddle1Y > gameHeight - paddle1.clientHeight) {
    paddle1Y = gameHeight - paddle1.clientHeight;
    paddle1Speed = 0;
  }
  
  paddle1.style.top = paddle1Y + 'px';
}

function updatePaddle2(deltaTime) {
  console.log('updatePaddle2 called, isAIMode:', isAIMode);
  if (isAIMode) {
    // Update AI decisions
    updateAIDecisions();
    
    // Apply the AI's simulated key presses to control the paddle
    if (aiKeyState['ArrowUp']) {
      paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
    } else if (aiKeyState['ArrowDown']) {
      paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
    } else {
      // Apply natural deceleration when AI isn't pressing a key
      if (paddle2Speed > 0) {
        paddle2Speed = Math.max(0, paddle2Speed - paddleDeceleration * deltaTime);
      } else if (paddle2Speed < 0) {
        paddle2Speed = Math.min(0, paddle2Speed + paddleDeceleration * deltaTime);
      }
    }
  } else {
    // Player 2 controls (Arrow keys)
    if (keysPressed['ArrowUp']) {
      paddle2Speed -= paddleAcceleration;
    } else if (keysPressed['ArrowDown']) {
      paddle2Speed += paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
      if (paddle2Speed > 0) paddle2Speed = Math.max(0, paddle2Speed - paddleDeceleration);
      if (paddle2Speed < 0) paddle2Speed = Math.min(0, paddle2Speed + paddleDeceleration);
    }
  }
  
  // Clamp paddle speed to maximum
  paddle2Speed = Math.max(-maxPaddleSpeed, Math.min(maxPaddleSpeed, paddle2Speed));
  
  // Scale paddle speed based on game area height 
  // This makes movement feel consistent regardless of screen size
  const effectiveSpeed = paddle2Speed * scaleY * deltaTime;
  
  // Update position
  paddle2Y += effectiveSpeed;
  
  // Boundary checks
  if (paddle2Y < 0) {
    paddle2Y = 0;
    paddle2Speed = 0;
  }
  if (paddle2Y > gameHeight - paddle2.clientHeight) {
    paddle2Y = gameHeight - paddle2.clientHeight;
    paddle2Speed = 0;
  }
  
  paddle2.style.top = paddle2Y + 'px';
}

/********************************************************************************************************
 * AI LOGIC FUNCTIONS
 ********************************************************************************************************/
// AI Controller function - handles AI decision making
function updateAIDecisions() {
  // Check if ball was just hit (to activate return to center behavior)
  if (ballSpeedX < 0 && aiPerceptionBallSpeedX > 0) {
    shouldReturnToCenter = true;
    lastBallHitX = ballX; // Mark where ball was when it changed direction
  }
  
  // Reset key states at the beginning of each frame - this simulates keyboard input
  aiKeyState['ArrowUp'] = false;
  aiKeyState['ArrowDown'] = false;
  
  // Update AI's perception of the ball based on reaction delay
  // The AI can only refresh its view of the game once per second
  const currentTime = Date.now();
  
  // Only update perception once per second as per requirements
  if (currentTime - lastAIUpdateTime > aiReactionDelay) {
    // Update AI's perception of the ball
    aiPerceptionBallX = ballX;
    aiPerceptionBallY = ballY;
    aiPerceptionBallSpeedX = ballSpeedX;
    aiPerceptionBallSpeedY = ballSpeedY;
    lastAIUpdateTime = currentTime;
    
    // AI makes mistakes based on difficulty
    if (Math.random() < aiMistakeChance) {
      // Intentionally misjudge ball direction or speed (makes AI more human-like)
      aiPerceptionBallSpeedY *= -0.8 + Math.random() * 0.4;
    }
  }
  
  // Get the center position of the paddle
  const centerPosition = gameHeight / 2 - paddle2.clientHeight / 2;
  const paddleCenter = paddle2Y + paddle2.clientHeight / 2;
  const centerDifference = centerPosition - paddle2Y;
  const distanceFromCenter = Math.abs(paddleCenter - gameHeight / 2);
  
  // AGGRESSIVE BEHAVIOR: Move to intercept the ball if it's coming toward the AI
  if (aiPerceptionBallSpeedX > 0) {
    // Calculate time until ball reaches paddle
    const distanceToTravel = gameWidth - paddle2.clientWidth - ball.clientWidth - aiPerceptionBallX;
    const timeToImpact = distanceToTravel / Math.max(0.1, aiPerceptionBallSpeedX); // Avoid division by zero
    
    // Predict where ball will be vertically with multiple bounce calculation
    let predictedY = predictBallPosition(aiPerceptionBallX, aiPerceptionBallY, 
                                        aiPerceptionBallSpeedX, aiPerceptionBallSpeedY, 
                                        distanceToTravel);
    
    // Add prediction errors based on difficulty
    if (Math.random() > aiPredictionAccuracy) {
      const errorAmount = (1 - aiPredictionAccuracy) * gameHeight * 0.3;
      predictedY += (Math.random() * 2 - 1) * errorAmount;
    }
    
    // Calculate dynamic error margin (smaller for hard difficulty)
    const distanceFactor = Math.min(1, distanceToTravel / gameWidth);
    const dynamicErrorMargin = paddle2.clientHeight * (aiErrorMargin * (0.3 + 0.7 * distanceFactor));
    
    // Calculate difference between predicted ball position and paddle position
    const predictedBallCenter = predictedY + ball.clientHeight / 2;
    const difference = predictedBallCenter - paddleCenter;
    
    // Intercept the ball with higher precision for harder difficulties
    if (Math.abs(difference) > dynamicErrorMargin) {
      aiKeyState[difference > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
    }
    
    // Reset center flag when actively tracking ball
    shouldReturnToCenter = false;
  } 
  // RETURN TO CENTER: After hitting ball or when ball is moving away
  else if (aiPerceptionBallSpeedX < 0) {
    // Hard difficulty AI should aggressively return to center
    const shouldCenter = Math.random() < aiReturnToMiddleSpeed;
    
    // If we should center and we're not already centered
    if (shouldCenter && distanceFromCenter > 10) {
      aiKeyState[paddleCenter > gameHeight / 2 ? 'ArrowUp' : 'ArrowDown'] = true;
    }
  }
  
  // For medium/hard difficulty, occasionally predict and move based on expected return trajectory
  if (aiPerceptionBallSpeedX < 0 && currentAIDifficulty !== 'easy') {
    const proactiveChance = currentAIDifficulty === 'hard' ? 0.7 : 0.3;
    
    if (Math.random() < proactiveChance) {
      // Try to predict where the ball might come back
      // This simulates a more experienced player anticipating the return
      const playerPaddleX = paddle1.clientWidth;
      const bounceX = Math.max(playerPaddleX, aiPerceptionBallX - Math.abs(aiPerceptionBallSpeedX) * 15);
      
      // Simple prediction of return trajectory
      let expectedReturnY = aiPerceptionBallY + (aiPerceptionBallSpeedY * 
                           (gameWidth / Math.max(1, Math.abs(aiPerceptionBallSpeedX))));
      
      // Keep within game bounds
      expectedReturnY = Math.max(0, Math.min(gameHeight - ball.clientHeight, expectedReturnY));
      
      // Move slightly toward the expected return position
      const returnDiff = (expectedReturnY + ball.clientHeight/2) - paddleCenter;
      
      // Only move if we're far from the predicted position and not already moving to center
      if (Math.abs(returnDiff) > gameHeight/4 && !aiKeyState['ArrowUp'] && !aiKeyState['ArrowDown']) {
        aiKeyState[returnDiff > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
      }
    }
  }
}

// Helper function to predict ball position with multiple bounces
function predictBallPosition(startX, startY, speedX, speedY, distanceX) {
  let currentX = startX;
  let currentY = startY;
  let currentSpeedY = speedY;
  const effectiveHeight = gameHeight - ball.clientHeight;
  
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
function moveBall(deltaTime) {
  // Store previous position for collision detection
  ballLastX = ballX;
  ballLastY = ballY;
  
  // Scale ball speed based on game area dimensions
  // This makes ball movement feel consistent regardless of screen size
  const effectiveSpeedX = ballSpeedX * scaleX * deltaTime;
  const effectiveSpeedY = ballSpeedY * scaleY * deltaTime;
  
  ballX += effectiveSpeedX;
  ballY += effectiveSpeedY;

  // Top collision: snap to top and reverse vertical velocity
  if (ballY <= 0) {
    ballY = 3;
    ballSpeedY = -ballSpeedY;
    // FIX: Add a small random horizontal adjustment to prevent infinite top bouncing
    ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(ballSpeedX);
    playSound(wallSound);
  }
  // Bottom collision: snap to bottom and reverse vertical velocity
  else if (ballY >= gameHeight - ball.clientHeight) {
    ballY = gameHeight - ball.clientHeight - 3;
    ballSpeedY = -ballSpeedY;
    // FIX: Add a small random horizontal adjustment to prevent infinite bottom bouncing
    ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(ballSpeedX);
    playSound(wallSound);
  }

  // Get the actual left paddle edge position - more accurate after resize
  const paddle1Right = paddle1.clientWidth;
  
  // IMPROVED LEFT PADDLE COLLISION DETECTION
  // Check if the ball is moving left (toward left paddle)
  if (ballSpeedX < 0) {
    // Trajectory-based collision detection for left paddle
    // This calculates if the ball crossed the paddle boundary between frames
    
    // Only check if the ball was to the right of the paddle in the last frame
    // and now is at or to the left of the paddle's right edge
    if (ballX <= paddle1Right && ballLastX > paddle1Right) {
      // Calculate the y position at the time of intersection using linear interpolation
      const ratio = (paddle1Right - ballLastX) / (ballX - ballLastX);
      const intersectY = ballLastY + ratio * (ballY - ballLastY);
      
      // Check if this y position is within the paddle's height bounds
      if (intersectY + ball.clientHeight >= paddle1Y &&
          intersectY <= paddle1Y + paddle1.clientHeight) {
        // Valid collision - set ball position to the edge of paddle
        ballX = paddle1Right;
        adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
      }
    }
    // Backup collision check for slower balls or edge cases
    // Bounding box collision detection as fallback - with extra buffer for resize issues
    else if (
      ballX <= paddle1Right + 2 && // Add small buffer for resize issues
      ballX + ball.clientWidth >= 0 && // Make sure ball isn't completely past paddle
      ballY + ball.clientHeight >= paddle1Y - 2 && // Add small buffer
      ballY <= paddle1Y + paddle1.clientHeight + 2 // Add small buffer
    ) {
      ballX = paddle1Right; // Snap to paddle edge
      adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
    }
  }

  // Get the actual right paddle position - more accurate after resize
  const rightPaddleLeft = gameWidth - paddle2.clientWidth;
  
  // IMPROVED RIGHT PADDLE COLLISION DETECTION
  // Check if the ball is moving right (toward right paddle)
  if (ballSpeedX > 0) {
    // Trajectory-based collision detection
    // Only check if the ball was to the left of the paddle in the last frame
    // and now is at or beyond the paddle's left edge
    if (ballX + ball.clientWidth >= rightPaddleLeft && ballLastX + ball.clientWidth < rightPaddleLeft) {
      // Calculate the y position at the time of intersection using linear interpolation
      const ratio = (rightPaddleLeft - (ballLastX + ball.clientWidth)) / 
                    ((ballX + ball.clientWidth) - (ballLastX + ball.clientWidth));
      const intersectY = ballLastY + ratio * (ballY - ballLastY);
      
      // Check if this y position is within the paddle's height bounds
      if (intersectY + ball.clientHeight >= paddle2Y &&
          intersectY <= paddle2Y + paddle2.clientHeight) {
        // Valid collision - set ball position to the edge of paddle
        ballX = rightPaddleLeft - ball.clientWidth;
        adjustBallDirection(paddle2Y, paddle2.clientHeight, false);
      }
    }
    // Backup collision check for slower balls or edge cases - with extra buffer for resize issues
    // Bounding box collision detection as fallback
    else if (
      ballX + ball.clientWidth >= rightPaddleLeft - 2 && // Add small buffer for resize issues
      ballX < rightPaddleLeft + paddle2.clientWidth && // Make sure ball isn't completely past paddle
      ballY + ball.clientHeight >= paddle2Y - 2 && // Add small buffer
      ballY <= paddle2Y + paddle2.clientHeight + 2 // Add small buffer
    ) {
      ballX = rightPaddleLeft - ball.clientWidth; // Snap to paddle edge
      adjustBallDirection(paddle2Y, paddle2.clientHeight, false);
    }
  }

  // Out-of-bounds (scoring conditions)
  if (ballX <= 0) {
    player2Score++;
    playSound(lossSound);
    updateScoreboard();
    
    // Check for win condition
    if (player2Score >= pointsToWin) {
      showWinScreen(player2Name);
    } else {
      resetBall();
    }
    return;
  }
  
  if (ballX >= gameWidth - ball.clientWidth) {
    player1Score++;
    playSound(lossSound);
    updateScoreboard();
    
    // Check for win condition
    if (player1Score >= pointsToWin) {
      showWinScreen(player1Name);
    } else {
      resetBall();
    }
    return;
  }

  // Update ball position on screen
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

/********************************************************************************************************
 * BALL PHYSICS HELPERS
 ********************************************************************************************************/
// Function to adjust the ball's direction and speed after it hits a paddle
function adjustBallDirection(paddleY, paddleHeight, isLeftPaddle) {
  // Calculate the vertical center of the paddle
  const paddleCenter = paddleY + paddleHeight / 2;

  // Calculate the vertical center of the ball
  const ballCenter = ballY + ball.clientHeight / 2;

  // Determine how far the ball's center is from the paddle's center
  const relativeIntersectY = ballCenter - paddleCenter;

  // Normalize the intersection value to a range of -1 to 1
  // -1 means the ball hit the top edge of the paddle
  //  0 means the ball hit the center of the paddle
  //  1 means the ball hit the bottom edge of the paddle
  const normalizedRelativeIntersectionY = relativeIntersectY / (paddleHeight / 2);

  // Define the maximum bounce angle (45 degrees or π/4 radians)
  const maxBounceAngle = Math.PI / 4;

  // Calculate the bounce angle based on where the ball hit the paddle
  const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

  // Calculate the current speed of the ball using the Pythagorean theorem
  let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);

  // Increase the ball's speed by a factor, but cap it at the maximum speed
  speed = Math.min(speed * speedIncreaseFactor, maxSpeed);

  // Adjust the ball's horizontal speed based on the paddle side and bounce angle
  // If the ball hit the left paddle, it moves to the right (positive X direction)
  // If the ball hit the right paddle, it moves to the left (negative X direction)
  ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);

  // Adjust the ball's vertical speed based on the bounce angle
  ballSpeedY = speed * Math.sin(bounceAngle);
  
  if (Math.abs(ballSpeedY) < 0.5) {
    // If vertical speed is very low, add a small random adjustment
    ballSpeedY += (Math.random() * 2 - 1) * speed * 0.1;
  }
  
  // Also add a tiny random factor to horizontal speed to vary gameplay
  ballSpeedX += (Math.random() * 2 - 1) * speed * 0.05;

  // If right paddle (AI) hit the ball, we want the AI to return to center
  if (!isLeftPaddle) {
    shouldReturnToCenter = true;
  }

  // Play a sound effect to indicate the ball hit the paddle
  playSound(paddleSound);
}

// Export key game functions and variables to global window object for SPA context
// This ensures the paddles work properly when loaded in the SPA
window.gameRunning = gameRunning;
window.gameOver = gameOver;
window.keysPressed = keysPressed;
window.startGame = startGame;
window.resetGame = resetGame;
window.applySettings = applySettings;
window.handleKeyDown = handleKeyDown;
window.handleKeyUp = handleKeyUp;
window.updatePaddle1 = updatePaddle1;
window.updatePaddle2 = updatePaddle2;
window.updateAIDecisions = updateAIDecisions; // Export AI function
window.updateGameDimensions = updateGameDimensions;
window.initializePositions = initializePositions;
window.checkWindowSize = checkWindowSize;
window.ensureElementsInBounds = ensureElementsInBounds;

// Add a function to synchronize isAIMode between window and local scope
function syncAIMode() {
  isAIMode = window.isAIMode;
  console.log('Synchronized isAIMode:', isAIMode);
}

// Set up a periodic check to ensure isAIMode stays in sync
setInterval(syncAIMode, 1000);

/********************************************************************************************************
 * GAME STATE MANAGEMENT
 ********************************************************************************************************/
// Note: pauseGame function is kept for backward compatibility but no longer used after scoring
function pauseGame() {
  gameRunning = false;
  ball.style.display = 'none';
  
  // Don't show any menu when paused in normal mode
}

// Function to toggle video background based on settings and pause/play accordingly
function toggleVideoBackground() {
  console.log('toggleVideoBackground called, currentBackground:', currentBackground);
  // Make sure we're targeting the video inside the game area
  const gameAreaVideoBackground = document.querySelector('.gameArea .video-background');
  
  if (gameAreaVideoBackground) {
    const videoElement = gameAreaVideoBackground.querySelector('video');
    
    if (currentBackground === 'video') {
      console.log('Setting video background to visible (z-index: 1)');
      // Set z-index to make video visible
      gameAreaVideoBackground.style.zIndex = '1';
      
      // Play the video when it becomes visible
      if (videoElement) {
        videoElement.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
    } else {
      console.log('Setting video background to hidden (z-index: -1000)');
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

// Export key game functions and variables to global window object for SPA context
// ... existing code ...
window.paddleSizeMultiplier = paddleSizeMultiplier;
window.currentBackground = currentBackground;
window.toggleVideoBackground = toggleVideoBackground;
window.updatePaddleSizes = updatePaddleSizes;