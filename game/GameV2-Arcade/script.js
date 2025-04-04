// Get DOM elements for game components and sound effects
const startText = document.getElementById('startText');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const ball = document.getElementById('ball');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');
const lossSound = document.getElementById('lossSound');
const wallSound = document.getElementById('wallSound');
const paddleSound = document.getElementById('paddleSound');

// Game state and control variables
let gameRunning = false;        // Indicates if the game loop is running
let keysPressed = {};           // Tracks keys currently pressed by the user

// Paddle movement variables for position and speed
let paddle1Speed = 0;
let paddle1Y = 150;             // Initial vertical position for paddle1, height 400/2 - 100/2
let paddle2Speed = 0;
let paddle2Y = 150;             // Initial vertical position for paddle2, height 400/2 - 100/2

// Ball movement variables: position and speed
let ballX = 290;                // Initial horizontal position for the ball, width 600/2 - 20/2
let ballSpeedX = 2;             // Initial horizontal speed for the ball
let ballY = 190;                // Initial vertical position for the ball, height 400/2 - 20/2
let ballSpeedY = 2;             // Initial vertical speed for the ball

// Score variables for both players
let player1Score = 0;
let player2Score = 0;

// Variable to track the previous frame's timestamp for deltaTime calculation
let lastTime = null;

// Constants for game mechanics
const paddleAcceleration = 1;   // How fast the paddle accelerates on key press
const paddleDeceleration = 1;   // How quickly the paddle slows down when keys are released
const maxPaddleSpeed = 5;       // Maximum paddle speed
const gameHeight = 400;         // Height of the game area
const gameWidth = 600;          // Width of the game area
const speedIncreaseFactor = 1.05; // Increase ball speed by 5% on paddle hit
const maxSpeed = 10;            // Cap for the ball's speed

// Event listeners for game controls and starting the game
document.addEventListener('keydown', startGame);   // Starts the game on any key press
document.addEventListener('keydown', handleKeyDown); // Captures key presses for paddle control
document.addEventListener('keyup', handleKeyUp);     // Captures key releases for paddle control

// Function to start the game: hides start text, shows the ball, and initiates the game loop
function startGame() {
  gameRunning = true;
  startText.style.display = 'none'; // Hide start instruction text
  ball.style.display = 'block';       // Make the ball visible
  document.removeEventListener('keydown', startGame); // Prevent re-triggering startGame
  lastTime = null; // Reset timing to ensure proper deltaTime calculation
  requestAnimationFrame(gameLoop); // Begin the game loop
}

// Handle key down events to update keysPressed object
function handleKeyDown(e) {
  keysPressed[e.key] = true;
}

// Handle key up events to update keysPressed object
function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

// Main game loop using requestAnimationFrame for smooth animations
function gameLoop(timestamp) {
  if (!gameRunning)
    return; // Exit if the game is not running

  if (lastTime === null) {
    lastTime = timestamp; // Initialize lastTime on first frame
  }

  // Calculate deltaTime normalized to a 60fps baseline
  const deltaTime = (timestamp - lastTime) / 16.67;

  // Update paddle positions and ball movement based on deltaTime
  updatePaddle1(deltaTime);
  updatePaddle2(deltaTime);
  moveBall(deltaTime);

  // Update lastTime for the next frame and schedule the next game loop iteration
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

/************************************
 * Paddle Update Functions
 ************************************/

// Update left paddle (Player 1) position based on input
function updatePaddle1(deltaTime) {
  if (keysPressed['w']) {
    // Move up: decrease speed until reaching the max upward speed
    paddle1Speed = Math.max(paddle1Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['s']) {
    // Move down: increase speed until reaching the max downward speed
    paddle1Speed = Math.min(paddle1Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    // Apply gradual deceleration when no key is pressed
    paddle1Speed *= 0.9;
  }
  
  // Update the paddle's vertical position
  paddle1Y += paddle1Speed * deltaTime;
  // Ensure the paddle doesn't go above the game area
  if (paddle1Y < 0) paddle1Y = 0;
  // Ensure the paddle doesn't go below the game area
  if (paddle1Y > gameHeight - paddle1.clientHeight)
    paddle1Y = gameHeight - paddle1.clientHeight;
  
  // Apply the new position to the paddle element
  paddle1.style.top = paddle1Y + 'px';
}

// Update right paddle (Player 2) position based on input
function updatePaddle2(deltaTime) {
  if (keysPressed['ArrowUp']) {
    // Move up: decrease speed until reaching the max upward speed
    paddle2Speed = Math.max(paddle2Speed - paddleAcceleration * deltaTime, -maxPaddleSpeed);
  } else if (keysPressed['ArrowDown']) {
    // Move down: increase speed until reaching the max downward speed
    paddle2Speed = Math.min(paddle2Speed + paddleAcceleration * deltaTime, maxPaddleSpeed);
  } else {
    // Apply gradual deceleration when no key is pressed
    paddle2Speed *= 0.9;
  }
  
  // Update the paddle's vertical position
  paddle2Y += paddle2Speed * deltaTime;
  // Ensure the paddle doesn't move out of bounds at the top
  if (paddle2Y < 0) paddle2Y = 0;
  // Ensure the paddle doesn't move out of bounds at the bottom
  if (paddle2Y > gameHeight - paddle2.clientHeight)
    paddle2Y = gameHeight - paddle2.clientHeight;
  
  // Apply the new position to the paddle element
  paddle2.style.top = paddle2Y + 'px';
}

/************************************
 * Ball Movement and Collision
 ************************************/

// Move the ball and handle collisions each frame
function moveBall(deltaTime) {
  // Update ball position using current speed values and deltaTime
  ballX += ballSpeedX * deltaTime;
  ballY += ballSpeedY * deltaTime;
  
  // Check collision with the top of the game area
  if (ballY <= 0) {
    ballY = 0;                // Snap ball to the top edge
    ballSpeedY = -ballSpeedY; // Reverse vertical direction
    playSound(wallSound);     // Play wall collision sound
  }
  // Check collision with the bottom of the game area
  else if (ballY >= gameHeight - ball.clientHeight) {
    ballY = gameHeight - ball.clientHeight; // Snap ball to bottom edge
    ballSpeedY = -ballSpeedY; // Reverse vertical direction
    playSound(wallSound);     // Play wall collision sound
  }
  
  // Check collision with left paddle (Player 1)
  if (
    ballX <= paddle1.clientWidth && // Ball reaches the left paddle's horizontal area
    ballY + ball.clientHeight >= paddle1Y && // Ball is low enough to hit the paddle
    ballY <= paddle1Y + paddle1.clientHeight // Ball is high enough to hit the paddle
  ) {
    adjustBallDirection(paddle1Y, paddle1.clientHeight, true);
  }
  
  // Check collision with right paddle (Player 2)
  if (
    ballX >= gameWidth - paddle2.clientWidth - ball.clientWidth && // Ball reaches right paddle's area
    ballY + ball.clientHeight >= paddle2Y && // Ball is low enough to hit the paddle
    ballY <= paddle2Y + paddle2.clientHeight // Ball is high enough to hit the paddle
  ) {
    adjustBallDirection(paddle2Y, paddle2.clientHeight, false);
  }
  
  // Check if the ball goes out-of-bounds on the left side (score for Player 2)
  if (ballX <= 0) {
    player2Score++;
    playSound(lossSound); // Play loss sound effect
    updateScoreboard();   // Update score display
    resetBall();          // Reset ball to the center
    pauseGame();          // Pause game until restart
    return;
  }
  // Check if the ball goes out-of-bounds on the right side (score for Player 1)
  else if (ballX >= gameWidth - ball.clientWidth) {
    player1Score++;
    playSound(lossSound); // Play loss sound effect
    updateScoreboard();   // Update score display
    resetBall();          // Reset ball to the center
    pauseGame();          // Pause game until restart
    return;
  }
  
  // Update the ball's position on the screen
  ball.style.left = ballX + 'px';
  ball.style.top = ballY + 'px';
}

// Adjust the ball's direction and speed after it hits a paddle
function adjustBallDirection(paddleY, paddleHeight, isLeftPaddle) {
  // Find the center positions of the paddle and the ball
  const paddleCenter = paddleY + paddleHeight / 2;
  const ballCenter = ballY + ball.clientHeight / 2;
  // Calculate the distance from the ball's center to the paddle's center
  const relativeIntersectY = ballCenter - paddleCenter;
  // Normalize this value (-1 to 1)
  const normalizedRelativeIntersectionY = relativeIntersectY / (paddleHeight / 2);
  // Maximum bounce angle (45° or π/4 radians)
  const maxBounceAngle = Math.PI / 4;
  // Determine the bounce angle based on where the ball hit the paddle
  const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;
  
  // Calculate current speed of the ball (Pythagorean theorem)
  let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
  // Increase ball speed by a factor, but do not exceed maxSpeed
  speed = Math.min(speed * speedIncreaseFactor, maxSpeed);
  
  // Adjust ball speed based on paddle side and calculated angle
  ballSpeedX = (isLeftPaddle ? 1 : -1) * speed * Math.cos(bounceAngle);
  ballSpeedY = speed * Math.sin(bounceAngle);
  
  // Play sound for paddle hit
  playSound(paddleSound);
}

/************************************
 * Game Control and Utility Functions
 ************************************/

// Pause the game, hide the ball, and re-enable the start listener
function pauseGame() {
  gameRunning = false;
  ball.style.display = 'none';
  // Optionally show start text here if desired (currently commented out)
  // startText.style.display = 'block';
  document.addEventListener('keydown', startGame);
}

// Reset the ball's position to the center and randomize its movement direction
function resetBall() {
  ballX = gameWidth / 2 - ball.clientWidth / 2; // Ball in the middle horizontally
  ballY = Math.random() * (gameHeight - ball.clientHeight); // Random Y position within bounds
  // Randomly choose a left or right initial direction
  ballSpeedX = Math.random() > 0.5 ? 2 : -2;
  // Randomly choose an up or down initial direction
  ballSpeedY = Math.random() > 0.5 ? 2 : -2;
}

// Update the scoreboard display with current player scores
function updateScoreboard() {
  player1ScoreElement.textContent = player1Score;
  player2ScoreElement.textContent = player2Score;
}

// Play a given sound effect by resetting its playback and starting it
function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}
