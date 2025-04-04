/***************************************************
 * SETUP THE CANVAS
 ***************************************************/
// Get a reference to the canvas element from the HTML by its id 'canvas'
const canvas = document.getElementById('canvas');
// Get the 2D rendering context of the canvas for drawing
const ctx = canvas.getContext('2d');

// Set the canvas dimensions to fill the entire browser window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/***************************************************
 * HANDLE KEYBOARD INPUT
 ***************************************************/
// Create an array to keep track of which keys are currently pressed
const keysPressed = [];

// Define key constants using modern key "code" values for clarity
const KEY_UP = "ArrowUp";   // Up arrow key
const KEY_DOWN = "ArrowDown"; // Down arrow key

// Listen for keydown events on the window
window.addEventListener('keydown', function(e) {
    // Mark the pressed key as 'true' in the keysPressed array/object
    keysPressed[e.code] = true;
    // Uncomment the line below for debugging key presses
    // console.log(`${e.code} is pressed`);
});

// Listen for keyup events on the window
window.addEventListener('keyup', function(e) {
    // Mark the key as 'false' when it is released
    keysPressed[e.code] = false;
    // Uncomment the line below for debugging key releases
    // console.log(`${e.code} is released`);
});

/***************************************************
 * UTILITY FUNCTION
 ***************************************************/
// A simple function to create a 2D vector object
function vec2(x, y) {
    return { x: x, y: y };
}

/***************************************************
 * OBJECT CONSTRUCTORS: BALL & PADDLE
 ***************************************************/

/* 
   Ball Constructor
   Creates a ball object with a position, speed, and radius.
   Contains methods to update its position and draw itself on the canvas.
*/
function Ball(pos, speed, radius) {
    this.pos = pos;       // Position vector {x, y}
    this.speed = speed;   // Speed vector {x, y}
    this.radius = radius; // Radius for drawing the circle

    // Update the ball's position based on its current speed (velocity)
    this.update = function() {
        this.pos.x += this.speed.x;
        this.pos.y += this.speed.y;
    }

    // Draw the ball as a circle on the canvas using the current position and radius
    this.draw = function() {
        ctx.fillStyle = 'green';
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        // Draw a full circle (arc from 0 to 2π)
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

/*
   Paddle Constructor
   Creates a paddle object with a position, speed, width, and height.
   Contains methods to update its position (from player input) and draw itself.
   Also provides helper methods to calculate half dimensions and center position.
*/
function Paddle(pos, speed, width, height) {
    this.pos = pos;       // Top-left position vector for the paddle
    this.speed = speed;   // Speed vector {x, y} (used for vertical movement)
    this.width = width;   // Width of the paddle
    this.height = height; // Height of the paddle
    this.score = 0;       // Score of the paddle (player's score)

    // Update the paddle's position based on keyboard input.
    this.update = function() {
        // When the up arrow key is pressed, move the paddle upward.
        if (keysPressed[KEY_UP])
            this.pos.y -= this.speed.y;
        // When the down arrow key is pressed, move the paddle downward.
        if (keysPressed[KEY_DOWN])
            this.pos.y += this.speed.y;
    };
    
    // Draw the paddle as a rectangle on the canvas.
    this.draw = function() {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    };

    // Returns half of the paddle's width (useful for collision detection).
    this.getHalfwidth = function() {
        return this.width / 2;
    }

    // Returns half of the paddle's height.
    this.getHalfheight = function() {
        return this.height / 2;
    }

    // Returns the center coordinates of the paddle.
    this.getCenter = function() {
        return vec2(
            this.pos.x + this.getHalfwidth(),
            this.pos.y + this.getHalfheight()
        );
    }
}

/***************************************************
 * COLLISION & BOUNDARY DETECTION FUNCTIONS
 ***************************************************/

/*
   pddleCollisionDetection: Keeps the paddle within the top and bottom boundaries  
   of the canvas.
*/
function pddleCollisionDetection(paddle) {
    // Prevent paddle from moving above the top edge
    if (paddle.pos.y <= 0)
        paddle.pos.y = 0;
    // Prevent paddle from moving below the bottom edge
    if (paddle.pos.y + paddle.height >= canvas.height)
        paddle.pos.y = canvas.height - paddle.height;
}

/*
   ballCollisionDetection: Checks for collisions of the ball with the top and bottom
   boundaries of the canvas and inverts the vertical speed when a collision occurs.
*/
function ballCollisionDetection(ball) {
    // If the ball touches the bottom or top edges, reverse its vertical velocity.
    if (ball.pos.y + ball.radius >= canvas.height || ball.pos.y - ball.radius <= 0)
        ball.speed.y *= -1;
}

/*
   player2AI: A simple artificial intelligence for the second paddle that makes it
   follow the ball vertically when the ball is moving towards it.
*/
function player2AI(ball, paddle) {
    // Only move the paddle if the ball is moving towards it (to the right)
    if (ball.speed.x > 0) {
        // If the ball is below the paddle's position, move the paddle down.
        if (ball.pos.y > paddle.pos.y) {
            paddle.pos.y += paddle.speed.y;
            // Ensure the paddle does not leave the bottom of the canvas.
            if (paddle.pos.y + paddle.height >= canvas.height)
                paddle.pos.y = canvas.height - paddle.height;
        }
        // If the ball is above the paddle, move the paddle up.
        if (ball.pos.y < paddle.pos.y) {
            paddle.pos.y -= paddle.speed.y;
            // Ensure the paddle does not leave the top of the canvas.
            if (paddle.pos.y <= 0)
                paddle.pos.y = 0;
        }
    }
}

/*
   ballPaddleCollisionDetection: Checks if the ball collides with a paddle.
   It calculates the absolute difference between the ball position and the center of the paddle.
   If these differences (dx and dy) are small enough (less than the sum of half-dimensions and the ball's radius),
   then we consider it a collision and reverse the horizontal direction of the ball.
*/
function ballPaddleCollisionDetection(ball, paddle) {
    // Check if the ball collides with the paddle
    if (
        ball.pos.x - ball.radius <= paddle.pos.x + paddle.width && // Ball touches the left paddle
        ball.pos.x + ball.radius >= paddle.pos.x &&               // Ball touches the right paddle
        ball.pos.y + ball.radius >= paddle.pos.y &&               // Ball is within the paddle's top boundary
        ball.pos.y - ball.radius <= paddle.pos.y + paddle.height  // Ball is within the paddle's bottom boundary
    ) {
        // Calculate the relative intersection point of the ball on the paddle
        const paddleCenter = paddle.pos.y + paddle.getHalfheight();
        const relativeIntersectY = ball.pos.y - paddleCenter;
        const normalizedRelativeIntersectionY = relativeIntersectY / paddle.getHalfheight();

        // Calculate the bounce angle (e.g., max angle of 45 degrees)
        const maxBounceAngle = Math.PI / 4; // 45 degrees
        const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

        // Calculate the ball's speed magnitude
        const speed = Math.sqrt(ball.speed.x ** 2 + ball.speed.y ** 2);

        // Update ball's speed and direction based on the bounce angle
        ball.speed.x = (ball.speed.x > 0 ? -1 : 1) * speed * Math.cos(bounceAngle); // Reverse horizontal direction
        ball.speed.y = speed * Math.sin(bounceAngle);
    }
}

/*
   ballRespawn: Resets the ball's position after a point is scored.
   The ball reappears near the edge it left and with a slightly randomized vertical position.
   The ball's direction is reversed to serve towards the scoring player.
*/
function ballRespawn(ball) {
    if (ball.speed.x > 0) {
        // If the ball was moving to the right, respawn near the right side.
        ball.pos.x = canvas.width - 150;
        ball.pos.y = (Math.random() * (canvas.height - 200) + 100);
    }
    if (ball.speed.x < 0) {
        // If the ball was moving to the left, respawn near the left side.
        ball.pos.x = 150;
        ball.pos.y = (Math.random() * (canvas.height - 200) + 100);
    }
    // Reverse the ball's horizontal and vertical speed.
    ball.speed.x *= -1;
    ball.speed.y *= -1;
}

/*
   increaseScore: Increases the score when the ball moves past a paddle (off-screen horizontally).
   Updates the HTML element (span) that displays the player's score.
*/
function increaseScore(ball, paddle1, paddle2) {
    // If the ball goes off the left side, player 2 scores.
    if (ball.pos.x <= -ball.radius) {
        paddle2.score += 1;
        document.getElementById('player2Score').innerHTML = paddle2.score;
        ballRespawn(ball);
    }
    
    // If the ball goes off the right side, player 1 scores.
    if (ball.pos.x >= canvas.width + ball.radius) {
        paddle1.score += 1;
        document.getElementById('player1Score').innerHTML = paddle1.score;
        ballRespawn(ball);
    }
}

/***************************************************
 * CREATE GAME OBJECTS
 ***************************************************/
// Create the ball object starting at position (200, 200) with a speed vector (10, 10) and a radius of 20 pixels.
const ball = new Ball(vec2(200, 200), vec2(10, 10), 20);
// Create player 1's paddle on the left side at position (0, 50) with speed (10,10), width 20, and height 160 pixels.
const paddle1 = new Paddle(vec2(0, 50), vec2(10, 10), 20, 160);
// Create player 2's paddle on the right side at a position near the right edge.
const paddle2 = new Paddle(vec2(canvas.width - 20, 50), vec2(10, 10), 20, 160);

/***************************************************
 * GAME LOOP FUNCTIONS
 ***************************************************/

/*
   gameUpdate: This function updates the positions and states of all the game objects.
   - It moves the ball.
   - It updates the player-controlled paddle.
   - It uses the simple AI for player 2's paddle.
   - It checks and corrects paddle and ball positions based on collisions.
   - It detects collisions between the ball and the paddles.
   - It handles scoring if the ball goes off the screen.
*/
function gameUpdate() {
    ball.update();                  // Move the ball based on its speed.
    paddle1.update();               // Update paddle1 based on keyboard input.
    player2AI(ball, paddle2);       // Update paddle2 position using AI behavior.
    
    // Ensure paddle1 stays within the canvas boundaries.
    pddleCollisionDetection(paddle1);
    // Handle collisions between the ball and the top or bottom boundaries.
    ballCollisionDetection(ball);
    // Handle collisions between the ball and both paddles.
    ballPaddleCollisionDetection(ball, paddle1);
    ballPaddleCollisionDetection(ball, paddle2);
    // Increase score if the ball leaves the screen and respawn the ball.
    increaseScore(ball, paddle1, paddle2);
}

/*
   gameDraw: This function draws the current state of all game objects on the canvas.
   It draws the ball and both paddles.
*/
function gameDraw() {
    ball.draw();
    paddle1.draw();
    paddle2.draw();
}

/*
   gameLoop: The main loop of the game that gets called repeatedly.
   It:
   - Clears (or partially clears) the canvas creating a trailing effect.
   - Requests the next animation frame for smooth animation.
   - Calls gameUpdate to update game logic.
   - Calls gameDraw to render the updated game state.
*/
function gameLoop() {
    // Instead of clearing completely, create a semi-transparent fill to produce a blur/trailing effect.
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Request the next frame to keep the game loop going.
    window.requestAnimationFrame(gameLoop);

    // Update the game logic and redraw the game objects.
    gameUpdate();
    gameDraw();
}

// Start the game loop.
gameLoop();


/*
Summary
***Canvas Setup: The game starts by setting up a full-browser canvas and obtaining its 2D drawing context. 
This is where all game elements (ball, paddles) will be rendered.

***Handling Input: The program listens for keydown and keyup events. 
It tracks which keys (specifically the arrow keys) are pressed using an array (keysPressed). 
This lets the player control one of the paddles.

***Game Objects - Ball and Paddle:

***Ball: Created with a starting position, speed, and radius. 
It has methods to update its position on every frame and draw itself as a circle.

***Paddle: Each paddle is constructed with a position, speed, and dimensions. 
The paddle’s update method adjusts its vertical position based on keyboard input (or AI for the second paddle). 
Helper methods calculate the paddle’s center and half-dimensions, which are used in collision detection.

***Collision Detection:

***Paddle-boundary Collision: Ensures the paddles stay within the canvas.

***Ball-boundary Collision: Checks and inverts the ball’s vertical speed when it touches the top or bottom of the canvas.

***Ball-Paddle Collision: By comparing the distance between the ball and the paddle’s center against a threshold (paddle half-dimensions plus ball radius),
 the code detects collisions and reverses the ball’s horizontal direction.

***AI for Opponent Paddle: A simple AI makes the second paddle follow the vertical position of the ball when the ball is moving toward it.

***Scoring: When the ball moves off the left or right side of the screen, the corresponding opponent’s score is incremented. 
The game updates the HTML elements displaying the score and respawns the ball with a reversed direction and randomized position.

***Game Loop: A continuous loop using requestAnimationFrame repeatedly:

Clears the canvas (using a semi-transparent fill to create a trailing effect).

***Updates the state of the ball and paddles.

Redraws all objects on the canvas.

*** The overall concept is to continuously perform calculations on object positions and speeds while detecting collisions and input. 
By updating in short time intervals (frames), it creates smooth animation and game physics, providing a simple but effective ping pong game.
*/