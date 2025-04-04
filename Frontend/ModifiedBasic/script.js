/******************************************************************************************************************************
 * Multiplayer Pong Game with Name Labels Outside the Game Area
 ******************************************************************************************************************************/

// Get DOM elements
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const playerCountSelect = document.getElementById('playerCount');

const player1NameInput = document.getElementById('player1Name');
const player2NameInput = document.getElementById('player2Name');
const player3NameContainer = document.getElementById('player3NameContainer');
const player4NameContainer = document.getElementById('player4NameContainer');
const player3NameInput = document.getElementById('player3Name');
const player4NameInput = document.getElementById('player4Name');

const gameContainer = document.getElementById('gameContainer');
const gameArea = document.getElementById('gameArea');

const leftLabel = document.getElementById('leftLabel');
const rightLabel = document.getElementById('rightLabel');
const topLabel = document.getElementById('topLabel');
const bottomLabel = document.getElementById('bottomLabel');

const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const paddle3 = document.getElementById('paddle3'); // bottom paddle
const paddle4 = document.getElementById('paddle4'); // top paddle
const ball = document.getElementById('ball');

const paddleSound = document.getElementById('paddleSound');
const wallSound = document.getElementById('wallSound');
const lossSound = document.getElementById('lossSound');

// Game Variables
let gameRunning = false;
let keysPressed = {};
let lastTime = null;
let lastPaddleTouched = null;

let gameMode = 2; // will be 2, 3, or 4
let playerNames = {
  paddle1: '',
  paddle2: '',
  paddle3: '',
  paddle4: ''
};

let scores = {
  paddle1: 0,
  paddle2: 0,
  paddle3: 0,
  paddle4: 0
};

// Paddle positions and speeds (vertical paddles use Y; horizontal use X)
let paddle1Y = 0, paddle2Y = 0;
let paddle3X = 0, paddle4X = 0;
let paddle1Speed = 0, paddle2Speed = 0;
let paddle3Speed = 0, paddle4Speed = 0;

// Ball variables (using top-left coordinates)
let ballX = 0, ballY = 0;
let ballSpeedX = 4, ballSpeedY = 4;

// Game area dimensions (set from gameArea element)
let gameHeight = gameArea.clientHeight;
let gameWidth = gameArea.clientWidth;

// Constants
const paddleAcceleration = 1;
const maxPaddleSpeed = 8;
const speedIncreaseFactor = 1.1;
const maxSpeed = 8;

// Show/hide extra name inputs based on player count selection
playerCountSelect.addEventListener('change', () => {
  const count = parseInt(playerCountSelect.value);
  if (count >= 3) {
    player3NameContainer.style.display = 'block';
    bottomLabel.style.display = 'block';
    paddle3.style.display = 'block';
  } else {
    player3NameContainer.style.display = 'none';
    bottomLabel.style.display = 'none';
    paddle3.style.display = 'none';
  }
  if (count === 4) {
    player4NameContainer.style.display = 'block';
    topLabel.style.display = 'block';
    paddle4.style.display = 'block';
  } else {
    player4NameContainer.style.display = 'none';
    topLabel.style.display = 'none';
    paddle4.style.display = 'none';
  }
});

// Start the game when Start button is clicked
startButton.addEventListener('click', () => {
  gameMode = parseInt(playerCountSelect.value);
  // Save player names
  playerNames.paddle1 = player1NameInput.value || 'Player 1';
  playerNames.paddle2 = player2NameInput.value || 'Player 2';
  if (gameMode >= 3) {
    playerNames.paddle3 = player3NameInput.value || 'Player 3';
  }
  if (gameMode === 4) {
    playerNames.paddle4 = player4NameInput.value || 'Player 4';
  }
  // Set labels next to the game area
  leftLabel.textContent = playerNames.paddle1;
  rightLabel.textContent = playerNames.paddle2;
  if (gameMode >= 3) {
    bottomLabel.textContent = playerNames.paddle3;
  }
  if (gameMode === 4) {
    topLabel.textContent = playerNames.paddle4;
  }
  
  startScreen.style.display = 'none';
  initializePositions();
  lastTime = null;
  gameRunning = true;
  requestAnimationFrame(gameLoop);
});

// Initialize positions for ball and paddles within gameArea
function initializePositions() {
  gameHeight = gameArea.clientHeight;
  gameWidth = gameArea.clientWidth;

  // Vertical paddles: center vertically
  paddle1Y = gameHeight / 2 - paddle1.clientHeight / 2;
  paddle2Y = gameHeight / 2 - paddle2.clientHeight / 2;
  paddle1.style.top = paddle1Y + 'px';
  paddle2.style.top = paddle2Y + 'px';

  // Horizontal paddles if enabled
  if (gameMode >= 3) {
    // Bottom paddle: centered horizontally at bottom
    paddle3X = gameWidth / 2 - paddle3.clientWidth / 2;
    paddle3.style.left = paddle3X + 'px';
    paddle3.style.top = (gameHeight - paddle3.clientHeight) + 'px';
  }
  if (gameMode === 4) {
    // Top paddle: centered horizontally at top
    paddle4X = gameWidth / 2 - paddle4.clientWidth / 2;
    paddle4.style.left = paddle4X + 'px';
    paddle4.style.top = '0px';
  }
  // Ball starts at center
  ballX = gameWidth / 2 - ball.clientWidth / 2;
  ballY = gameHeight / 2 - ball.clientHeight / 2;
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Listen for key presses (for paddle movement)
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
function handleKeyDown(e) {
  keysPressed[e.key] = true;
}
function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

// Main game loop using requestAnimationFrame
function gameLoop(timestamp) {
  if (!gameRunning) return;
  if (lastTime === null) lastTime = timestamp;
  const deltaTime = (timestamp - lastTime) / 16.67; // normalized to 60fps

  updatePaddle1(deltaTime);
  updatePaddle2(deltaTime);
  if (gameMode >= 3) updatePaddle3(deltaTime);
  if (gameMode === 4) updatePaddle4(deltaTime);
  moveBall(deltaTime);

  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

/************************************ Paddle Updates ***********************************/
// Left paddle (vertical; controlled by W/S)
function updatePaddle1(deltaTime) {
  if (keysPressed['w']) {
    paddle1Speed = Math.max(paddle1Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['s']) {
    paddle1Speed = Math.min(paddle1Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle1Speed *= 0.9;
  }
  paddle1Y += paddle1Speed * deltaTime;
  if (paddle1Y < 0) paddle1Y = 0;
  if (paddle1Y > gameHeight - paddle1.clientHeight) paddle1Y = gameHeight - paddle1.clientHeight;
  paddle1.style.top = paddle1Y + 'px';
}

// Right paddle (vertical; controlled by ArrowUp/ArrowDown)
function updatePaddle2(deltaTime) {
  if (keysPressed['ArrowUp']) {
    paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['ArrowDown']) {
    paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle2Speed *= 0.9;
  }
  paddle2Y += paddle2Speed * deltaTime;
  if (paddle2Y < 0) paddle2Y = 0;
  if (paddle2Y > gameHeight - paddle2.clientHeight) paddle2Y = gameHeight - paddle2.clientHeight;
  paddle2.style.top = paddle2Y + 'px';
}

// Bottom paddle (horizontal; controlled by A/D)
function updatePaddle3(deltaTime) {
  if (keysPressed['a']) {
    paddle3Speed = Math.max(paddle3Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['d']) {
    paddle3Speed = Math.min(paddle3Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle3Speed *= 0.9;
  }
  paddle3X += paddle3Speed * deltaTime;
  if (paddle3X < 0) paddle3X = 0;
  if (paddle3X > gameWidth - paddle3.clientWidth) paddle3X = gameWidth - paddle3.clientWidth;
  paddle3.style.left = paddle3X + 'px';
}

// Top paddle (horizontal; controlled by J/L)
function updatePaddle4(deltaTime) {
  if (keysPressed['j']) {
    paddle4Speed = Math.max(paddle4Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['l']) {
    paddle4Speed = Math.min(paddle4Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle4Speed *= 0.9;
  }
  paddle4X += paddle4Speed * deltaTime;
  if (paddle4X < 0) paddle4X = 0;
  if (paddle4X > gameWidth - paddle4.clientWidth) paddle4X = gameWidth - paddle4.clientWidth;
  paddle4.style.left = paddle4X + 'px';
}

/************************************ Ball Movement and Collision ***********************************/
function moveBall(deltaTime) {
  ballX += ballSpeedX * deltaTime;
  ballY += ballSpeedY * deltaTime;

  // Bounce off top and bottom walls
  if (ballY <= 0) {
    ballY = 0;
    ballSpeedY = -ballSpeedY;
    playSound(wallSound);
  }
  if (ballY >= gameHeight - ball.clientHeight) {
    ballY = gameHeight - ball.clientHeight;
    ballSpeedY = -ballSpeedY;
    playSound(wallSound);
  }

  // Collision with left paddle
  if (
    ballX <= paddle1.clientWidth &&
    ballY + ball.clientHeight >= paddle1Y &&
    ballY <= paddle1Y + paddle1.clientHeight
  ) {
    adjustBallDirectionVertical(paddle1Y, paddle1.clientHeight, true);
    ballX = paddle1.clientWidth;
  }
  // Collision with right paddle
  if (
    ballX + ball.clientWidth >= gameWidth - paddle2.clientWidth &&
    ballY + ball.clientHeight >= paddle2Y &&
    ballY <= paddle2Y + paddle2.clientHeight
  ) {
    adjustBallDirectionVertical(paddle2Y, paddle2.clientHeight, false);
    ballX = gameWidth - paddle2.clientWidth - ball.clientWidth;
  }
  // Collision with bottom paddle (if enabled)
  if (gameMode >= 3) {
    if (
      ballY + ball.clientHeight >= gameHeight - paddle3.clientHeight &&
      ballX + ball.clientWidth / 2 >= paddle3X &&
      ballX + ball.clientWidth / 2 <= paddle3X + paddle3.clientWidth
    ) {
      adjustBallDirectionHorizontal(paddle3X, paddle3.clientWidth, false);
      ballY = gameHeight - paddle3.clientHeight - ball.clientHeight;
    }
  }
  // Collision with top paddle (if enabled)
  if (gameMode === 4) {
    if (
      ballY <= paddle4.clientHeight &&
      ballX + ball.clientWidth / 2 >= paddle4X &&
      ballX + ball.clientWidth / 2 <= paddle4X + paddle4.clientWidth
    ) {
      adjustBallDirectionHorizontal(paddle4X, paddle4.clientWidth, true);
      ballY = paddle4.clientHeight;
    }
  }

  // Check if ball leaves game area → award point to last paddle that touched it
  if (
    ballX < 0 ||
    ballX > gameWidth - ball.clientWidth ||
    ballY < 0 ||
    ballY > gameHeight - ball.clientHeight
  ) {
    if (lastPaddleTouched) {
      scores[lastPaddleTouched]++;
      // (You could add additional feedback here if desired.)
    }
    playSound(lossSound);
    resetBall();
  }

  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Adjust ball direction on vertical paddle collision
function adjustBallDirectionVertical(paddleY, paddleHeight, isLeftPaddle) {
  const paddleCenter = paddleY + paddleHeight / 2;
  const ballCenter = ballY + ball.clientHeight / 2;
  const relativeIntersectY = ballCenter - paddleCenter;
  const maxBounceAngle = Math.PI / 4;
  const bounceAngle = (relativeIntersectY / (paddleHeight / 2)) * maxBounceAngle;
  let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
  speed = Math.min(speed * speedIncreaseFactor, maxSpeed);
  ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);
  ballSpeedY = speed * Math.sin(bounceAngle);
  playSound(paddleSound);
  lastPaddleTouched = isLeftPaddle ? 'paddle1' : 'paddle2';
}

// Adjust ball direction on horizontal paddle collision
function adjustBallDirectionHorizontal(paddleX, paddleWidth, isTopPaddle) {
  const paddleCenter = paddleX + paddleWidth / 2;
  const ballCenter = ballX + ball.clientWidth / 2;
  const relativeIntersectX = ballCenter - paddleCenter;
  const maxBounceAngle = Math.PI / 4;
  const bounceAngle = (relativeIntersectX / (paddleWidth / 2)) * maxBounceAngle;
  let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
  speed = Math.min(speed * speedIncreaseFactor, maxSpeed);
  ballSpeedY = (isTopPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);
  ballSpeedX = speed * Math.sin(bounceAngle);
  playSound(paddleSound);
  lastPaddleTouched = isTopPaddle ? 'paddle4' : 'paddle3';
}

// Reset ball to center after scoring
function resetBall() {
  ballX = gameWidth / 2 - ball.clientWidth / 2;
  ballY = gameHeight / 2 - ball.clientHeight / 2;
  ballSpeedX = Math.random() > 0.5 ? 2 : -2;
  ballSpeedY = Math.random() > 0.5 ? 2 : -2;
  lastPaddleTouched = null;
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Play a sound
function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// Reinitialize positions on window resize
window.addEventListener('resize', () => {
  initializePositions();
});
