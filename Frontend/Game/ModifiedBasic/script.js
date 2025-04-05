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
let ballSpeedX = 4;
let ballY = 0;
let ballSpeedY = 4;
let player1Score = 0;
let player2Score = 0;
let lastTime = null;

// Game Constants
const paddleAcceleration = 1;
const paddleDeceleration = 1;
const maxPaddleSpeed = 8; // Maximum paddle speed
const speedIncreaseFactor = 1.1; // 10% speed increase per paddle hit
const maxSpeed = 8; // Prevent excessive speed

// Dynamically calculate game dimensions
let gameHeight = window.innerHeight;
let gameWidth = window.innerWidth;

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

// Call initializePositions on page load and resize
window.addEventListener('load', initializePositions);
window.addEventListener('resize', () => {
  gameHeight = window.innerHeight;
  gameWidth = window.innerWidth;
  initializePositions();
});

// Listeners for game controls
document.addEventListener('keydown', startGame); // Start the game when any key is pressed initially
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Start the game: hide menu text, show ball, and resume game loop
function startGame() {
  gameRunning = true;
  startText.style.display = 'none';
  ball.style.display = 'block';
  document.removeEventListener('keydown', startGame);
  lastTime = null; // Reset timing
  requestAnimationFrame(gameLoop);
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

  if (lastTime === null) {
    lastTime = timestamp;
  }
  const deltaTime = (timestamp - lastTime) / 16.67; // Normalize to 60fps baseline

  updatePaddle1(deltaTime);
  updatePaddle2(deltaTime);
  moveBall(deltaTime);

  lastTime = timestamp;
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
  if (keysPressed['ArrowUp']) {
    paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['ArrowDown']) {
    paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    paddle2Speed *= 0.9; // Gradual slow down
  }
  paddle2Y += paddle2Speed * deltaTime;
  if (paddle2Y < 0) paddle2Y = 0;
  if (paddle2Y > gameHeight - paddle2.clientHeight)
    paddle2Y = gameHeight - paddle2.clientHeight;
  paddle2.style.top = paddle2Y + 'px';
}

/************************************ Move Ball ***********************************/
function moveBall(deltaTime) {
  ballX += ballSpeedX * deltaTime;
  ballY += ballSpeedY * deltaTime;

  // Top collision: snap to top and reverse vertical velocity
  if (ballY <= 0) {
    ballY = 0;
    ballSpeedY = -ballSpeedY;
    playSound(wallSound);
  }
  //Not sure if we need to make else if ?  Bottom collision: snap to bottom and reverse vertical velocity
 if (ballY >= gameHeight - ball.clientHeight) {
    ballY = gameHeight - ball.clientHeight;
    ballSpeedY = -ballSpeedY;
    playSound(wallSound);
  }

  // Paddle1 collision with angle adjustment
  if (
    ballX <= paddle1.clientWidth &&
    ballY + ball.clientHeight >= paddle1Y &&
    ballY <= paddle1Y + paddle1.clientHeight
  ) {
    adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
  }

  // Paddle2 collision with angle adjustment
  if (
    ballX >= gameWidth - paddle2.clientWidth - ball.clientWidth &&
    ballY + ball.clientHeight >= paddle2Y &&
    ballY <= paddle2Y + paddle2.clientHeight
  ) {
    adjustBallDirection(paddle2Y, paddle2.clientHeight, false);
  }

  // Out-of-bounds (scoring conditions)
  if (ballX <= 0) {
    player2Score++;
    playSound(lossSound);
    updateScoreboard();
    resetBall();
    pauseGame();
    return;
  }
  // not sure if it need to be else if ? Out-of-bounds (scoring conditions) 
  if (ballX >= gameWidth - ball.clientWidth) {
    player1Score++;
    playSound(lossSound);
    updateScoreboard();
    resetBall();
    pauseGame();
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

  // Play a sound effect to indicate the ball hit the paddle
  playSound(paddleSound);
}

/************************************ Helper Functions ***********************************/
// Pause the game and show the start menu; also hide the ball
function pauseGame() {
  gameRunning = false;
  ball.style.display = 'none';
  document.addEventListener('keydown', startGame);
}

function resetBall() {
  ballX = gameWidth / 2 - ball.clientWidth / 2; // Ball in the middle horizontally
  ballY = Math.random() * (gameHeight - ball.clientHeight); // Random Y position within bounds
  // Randomly choose a left or right initial direction
  ballSpeedX = Math.random() > 0.5 ? 2 : -2;
  // Randomly choose an up or down initial direction
  ballSpeedY = Math.random() > 0.5 ? 2 : -2;
}

function updateScoreboard() {
  player1ScoreElement.textContent = player1Score;
  player2ScoreElement.textContent = player2Score;
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}
