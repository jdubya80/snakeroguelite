// Constants for grid and canvas size
const GRID_SIZE = 20;
const CELL_SIZE = 30;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const UI_WIDTH = 150; // Width for UI panel
const BASE_SPEED = 7; // Lower starting speed

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
let currentSpeed; // Track current game speed
let dashCooldown = 0; // Cooldown for dash ability
let wallBounceActive = false; // Flag for wall bounce effect

// Persistent upgrade variables
let gems = 0; // Currency that persists between runs
let permanentUpgrades = {
  speedBoost: 0,    // Each level gives +1 starting speed
  healthBoost: 0,   // Each level gives +1 starting health
  gemMultiplier: 1, // Multiplier for gems earned
  snakeLength: 0,   // Extra starting length
  wallBounce: 0,    // Ability to bounce off walls (costs health)
  dashPower: 0,     // Ability to dash and destroy enemies
  blockBreaker: 0   // Ability to destroy blocks (static enemies)
};

// Direction mappings for movement
const directions = {
  'up': {dx: 0, dy: -1},
  'down': {dx: 0, dy: 1},
  'left': {dx: -1, dy: 0},
  'right': {dx: 1, dy: 0}
};

// Setup function to initialize the game
function setup() {
  createCanvas(CANVAS_SIZE + UI_WIDTH, CANVAS_SIZE);
  frameRate(BASE_SPEED); // Use BASE_SPEED for initial game speed
  
  // Load saved data if available
  loadGameData();
  
  initGame();
}

// Load saved game data from localStorage
function loadGameData() {
  if (localStorage.getItem('snakeRogueLiteGems')) {
    gems = parseInt(localStorage.getItem('snakeRogueLiteGems'));
  }
  
  if (localStorage.getItem('snakeRogueLiteUpgrades')) {
    let savedUpgrades = JSON.parse(localStorage.getItem('snakeRogueLiteUpgrades'));
    
    // Ensure all upgrade properties exist with proper values
    permanentUpgrades.speedBoost = savedUpgrades.speedBoost || 0;
    permanentUpgrades.healthBoost = savedUpgrades.healthBoost || 0;
    permanentUpgrades.gemMultiplier = savedUpgrades.gemMultiplier || 1;
    permanentUpgrades.snakeLength = savedUpgrades.snakeLength || 0;
    permanentUpgrades.wallBounce = savedUpgrades.wallBounce || 0;
    permanentUpgrades.dashPower = savedUpgrades.dashPower || 0;
    permanentUpgrades.blockBreaker = savedUpgrades.blockBreaker || 0;
  }
}

// Save game data to localStorage
function saveGameData() {
  localStorage.setItem('snakeRogueLiteGems', gems);
  localStorage.setItem('snakeRogueLiteUpgrades', JSON.stringify(permanentUpgrades));
}

// Reset all saved game data
function resetGameData() {
  gems = 0;
  permanentUpgrades = {
    speedBoost: 0,
    healthBoost: 0,
    gemMultiplier: 1,
    snakeLength: 0,
    wallBounce: 0,
    dashPower: 0,
    blockBreaker: 0
  };
  localStorage.removeItem('snakeRogueLiteGems');
  localStorage.removeItem('snakeRogueLiteUpgrades');
  initGame();
}

// Initialize or reset the game
function initGame() {
  score = 0;
  level = 1;
  maxHealth = 3 + permanentUpgrades.healthBoost;
  health = maxHealth;
  currentSpeed = BASE_SPEED + permanentUpgrades.speedBoost;
  frameRate(currentSpeed);
  dashCooldown = 0;
  wallBounceActive = false;
  startLevel();
  gameState = 'playing';
}

// Start a new level
function startLevel() {
  // Create snake with extra length from upgrades
  snake = [{x: 10, y: 10}];
  for (let i = 0; i < 2 + permanentUpgrades.snakeLength; i++) {
    snake.push({x: 9 - i, y: 10});
  }
  
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
  // Draw connecting lines between segments with gradient effect
  for (let i = 1; i < snake.length; i++) {
    let prev = snake[i - 1];
    let curr = snake[i];
    let px1 = prev.x * CELL_SIZE + CELL_SIZE / 2;
    let py1 = prev.y * CELL_SIZE + CELL_SIZE / 2;
    let px2 = curr.x * CELL_SIZE + CELL_SIZE / 2;
    let py2 = curr.y * CELL_SIZE + CELL_SIZE / 2;
    
    // Create gradient effect for snake body connections
    let gradientColor = lerpColor(
      color(0, 200, 0, 150), 
      color(0, 100, 0, 100), 
      i / snake.length
    );
    stroke(gradientColor);
    strokeWeight(CELL_SIZE * 0.4);
    line(px1, py1, px2, py2);
  }
  
  // Reset stroke for other elements
  strokeWeight(1);
  noStroke();
  
  // Head with special effects
  let head = snake[0];
  let headPx = head.x * CELL_SIZE + CELL_SIZE / 2;
  let headPy = head.y * CELL_SIZE + CELL_SIZE / 2;
  
  // Glow effect for head
  if (dashCooldown === 0 && permanentUpgrades.dashPower > 0) {
    // Ready to dash - add pulsing glow
    let glowSize = CELL_SIZE * 1.3 + sin(frameCount * 0.2) * 5;
    fill(255, 165, 0, 100); // Orange glow
    ellipse(headPx, headPy, glowSize, glowSize);
  }
  
  // Head color based on state
  if (dashCooldown === 1) {
    // Flash when dash is about to be ready
    fill(255, 165, 0); // Orange flash
  } else if (wallBounceActive) {
    // Red when wall bounce is active with pulsing effect
    fill(255, 0, 0);
    // Add impact particles when bouncing
    for (let i = 0; i < 5; i++) {
      fill(255, 100, 100, 150);
      let particleSize = random(5, 10);
      let particleX = headPx + random(-CELL_SIZE/2, CELL_SIZE/2);
      let particleY = headPy + random(-CELL_SIZE/2, CELL_SIZE/2);
      ellipse(particleX, particleY, particleSize, particleSize);
    }
  } else {
    // Normal head with gradient
    let headGradient = drawingContext.createRadialGradient(
      headPx, headPy, 0,
      headPx, headPy, CELL_SIZE/2
    );
    headGradient.addColorStop(0, '#00FF00');
    headGradient.addColorStop(1, '#006600');
    drawingContext.fillStyle = headGradient;
  }
  
  // Draw the head
  ellipse(headPx, headPy, CELL_SIZE, CELL_SIZE);
  
  // Eyes based on direction with more detail
  fill(255); // White eyeballs
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
  
  // Draw eyeballs
  ellipse(headPx + eyeOffsetX, headPy - eyeOffsetY, 8, 8);
  ellipse(headPx + eyeOffsetX, headPy + eyeOffsetY, 8, 8);
  
  // Draw pupils (black)
  fill(0);
  ellipse(headPx + eyeOffsetX * 1.1, headPy - eyeOffsetY, 4, 4);
  ellipse(headPx + eyeOffsetX * 1.1, headPy + eyeOffsetY, 4, 4);
  
  // Add tongue occasionally
  if (frameCount % 30 < 10) {
    fill(255, 50, 50);
    let tongueLength = 10;
    let tongueWidth = 3;
    
    if (direction === 'right') {
      triangle(
        headPx + CELL_SIZE/2, headPy,
        headPx + CELL_SIZE/2 + tongueLength, headPy - tongueWidth,
        headPx + CELL_SIZE/2 + tongueLength, headPy + tongueWidth
      );
    } else if (direction === 'left') {
      triangle(
        headPx - CELL_SIZE/2, headPy,
        headPx - CELL_SIZE/2 - tongueLength, headPy - tongueWidth,
        headPx - CELL_SIZE/2 - tongueLength, headPy + tongueWidth
      );
    } else if (direction === 'up') {
      triangle(
        headPx, headPy - CELL_SIZE/2,
        headPx - tongueWidth, headPy - CELL_SIZE/2 - tongueLength,
        headPx + tongueWidth, headPy - CELL_SIZE/2 - tongueLength
      );
    } else if (direction === 'down') {
      triangle(
        headPx, headPy + CELL_SIZE/2,
        headPx - tongueWidth, headPy + CELL_SIZE/2 + tongueLength,
        headPx + tongueWidth, headPy + CELL_SIZE/2 + tongueLength
      );
    }
  }
  
  // Body segments with gradient and scale effect
  for (let i = 1; i < snake.length; i++) {
    let seg = snake[i];
    let px = seg.x * CELL_SIZE + CELL_SIZE / 2;
    let py = seg.y * CELL_SIZE + CELL_SIZE / 2;
    
    // Create gradient for body segments
    let segmentGradient = drawingContext.createRadialGradient(
      px, py, 0,
      px, py, CELL_SIZE * 0.3
    );
    
    // Color based on position in snake
    let colorIntensity = map(i, 1, snake.length, 0.9, 0.5);
    segmentGradient.addColorStop(0, `rgba(0, ${200 * colorIntensity}, 0, 1)`);
    segmentGradient.addColorStop(1, `rgba(0, ${100 * colorIntensity}, 0, 0.8)`);
    drawingContext.fillStyle = segmentGradient;
    
    // Size decreases slightly toward tail
    let segmentSize = map(i, 1, snake.length, CELL_SIZE * 0.7, CELL_SIZE * 0.5);
    ellipse(px, py, segmentSize, segmentSize);
    
    // Add scale pattern
    fill(0, 150, 0, 50);
    let scaleSize = segmentSize * 0.4;
    arc(px, py - segmentSize * 0.2, scaleSize, scaleSize, PI, 0);
  }
}

// Draw the food with a pulsing effect
function drawFood() {
  let fx = food.x * CELL_SIZE + CELL_SIZE / 2;
  let fy = food.y * CELL_SIZE + CELL_SIZE / 2;
  
  // Glow effect
  let glowSize = CELL_SIZE * 1.2 + sin(frameCount * 0.1) * 8;
  fill(255, 0, 0, 50);
  ellipse(fx, fy, glowSize, glowSize);
  
  // Gem-like appearance
  push();
  translate(fx, fy);
  rotate(sin(frameCount * 0.05) * 0.2);
  
  // Gem body
  fill(255, 0, 0);
  beginShape();
  vertex(0, -CELL_SIZE * 0.4);
  vertex(CELL_SIZE * 0.3, -CELL_SIZE * 0.1);
  vertex(CELL_SIZE * 0.3, CELL_SIZE * 0.2);
  vertex(0, CELL_SIZE * 0.4);
  vertex(-CELL_SIZE * 0.3, CELL_SIZE * 0.2);
  vertex(-CELL_SIZE * 0.3, -CELL_SIZE * 0.1);
  endShape(CLOSE);
  
  // Shine effect
  fill(255, 200, 200);
  beginShape();
  vertex(0, -CELL_SIZE * 0.3);
  vertex(CELL_SIZE * 0.1, -CELL_SIZE * 0.1);
  vertex(0, -CELL_SIZE * 0.15);
  endShape(CLOSE);
  
  pop();
  
  // Particles around food
  if (frameCount % 5 === 0) {
    fill(255, 100, 100, 150);
    let particleSize = random(3, 6);
    let angle = random(TWO_PI);
    let distance = random(CELL_SIZE * 0.5, CELL_SIZE * 0.7);
    let particleX = fx + cos(angle) * distance;
    let particleY = fy + sin(angle) * distance;
    ellipse(particleX, particleY, particleSize, particleSize);
  }
}

// Draw enemies with different appearances
function drawEnemies() {
  enemies.forEach(enemy => {
    let ex = enemy.x * CELL_SIZE;
    let ey = enemy.y * CELL_SIZE;
    let centerX = ex + CELL_SIZE / 2;
    let centerY = ey + CELL_SIZE / 2;
    
    if (enemy.type === 0) {
      // Static enemy - Spiky block
      push();
      translate(centerX, centerY);
      rotate(frameCount * 0.01); // Slow rotation
      
      // Draw spiky block
      fill(80, 80, 80);
      rect(-CELL_SIZE/2 + 5, -CELL_SIZE/2 + 5, CELL_SIZE - 10, CELL_SIZE - 10);
      
      // Draw spikes
      fill(50, 50, 50);
      for (let i = 0; i < 8; i++) {
        push();
        rotate(i * PI/4);
        triangle(
          -CELL_SIZE/2 + 5, 0,
          -CELL_SIZE/2 - 5, -8,
          -CELL_SIZE/2 - 5, 8
        );
        pop();
      }
      
      // Add glowing core
      fill(255, 0, 0, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, CELL_SIZE * 0.3, CELL_SIZE * 0.3);
      
      pop();
    } else if (enemy.type === 1) {
      // Moving enemy - Evil slime
      
      // Pulsing body
      let pulseSize = sin(frameCount * 0.1 + enemy.x * 0.5) * 5;
      
      // Shadow
      fill(0, 0, 100, 50);
      ellipse(centerX, centerY + CELL_SIZE * 0.3, CELL_SIZE * 0.7, CELL_SIZE * 0.2);
      
      // Slime body with gradient
      let slimeGradient = drawingContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, CELL_SIZE * 0.5
      );
      slimeGradient.addColorStop(0, 'rgba(100, 100, 255, 1)');
      slimeGradient.addColorStop(0.7, 'rgba(0, 0, 200, 0.9)');
      slimeGradient.addColorStop(1, 'rgba(0, 0, 150, 0.7)');
      drawingContext.fillStyle = slimeGradient;
      
      // Main body
      beginShape();
      let slimePoints = 8;
      for (let i = 0; i < slimePoints; i++) {
        let angle = map(i, 0, slimePoints, 0, TWO_PI);
        let radius = CELL_SIZE * 0.4 + sin(frameCount * 0.1 + i) * 3;
        let sx = centerX + cos(angle) * radius;
        let sy = centerY + sin(angle) * radius + pulseSize;
        curveVertex(sx, sy);
      }
      endShape(CLOSE);
      
      // Eyes
      fill(255);
      let eyeX = centerX + (enemy.dir === 'left' ? -8 : (enemy.dir === 'right' ? 8 : 0));
      let eyeY = centerY + (enemy.dir === 'up' ? -8 : (enemy.dir === 'down' ? 8 : 0));
      ellipse(eyeX - 5, eyeY - 5, 8, 8);
      ellipse(eyeX + 5, eyeY - 5, 8, 8);
      
      // Pupils
      fill(255, 0, 0);
      ellipse(eyeX - 5, eyeY - 5, 4, 4);
      ellipse(eyeX + 5, eyeY - 5, 4, 4);
      
      // Mouth
      fill(0);
      arc(eyeX, eyeY + 5, 10, 10, 0, PI);
    }
  });
}

// Draw the user interface
function drawUI() {
  // Position UI on the right side of the canvas
  let uiX = CANVAS_SIZE + 10;
  let uiWidth = UI_WIDTH - 20; // Account for padding
  
  // Background for UI panel
  fill(240);
  rect(CANVAS_SIZE, 0, UI_WIDTH, CANVAS_SIZE);
  
  // Title
  fill(0);
  textSize(18);
  textAlign(LEFT);
  text("SNAKE ROGUELITE", uiX, 30);
  
  // Game stats
  textSize(16);
  text(`Score: ${score}`, uiX, 70);
  text(`Level: ${level}`, uiX, 100);
  text(`Health: ${health}/${maxHealth}`, uiX, 130);
  text(`Speed: ${currentSpeed}`, uiX, 160);
  
  // Gems (persistent currency)
  fill(0, 100, 255);
  text(`Gems: ${gems}`, uiX, 190);
  
  // Special abilities
  if (permanentUpgrades.dashPower > 0) {
    fill(dashCooldown > 0 ? 150 : 0);
    text(`Dash: ${dashCooldown > 0 ? dashCooldown : 'Ready'}`, uiX, 220);
  }
  
  if (permanentUpgrades.wallBounce > 0) {
    fill(wallBounceActive ? 255 : 0, 0, wallBounceActive ? 0 : 0);
    text(`Wall Bounce: ${permanentUpgrades.wallBounce}`, uiX, 250);
  }
  
  if (permanentUpgrades.blockBreaker > 0) {
    fill(0);
    text(`Block Break: ${permanentUpgrades.blockBreaker}`, uiX, 280);
  }
  
  // Health bar
  fill(255, 0, 0); // Red background
  rect(uiX, 140, uiWidth, 10);
  fill(0, 255, 0); // Green health
  let healthWidth = map(health, 0, maxHealth, 0, uiWidth);
  rect(uiX, 140, healthWidth, 10);
  
  // Reset text alignment for other elements
  textAlign(CENTER, CENTER);
}

// Update game logic
function updateGame() {
  // Decrease dash cooldown if active
  if (dashCooldown > 0) {
    dashCooldown--;
  }
  
  // Reset wall bounce flag
  wallBounceActive = false;
  
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

  // Check wall collisions
  let hitWall = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
  
  if (hitWall) {
    console.log("Hit wall! Wall bounce level:", permanentUpgrades.wallBounce);
    
    // Check if wall bounce upgrade is active
    if (permanentUpgrades.wallBounce && permanentUpgrades.wallBounce > 0) {
      console.log("Wall bounce activated!");
      
      // Activate wall bounce
      wallBounceActive = true;
      health -= 1;
      
      // Determine which wall was hit and set position and direction
      if (newHead.x < 0) {
        // Left wall hit - bounce right
        direction = 'right';
        nextDirection = 'right';
        // Keep the snake at the edge
        newHead.x = 0;
      } else if (newHead.x >= GRID_SIZE) {
        // Right wall hit - bounce left
        direction = 'left';
        nextDirection = 'left';
        // Keep the snake at the edge
        newHead.x = GRID_SIZE - 1;
      } else if (newHead.y < 0) {
        // Top wall hit - bounce down
        direction = 'down';
        nextDirection = 'down';
        // Keep the snake at the edge
        newHead.y = 0;
      } else if (newHead.y >= GRID_SIZE) {
        // Bottom wall hit - bounce up
        direction = 'up';
        nextDirection = 'up';
        // Keep the snake at the edge
        newHead.y = GRID_SIZE - 1;
      }
      
      console.log("New direction:", direction);
      
      // Check if out of health after bounce
      if (health <= 0) {
        gameState = 'gameover';
        return;
      }
      
      // Add the bounced head to the snake
      snake.unshift(newHead);
      snake.pop(); // Remove tail to maintain length
      
      // Force an immediate move in the new direction to prevent getting stuck
      let newDir = directions[direction];
      let bouncedHead = {
        x: newHead.x + newDir.dx,
        y: newHead.y + newDir.dy
      };
      
      // Add the new head position after bouncing
      snake.unshift(bouncedHead);
      snake.pop(); // Remove tail to maintain length
      
      return; // Skip the rest of the update to avoid double movement
    } else {
      console.log("No wall bounce upgrade!");
      gameState = 'gameover';
      return;
    }
  }
  
  // Check self collision
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    gameState = 'gameover';
    return;
  }
  
  snake.unshift(newHead);

  // Handle food collision
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    // Add gems when eating food (with multiplier)
    gems += 1 * permanentUpgrades.gemMultiplier;
    saveGameData();
    
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
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (newHead.x === enemy.x && newHead.y === enemy.y) {
      // Check if dash is active to destroy enemy
      if (dashCooldown === 0 && permanentUpgrades.dashPower > 0) {
        // Destroy enemy with dash
        enemies.splice(i, 1);
        dashCooldown = 10 - permanentUpgrades.dashPower; // Cooldown based on dash power level
        gems += 2; // Bonus gems for destroying enemy
        saveGameData();
        continue;
      }
      
      // Check if block breaker is active for static enemies
      if (enemy.type === 0 && permanentUpgrades.blockBreaker > 0) {
        // Chance to break block based on blockBreaker level
        if (random() < permanentUpgrades.blockBreaker * 0.2) { // 20% chance per level
          enemies.splice(i, 1);
          gems += 1; // Bonus gem for breaking block
          saveGameData();
          continue;
        }
      }
      
      // Take damage if no special ability destroyed the enemy
      health -= 1;
      if (health <= 0) {
        gameState = 'gameover';
        return;
      }
    }
  }
}

// Draw the upgrade selection menu
function drawUpgradeMenu() {
  background(220);
  
  // Add UI panel background
  fill(240);
  rect(CANVAS_SIZE, 0, UI_WIDTH, CANVAS_SIZE);
  
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(30);
  text("Choose an upgrade:", CANVAS_SIZE / 2, height / 2 - 50);
  textSize(20);
  text("1. Speed", CANVAS_SIZE / 2, height / 2);
  text("2. Health", CANVAS_SIZE / 2, height / 2 + 30);
}

// Draw the game over screen
function drawGameOver() {
  background(220);
  
  // Add UI panel background
  fill(240);
  rect(CANVAS_SIZE, 0, UI_WIDTH, CANVAS_SIZE);
  
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(40);
  text("Game Over", CANVAS_SIZE / 2, height / 2 - 120);
  textSize(20);
  text(`Final Score: ${score}`, CANVAS_SIZE / 2, height / 2 - 70);
  text(`Gems: ${gems}`, CANVAS_SIZE / 2, height / 2 - 40);
  
  // Permanent upgrade options
  textSize(24);
  text("Permanent Upgrades:", CANVAS_SIZE / 2, height / 2);
  textSize(16);
  text(`1. Speed Boost (${permanentUpgrades.speedBoost}) - 5 gems`, CANVAS_SIZE / 2, height / 2 + 30);
  text(`2. Health Boost (${permanentUpgrades.healthBoost}) - 5 gems`, CANVAS_SIZE / 2, height / 2 + 55);
  text(`3. Gem Multiplier (${permanentUpgrades.gemMultiplier}x) - 10 gems`, CANVAS_SIZE / 2, height / 2 + 80);
  text(`4. Snake Length (${permanentUpgrades.snakeLength}) - 8 gems`, CANVAS_SIZE / 2, height / 2 + 105);
  text(`5. Wall Bounce (${permanentUpgrades.wallBounce}) - 15 gems`, CANVAS_SIZE / 2, height / 2 + 130);
  text(`6. Dash Power (${permanentUpgrades.dashPower}) - 12 gems`, CANVAS_SIZE / 2, height / 2 + 155);
  text(`7. Block Breaker (${permanentUpgrades.blockBreaker}) - 10 gems`, CANVAS_SIZE / 2, height / 2 + 180);
  
  text("Press R to restart", CANVAS_SIZE / 2, height / 2 + 220);
  textSize(14);
  text("Press X to reset all progress", CANVAS_SIZE / 2, height / 2 + 250);
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
    
    // Dash ability with spacebar
    if (keyCode === 32 && dashCooldown === 0 && permanentUpgrades.dashPower > 0) {
      // Activate dash on next frame
      dashCooldown = 10 - permanentUpgrades.dashPower; // Cooldown based on dash power level
    }
  } else if (gameState === 'upgrade') {
    // Upgrade selection
    if (key === '1') {
      currentSpeed += 1; // Smaller speed increase
      frameRate(currentSpeed);
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
    // Permanent upgrades
    if (key === '1' && gems >= 5) {
      permanentUpgrades.speedBoost = (permanentUpgrades.speedBoost || 0) + 1;
      gems -= 5;
      saveGameData();
    } else if (key === '2' && gems >= 5) {
      permanentUpgrades.healthBoost = (permanentUpgrades.healthBoost || 0) + 1;
      gems -= 5;
      saveGameData();
    } else if (key === '3' && gems >= 10) {
      permanentUpgrades.gemMultiplier = (permanentUpgrades.gemMultiplier || 1) + 0.5;
      gems -= 10;
      saveGameData();
    } else if (key === '4' && gems >= 8) {
      permanentUpgrades.snakeLength = (permanentUpgrades.snakeLength || 0) + 1;
      gems -= 8;
      saveGameData();
    } else if (key === '5' && gems >= 15) {
      permanentUpgrades.wallBounce = (permanentUpgrades.wallBounce || 0) + 1;
      gems -= 15;
      saveGameData();
    } else if (key === '6' && gems >= 12) {
      permanentUpgrades.dashPower = (permanentUpgrades.dashPower || 0) + 1;
      gems -= 12;
      saveGameData();
    } else if (key === '7' && gems >= 10) {
      permanentUpgrades.blockBreaker = (permanentUpgrades.blockBreaker || 0) + 1;
      gems -= 10;
      saveGameData();
    }
    
    // Reset all progress
    if (key === 'x' || key === 'X') {
      resetGameData();
      gameState = 'playing';
    }
    
    // Restart game
    if (key === 'r' || key === 'R') {
      initGame();
    }
  }
}