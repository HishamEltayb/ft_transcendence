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
// Create JS representation of the game from DOM
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

// Game Variables
let gameRunning = false;
let keysPressed = {};
let paddle1Speed = 0;
let paddle1Y = 0;
let paddle2Speed = 0;
let paddle2Y = 0;
let ballX = 0;
let ballSpeedX = 5; // Default higher speed
let ballY = 0;
let ballSpeedY = 5; // Default higher speed
let initialBallSpeed = 5; // Store initial ball speed for resets
let player1Score = 0;
let player2Score = 0;
let player1Name = "Player 1";
let player2Name = "Player 2";
let pointsToWin = 5;
let lastTime = null;
let gameOver = false;
let ballLastX = 0; // Track previous position for improved collision
let ballLastY = 0; // Track previous position for improved collision

// Game Constants
const paddleAcceleration = 1;
const paddleDeceleration = 1;
const maxPaddleSpeed = 8; // Maximum paddle speed
const speedIncreaseFactor = 1.05; // 5% speed increase per paddle hit
const maxSpeed = 15; // Prevent excessive speed

// Fixed game dimensions as per requirements
const gameWidth = 800;
const gameHeight = 600;

// Game mode and AI variables
let isAIMode = false;
let lastAIUpdateTime = 0; // Track last time AI updated its perception
let aiPerceptionBallX = 0; // What the AI "sees" (not actual ball position)
let aiPerceptionBallY = 0;
let aiPerceptionBallSpeedX = 0;
let aiPerceptionBallSpeedY = 0;
let currentAIDifficulty = 'medium'; // Default difficulty

// ********** AI DIFFICULTY PARAMETERS **********
// These values will be adjusted based on selected difficulty
let aiMistakeChance = 0.02;        // Chance of AI misperceiving the ball
let aiErrorMargin = 0.05;          // Paddle targeting precision (smaller = more accurate)
let aiReactionDelay = 150;         // How often AI updates its movement (ms) (smaller = faster reactions)
let aiReturnToMiddleSpeed = 0.15;  // How quickly AI returns to center
let aiCenteringProbability = 0.3;  // How often AI tries to center itself
let aiPredictionAccuracy = 0.9;    // How accurately AI predicts bounces (0-1)

// Preset difficulty configurations
const aiDifficultySettings = {
  easy: {
    mistakeChance: 0.15,
    errorMargin: 0.3,
    reactionDelay: 300,
    returnToMiddleSpeed: 0.05,
    centeringProbability: 0.1,
    predictionAccuracy: 0.5
  },
  medium: {
    mistakeChance: 0.05,
    errorMargin: 0.15,
    reactionDelay: 150,
    returnToMiddleSpeed: 0.15,
    centeringProbability: 0.3,
    predictionAccuracy: 0.8
  },
  hard: {
    mistakeChance: 0.01,
    errorMargin: 0.08,
    reactionDelay: 80,
    returnToMiddleSpeed: 0.25,
    centeringProbability: 0.5,
    predictionAccuracy: 0.95
  },
  unbeatable: {
    mistakeChance: 0.0,
    errorMargin: 0.02,
    reactionDelay: 30,
    returnToMiddleSpeed: 0.4,
    centeringProbability: 0.8,
    predictionAccuracy: 0.99
  }
};
// ***********************************************************************************

// AI simulated keyboard state (to mimic human keyboard input as required)
let aiKeyState = {
  'ArrowUp': false,
  'ArrowDown': false
};

// Additional AI tracking variables
let lastBallHitX = 0;           // Track where ball was last hit
let shouldReturnToCenter = false; // Flag to indicate if AI should return to center

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

// Call initializePositions on page load
window.addEventListener('load', () => {
  initializePositions();
  
  // Set default player names on initial load
  player1NameElement.textContent = "Player 1";
  player2NameElement.textContent = "Player 2";
  
  // Hide all screens, don't select any button by default
  hideAllScreens();
  clearActiveNavButtons();
});

// Get navigation elements
const playButton = document.getElementById('playButton');
const settingsButton = document.getElementById('settingsButton');
const howToPlayButton = document.getElementById('howToPlayButton');

// Get screen elements
const playScreen = document.getElementById('playScreen');
const settingsScreen = document.getElementById('settingsScreen');
const howToPlayScreen = document.getElementById('howToPlayScreen');

// Setup game mode selection buttons
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

// Game Mode buttons
pvpButton.addEventListener('click', () => {
  isAIMode = false;
  playScreen.style.display = 'none';
  startText.style.display = 'block';
//   player2Controls.textContent = 'Player 2: Up and Down';
  
  // Apply current settings
  applySettings();
  
  resetGame();
});

pveButton.addEventListener('click', () => {
  isAIMode = true;
  playScreen.style.display = 'none';
  startText.style.display = 'block';
//   player2Controls.textContent = 'AI will control Player 2';
  
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
    if (currentAIDifficulty === 'unbeatable') {
      player2Name = "MASTER AI";
    } else {
      player2Name = `AI (${currentAIDifficulty.charAt(0).toUpperCase() + currentAIDifficulty.slice(1)})`;
    }
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

// Back button from How to Play screen
backFromHowToPlayButton.addEventListener('click', () => {
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
});

// Listeners for game controls
document.addEventListener('keydown', (e) => {
  // Resume game with any key if paused but not game over
  if (!gameRunning && !gameOver && ball.style.display === 'none') {
    startGame();
  }
});
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Start the game: hide all screens, show ball, disable nav buttons, and resume game loop
function startGame() {
  if (!gameOver) {
    gameRunning = true;
    hideAllScreens(); // Hide all screens including startText
    ball.style.display = 'block';
    lastTime = null; // Reset timing
    
    // Disable navigation buttons during gameplay
    setNavButtonsEnabled(false);
    
    requestAnimationFrame(gameLoop);
  }
}

function handleKeyDown(e) {
  keysPressed[e.key] = true;
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

// Main Game Loop using requestAnimationFrame with delta time
function gameLoop(timestamp) {
  if (!gameRunning) return;
//   console.time('gameLoop');
  if (lastTime === null) {
      lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 16.67; // Normalize to 60fps baseline
    
    updatePaddle1(deltaTime);
    updatePaddle2(deltaTime);
    moveBall(deltaTime);
    
    lastTime = timestamp;
    // console.timeEnd('gameLoop');
    requestAnimationFrame(gameLoop);
}

/************************************ Update Paddles ***********************************/
function updatePaddle1(deltaTime) {
  if (keysPressed['w']) {
    paddle1Speed = Math.max(paddle1Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['s']) {
    paddle1Speed = Math.min(paddle1Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle1Speed *= 0.9; // Gradual slow down
  }
  paddle1Y += paddle1Speed * deltaTime;
  if (paddle1Y < 0) paddle1Y = 0;
  if (paddle1Y > gameHeight - paddle1.clientHeight)
    paddle1Y = gameHeight - paddle1.clientHeight;
  paddle1.style.top = paddle1Y + 'px';
}

function updatePaddle2(deltaTime) {
  if (isAIMode) {
    // Check if ball was just hit (to activate return to center behavior)
    // This detects when the ball changes direction from left to right (meaning AI just hit it)
    if (ballSpeedX < 0 && aiPerceptionBallSpeedX > 0) {
      shouldReturnToCenter = true;
      lastBallHitX = ballX; // Mark where ball was when it changed direction
    }
    
    // AI LOGIC - with configurable perception update based on difficulty
    const currentTime = Date.now();
    
    // Update AI's perception of the ball based on reaction delay (difficulty setting)
    // Performance optimization: Throttle AI calculations based on difficulty
    const aiUpdateInterval = currentAIDifficulty === 'easy' ? 50 : 
                            currentAIDifficulty === 'medium' ? 40 : 
                            currentAIDifficulty === 'hard' ? 30 : 20;
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
        aiPerceptionBallSpeedY *= -0.8 + Math.random() * 0.4; // Random error in vertical prediction
        
        // For easier difficulties, sometimes misperceive horizontal direction too
        if (currentAIDifficulty === 'easy' && Math.random() < 0.2) {
          aiPerceptionBallSpeedX *= 0.7 + Math.random() * 0.6; // Add horizontal error for easier AI
        }
      }
    }
    
    // Reset key states at the beginning of each frame
    aiKeyState['ArrowUp'] = false;
    aiKeyState['ArrowDown'] = false;
    
    // BEHAVIOR: RETURN TO CENTER after hitting the ball
    // This only activates if the shouldReturnToCenter flag is true and ball is moving away
    if (shouldReturnToCenter && aiPerceptionBallSpeedX < 0) {
      const centerPosition = gameHeight / 2 - paddle2.clientHeight / 2;
      const centerDifference = centerPosition - paddle2Y;
      
      // If we're close enough to center, stop centering
      if (Math.abs(centerDifference) < 15) {
        shouldReturnToCenter = false;
      } else {
        // Only make centering decisions with a certain probability based on difficulty
        if (Math.random() < aiReturnToMiddleSpeed) {
          if (centerDifference > 0) {
            // Need to move DOWN toward center
            aiKeyState['ArrowDown'] = true;
          } else {
            // Need to move UP toward center
            aiKeyState['ArrowUp'] = true;
          }
        }
      }
    }
    // BEHAVIOR: INTERCEPT BALL when it's coming toward the AI
    else if (aiPerceptionBallSpeedX > 0) {
      // Calculate time until ball reaches paddle (physics prediction)
      const distanceToTravel = gameWidth - paddle2.clientWidth - ball.clientWidth - aiPerceptionBallX;
      const timeToImpact = distanceToTravel / aiPerceptionBallSpeedX;
      
      // Predict where ball will be vertically, accounting for bounces
      let predictedY = aiPerceptionBallY + (aiPerceptionBallSpeedY * timeToImpact);
      
      // Advanced bounce prediction with configurable accuracy based on difficulty
      // Performance optimization: Reduce maximum bounce calculations
      const bounceCalculations = Math.min(3, Math.ceil(timeToImpact / 15)); // Reduced for better performance
      const effectiveHeight = gameHeight - ball.clientHeight;
      
      // More accurate bounce prediction (fixes ball getting stuck bug)
      for (let i = 0; i < bounceCalculations; i++) {
        if (predictedY < 0) {
          // When ball hits top, it bounces down with preserved momentum
          predictedY = Math.abs(predictedY);
        } else if (predictedY > effectiveHeight) {
          // When ball hits bottom, it bounces up with preserved momentum
          predictedY = effectiveHeight - (predictedY - effectiveHeight);
        }
        
        // If within bounds, no more bounces needed
        if (predictedY >= 0 && predictedY <= effectiveHeight) {
          break;
        }
      }
      
      // Apply AI prediction accuracy (lower for easier difficulties)
      if (Math.random() > aiPredictionAccuracy) {
        // Introduce intentional prediction error (based on difficulty)
        const errorAmount = (1 - aiPredictionAccuracy) * gameHeight * 0.3;
        predictedY += (Math.random() * 2 - 1) * errorAmount;
      }
      
      // Error margin gets larger as the ball gets further away (more human-like)
      // Harder difficulties have smaller error margins
      const distanceFactor = Math.min(1, distanceToTravel / gameWidth);
      const dynamicErrorMargin = paddle2.clientHeight * (aiErrorMargin * (0.5 + 0.5 * distanceFactor));
      
      const paddleCenter = paddle2Y + paddle2.clientHeight / 2;
      const predictedBallCenter = predictedY + ball.clientHeight / 2;
      const difference = predictedBallCenter - paddleCenter;
      
      // Reset the return to center flag when ball is coming toward AI
      shouldReturnToCenter = false;
      
      // For unbeatable difficulty, add perfect anticipation
      if (currentAIDifficulty === 'unbeatable') {
        // Perfect positioning with minimal correction
        if (Math.abs(difference) > 2) {
          if (difference > 0) {
            aiKeyState['ArrowDown'] = true;
          } else {
            aiKeyState['ArrowUp'] = true;
          }
        }
      } else {
        // Normal difficulty-based movement
        if (Math.abs(difference) > dynamicErrorMargin) {
          if (difference > 0) {
            // Ball is predicted BELOW paddle - press DOWN key
            aiKeyState['ArrowDown'] = true;
          } else {
            // Ball is predicted ABOVE paddle - press UP key
            aiKeyState['ArrowUp'] = true;
          }
        }
        // If within error margin, both keys remain released (paddle will slow down naturally)
      }
    } 
    // BEHAVIOR: IDLE CENTERING when ball is moving away and not actively returning to center
    else if (!shouldReturnToCenter) {
      const centerPosition = gameHeight / 2 - paddle2.clientHeight / 2;
      const centerDifference = centerPosition - paddle2Y;
      
      // Only make centering decisions with a configurable probability based on difficulty
      if (Math.random() < aiCenteringProbability) {
        // Occasionally move in wrong direction (adds human-like mistakes)
        // Higher chances for easier difficulties, almost never for harder ones
        const wrongDirectionChance = currentAIDifficulty === 'easy' ? 0.15 : 
                                    currentAIDifficulty === 'medium' ? 0.05 : 
                                    currentAIDifficulty === 'hard' ? 0.01 : 0;
                                    
        if (Math.random() < wrongDirectionChance) {
          if (centerDifference > 0) {
            // Should move up instead of down
            aiKeyState['ArrowUp'] = true;
          } else {
            // Should move down instead of up
            aiKeyState['ArrowDown'] = true;
          }
        } 
        // Only try to center if we're not already very close to center
        else if (Math.abs(centerDifference) > 20) {
          if (centerDifference > 0) {
            // Need to move DOWN toward center
            aiKeyState['ArrowDown'] = true;
          } else {
            // Need to move UP toward center
            aiKeyState['ArrowUp'] = true;
          }
        }
      }
    }
    
    // Apply the AI's simulated key presses to control the paddle
    // This uses the exact same code path as human player input
    if (aiKeyState['ArrowUp']) {
      // For unbeatable difficulty, faster paddle movement
      const accelerationMultiplier = currentAIDifficulty === 'unbeatable' ? 1.5 : 1;
      paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime * accelerationMultiplier, -maxPaddleSpeed);
    } else if (aiKeyState['ArrowDown']) {
      const accelerationMultiplier = currentAIDifficulty === 'unbeatable' ? 1.5 : 1;
      paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime * accelerationMultiplier, maxPaddleSpeed);
    } else {
      // Unbeatable AI has faster reactions when stopping
      const decelMultiplier = currentAIDifficulty === 'unbeatable' ? 0.8 : 0.9;
      paddle2Speed *= decelMultiplier; // Gradual slow down
    }
  } else {
    // Human player controls (unchanged)
    if (keysPressed['ArrowUp']) {
      paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
    } else if (keysPressed['ArrowDown']) {
      paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
    } else {
      paddle2Speed *= 0.9; // Gradual slow down
    }
  }
  
  paddle2Y += paddle2Speed * deltaTime;
  if (paddle2Y < 0) paddle2Y = 0;
  if (paddle2Y > gameHeight - paddle2.clientHeight)
    paddle2Y = gameHeight - paddle2.clientHeight;
  paddle2.style.top = paddle2Y + 'px';
}

/************************************ Move Ball ***********************************/
function moveBall(deltaTime) {
  // Store previous position for collision detection
  ballLastX = ballX;
  ballLastY = ballY;
  
  ballX += ballSpeedX * deltaTime;
  ballY += ballSpeedY * deltaTime;

  // Top collision: snap to top and reverse vertical velocity
  if (ballY <= 0) {
    ballY = 0;
    ballSpeedY = -ballSpeedY;
    // FIX: Add a small random horizontal adjustment to prevent infinite top bouncing
    ballSpeedX += (Math.random() * 0.4 - 0.2) * Math.sign(ballSpeedX);
    playSound(wallSound);
  }
  // Bottom collision: snap to bottom and reverse vertical velocity
  else if (ballY >= gameHeight - ball.clientHeight) {
    ballY = gameHeight - ball.clientHeight;
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
      pauseGame();
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
      pauseGame();
    }
    return;
  }

  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

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

/************************************ Helper Functions ***********************************/
// Pause the game but don't show any menu; just hide the ball
function pauseGame() {
  gameRunning = false;
  ball.style.display = 'none';
  // Don't show any menu when paused
}

function resetBall() {
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
  ballSpeedY *= 0.7;
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

// Function to display the win screen
function showWinScreen(winnerName) {
  gameRunning = false;
  gameOver = true;
  ball.style.display = 'none';
  
  winnerTextElement.textContent = `${winnerName} Wins!`;
  finalScoreElement.textContent = `${player1Score} - ${player2Score}`;
  winScreen.style.display = 'block';
  
  // Re-enable navigation buttons when game is over
  setNavButtonsEnabled(true);
}

// Event listener for the restart button
restartButton.addEventListener('click', () => {
  winScreen.style.display = 'none';
  resetGame();
  // Return to the play screen
  hideAllScreens();
  setActiveNavButton(playButton);
  playScreen.style.display = 'block';
});

