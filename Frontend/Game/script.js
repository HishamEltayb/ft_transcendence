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

// Tournament Mode Variables
let isTournamentMode = false;
let tournamentMatchData = null;

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
let currentAIDifficulty = 'easy'; // Default difficulty

// AI Behavior Parameters
let aiMistakeChance = 0.02;        // Chance of AI misperceiving the ball
let aiErrorMargin = 0.05;          // Paddle targeting precision (smaller = more accurate)
let aiReactionDelay = 150;         // How often AI updates its movement (ms) (smaller = faster reactions)
let aiReturnToMiddleSpeed = 0.15;  // How quickly AI returns to center
let aiCenteringProbability = 0.3;  // How often AI tries to center itself
let aiPredictionAccuracy = 0.9;    // How accurately AI predicts bounces (0-1)

// AI Difficulty Presets
const aiDifficultySettings = {
  easy: {
    mistakeChance: 0.40,
    errorMargin: 0.4,
    reactionDelay: 500,
    returnToMiddleSpeed: 0.05,
    centeringProbability: 0.2,
    predictionAccuracy: 0.5
  },
  medium: {
    mistakeChance: 0.25,
    errorMargin: 0.25,
    reactionDelay: 250,
    returnToMiddleSpeed: 0.15,
    centeringProbability: 0.4,
    predictionAccuracy: 0.8
  },
  hard: {
    mistakeChance: 0.15,
    errorMargin: 0.15,
    reactionDelay: 150,
    returnToMiddleSpeed: 0.25,
    centeringProbability: 0.6,
    predictionAccuracy: 0.95
  },
};

// AI Control State
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

// Check if this game is part of a tournament
function checkTournamentMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'tournament') {
    console.log("Tournament mode detected");
    isTournamentMode = true;
    
    // Get tournament match data from localStorage
    tournamentMatchData = JSON.parse(localStorage.getItem('tournamentMatch') || '{}');
    console.log("Tournament match data:", tournamentMatchData);
    
    if (tournamentMatchData.player1 && tournamentMatchData.player2) {
      // Auto-set player names
      player1Name = tournamentMatchData.player1;
      player2Name = tournamentMatchData.player2;
      
      // Update display
      player1NameElement.textContent = player1Name;
      player2NameElement.textContent = player2Name;
      
      // Tournament settings
      pointsToWin = 5; // Default to 5 points for tournament matches
      initialBallSpeed = 5; // Default speed
      gameMode = 'pvp';
      
      console.log(`Tournament match: ${player1Name} vs ${player2Name}`);
      
      // Setup the game display for tournament
      hideAllScreens();
      setNavButtonsEnabled(false);
      initializePositions();
      
      // Show game container and start prompt
      const gameContainer = document.querySelector('.gameContainer');
      if (gameContainer) {
        gameContainer.style.display = 'flex';
      }
      
      startText.style.display = 'block';
      ball.style.display = 'none';
      
      // Hide AI container
      const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
      if (aiDifficultyContainer) {
        aiDifficultyContainer.style.display = 'none';
      }
      
      // Show the tournament return button
      const tournamentReturnBtn = document.getElementById('tournamentReturnBtn');
      if (tournamentReturnBtn) {
        tournamentReturnBtn.style.display = 'block';
        tournamentReturnBtn.addEventListener('click', returnToTournament);
      }
    }
  }
}

// Window load event - initialize everything
window.addEventListener('load', () => {
  initializePositions();
  
  // Set default player names on initial load
  player1NameElement.textContent = "Player 1";
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
  
  // Check if this is a tournament match
  checkTournamentMode();
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
  
  if (isTournamentMode) {
    // If in tournament mode, just reset the game but don't change screens
    startText.style.display = 'block';
  } else {
    // Return to the play screen
    hideAllScreens();
    setActiveNavButton(playButton);
    playScreen.style.display = 'block';
  }
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
// Start the game: hide all screens, show ball, disable nav buttons, and resume game loop
function startGame() {
  startText.style.display = 'none';
  ball.style.display = 'block';
  resetBall();
  gameRunning = true;
  gameOver = false;
  setNavButtonsEnabled(false);
  
  console.log("Game started! Ball visible, game running set to true");
  
  // If this is the first start, kick off the game loop
  if (!lastTime) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    console.log("Game loop started with requestAnimationFrame");
  }
}

// Main Game Loop using requestAnimationFrame with delta time
function gameLoop(timestamp) {
  if (!gameRunning)
    return;
  if (lastTime === null)
    lastTime = timestamp;
  const deltaTime = (timestamp - lastTime) / 16.67; // Normalize to 60fps baseline
  updatePaddle1(deltaTime);
  updatePaddle2(deltaTime);
  moveBall(deltaTime);
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
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
  
  // Reset key states at the beginning of each frame
  aiKeyState['ArrowUp'] = false;
  aiKeyState['ArrowDown'] = false;
  
  // Update AI's perception of the ball based on reaction delay
  const currentTime = Date.now();
  const aiUpdateInterval = currentAIDifficulty === 'easy' ? 50 : 
                          currentAIDifficulty === 'medium' ? 40 : 
                          currentAIDifficulty === 'hard' ? 30 : 20;
  
  // Only update perception periodically based on difficulty
  if (currentTime - lastAIUpdateTime > Math.max(aiReactionDelay, aiUpdateInterval)) {
    // Update AI's perception of the ball
    aiPerceptionBallX = ballX;
    aiPerceptionBallY = ballY;
    aiPerceptionBallSpeedX = ballSpeedX;
    aiPerceptionBallSpeedY = ballSpeedY;
    lastAIUpdateTime = currentTime;
    
    // AI makes mistakes based on difficulty
    if (Math.random() < aiMistakeChance) {
      // Intentionally misjudge ball direction or speed
      aiPerceptionBallSpeedY *= -0.8 + Math.random() * 0.4;
    }
  }
  
  // Get the center position of the paddle
  const centerPosition = gameHeight / 2 - paddle2.clientHeight / 2;
  const centerDifference = centerPosition - paddle2Y;
  
  // BEHAVIOR 1: RETURN TO CENTER after hitting the ball
  if (shouldReturnToCenter && aiPerceptionBallSpeedX < 0) {
    // If we're close enough to center, stop centering
    if (Math.abs(centerDifference) < 15) {
      shouldReturnToCenter = false;
    } 
    // Move toward center with probability based on difficulty
    else if (Math.random() < aiReturnToMiddleSpeed) {
      aiKeyState[centerDifference > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
    }
  }
  // BEHAVIOR 2: INTERCEPT BALL when it's coming toward the AI
  else if (aiPerceptionBallSpeedX > 0) {
    // Calculate time until ball reaches paddle
    const distanceToTravel = gameWidth - paddle2.clientWidth - ball.clientWidth - aiPerceptionBallX;
    const timeToImpact = distanceToTravel / aiPerceptionBallSpeedX;
    
    // Predict where ball will be vertically
    let predictedY = aiPerceptionBallY + (aiPerceptionBallSpeedY * timeToImpact);
    
    // Simple bounce prediction (limited calculations for performance)
    const bounceCalculations = Math.min(3, Math.ceil(timeToImpact / 15));
    const effectiveHeight = gameHeight - ball.clientHeight;
    
    // Predict bounces
    for (let i = 0; i < bounceCalculations; i++) {
      if (predictedY < 0) {
        predictedY = Math.abs(predictedY); // Bounce off top
      } else if (predictedY > effectiveHeight) {
        predictedY = effectiveHeight - (predictedY - effectiveHeight); // Bounce off bottom
      }
      
      // If within bounds, no more bounces needed
      if (predictedY >= 0 && predictedY <= effectiveHeight) break;
    }
    
    // Add prediction errors based on difficulty
    if (Math.random() > aiPredictionAccuracy) {
      const errorAmount = (1 - aiPredictionAccuracy) * gameHeight * 0.3;
      predictedY += (Math.random() * 2 - 1) * errorAmount;
    }
    
    // Calculate error margin (larger when ball is far away)
    const distanceFactor = Math.min(1, distanceToTravel / gameWidth);
    const dynamicErrorMargin = paddle2.clientHeight * (aiErrorMargin * (0.5 + 0.5 * distanceFactor));
    
    // Calculate difference between predicted ball position and paddle position
    const paddleCenter = paddle2Y + paddle2.clientHeight / 2;
    const predictedBallCenter = predictedY + ball.clientHeight / 2;
    const difference = predictedBallCenter - paddleCenter;
    
    // Reset the return to center flag
    shouldReturnToCenter = false;
    
    // Move paddle based on prediction
    if (Math.abs(difference) > dynamicErrorMargin) {
      aiKeyState[difference > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
    }
  }
  // BEHAVIOR 3: IDLE CENTERING when ball is moving away
  else if (!shouldReturnToCenter) {
    // Only make centering decisions with a probability based on difficulty
    if (Math.random() < aiCenteringProbability) {
      // Occasionally move in wrong direction (human-like mistakes)
      const wrongDirectionChance = 
        currentAIDifficulty === 'easy' ? 0.15 : 
        currentAIDifficulty === 'medium' ? 0.05 : 
        currentAIDifficulty === 'hard' ? 0.01 : 0;
      
      if (Math.random() < wrongDirectionChance) {
        // Move in the wrong direction
        aiKeyState[centerDifference > 0 ? 'ArrowUp' : 'ArrowDown'] = true;
      }
      // Only try to center if not already close to center
      else if (Math.abs(centerDifference) > 20) {
        aiKeyState[centerDifference > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
      }
    }
  }
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
  
  // Make sure ball is visible and game is running
  ball.style.display = 'block';
  
  // Make sure the game stays running
  gameRunning = true;
}

function updateScoreboard() {
  player1ScoreElement.textContent = player1Score;
  player2ScoreElement.textContent = player2Score;
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
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
  
  // Reset game state
  gameOver = false;
  
  // Update player names display (ensuring they're always visible)
  player1NameElement.textContent = player1Name || "Player 1";
  player2NameElement.textContent = player2Name || "Player 2";
  
  // Hide the ball until game starts
  ball.style.display = 'none';
}

/********************************************************************************************************
 * WIN CONDITION AND GAME END
 ********************************************************************************************************/
// Function to display the win screen
function showWinScreen(winnerName) {
  gameRunning = false;
  gameOver = true;
  ball.style.display = 'none';
  
  winnerTextElement.textContent = `${winnerName} Wins!`;
  finalScoreElement.textContent = `${player1Score} - ${player2Score}`;
  
  // If in tournament mode, handle tournament match completion differently
  if (isTournamentMode && tournamentMatchData) {
    // Store match result in localStorage
    localStorage.setItem('tournamentMatchResult', JSON.stringify({
      round: tournamentMatchData.round,
      matchId: tournamentMatchData.matchId,
      winner: winnerName
    }));
    
    // Show a brief win message for 2 seconds then automatically return to tournament
    winScreen.style.display = 'block';
    
    // Create a countdown display
    const countdownDiv = document.createElement('div');
    countdownDiv.style.marginTop = '15px';
    countdownDiv.style.fontSize = '14px';
    countdownDiv.textContent = 'Returning to tournament in 3...';
    winScreen.appendChild(countdownDiv);
    
    // Hide any existing buttons
    const existingButtons = winScreen.querySelectorAll('button');
    existingButtons.forEach(button => {
      button.style.display = 'none';
    });
    
    // Automatically return to tournament after countdown
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        returnToTournament();
      } else {
        countdownDiv.textContent = `Returning to tournament in ${countdown}...`;
      }
    }, 1000);
    
  } else {
    // Regular non-tournament game - show normal win screen with buttons
    winScreen.style.display = 'block';
    
    // Re-enable navigation buttons when game is over
    setNavButtonsEnabled(true);
  }
}

// Function to return to tournament after a match
function returnToTournament() {
  // If a match was completed and we have a winner, save the result
  if (gameOver && tournamentMatchData) {
    // Determine winner name
    const winnerName = player1Score > player2Score ? player1Name : player2Name;
    
    // Store match result in localStorage
    localStorage.setItem('tournamentMatchResult', JSON.stringify({
      round: tournamentMatchData.round,
      matchId: tournamentMatchData.matchId,
      winner: winnerName
    }));
  }
  
  // Navigate back to tournament page with result parameter
  window.location.href = '../Tournament/tournament.html?result=completed';
}