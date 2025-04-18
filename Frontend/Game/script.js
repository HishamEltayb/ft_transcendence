/******************************************************************************************************************************
 * This is a modified version of the basic Pong game that includes the following features:
 * 
 * 
 * This game has 1 vs 1 working as expected and follows the basic rules of Pong.
 * What needs to be done:
 * 1. Add a start menu that displays the controls and waits for the player to press any key to start the game.
 * 2. There is a bug where the ball get stuck on the bottom or top of the screen and keeps bouncing back and forth,
 * even though it bounced off the paddle but it keeps going back and forth in straight line. This needs to be fixed.
 * 3. Need to make it single player vs computer.
 * 4. Need to make game win condition.
 * 5. Need to add players name and details, and display them on the screen.
 * 6. Need to add player icon.
 * 7. Need to add history of the game.
******************************************************************************************************************************/

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

// Navigation Elements
const playButton = document.getElementById('playButton');
const settingsButton = document.getElementById('settingsButton');
const howToPlayButton = document.getElementById('howToPlayButton');
const playScreen = document.getElementById('playScreen');
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

/********************************************************************************************************
 * GAME STATE VARIABLES
 ********************************************************************************************************/
// Core Game Variables
let gameRunning = false;
let gameOver = false;
let keysPressed = {};
let lastTime = null;

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
const gameWidth = 800;
const gameHeight = 600;

/********************************************************************************************************
 * AI CONFIGURATION
 ********************************************************************************************************/
// AI Mode Variables
let isAIMode = false;
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
  paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
  paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
  ballX = gameWidth / 2 - ball.clientWidth / 2;
  ballY = gameHeight / 2 - ball.clientHeight / 2;

  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Window load event - initialize everything
window.addEventListener('load', () => {
  initializePositions();
  
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
  clearActiveNavButtons();
  
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
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

/********************************************************************************************************
 * UI NAVIGATION FUNCTIONS
 ********************************************************************************************************/
// Helper function to hide all screens
function hideAllScreens() {
  const screens = [playScreen, settingsScreen, howToPlayScreen, startText, winScreen];
  screens.forEach(screen => {
    if (screen) screen.style.display = 'none';
  });
}

// Helper function to set active nav button
function setActiveNavButton(activeButton) {
  clearActiveNavButtons();
  activeButton.classList.add('active');
}

// Helper function to clear all active nav buttons
function clearActiveNavButtons() {
  const navButtons = [playButton, settingsButton, howToPlayButton];
  navButtons.forEach(button => {
    button.classList.remove('active');
  });
}

// Helper function to toggle nav buttons enabled/disabled state
function setNavButtonsEnabled(enabled) {
  const navButtons = [playButton, settingsButton, howToPlayButton];
  navButtons.forEach(button => {
    button.disabled = !enabled;
    if (!enabled) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }
  });
}

/********************************************************************************************************
 * EVENT LISTENERS
 ********************************************************************************************************/
// Navigation buttons event listeners
playButton.addEventListener('click', () => {
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
});

settingsButton.addEventListener('click', () => {
  hideAllScreens();
  setActiveNavButton(settingsButton);
  settingsScreen.style.display = 'block';
});

howToPlayButton.addEventListener('click', () => {
  hideAllScreens();
  setActiveNavButton(howToPlayButton);
  howToPlayScreen.style.display = 'block';
});

// Game Mode buttons
pvpButton.addEventListener('click', () => {
  isAIMode = false;
  playScreen.style.display = 'none';
  startText.style.display = 'block';
  
  // Apply current settings
  applySettings();
  
  resetGame();
});

pveButton.addEventListener('click', () => {
  isAIMode = true;
  playScreen.style.display = 'none';
  startText.style.display = 'block';
  
  // Apply current settings
  applySettings();
  
  resetGame();
});

// Settings screen save button
saveSettingsButton.addEventListener('click', () => {
  // Save settings but don't start the game yet
  applySettings();
  
  // Go back to play screen
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
});

// Back button from How to Play screen
backFromHowToPlayButton.addEventListener('click', () => {
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
});

// Event listener for the restart button
restartButton.addEventListener('click', () => {
  winScreen.style.display = 'none';
  resetGame();
  
  // Return to the play screen
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
  
  // Reset the lastTime variable to ensure the game loop starts fresh
  lastTime = null;
});

/********************************************************************************************************
 * SETTINGS FUNCTIONS
 ********************************************************************************************************/
// Apply current settings
function applySettings() {
  pointsToWin = parseInt(winScoreSelect.value);
  initialBallSpeed = parseInt(ballSpeedSelect.value);
  ballSpeedX = Math.sign(ballSpeedX) * initialBallSpeed; // Preserve direction
  ballSpeedY = Math.sign(ballSpeedY) * initialBallSpeed; // Preserve direction
  player1Name = player1NameInput.value || "Player 1";
  player2Name = isAIMode ? "AI" : (player2NameInput.value || "Player 2");
  
  // Apply AI difficulty settings if in AI mode
  if (isAIMode && aiDifficultySelect) {
    currentAIDifficulty = aiDifficultySelect.value;
    const settings = aiDifficultySettings[currentAIDifficulty];
    
    // Apply the difficulty settings
    aiMistakeChance = settings.mistakeChance;
    aiErrorMargin = settings.errorMargin;
    aiReactionDelay = settings.reactionDelay;
    aiReturnToMiddleSpeed = settings.returnToMiddleSpeed;
    aiCenteringProbability = settings.centeringProbability;
    aiPredictionAccuracy = settings.predictionAccuracy;
    
    // Update AI name to reflect difficulty
    player2Name = `AI (${currentAIDifficulty.charAt(0).toUpperCase() + currentAIDifficulty.slice(1)})`;
  }
  
  // Update display
  player1NameElement.textContent = player1Name;
  player2NameElement.textContent = player2Name;
  
  // Toggle AI difficulty setting visibility
  const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
  if (aiDifficultyContainer) {
    aiDifficultyContainer.style.display = isAIMode ? 'block' : 'none';
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

// Reset the entire game state
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
  
  // Reset last time to ensure game loop functions properly on restart
  lastTime = null;
}

// Start the game: hide all screens, show ball, disable nav buttons, and resume game loop
function startGame() {
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
  if (keysPressed['w']) {
    paddle1Speed = Math.max(paddle1Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['s']) {
    paddle1Speed = Math.min(paddle1Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle1Speed *= 0.9; // Gradual slow down
  }
  paddle1Y += paddle1Speed * deltaTime;
  if (paddle1Y < 0) {
    paddle1Y = 0;
  }
  if (paddle1Y > gameHeight - paddle1.clientHeight) {
    paddle1Y = gameHeight - paddle1.clientHeight;
  }
  paddle1.style.top = paddle1Y + 'px';
}

function updatePaddle2(deltaTime) {
  if (isAIMode) {
    // Update AI decisions
    updateAIDecisions();
    
    // Apply the AI's simulated key presses to control the paddle
    // This ensures AI follows the same speed constraints as human players
    if (aiKeyState['ArrowUp']) {
      paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
    } else if (aiKeyState['ArrowDown']) {
      paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
    } else {
      paddle2Speed *= 0.9; // Gradual slow down
    }
  } else {
    // Human player controls
    if (keysPressed['ArrowUp']) {
      paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
    } else if (keysPressed['ArrowDown']) {
      paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
    } else {
      paddle2Speed *= 0.9; // Gradual slow down
    }
  }
  
  // Apply paddle movement with boundary constraints
  paddle2Y += paddle2Speed * deltaTime;
  if (paddle2Y < 0) paddle2Y = 0;
  if (paddle2Y > gameHeight - paddle2.clientHeight)
    paddle2Y = gameHeight - paddle2.clientHeight;
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
  
  ballX += ballSpeedX * deltaTime;
  ballY += ballSpeedY * deltaTime;

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

  // Improved collision detection for Paddle1 using line intersection
  // This handles fast balls better by checking if the ball's path intersects with paddle
  if (ballSpeedX < 0) { // Ball moving left
    const paddleRight = paddle1.clientWidth;
    
    // Check if ball crossed the paddle boundary line in this frame
    if (ballX <= paddleRight && ballLastX > paddleRight) {
      // Calculate the Y position at intersection point
      const ratio = (paddleRight - ballLastX) / (ballX - ballLastX);
      const intersectY = ballLastY + ratio * (ballY - ballLastY);
      
      // Check if this Y position is within the paddle height
      if (intersectY + ball.clientHeight >= paddle1Y && 
          intersectY <= paddle1Y + paddle1.clientHeight) {
        // Move ball to paddle edge to prevent going through
        ballX = paddle1.clientWidth;
        adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
      }
    }
    // Standard collision (for slow moving balls)
    else if (
      ballX <= paddle1.clientWidth &&
      ballY + ball.clientHeight >= paddle1Y &&
      ballY <= paddle1Y + paddle1.clientHeight
    ) {
      adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
    }
  }

  // Improved collision detection for Paddle2
  if (ballSpeedX > 0) { // Ball moving right
    const paddleLeft = gameWidth - paddle2.clientWidth - ball.clientWidth;
    
    // Check if ball crossed the paddle boundary line in this frame
    if (ballX >= paddleLeft && ballLastX < paddleLeft) {
      // Calculate the Y position at intersection point
      const ratio = (paddleLeft - ballLastX) / (ballX - ballLastX);
      const intersectY = ballLastY + ratio * (ballY - ballLastY);
      
      // Check if this Y position is within the paddle height
      if (intersectY + ball.clientHeight >= paddle2Y && 
          intersectY <= paddle2Y + paddle2.clientHeight) {
        // Move ball to paddle edge to prevent going through
        ballX = paddleLeft;
        adjustBallDirection(paddle2Y, paddle2.clientHeight, false);
      }
    }
    // Standard collision (for slow moving balls)
    else if (
      ballX >= gameWidth - paddle2.clientWidth - ball.clientWidth &&
      ballY + ball.clientHeight >= paddle2Y &&
      ballY <= paddle2Y + paddle2.clientHeight
    ) {
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

/********************************************************************************************************
 * GAME STATE MANAGEMENT
 ********************************************************************************************************/
// Note: pauseGame function is kept for backward compatibility but no longer used after scoring
function pauseGame() {
  gameRunning = false;
  ball.style.display = 'none';
  
  // Don't show any menu when paused in normal mode
}