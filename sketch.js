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

// Sound effects
let soundEat;
let soundDie;
let soundHurt;
let soundLevelUp;
let soundDash;
let soundWallBounce;
let soundBlockBreak;
let soundBgMusic;
let soundGameOver;

// Visual effects
let particles = []; // Array to store particle effects
let screenShake = 0; // Screen shake effect intensity
let titleAlpha = 255; // For title screen fade effect
let logoY = -100; // Logo starting position for animation
let gameStartTime; // Track when game started for achievements
let achievementDisplay = null; // Current achievement being displayed

// Game states
const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  UPGRADE: 'upgrade',
  GAMEOVER: 'gameover',
  ACHIEVEMENTS: 'achievements'
};

// Achievement system
let achievements = [
  { id: 'first_blood', name: 'First Blood', description: 'Die for the first time', unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Reach speed level 5', unlocked: false },
  { id: 'wall_master', name: 'Wall Master', description: 'Bounce off walls 10 times', unlocked: false },
  { id: 'gem_hoarder', name: 'Gem Hoarder', description: 'Collect 100 gems total', unlocked: false },
  { id: 'snake_charmer', name: 'Snake Charmer', description: 'Reach snake length 15', unlocked: false }
];

// Stats tracking
let stats = {
  totalGems: 0,
  wallBounces: 0,
  enemiesDestroyed: 0,
  blocksDestroyed: 0,
  highScore: 0,
  timePlayed: 0,
  deaths: 0
};

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

// Preload function to load sounds
function preload() {
  try {
    // Check if loadSound is defined
    if (typeof loadSound === 'undefined') {
      // Create a dummy loadSound function if it doesn't exist
      window.loadSound = function() {
        // Return an object with play, loop, and setVolume methods that do nothing
        return {
          play: function() {},
          loop: function() {},
          setVolume: function() {}
        };
      };
      console.warn("Sound library not loaded. Sound features will be disabled.");
    }
    
    // Try to load sound files with error handling
    try { soundEat = loadSound('sounds/eat.mp3'); } 
    catch(e) { console.warn("Failed to load eat sound:", e); soundEat = { play: function() {} }; }
    
    try { soundDie = loadSound('sounds/die.mp3'); } 
    catch(e) { console.warn("Failed to load die sound:", e); soundDie = { play: function() {} }; }
    
    try { soundHurt = loadSound('sounds/hurt.mp3'); } 
    catch(e) { console.warn("Failed to load hurt sound:", e); soundHurt = { play: function() {} }; }
    
    try { soundLevelUp = loadSound('sounds/levelup.mp3'); } 
    catch(e) { console.warn("Failed to load level up sound:", e); soundLevelUp = { play: function() {} }; }
    
    try { soundDash = loadSound('sounds/dash.mp3'); } 
    catch(e) { console.warn("Failed to load dash sound:", e); soundDash = { play: function() {} }; }
    
    try { soundWallBounce = loadSound('sounds/wallbounce.mp3'); } 
    catch(e) { console.warn("Failed to load wall bounce sound:", e); soundWallBounce = { play: function() {} }; }
    
    try { soundBlockBreak = loadSound('sounds/blockbreak.mp3'); } 
    catch(e) { console.warn("Failed to load block break sound:", e); soundBlockBreak = { play: function() {} }; }
    
    try { soundBgMusic = loadSound('sounds/bgmusic.mp3'); } 
    catch(e) { console.warn("Failed to load background music:", e); soundBgMusic = { loop: function() {}, setVolume: function() {} }; }
    
    try { soundGameOver = loadSound('sounds/gameover.mp3'); } 
    catch(e) { console.warn("Failed to load game over sound:", e); soundGameOver = { play: function() {} }; }
  } catch (e) {
    console.error("Error in preload function:", e);
    // Create dummy sound objects if loading fails
    soundEat = soundDie = soundHurt = soundLevelUp = soundDash = 
    soundWallBounce = soundBlockBreak = soundGameOver = { play: function() {} };
    soundBgMusic = { loop: function() {}, setVolume: function() {} };
  }
}

// Setup function to initialize the game
function setup() {
  let canvas = createCanvas(CANVAS_SIZE + UI_WIDTH, CANVAS_SIZE);
  canvas.parent('gameContainer');
  frameRate(BASE_SPEED); // Use BASE_SPEED for initial game speed
  
  // Load saved data if available
  loadGameData();
  
  // Set initial game state to title screen
  gameState = GAME_STATE.TITLE;
  
  // Initialize particles array
  particles = [];
  
  // Add a click listener to the canvas to enable audio context
  canvas.mousePressed(enableAudioContext);
}

// Function to enable audio context after user interaction
function enableAudioContext() {
  // Only try to start audio context if we're in the title screen
  if (gameState === GAME_STATE.TITLE) {
    try {
      // Get the audio context
      if (getAudioContext) {
        let audioContext = getAudioContext();
        
        // Resume the audio context if it's suspended
        if (audioContext && audioContext.state !== 'running') {
          audioContext.resume().then(() => {
            console.log('AudioContext started!');
            
            // Start background music after audio context is resumed
            if (soundBgMusic && typeof soundBgMusic.setVolume === 'function') {
              soundBgMusic.setVolume(0.3);
              
              // Only try to loop if the method exists
              if (typeof soundBgMusic.loop === 'function') {
                soundBgMusic.loop();
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn("Could not start AudioContext:", e);
    }
  }
}

// Load saved game data from localStorage
function loadGameData() {
  if (localStorage.getItem('snakeRogueLiteGems')) {
    gems = parseInt(localStorage.getItem('snakeRogueLiteGems'));
    stats.totalGems = gems; // Initialize total gems with current gems
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
  
  // Load stats and achievements
  if (localStorage.getItem('snakeRogueLiteStats')) {
    stats = JSON.parse(localStorage.getItem('snakeRogueLiteStats'));
  }
  
  if (localStorage.getItem('snakeRogueLiteAchievements')) {
    let savedAchievements = JSON.parse(localStorage.getItem('snakeRogueLiteAchievements'));
    achievements.forEach((achievement, index) => {
      if (savedAchievements[index]) {
        achievement.unlocked = savedAchievements[index].unlocked;
      }
    });
  }
}

// Save game data to localStorage
function saveGameData() {
  localStorage.setItem('snakeRogueLiteGems', gems);
  localStorage.setItem('snakeRogueLiteUpgrades', JSON.stringify(permanentUpgrades));
  localStorage.setItem('snakeRogueLiteStats', JSON.stringify(stats));
  
  // Save achievements (just the unlocked status)
  let achievementStatus = achievements.map(a => ({ unlocked: a.unlocked }));
  localStorage.setItem('snakeRogueLiteAchievements', JSON.stringify(achievementStatus));
  
  // Update score for social sharing and game details display
  if (window.updateGameScore) {
    window.updateGameScore(score);
  }
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
  
  // Reset stats
  stats = {
    totalGems: 0,
    wallBounces: 0,
    enemiesDestroyed: 0,
    blocksDestroyed: 0,
    highScore: 0,
    timePlayed: 0,
    deaths: 0
  };
  
  // Reset achievements
  achievements.forEach(achievement => {
    achievement.unlocked = false;
  });
  
  localStorage.removeItem('snakeRogueLiteGems');
  localStorage.removeItem('snakeRogueLiteUpgrades');
  localStorage.removeItem('snakeRogueLiteStats');
  localStorage.removeItem('snakeRogueLiteAchievements');
  
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
  particles = [];
  screenShake = 0;
  gameStartTime = millis();
  
  // Reset score display
  if (window.updateGameScore) {
    window.updateGameScore(score);
  }
  
  startLevel();
  gameState = GAME_STATE.PLAYING;
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
  // Apply screen shake effect if active
  if (screenShake > 0) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
    screenShake *= 0.9; // Reduce shake over time
    if (screenShake < 0.5) screenShake = 0;
  }
  
  if (gameState === GAME_STATE.TITLE) {
    drawTitleScreen();
  } else if (gameState === GAME_STATE.PLAYING) {
    background(220); // Light gray background
    drawGrid();
    drawSnake();
    drawFood();
    drawEnemies();
    updateGame();
    drawUI();
    updateParticles();
  } else if (gameState === GAME_STATE.UPGRADE) {
    drawUpgradeMenu();
  } else if (gameState === GAME_STATE.GAMEOVER) {
    drawGameOver();
  } else if (gameState === GAME_STATE.ACHIEVEMENTS) {
    drawAchievements();
  }
  
  // Draw achievement notification if active
  if (achievementDisplay) {
    drawAchievementNotification();
  }
  
  // Update stats
  if (gameState === GAME_STATE.PLAYING) {
    stats.timePlayed += 1/frameRate();
  }
}

// Draw the title screen
function drawTitleScreen() {
  background(0);
  
  // Animate logo
  if (logoY < height/4) {
    logoY += 5;
  }
  
  // Draw game logo
  textAlign(CENTER, CENTER);
  textSize(50);
  fill(0, 255, 0);
  text("SNAKE", width/2, logoY);
  textSize(30);
  fill(255, 0, 0);
  text("ROGUELITE", width/2, logoY + 50);
  
  // Pulsing effect for "Press any key"
  let pulseAlpha = 127 + 127 * sin(frameCount * 0.05);
  fill(255, pulseAlpha);
  textSize(20);
  text("Press any key to start", width/2, height/2 + 100);
  
  // Sound message
  fill(255, 200);
  textSize(14);
  text("Click anywhere to enable sound", width/2, height/2 + 130);
  
  // Draw stats
  textAlign(LEFT, CENTER);
  textSize(16);
  fill(200);
  text(`High Score: ${stats.highScore}`, 50, height - 120);
  text(`Total Gems: ${stats.totalGems}`, 50, height - 90);
  text(`Deaths: ${stats.deaths}`, 50, height - 60);
  
  // Draw achievements
  textAlign(RIGHT, CENTER);
  text(`Achievements: ${achievements.filter(a => a.unlocked).length}/${achievements.length}`, width - 50, height - 120);
  
  // Draw social buttons
  drawSocialButtons(width/2, height - 50);
}

// Draw social sharing buttons
function drawSocialButtons(x, y) {
  textAlign(CENTER, CENTER);
  textSize(16);
  fill(255);
  text("Share:", x, y - 30);
  
  // Twitter button
  fill(29, 161, 242);
  rect(x - 100, y, 60, 30, 5);
  fill(255);
  text("Twitter", x - 70, y + 15);
  
  // Facebook button
  fill(66, 103, 178);
  rect(x - 30, y, 60, 30, 5);
  fill(255);
  text("FB", x, y + 15);
  
  // Copy link button
  fill(40, 167, 69);
  rect(x + 40, y, 60, 30, 5);
  fill(255);
  text("Copy", x + 70, y + 15);
}

// Check for achievement unlocks
function checkAchievements() {
  // First Blood
  if (!achievements[0].unlocked && stats.deaths > 0) {
    unlockAchievement(0);
  }
  
  // Speed Demon
  if (!achievements[1].unlocked && permanentUpgrades.speedBoost >= 5) {
    unlockAchievement(1);
  }
  
  // Wall Master
  if (!achievements[2].unlocked && stats.wallBounces >= 10) {
    unlockAchievement(2);
  }
  
  // Gem Hoarder
  if (!achievements[3].unlocked && stats.totalGems >= 100) {
    unlockAchievement(3);
  }
  
  // Snake Charmer
  if (!achievements[4].unlocked && snake.length >= 15) {
    unlockAchievement(4);
  }
}

// Unlock an achievement
function unlockAchievement(index) {
  if (!achievements[index].unlocked) {
    achievements[index].unlocked = true;
    achievementDisplay = {
      name: achievements[index].name,
      description: achievements[index].description,
      timer: 180 // Display for 3 seconds (60 frames per second)
    };
    saveGameData();
  }
}

// Draw achievement notification
function drawAchievementNotification() {
  if (achievementDisplay) {
    // Background
    fill(0, 0, 0, 200);
    rect(width/2 - 150, 20, 300, 60, 10);
    
    // Text
    textAlign(CENTER, CENTER);
    fill(255, 215, 0); // Gold color
    textSize(18);
    text("Achievement Unlocked!", width/2, 40);
    fill(255);
    textSize(14);
    text(achievementDisplay.name, width/2, 65);
    
    // Decrease timer
    achievementDisplay.timer--;
    if (achievementDisplay.timer <= 0) {
      achievementDisplay = null;
    }
  }
}

// Draw the achievements screen
function drawAchievements() {
  background(0);
  
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255, 215, 0); // Gold color
  text("ACHIEVEMENTS", width/2, 50);
  
  // Draw each achievement
  for (let i = 0; i < achievements.length; i++) {
    let y = 120 + i * 70;
    
    // Background
    if (achievements[i].unlocked) {
      fill(0, 100, 0); // Green for unlocked
    } else {
      fill(50, 50, 50); // Gray for locked
    }
    rect(width/2 - 200, y, 400, 60, 10);
    
    // Text
    textAlign(LEFT, CENTER);
    if (achievements[i].unlocked) {
      fill(255, 215, 0); // Gold for unlocked
    } else {
      fill(150); // Light gray for locked
    }
    textSize(18);
    text(achievements[i].name, width/2 - 180, y + 15);
    
    textSize(14);
    fill(200);
    text(achievements[i].description, width/2 - 180, y + 40);
    
    // Icon
    if (achievements[i].unlocked) {
      fill(255, 215, 0);
      star(width/2 + 170, y + 30, 15, 7, 5);
    } else {
      fill(100);
      ellipse(width/2 + 170, y + 30, 20, 20);
    }
  }
  
  // Back button
  fill(100);
  rect(width/2 - 50, height - 70, 100, 40, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("BACK", width/2, height - 50);
}

// Draw a star shape for achievements
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Update and draw particles
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      fill(p.r, p.g, p.b, p.life);
      ellipse(p.x, p.y, p.size, p.size);
    }
  }
}

// Add particles at a position
function addParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(3, 8),
      life: 255,
      decay: random(5, 10),
      r: color.r || 255,
      g: color.g || 255,
      b: color.b || 255
    });
  }
}

// Add screen shake effect
function addScreenShake(intensity) {
  screenShake = intensity;
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
  
  // Title with pulsing effect
  let titlePulse = sin(frameCount * 0.05) * 2;
  fill(0, 150, 0);
  textSize(18 + titlePulse);
  textAlign(LEFT);
  text("SNAKE ROGUELITE", uiX, 30);
  
  // Game stats
  textSize(16);
  fill(0);
  text(`Score: ${score}`, uiX, 70);
  text(`Level: ${level}`, uiX, 100);
  text(`Health: ${health}/${maxHealth}`, uiX, 130);
  text(`Speed: ${currentSpeed}`, uiX, 160);
  
  // Gems (persistent currency)
  fill(0, 100, 255);
  text(`Gems: ${gems}`, uiX, 190);
  
  // Special abilities
  if (permanentUpgrades.dashPower > 0) {
    // Dash cooldown bar
    fill(150);
    rect(uiX, 220, uiWidth, 10);
    
    if (dashCooldown > 0) {
      // Cooldown progress
      let cooldownWidth = map(dashCooldown, 10 - permanentUpgrades.dashPower, 0, 0, uiWidth);
      fill(255, 165, 0);
      rect(uiX, 220, cooldownWidth, 10);
      fill(150);
      text(`Dash: Cooling down`, uiX, 245);
    } else {
      // Ready to dash
      fill(255, 165, 0);
      rect(uiX, 220, uiWidth, 10);
      text(`Dash: READY! (Space)`, uiX, 245);
    }
  }
  
  if (permanentUpgrades.wallBounce > 0) {
    fill(wallBounceActive ? 255 : 0, 0, wallBounceActive ? 0 : 0);
    text(`Wall Bounce: ${permanentUpgrades.wallBounce}`, uiX, 270);
  }
  
  if (permanentUpgrades.blockBreaker > 0) {
    fill(0);
    let chance = (permanentUpgrades.blockBreaker * 20).toFixed(0);
    text(`Block Break: ${chance}%`, uiX, 295);
  }
  
  // Health bar
  fill(255, 0, 0); // Red background
  rect(uiX, 140, uiWidth, 10);
  fill(0, 255, 0); // Green health
  let healthWidth = map(health, 0, maxHealth, 0, uiWidth);
  rect(uiX, 140, healthWidth, 10);
  
  // Social buttons in UI
  if (CANVAS_SIZE >= 500) { // Only show if canvas is large enough
    fill(0);
    textSize(14);
    text("Share:", uiX, CANVAS_SIZE - 80);
    
    // Draw small social buttons
    let btnY = CANVAS_SIZE - 50;
    let btnWidth = 40;
    let btnHeight = 25;
    let btnSpacing = 45;
    
    // Twitter button
    fill(29, 161, 242);
    rect(uiX, btnY, btnWidth, btnHeight, 5);
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text("Twitter", uiX + btnWidth/2, btnY + btnHeight/2);
    
    // Facebook button
    fill(66, 103, 178);
    rect(uiX + btnSpacing, btnY, btnWidth, btnHeight, 5);
    fill(255);
    text("FB", uiX + btnSpacing + btnWidth/2, btnY + btnHeight/2);
    
    // Copy button
    fill(40, 167, 69);
    rect(uiX + btnSpacing*2, btnY, btnWidth, btnHeight, 5);
    fill(255);
    text("Copy", uiX + btnSpacing*2 + btnWidth/2, btnY + btnHeight/2);
    
    // Reset text alignment for other elements
    textAlign(LEFT);
  }
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
      
      // Play wall bounce sound
      soundWallBounce.play();
      
      // Add screen shake
      addScreenShake(5);
      
      // Track wall bounces for achievements
      stats.wallBounces++;
      checkAchievements();
      
      // Determine which wall was hit and set position and direction
      if (newHead.x < 0) {
        // Left wall hit - bounce right
        direction = 'right';
        nextDirection = 'right';
        // Keep the snake at the edge
        newHead.x = 0;
        
        // Add particles at wall impact
        addParticles(0, newHead.y * CELL_SIZE + CELL_SIZE/2, 15, {r: 255, g: 0, b: 0});
      } else if (newHead.x >= GRID_SIZE) {
        // Right wall hit - bounce left
        direction = 'left';
        nextDirection = 'left';
        // Keep the snake at the edge
        newHead.x = GRID_SIZE - 1;
        
        // Add particles at wall impact
        addParticles(CANVAS_SIZE, newHead.y * CELL_SIZE + CELL_SIZE/2, 15, {r: 255, g: 0, b: 0});
      } else if (newHead.y < 0) {
        // Top wall hit - bounce down
        direction = 'down';
        nextDirection = 'down';
        // Keep the snake at the edge
        newHead.y = 0;
        
        // Add particles at wall impact
        addParticles(newHead.x * CELL_SIZE + CELL_SIZE/2, 0, 15, {r: 255, g: 0, b: 0});
      } else if (newHead.y >= GRID_SIZE) {
        // Bottom wall hit - bounce up
        direction = 'up';
        nextDirection = 'up';
        // Keep the snake at the edge
        newHead.y = GRID_SIZE - 1;
        
        // Add particles at wall impact
        addParticles(newHead.x * CELL_SIZE + CELL_SIZE/2, CANVAS_SIZE, 15, {r: 255, g: 0, b: 0});
      }
      
      console.log("New direction:", direction);
      
      // Check if out of health after bounce
      if (health <= 0) {
        gameOver();
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
      gameOver();
      return;
    }
  }
  
  // Check self collision
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    gameOver();
    return;
  }
  
  snake.unshift(newHead);

  // Handle food collision
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    // Add gems when eating food (with multiplier)
    let gemsEarned = 1 * permanentUpgrades.gemMultiplier;
    gems += gemsEarned;
    stats.totalGems += gemsEarned;
    
    // Update score display
    if (window.updateGameScore) {
      window.updateGameScore(score);
    }
    
    saveGameData();
    
    // Play eat sound
    soundEat.play();
    
    // Add particles at food location
    addParticles(food.x * CELL_SIZE + CELL_SIZE/2, food.y * CELL_SIZE + CELL_SIZE/2, 20, {r: 255, g: 0, b: 0});
    
    // Check achievements
    checkAchievements();
    
    foodEaten += 1;
    if (foodEaten >= 5) {
      // Level complete
      soundLevelUp.play();
      addScreenShake(10);
      gameState = GAME_STATE.UPGRADE; // Level complete after 5 food
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
        
        // Play dash sound
        soundDash.play();
        
        // Add particles at enemy location
        addParticles(enemy.x * CELL_SIZE + CELL_SIZE/2, enemy.y * CELL_SIZE + CELL_SIZE/2, 30, 
                    {r: enemy.type === 0 ? 100 : 0, g: 0, b: enemy.type === 1 ? 255 : 0});
        
        // Add screen shake
        addScreenShake(3);
        
        // Track enemy destruction for stats
        stats.enemiesDestroyed++;
        
        // Add bonus gems
        let bonusGems = 2;
        gems += bonusGems;
        stats.totalGems += bonusGems;
        saveGameData();
        
        // Check achievements
        checkAchievements();
        
        continue;
      }
      
      // Check if block breaker is active for static enemies
      if (enemy.type === 0 && permanentUpgrades.blockBreaker > 0) {
        // Chance to break block based on blockBreaker level
        if (random() < permanentUpgrades.blockBreaker * 0.2) { // 20% chance per level
          enemies.splice(i, 1);
          
          // Play block break sound
          soundBlockBreak.play();
          
          // Add particles at block location
          addParticles(enemy.x * CELL_SIZE + CELL_SIZE/2, enemy.y * CELL_SIZE + CELL_SIZE/2, 25, {r: 100, g: 100, b: 100});
          
          // Add screen shake
          addScreenShake(2);
          
          // Track block destruction for stats
          stats.blocksDestroyed++;
          
          // Add bonus gem
          let bonusGems = 1;
          gems += bonusGems;
          stats.totalGems += bonusGems;
          saveGameData();
          
          // Check achievements
          checkAchievements();
          
          continue;
        }
      }
      
      // Take damage if no special ability destroyed the enemy
      health -= 1;
      
      // Play hurt sound
      soundHurt.play();
      
      // Add screen shake
      addScreenShake(5);
      
      if (health <= 0) {
        gameOver();
        return;
      }
    }
  }
}

// Game over function
function gameOver() {
  // Play game over sound
  soundDie.play();
  
  // Add intense screen shake
  addScreenShake(15);
  
  // Add explosion particles at snake head
  let head = snake[0];
  addParticles(head.x * CELL_SIZE + CELL_SIZE/2, head.y * CELL_SIZE + CELL_SIZE/2, 50, {r: 255, g: 0, b: 0});
  
  // Update stats
  stats.deaths++;
  if (score > stats.highScore) {
    stats.highScore = score;
  }
  
  // Check achievements
  checkAchievements();
  
  // Save game data
  saveGameData();
  
  // Set game state to game over
  gameState = GAME_STATE.GAMEOVER;
}

// Draw the game over screen
function drawGameOver() {
  background(0, 0, 0, 200); // Semi-transparent black
  
  // Add UI panel background
  fill(240);
  rect(CANVAS_SIZE, 0, UI_WIDTH, CANVAS_SIZE);
  
  // Game over text with animation
  let pulseSize = 1 + sin(frameCount * 0.1) * 0.1;
  push();
  translate(CANVAS_SIZE / 2, height / 2 - 120);
  scale(pulseSize);
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  textSize(40);
  text("GAME OVER", 0, 0);
  pop();
  
  textAlign(CENTER, CENTER);
  fill(255);
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
  
  // Game controls
  fill(255);
  text("Press R to restart", CANVAS_SIZE / 2, height / 2 + 220);
  textSize(14);
  text("Press X to reset all progress", CANVAS_SIZE / 2, height / 2 + 250);
  text("Press A to view achievements", CANVAS_SIZE / 2, height / 2 + 270);
  
  // Social sharing buttons
  drawSocialButtons(CANVAS_SIZE / 2, height / 2 + 310);
  
  // Update particles
  updateParticles();
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

// Handle keyboard input
function keyPressed() {
  if (gameState === GAME_STATE.TITLE) {
    // Any key starts the game from title screen
    initGame();
    return;
  }
  
  if (gameState === GAME_STATE.PLAYING) {
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
    
    // Press 'P' to pause/unpause
    if (key === 'p' || key === 'P') {
      if (isLooping()) {
        noLoop();
      } else {
        loop();
      }
    }
    
    // Press 'A' to view achievements
    if (key === 'a' || key === 'A') {
      gameState = GAME_STATE.ACHIEVEMENTS;
    }
  } else if (gameState === GAME_STATE.UPGRADE) {
    // Upgrade selection
    if (key === '1') {
      currentSpeed += 1; // Smaller speed increase
      frameRate(currentSpeed);
      level += 1;
      startLevel();
      gameState = GAME_STATE.PLAYING;
    } else if (key === '2') {
      maxHealth += 1; // Increase health
      health = maxHealth;
      level += 1;
      startLevel();
      gameState = GAME_STATE.PLAYING;
    }
  } else if (gameState === GAME_STATE.GAMEOVER) {
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
      gameState = GAME_STATE.PLAYING;
    }
    
    // Restart game
    if (key === 'r' || key === 'R') {
      initGame();
    }
    
    // View achievements
    if (key === 'a' || key === 'A') {
      gameState = GAME_STATE.ACHIEVEMENTS;
    }
  } else if (gameState === GAME_STATE.ACHIEVEMENTS) {
    // Back to previous screen
    if (key === 'b' || key === 'B' || keyCode === ESCAPE || key === ' ') {
      if (score > 0) {
        gameState = GAME_STATE.GAMEOVER;
      } else {
        gameState = GAME_STATE.TITLE;
      }
    }
  }
}

// Handle mouse clicks for UI elements
function mousePressed() {
  // Handle social button clicks in game UI
  if (gameState === GAME_STATE.PLAYING) {
    let uiX = CANVAS_SIZE + 10;
    let btnY = CANVAS_SIZE - 50;
    let btnWidth = 40;
    let btnHeight = 25;
    let btnSpacing = 45;
    
    // Check if clicking Twitter button
    if (mouseX >= uiX && mouseX <= uiX + btnWidth && 
        mouseY >= btnY && mouseY <= btnY + btnHeight) {
      shareTwitter();
    }
    
    // Check if clicking Facebook button
    if (mouseX >= uiX + btnSpacing && mouseX <= uiX + btnSpacing + btnWidth && 
        mouseY >= btnY && mouseY <= btnY + btnHeight) {
      shareFacebook();
    }
    
    // Check if clicking Copy button
    if (mouseX >= uiX + btnSpacing*2 && mouseX <= uiX + btnSpacing*2 + btnWidth && 
        mouseY >= btnY && mouseY <= btnY + btnHeight) {
      copyLink();
    }
  }
  
  // Handle social button clicks on title screen
  if (gameState === GAME_STATE.TITLE) {
    let x = width/2;
    let y = height - 50;
    
    // Twitter button
    if (mouseX >= x - 100 && mouseX <= x - 40 && 
        mouseY >= y && mouseY <= y + 30) {
      shareTwitter();
    }
    
    // Facebook button
    if (mouseX >= x - 30 && mouseX <= x + 30 && 
        mouseY >= y && mouseY <= y + 30) {
      shareFacebook();
    }
    
    // Copy link button
    if (mouseX >= x + 40 && mouseX <= x + 100 && 
        mouseY >= y && mouseY <= y + 30) {
      copyLink();
    }
  }
  
  // Handle social button clicks on game over screen
  if (gameState === GAME_STATE.GAMEOVER) {
    let x = CANVAS_SIZE / 2;
    let y = height / 2 + 310;
    
    // Twitter button
    if (mouseX >= x - 100 && mouseX <= x - 40 && 
        mouseY >= y && mouseY <= y + 30) {
      shareTwitter();
    }
    
    // Facebook button
    if (mouseX >= x - 30 && mouseX <= x + 30 && 
        mouseY >= y && mouseY <= y + 30) {
      shareFacebook();
    }
    
    // Copy link button
    if (mouseX >= x + 40 && mouseX <= x + 100 && 
        mouseY >= y && mouseY <= y + 30) {
      copyLink();
    }
  }
  
  // Handle back button in achievements screen
  if (gameState === GAME_STATE.ACHIEVEMENTS) {
    if (mouseX >= width/2 - 50 && mouseX <= width/2 + 50 && 
        mouseY >= height - 70 && mouseY <= height - 30) {
      if (score > 0) {
        gameState = GAME_STATE.GAMEOVER;
      } else {
        gameState = GAME_STATE.TITLE;
      }
    }
  }
}

// Share functions that call the global functions
function shareTwitter() {
  if (typeof window.shareTwitter === 'function') {
    window.shareTwitter();
  }
}

function shareFacebook() {
  if (typeof window.shareFacebook === 'function') {
    window.shareFacebook();
  }
}

function copyLink() {
  if (typeof window.copyLink === 'function') {
    window.copyLink();
  }
}