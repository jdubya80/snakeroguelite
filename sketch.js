// Constants for grid and canvas size
const GRID_SIZE = 20;
const CELL_SIZE = 30;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// Global game variables
let snake;
let direction;
let nextDirection;
let food;
let enemies;
let score;
let health;
let maxHealth;
let level;
let foodEaten;
let gameState;

// Direction mappings for movement
const directions = {
  'up': {dx: 0, dy: -1},
  'down': {dx: 0, dy: 1},
  'left': {dx: -1, dy: 0},
  'right': {dx: 1, dy: 0}
};

// Setup function to initialize the game
function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  frameRate(10); // Initial game speed
  initGame();
}

// Initialize or reset the game
function initGame() {
  score = 0;
  level = 1;
  maxHealth = 3;
  health = maxHealth;
  startLevel();
  gameState = 'playing';
}

// Start a new level
function startLevel() {
  snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
  direction = 'right';
  nextDirection = 'right';
  placeEnemies();
  food = getRandomEmptyPosition();
  foodEaten = 0;
}

// Get a random empty position on the grid
function getRandomEmptyPosition() {
  let x, y;
  do {
    x = floor(random(GRID_SIZE));
    y = floor(random(GRID_SIZE));
  } while (snake.some(seg => seg.x === x && seg.y === y) || 
           enemies.some(enemy => enemy.x === x && enemy.y === y));
  return {x, y};
}

// Place enemies based on the current level
function placeEnemies() {
  enemies = [];
  let numEnemies = level * 2; // Increase enemies with level
  for (let i = 0; i < numEnemies; i++) {
    let enemy = getRandomEmptyPosition();
    enemy.type = floor(random(2)); // 0: static, 1: moving
    if (enemy.type === 1) {
      enemy.dir = random(['left', 'right', 'up', 'down']);
    }
    enemies.push(enemy);
  }
}

// Main draw loop
function draw() {
  if (gameState === 'playing') {
    background(220); // Light gray background
    drawGrid();
    drawSnake();
    drawFood();
    drawEnemies();
    updateGame();
    drawUI();
  } else if (gameState === 'upgrade') {
    drawUpgradeMenu();
  } else if (gameState === 'gameover') {
    drawGameOver();
  }
}

// Draw the grid lines
function drawGrid() {
  stroke(200); // Light gray grid
  for (let i = 0; i <= GRID_SIZE; i++) {
    line(i * CELL_SIZE, 0, i * CELL_SIZE, CANVAS_SIZE);
    line(0, i * CELL_SIZE, CANVAS_SIZE, i * CELL_SIZE);
  }
}

// Draw the snake with custom visuals
function drawSnake() {
  // Draw connecting lines between segments
  stroke(0, 150, 0); // Dark green lines
  for (let i = 1; i < snake.length; i++) {
    let prev = snake[i - 1];
    let curr = snake[i];
    let px1 = prev.x * CELL_SIZE + CELL_SIZE / 2;
    let py1 = prev.y * CELL_SIZE + CELL_SIZE / 2;
    let px2 = curr.x * CELL_SIZE + CELL_SIZE / 2;
    let py2 = curr.y * CELL_SIZE + CELL_SIZE / 2;
    line(px1, py1, px2, py2);
  }
  // Draw segments
  noStroke();
  // Head
  fill(0, 100, 0); // Dark green head
  let head = snake[0];
  let headPx = head.x * CELL_SIZE + CELL_SIZE / 2;
  let headPy = head.y * CELL_SIZE + CELL_SIZE / 2;
  ellipse(headPx, headPy, CELL_SIZE, CELL_SIZE);
  // Eyes based on direction
  fill(0); // Black eyes
  let eyeOffsetX, eyeOffsetY;
  if (direction === 'right') {
    eyeOffsetX = 0.3 * CELL_SIZE;
    eyeOffsetY = 0.2 * CELL_SIZE;
  } else if (direction === 'left') {
    eyeOffsetX = -0.3 * CELL_SIZE;
    eyeOffsetY = 0.2 * CELL_SIZE;
  } else if (direction === 'up') {
    eyeOffsetX = 0.2 * CELL_SIZE;
    eyeOffsetY = -0.3 * CELL_SIZE;
  } else if (direction === 'down') {
    eyeOffsetX = 0.2 * CELL_SIZE;
    eyeOffsetY = 0.3 * CELL_SIZE;
  }
  ellipse(headPx + eyeOffsetX, headPy - eyeOffsetY, 5, 5);
  ellipse(headPx + eyeOffsetX, headPy + eyeOffsetY, 5, 5);
  // Body segments
  fill(0, 200, 0); // Light green body
  for (let i = 1; i < snake.length; i++) {
    let seg = snake[i];
    let px = seg.x * CELL_SIZE + CELL_SIZE / 2;
    let py = seg.y * CELL_SIZE + CELL_SIZE / 2;
    ellipse(px, py, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
  }
}

// Draw the food with a pulsing effect
function drawFood() {
  let fx = food.x * CELL_SIZE + CELL_SIZE / 2;
  let fy = food.y * CELL_SIZE + CELL_SIZE / 2;
  let foodSize = CELL_SIZE * 0.8 + sin(frameCount * 0.1) * 5; // Pulsing size
  fill(255, 0, 0); // Red food
  ellipse(fx, fy, foodSize, foodSize);
  fill(255); // White shine
  ellipse(fx + 5, fy - 5, 10, 10);
}

// Draw enemies with different appearances
function drawEnemies() {
  enemies.forEach(enemy => {
    let ex = enemy.x * CELL_SIZE;
    let ey = enemy.y * CELL_SIZE;
    if (enemy.type === 0) {
      fill(100); // Gray static enemy
      rect(ex, ey, CELL_SIZE, CELL_SIZE);
    } else if (enemy.type === 1) {
      fill(0, 0, 255); // Blue moving enemy
      ellipse(ex + CELL_SIZE / 2, ey + CELL_SIZE / 2, CELL_SIZE * 0.8, CELL_SIZE * 0.8);
    }
  });
}

// Draw the user interface
function drawUI() {
  textSize(20);
  fill(0); // Black text
  text(`Score: ${score}`, 10, 30);
  text(`Health: ${health}/${maxHealth}`, 10, 60);
  text(`Level: ${level}`, 10, 90);
  // Health bar
  fill(255, 0, 0); // Red background
  rect(10, 100, 100, 20);
  fill(0, 255, 0); // Green health
  let healthWidth = map(health, 0, maxHealth, 0, 100);
  rect(10, 100, healthWidth, 20);
}

// Update game logic
function updateGame() {
  // Move moving enemies
  enemies.forEach(enemy => {
    if (enemy.type === 1) {
      let dir = directions[enemy.dir];
      let newX = enemy.x + dir.dx;
      let newY = enemy.y + dir.dy;
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        // Reverse direction at walls
        if (enemy.dir === 'left') enemy.dir = 'right';
        else if (enemy.dir === 'right') enemy.dir = 'left';
        else if (enemy.dir === 'up') enemy.dir = 'down';
        else if (enemy.dir === 'down') enemy.dir = 'up';
      } else {
        enemy.x = newX;
        enemy.y = newY;
      }
    }
  });

  // Update snake direction and position
  direction = nextDirection;
  let dir = directions[direction];
  let newHead = {x: snake[0].x + dir.dx, y: snake[0].y + dir.dy};

  // Check collisions
  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    gameState = 'gameover';
    return;
  }
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    gameState = 'gameover';
    return;
  }
  snake.unshift(newHead);

  // Handle food collision
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    foodEaten += 1;
    if (foodEaten >= 5) {
      gameState = 'upgrade'; // Level complete after 5 food
    } else {
      food = getRandomEmptyPosition();
    }
  } else {
    snake.pop(); // Move without growing
  }

  // Check enemy collisions
  enemies.forEach(enemy => {
    if (newHead.x === enemy.x && newHead.y === enemy.y) {
      health -= 1;
      if (health <= 0) {
        gameState = 'gameover';
      }
    }
  });
}

// Draw the upgrade selection menu
function drawUpgradeMenu() {
  background(220);
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(30);
  text("Choose an upgrade:", width / 2, height / 2 - 50);
  textSize(20);
  text("1. Speed", width / 2, height / 2);
  text("2. Health", width / 2, height / 2 + 30);
}

// Draw the game over screen
function drawGameOver() {
  background(220);
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(40);
  text("Game Over", width / 2, height / 2 - 50);
  textSize(20);
  text(`Final Score: ${score}`, width / 2, height / 2);
  text("Press R to restart", width / 2, height / 2 + 50);
}

// Handle keyboard input
function keyPressed() {
  if (gameState === 'playing') {
    // Snake movement controls
    if (keyCode === LEFT_ARROW && direction !== 'right') {
      nextDirection = 'left';
    } else if (keyCode === RIGHT_ARROW && direction !== 'left') {
      nextDirection = 'right';
    } else if (keyCode === UP_ARROW && direction !== 'down') {
      nextDirection = 'up';
    } else if (keyCode === DOWN_ARROW && direction !== 'up') {
      nextDirection = 'down';
    }
  } else if (gameState === 'upgrade') {
    // Upgrade selection
    if (key === '1') {
      frameRate(frameRate() + 2); // Increase speed
      level += 1;
      startLevel();
      gameState = 'playing';
    } else if (key === '2') {
      maxHealth += 1; // Increase health
      health = maxHealth;
      level += 1;
      startLevel();
      gameState = 'playing';
    }
  } else if (gameState === 'gameover') {
    // Restart game
    if (key === 'r' || key === 'R') {
      initGame();
    }
  }
}