/********************************************************************************************************
 * DOM ELEMENTS AND GAME VARIABLES
 ********************************************************************************************************/
// DOM Elements
const startText = document.getElementById('startText');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const paddle3 = document.getElementById('paddle3');
const paddle4 = document.getElementById('paddle4');
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
const multiplayerButton = document.getElementById('multiplayerButton');
const player2Controls = document.getElementById('player2Controls');
const winScoreSelect = document.getElementById('winScore');
const ballSpeedSelect = document.getElementById('ballSpeedSelect');
const aiDifficultySelect = document.getElementById('aiDifficultySelect');
const player1NameInput = document.getElementById('player1NameInput');
const player2NameInput = document.getElementById('player2NameInput');
const team1NameInput = document.getElementById('team1NameInput');
const team2NameInput = document.getElementById('team2NameInput');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const backFromHowToPlayButton = document.getElementById('backFromHowToPlayButton');

// Add new global variables for the new settings
let currentBackground = 'classic'; // Default background
let paddleSizeMultiplier = 1; // Default paddle size multiplier

// Multiplayer variables
let isMultiplayerMode = false;
let lastPaddleHit = null; // Track which paddle last hit the ball
let team1Name = "Left Team";
let team2Name = "Right Team";
let team1Score = 0;
let team2Score = 0;

// DOM Elements - add new elements
const paddleSizeSelect = document.getElementById('paddleSize');
const backgroundSelect = document.getElementById('backgroundSelect');
const videoBackground = document.querySelector('.gameArea .video-background');
const teamNameSettings = document.querySelectorAll('.setting-team');

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
let paddle3Speed = 0;
let paddle3Y = 0;
let paddle4Speed = 0;
let paddle4Y = 0;

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

// Add a variable to track if a collision has happened in the current frame
let collisionProcessedThisFrame = false;

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
    paddle3Y = Math.min(gameHeight - paddle3.clientHeight, paddle3Y * heightRatio);
    paddle4Y = Math.min(gameHeight - paddle4.clientHeight, paddle4Y * heightRatio);
    
    // Scale ball position
    ballX = Math.min(gameWidth - ball.clientWidth, ballX * widthRatio);
    ballY = Math.min(gameHeight - ball.clientHeight, ballY * heightRatio);
    
    // Apply the new positions
    paddle1.style.top = paddle1Y + 'px';
    paddle2.style.top = paddle2Y + 'px';
    paddle3.style.top = paddle3Y + 'px';
    paddle4.style.top = paddle4Y + 'px';
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
  
  // Position paddles at the correct heights
  if (isMultiplayerMode) {
    // Position paddles in their respective quarters
    paddle1Y = gameHeight * 0.25 - paddle1.clientHeight / 2;
    paddle2Y = gameHeight * 0.25 - paddle2.clientHeight / 2;
    paddle3Y = gameHeight * 0.75 - paddle3.clientHeight / 2;
    paddle4Y = gameHeight * 0.75 - paddle4.clientHeight / 2;
    
    // Show multiplayer paddles
    paddle3.style.display = 'block';
    paddle4.style.display = 'block';
    
    // Initialize paddle states: paddle1 and paddle2 active, paddle3 and paddle4 disabled
    paddle1.classList.remove('paddle-disabled');
    paddle2.classList.remove('paddle-disabled');
    paddle3.classList.add('paddle-disabled');
    paddle4.classList.add('paddle-disabled');
    
    // Set lastPaddleHit for proper initialization
    lastPaddleHit = {
      leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
      rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
    };
  } else {
    // Standard 2-player positioning
    paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
    paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
    
    // Hide multiplayer paddles in normal mode
    paddle3.style.display = 'none';
    paddle4.style.display = 'none';
  }
  
  // Set the paddle width based on the game area width (responsive)
  const paddleWidth = Math.max(Math.round(0.01 * gameWidth), 6); // at least 6px wide
  paddle1.style.width = paddleWidth + 'px';
  paddle2.style.width = paddleWidth + 'px';
  paddle3.style.width = paddleWidth + 'px';
  paddle4.style.width = paddleWidth + 'px';
  
  // Apply the paddle height based on size multiplier (as percentage)
  const paddleHeight = 15 * paddleSizeMultiplier + '%'; // 15% is the base height
  paddle1.style.height = paddleHeight;
  paddle2.style.height = paddleHeight;
  paddle3.style.height = paddleHeight;
  paddle4.style.height = paddleHeight;
  
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
  paddle3.style.left = '0px'; // Ensure paddle3 is at left edge
  paddle4.style.right = '0px'; // Ensure paddle4 is at right edge
  
  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';
  
  if (isMultiplayerMode) {
    paddle3.style.top = paddle3Y + 'px';
    paddle4.style.top = paddle4Y + 'px';
  }
  
  // Reset speeds to ensure consistent gameplay
  paddle1Speed = 0;
  paddle2Speed = 0;
  paddle3Speed = 0;
  paddle4Speed = 0;
  
  // Ensure the appropriate elements are visible
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
  if (paddle3Y < 0) paddle3Y = 0;
  if (paddle4Y < 0) paddle4Y = 0;
  
  const maxPaddle1Y = gameHeight - paddle1.clientHeight;
  const maxPaddle2Y = gameHeight - paddle2.clientHeight;
  const maxPaddle3Y = gameHeight - paddle3.clientHeight;
  const maxPaddle4Y = gameHeight - paddle4.clientHeight;
  
  if (paddle1Y > maxPaddle1Y) paddle1Y = maxPaddle1Y;
  if (paddle2Y > maxPaddle2Y) paddle2Y = maxPaddle2Y;
  if (paddle3Y > maxPaddle3Y) paddle3Y = maxPaddle3Y;
  if (paddle4Y > maxPaddle4Y) paddle4Y = maxPaddle4Y;
  
  // Apply corrected positions
  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';
  paddle3.style.top = paddle3Y + 'px';
  paddle4.style.top = paddle4Y + 'px';
  
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
  isMultiplayerMode = false;
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
  isMultiplayerMode = false;
  console.log('AI mode selected, isAIMode set to:', isAIMode);
  hideAllScreens();
  
  // Apply current settings
  applySettings();
  
  // Reset and start the game immediately
  resetGame();
  startGame();
});

// Add event listener for multiplayer button
multiplayerButton.addEventListener('click', () => {
  console.log('Multiplayer button clicked');
  window.isAIMode = false;
  isAIMode = false; // Set both local and global
  isMultiplayerMode = true;
  console.log('Multiplayer mode selected, isMultiplayerMode set to:', isMultiplayerMode);
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
  
  // Handle team names for multiplayer mode
  if (isMultiplayerMode) {
    team1Name = team1NameInput.value || "Left Team";
    team2Name = team2NameInput.value || "Right Team";
    
    // Update player names to reflect teams in multiplayer
    player1NameElement.textContent = team1Name;
    player2NameElement.textContent = team2Name;
    
    // Show team name settings
    teamNameSettings.forEach(setting => {
      setting.style.display = 'block';
    });
  } else {
    // Hide team name settings in regular modes
    teamNameSettings.forEach(setting => {
      setting.style.display = 'none';
    });
    
    // Regular player names display
    player1NameElement.textContent = player1Name;
    player2NameElement.textContent = player2Name;
  }
  
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
  updateScoreboard();
  
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
  if (paddle1 && paddle2 && paddle3 && paddle4) {
    paddle1.style.height = newHeightPercentage + '%';
    paddle2.style.height = newHeightPercentage + '%';
    paddle3.style.height = newHeightPercentage + '%';
    paddle4.style.height = newHeightPercentage + '%';
    
    // Reposition paddles to center them vertically
    resetPaddlePositions();
  }
}

// Function to reset paddle positions (used after size change)
function resetPaddlePositions() {
  if (paddle1 && paddle2 && paddle3 && paddle4) {
    // Calculate positions to center paddles vertically
    paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
    paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
    paddle3Y = gameHeight / 2 - paddle3.clientHeight / 2;
    paddle4Y = gameHeight / 2 - paddle4.clientHeight / 2;
    
    // Apply positions
    paddle1.style.top = paddle1Y + 'px';
    paddle2.style.top = paddle2Y + 'px';
    paddle3.style.top = paddle3Y + 'px';
    paddle4.style.top = paddle4Y + 'px';
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
  updatePaddle3(deltaTime);
  updatePaddle4(deltaTime);
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
  if (isMultiplayerMode) {
    player1ScoreElement.textContent = team1Score;
    player2ScoreElement.textContent = team2Score;
  } else {
    player1ScoreElement.textContent = player1Score;
    player2ScoreElement.textContent = player2Score;
  }
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
  team1Score = 0;
  team2Score = 0;
  updateScoreboard();
  
  // Reset paddles and ball
  initializePositions();
  
  // Reset speeds
  paddle1Speed = 0;
  paddle2Speed = 0;
  paddle3Speed = 0;
  paddle4Speed = 0;
  ballSpeedX = initialBallSpeed;
  ballSpeedY = initialBallSpeed * 0.5;
  
  // Reset game state
  gameRunning = false;
  gameOver = false;
  collisionProcessedThisFrame = false;
  
  // In multiplayer mode, set initial paddle states
  if (isMultiplayerMode) {
    // Initialize the lastPaddleHit tracker
    lastPaddleHit = {
      leftSide: 'paddle3',  // Paddle3 is initially "last hit" so paddle1 is active
      rightSide: 'paddle4'  // Paddle4 is initially "last hit" so paddle2 is active
    };
    
    // Apply visual states
    resetPaddleVisuals();
  } else {
    lastPaddleHit = null;
  }
  
  // Update player names display (ensuring they're always visible)
  if (isMultiplayerMode) {
    player1NameElement.textContent = team1Name || "Left Team";
    player2NameElement.textContent = team2Name || "Right Team";
  } else {
    player1NameElement.textContent = player1Name || "Player 1";
    player2NameElement.textContent = player2Name || "Player 2";
  }
  
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
  
  if (isMultiplayerMode) {
    finalScoreElement.textContent = `${team1Score} - ${team2Score}`;
  } else {
    finalScoreElement.textContent = `${player1Score} - ${player2Score}`;
  }
  
  // Show normal win screen with buttons
  winScreen.style.display = 'block';
  
  // Re-enable navigation buttons when game is over
  setNavButtonsEnabled(true);
}

/********************************************************************************************************
 * PADDLE MOVEMENT FUNCTIONS
 ********************************************************************************************************/
function updatePaddle1(deltaTime) {
  // Only control if not disabled in multiplayer mode
  const isDisabled = isMultiplayerMode && lastPaddleHit === 'paddle1';
  
  if (!isDisabled) {
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
  } else {
    // Slowly decelerate if disabled
    if (paddle1Speed > 0) paddle1Speed = Math.max(0, paddle1Speed - paddleDeceleration);
    if (paddle1Speed < 0) paddle1Speed = Math.min(0, paddle1Speed + paddleDeceleration);
  }
  
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
  // Handle AI mode separately
  if (isAIMode) {
    // Use existing AI logic
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
    // Check if paddle is disabled in multiplayer mode
    const isDisabled = isMultiplayerMode && lastPaddleHit === 'paddle2';
    
    if (!isDisabled) {
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
    } else {
      // Slowly decelerate if disabled
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

// Function to handle paddle3 movement (Player 3, left side, E/D keys)
function updatePaddle3(deltaTime) {
  if (!isMultiplayerMode) return; // Only active in multiplayer mode
  
  // Only control if not disabled in multiplayer mode
  const isDisabled = lastPaddleHit === 'paddle3';
  
  if (!isDisabled) {
    // Player 3 controls (E/D keys)
    if (keysPressed['e'] || keysPressed['E']) {
      paddle3Speed -= paddleAcceleration;
    } else if (keysPressed['d'] || keysPressed['D']) {
      paddle3Speed += paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
      if (paddle3Speed > 0) paddle3Speed = Math.max(0, paddle3Speed - paddleDeceleration);
      if (paddle3Speed < 0) paddle3Speed = Math.min(0, paddle3Speed + paddleDeceleration);
    }

    // Clamp paddle speed to maximum
    paddle3Speed = Math.max(-maxPaddleSpeed, Math.min(maxPaddleSpeed, paddle3Speed));
  } else {
    // Slowly decelerate if disabled
    if (paddle3Speed > 0) paddle3Speed = Math.max(0, paddle3Speed - paddleDeceleration);
    if (paddle3Speed < 0) paddle3Speed = Math.min(0, paddle3Speed + paddleDeceleration);
  }
  
  // Scale paddle speed based on game area height
  const effectiveSpeed = paddle3Speed * scaleY * deltaTime;
  
  // Update position
  paddle3Y += effectiveSpeed;
  
  // Boundary checks
  if (paddle3Y < 0) {
    paddle3Y = 0;
    paddle3Speed = 0;
  }
  if (paddle3Y > gameHeight - paddle3.clientHeight) {
    paddle3Y = gameHeight - paddle3.clientHeight;
    paddle3Speed = 0;
  }
  
  paddle3.style.top = paddle3Y + 'px';
}

// Function to handle paddle4 movement (Player 4, right side, I/K keys)
function updatePaddle4(deltaTime) {
  if (!isMultiplayerMode) return; // Only active in multiplayer mode
  
  // Only control if not disabled in multiplayer mode
  const isDisabled = lastPaddleHit === 'paddle4';
  
  if (!isDisabled) {
    // Player 4 controls (I/K keys)
    if (keysPressed['i'] || keysPressed['I']) {
      paddle4Speed -= paddleAcceleration;
    } else if (keysPressed['k'] || keysPressed['K']) {
      paddle4Speed += paddleAcceleration;
    } else {
      // Apply deceleration when no keys are pressed
      if (paddle4Speed > 0) paddle4Speed = Math.max(0, paddle4Speed - paddleDeceleration);
      if (paddle4Speed < 0) paddle4Speed = Math.min(0, paddle4Speed + paddleDeceleration);
    }

    // Clamp paddle speed to maximum
    paddle4Speed = Math.max(-maxPaddleSpeed, Math.min(maxPaddleSpeed, paddle4Speed));
  } else {
    // Slowly decelerate if disabled
    if (paddle4Speed > 0) paddle4Speed = Math.max(0, paddle4Speed - paddleDeceleration);
    if (paddle4Speed < 0) paddle4Speed = Math.min(0, paddle4Speed + paddleDeceleration);
  }
  
  // Scale paddle speed based on game area height
  const effectiveSpeed = paddle4Speed * scaleY * deltaTime;
  
  // Update position
  paddle4Y += effectiveSpeed;
  
  // Boundary checks
  if (paddle4Y < 0) {
    paddle4Y = 0;
    paddle4Speed = 0;
  }
  if (paddle4Y > gameHeight - paddle4.clientHeight) {
    paddle4Y = gameHeight - paddle4.clientHeight;
    paddle4Speed = 0;
  }
  
  paddle4.style.top = paddle4Y + 'px';
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

  // Reset collision flag at the start of each frame
  collisionProcessedThisFrame = false;

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
  
  // Left paddles collision detection (paddle1 and paddle3)
  // First, check if the ball is moving left (toward left paddles)
  if (ballSpeedX < 0) {
    // Check for active paddle first, then disabled paddle
    if (isMultiplayerMode) {
      // Determine which paddle is active and which is disabled
      const activePaddle = lastPaddleHit.leftSide === 'paddle3' ? paddle1 : paddle3;
      const activePaddleY = lastPaddleHit.leftSide === 'paddle3' ? paddle1Y : paddle3Y;
      const activePaddleId = lastPaddleHit.leftSide === 'paddle3' ? 'paddle1' : 'paddle3';
      
      const disabledPaddle = lastPaddleHit.leftSide === 'paddle3' ? paddle3 : paddle1;
      const disabledPaddleY = lastPaddleHit.leftSide === 'paddle3' ? paddle3Y : paddle1Y;
      const disabledPaddleId = lastPaddleHit.leftSide === 'paddle3' ? 'paddle3' : 'paddle1';
      
      // Check active paddle first
      checkLeftPaddleCollision(activePaddle, activePaddleY, paddle1Right, activePaddleId);
      
      // Only check disabled paddle if no collision has been processed yet
      if (!collisionProcessedThisFrame) {
        checkLeftPaddleCollision(disabledPaddle, disabledPaddleY, paddle1Right, disabledPaddleId);
      }
    } else {
      // Standard single player mode
      checkLeftPaddleCollision(paddle1, paddle1Y, paddle1Right, 'paddle1');
    }
  }

  // Get the actual right paddle position - more accurate after resize
  const rightPaddleLeft = gameWidth - paddle2.clientWidth;
  
  // Right paddles collision detection (paddle2 and paddle4)
  // Check if the ball is moving right (toward right paddles)
  if (ballSpeedX > 0) {
    // Check for active paddle first, then disabled paddle
    if (isMultiplayerMode) {
      // Determine which paddle is active and which is disabled
      const activePaddle = lastPaddleHit.rightSide === 'paddle4' ? paddle2 : paddle4;
      const activePaddleY = lastPaddleHit.rightSide === 'paddle4' ? paddle2Y : paddle4Y;
      const activePaddleId = lastPaddleHit.rightSide === 'paddle4' ? 'paddle2' : 'paddle4';
      
      const disabledPaddle = lastPaddleHit.rightSide === 'paddle4' ? paddle4 : paddle2;
      const disabledPaddleY = lastPaddleHit.rightSide === 'paddle4' ? paddle4Y : paddle2Y;
      const disabledPaddleId = lastPaddleHit.rightSide === 'paddle4' ? 'paddle4' : 'paddle2';
      
      // Check active paddle first
      checkRightPaddleCollision(activePaddle, activePaddleY, rightPaddleLeft, activePaddleId);
      
      // Only check disabled paddle if no collision has been processed yet
      if (!collisionProcessedThisFrame) {
        checkRightPaddleCollision(disabledPaddle, disabledPaddleY, rightPaddleLeft, disabledPaddleId);
      }
    } else {
      // Standard single player mode
      checkRightPaddleCollision(paddle2, paddle2Y, rightPaddleLeft, 'paddle2');
    }
  }

  // Out-of-bounds (scoring conditions)
  if (ballX <= 0) {
    if (isMultiplayerMode) {
      team2Score++;
    } else {
      player2Score++;
    }
    playSound(lossSound);
    updateScoreboard();
    
    // Check for win condition
    if ((isMultiplayerMode && team2Score >= pointsToWin) || 
        (!isMultiplayerMode && player2Score >= pointsToWin)) {
      if (isMultiplayerMode) {
        showWinScreen(team2Name);
      } else {
        showWinScreen(player2Name);
      }
    } else {
      resetBall();
    }
    return;
  }
  
  if (ballX >= gameWidth - ball.clientWidth) {
    if (isMultiplayerMode) {
      team1Score++;
    } else {
      player1Score++;
    }
    playSound(lossSound);
    updateScoreboard();
    
    // Check for win condition
    if ((isMultiplayerMode && team1Score >= pointsToWin) || 
        (!isMultiplayerMode && player1Score >= pointsToWin)) {
      if (isMultiplayerMode) {
        showWinScreen(team1Name);
      } else {
        showWinScreen(player1Name);
      }
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
function adjustBallDirection(paddleY, paddleHeight, isLeftPaddle, paddleId = null) {
  // Calculate the vertical center of the paddle
  const paddleCenter = paddleY + paddleHeight / 2;

  // Calculate the vertical center of the ball
  const ballCenter = ballY + ball.clientHeight / 2;

  // Determine how far the ball's center is from the paddle's center
  const relativeIntersectY = ballCenter - paddleCenter;

  // Normalize the intersection value to a range of -1 to 1
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
  ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);

  // Adjust the ball's vertical speed based on the bounce angle
  ballSpeedY = speed * Math.sin(bounceAngle);
  
  if (Math.abs(ballSpeedY) < 0.5) {
    // If vertical speed is very low, add a small random adjustment
    ballSpeedY += (Math.random() * 2 - 1) * speed * 0.1;
  }
  
  // Also add a tiny random factor to horizontal speed to vary gameplay
  ballSpeedX += (Math.random() * 2 - 1) * speed * 0.05;

  // If in multiplayer mode, handle tag-team mechanics
  if (isMultiplayerMode && paddleId) {
    console.log(`${paddleId} hit the ball`);
    
    // Update the last paddle hit for the appropriate side
    if (paddleId === 'paddle1' || paddleId === 'paddle3') {
      // Left side paddle hit
      lastPaddleHit.leftSide = paddleId;
    } else if (paddleId === 'paddle2' || paddleId === 'paddle4') {
      // Right side paddle hit
      lastPaddleHit.rightSide = paddleId;
    }
    
    // Apply visual cue to show which paddle is disabled
    resetPaddleVisuals();
  }

  // Play a sound effect to indicate the ball hit the paddle
  playSound(paddleSound);
}

// Function to reset paddle visuals (update disabled state)
function resetPaddleVisuals() {
  // Check if we're in multiplayer mode
  if (!isMultiplayerMode) return;
  
  // Reset visual appearance of all paddles
  paddle1.classList.remove('paddle-disabled');
  paddle2.classList.remove('paddle-disabled');
  paddle3.classList.remove('paddle-disabled');
  paddle4.classList.remove('paddle-disabled');
  
  // Apply disabled visual based on lastPaddleHit
  // For left side
  if (lastPaddleHit.leftSide === 'paddle1') {
    paddle1.classList.add('paddle-disabled');
  } else if (lastPaddleHit.leftSide === 'paddle3') {
    paddle3.classList.add('paddle-disabled');
  }
  
  // For right side
  if (lastPaddleHit.rightSide === 'paddle2') {
    paddle2.classList.add('paddle-disabled');
  } else if (lastPaddleHit.rightSide === 'paddle4') {
    paddle4.classList.add('paddle-disabled');
  }
}

// Helper function to check collision with left paddles
function checkLeftPaddleCollision(paddle, paddleY, paddleRight, paddleId) {
  // Skip collision check if we've already processed a collision this frame
  if (collisionProcessedThisFrame) return false;
  
  // Skip collision check for disabled paddles in multiplayer mode
  if (isMultiplayerMode) {
    // For left side (paddle1 and paddle3)
    // Skip if this paddle matches the last hit paddle for the left side
    if (paddleId === lastPaddleHit.leftSide) {
      return false;
    }
  }
  
  // Trajectory-based collision detection for left paddle
  // Only check if the ball was to the right of the paddle in the last frame
  // and now is at or to the left of the paddle's right edge
  if (ballX <= paddleRight && ballLastX > paddleRight) {
    // Calculate the y position at the time of intersection using linear interpolation
    const ratio = (paddleRight - ballLastX) / (ballX - ballLastX);
    const intersectY = ballLastY + ratio * (ballY - ballLastY);
    
    // Check if this y position is within the paddle's height bounds
    if (intersectY + ball.clientHeight >= paddleY &&
        intersectY <= paddleY + paddle.clientHeight) {
      // Valid collision - set ball position to the edge of paddle
      ballX = paddleRight;
      adjustBallDirection(paddleY, paddle.clientHeight, true, paddleId);
      collisionProcessedThisFrame = true;
      return true;
    }
  }
  // Backup collision check for slower balls or edge cases
  else if (
    ballX <= paddleRight + 2 && // Add small buffer for resize issues
    ballX + ball.clientWidth >= 0 && // Make sure ball isn't completely past paddle
    ballY + ball.clientHeight >= paddleY - 2 && // Add small buffer
    ballY <= paddleY + paddle.clientHeight + 2 // Add small buffer
  ) {
    ballX = paddleRight; // Snap to paddle edge
    adjustBallDirection(paddleY, paddle.clientHeight, true, paddleId);
    collisionProcessedThisFrame = true;
    return true;
  }
  
  return false;
}

// Helper function to check collision with right paddles
function checkRightPaddleCollision(paddle, paddleY, paddleLeft, paddleId) {
  // Skip collision check if we've already processed a collision this frame
  if (collisionProcessedThisFrame) return false;
  
  // Skip collision check for disabled paddles in multiplayer mode
  if (isMultiplayerMode) {
    // For right side (paddle2, paddle4)
    // Skip if this paddle matches the last hit paddle for the right side
    if (paddleId === lastPaddleHit.rightSide) {
      return false;
    }
  }
  
  // Trajectory-based collision detection
  // Only check if the ball was to the left of the paddle in the last frame
  // and now is at or beyond the paddle's left edge
  if (ballX + ball.clientWidth >= paddleLeft && ballLastX + ball.clientWidth < paddleLeft) {
    // Calculate the y position at the time of intersection using linear interpolation
    const ratio = (paddleLeft - (ballLastX + ball.clientWidth)) / 
                 ((ballX + ball.clientWidth) - (ballLastX + ball.clientWidth));
    const intersectY = ballLastY + ratio * (ballY - ballLastY);
    
    // Check if this y position is within the paddle's height bounds
    if (intersectY + ball.clientHeight >= paddleY &&
        intersectY <= paddleY + paddle.clientHeight) {
      // Valid collision - set ball position to the edge of paddle
      ballX = paddleLeft - ball.clientWidth;
      adjustBallDirection(paddleY, paddle.clientHeight, false, paddleId);
      collisionProcessedThisFrame = true;
      return true;
    }
  }
  // Backup collision check for slower balls or edge cases
  else if (
    ballX + ball.clientWidth >= paddleLeft - 2 && // Add small buffer for resize issues
    ballX < paddleLeft + paddle.clientWidth && // Make sure ball isn't completely past paddle
    ballY + ball.clientHeight >= paddleY - 2 && // Add small buffer
    ballY <= paddleY + paddle.clientHeight + 2 // Add small buffer
  ) {
    ballX = paddleLeft - ball.clientWidth; // Snap to paddle edge
    adjustBallDirection(paddleY, paddle.clientHeight, false, paddleId);
    collisionProcessedThisFrame = true;
    return true;
  }
  
  return false;
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
window.updatePaddle3 = updatePaddle3;
window.updatePaddle4 = updatePaddle4;
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