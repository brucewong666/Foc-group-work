const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const statusEl = document.getElementById("status");
const restartButton = document.getElementById("restart");

const gridSize = 24;
const tileCount = canvas.width / gridSize;

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const powerupTypes = [
  { type: "boost", label: "加速" },
  { type: "slow", label: "减速" },
  { type: "shield", label: "护盾" },
  { type: "double", label: "双倍" },
];

let snake;
let direction;
let nextDirection;
let food;
let powerups;
let score;
let highScore = Number.parseInt(localStorage.getItem("snakeHighScore") || "0", 10);
let speed = 7;
let speedModifier = 1;
let scoreMultiplier = 1;
let invincible = false;
let activeEffects;
let lastFrameTime = 0;
let lastPowerupTime = 0;
let lastTickTime = 0;
let paused = false;
let gameOver = false;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 7;
  speedModifier = 1;
  scoreMultiplier = 1;
  invincible = false;
  powerups = [];
  activeEffects = {};
  paused = false;
  gameOver = false;
  statusEl.textContent = "";
  lastFrameTime = 0;
  lastPowerupTime = 0;
  lastTickTime = 0;
  placeFood();
  updateScore();
}

function updateScore() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
}

function placeFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (
    snake.some((segment) => segment.x === position.x && segment.y === position.y) ||
    powerups.some((item) => item.x === position.x && item.y === position.y)
  );
  food = position;
}

function placePowerup() {
  if (powerups.length >= 2) {
    return;
  }
  const pick = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (
    snake.some((segment) => segment.x === position.x && segment.y === position.y) ||
    (food && food.x === position.x && food.y === position.y) ||
    powerups.some((item) => item.x === position.x && item.y === position.y)
  );
  powerups.push({ ...position, type: pick.type, label: pick.label, ttl: 12000 });
}

function drawGrid() {
  context.strokeStyle = "rgba(255, 255, 255, 0.05)";
  context.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const position = i * gridSize;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawFood() {
  const { x, y } = food;
  const centerX = x * gridSize + gridSize / 2;
  const centerY = y * gridSize + gridSize / 2;
  const radius = gridSize * 0.35;

  const gradient = context.createRadialGradient(
    centerX - radius / 3,
    centerY - radius / 3,
    radius / 2,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, "#fde68a");
  gradient.addColorStop(1, "#f97316");

  context.shadowColor = "rgba(249, 115, 22, 0.6)";
  context.shadowBlur = 12;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
}

function drawPowerups() {
  powerups.forEach((item) => {
    const centerX = item.x * gridSize + gridSize / 2;
    const centerY = item.y * gridSize + gridSize / 2;
    const radius = gridSize * 0.34;

    const gradient = context.createRadialGradient(
      centerX - radius / 2,
      centerY - radius / 2,
      radius / 4,
      centerX,
      centerY,
      radius
    );
    const colors = {
      boost: ["#7dd3fc", "#0284c7"],
      slow: ["#fca5a5", "#ef4444"],
      shield: ["#a7f3d0", "#059669"],
      double: ["#fde68a", "#f59e0b"],
    };
    const [start, end] = colors[item.type] ?? ["#e5e7eb", "#6b7280"];
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);

    context.shadowColor = "rgba(255, 255, 255, 0.35)";
    context.shadowBlur = 10;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(15, 23, 42, 0.75)";
    context.font = "bold 12px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(item.label, centerX, centerY + 1);
  });
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const segmentX = segment.x * gridSize;
    const segmentY = segment.y * gridSize;
    const gradient = context.createLinearGradient(
      segmentX,
      segmentY,
      segmentX + gridSize,
      segmentY + gridSize
    );
    gradient.addColorStop(0, isHead ? "#6ee7b7" : "#34d399");
    gradient.addColorStop(1, "#047857");
    context.fillStyle = gradient;
    context.strokeStyle = "rgba(6, 78, 59, 0.85)";
    context.lineWidth = 2;
    context.shadowColor = "rgba(16, 185, 129, 0.4)";
    context.shadowBlur = isHead ? 10 : 6;
    context.beginPath();
    context.roundRect(
      segmentX + 2,
      segmentY + 2,
      gridSize - 4,
      gridSize - 4,
      6
    );
    context.fill();
    context.stroke();

    context.shadowBlur = 0;
    context.fillStyle = "rgba(255, 255, 255, 0.3)";
    context.beginPath();
    context.roundRect(
      segmentX + 6,
      segmentY + 6,
      gridSize / 2.4,
      gridSize / 2.4,
      4
    );
    context.fill();
  });
}

function applyPowerup(type) {
  const now = performance.now();
  if (type === "boost") {
    speedModifier = 1.35;
    activeEffects.speed = now + 7000;
    statusEl.textContent = "加速中！";
  } else if (type === "slow") {
    speedModifier = 0.75;
    activeEffects.speed = now + 7000;
    statusEl.textContent = "减速收集更多！";
  } else if (type === "shield") {
    invincible = true;
    activeEffects.shield = now + 6000;
    statusEl.textContent = "护盾开启，暂时无敌！";
  } else if (type === "double") {
    scoreMultiplier = 2;
    activeEffects.double = now + 8000;
    statusEl.textContent = "得分翻倍！";
  }
}

function updateEffects(timestamp) {
  if (activeEffects.speed && timestamp > activeEffects.speed) {
    speedModifier = 1;
    delete activeEffects.speed;
  }
  if (activeEffects.shield && timestamp > activeEffects.shield) {
    invincible = false;
    delete activeEffects.shield;
  }
  if (activeEffects.double && timestamp > activeEffects.double) {
    scoreMultiplier = 1;
    delete activeEffects.double;
  }
  if (Object.keys(activeEffects).length === 0 && statusEl.textContent) {
    statusEl.textContent = "";
  }
}

function updateSnake() {
  direction = nextDirection;
  const newHead = {
    x: (snake[0].x + direction.x + tileCount) % tileCount,
    y: (snake[0].y + direction.y + tileCount) % tileCount,
  };

  if (!invincible && snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  let ateFood = false;
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10 * scoreMultiplier;
    speed = Math.min(16, speed + 0.35);
    placeFood();
    ateFood = true;
  }

  const powerupIndex = powerups.findIndex(
    (item) => item.x === newHead.x && item.y === newHead.y
  );
  if (powerupIndex !== -1) {
    const [picked] = powerups.splice(powerupIndex, 1);
    applyPowerup(picked.type);
    score += 5 * scoreMultiplier;
    ateFood = true;
  }

  if (!ateFood) {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  statusEl.textContent = "游戏结束，按 R 重新开始。";
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snakeHighScore", String(highScore));
  }
  updateScore();
}

function render() {
  context.fillStyle = "#0a0c10";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawPowerups();
  drawSnake();
}

function gameLoop(timestamp) {
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }
  if (!lastTickTime) {
    lastTickTime = timestamp;
  }
  const frameDuration = 1000 / (speed * speedModifier);
  const delta = timestamp - lastFrameTime;
  const tickDelta = timestamp - lastTickTime;

  if (!paused && !gameOver && delta >= frameDuration) {
    updateSnake();
    updateScore();
    lastFrameTime = timestamp;
  }

  if (!paused && !gameOver) {
    updateEffects(timestamp);
    if (!lastPowerupTime) {
      lastPowerupTime = timestamp;
    }
    if (timestamp - lastPowerupTime > 7000) {
      placePowerup();
      lastPowerupTime = timestamp;
    }
    powerups = powerups
      .map((item) => ({ ...item, ttl: item.ttl - tickDelta }))
      .filter((item) => item.ttl > 0);
  }

  render();
  lastTickTime = timestamp;
  requestAnimationFrame(gameLoop);
}

function handleDirectionChange(event) {
  const key = event.key;
  if (key === " ") {
    paused = !paused;
    statusEl.textContent = paused ? "已暂停" : "";
    return;
  }

  if (key.toLowerCase() === "r") {
    resetGame();
    return;
  }

  if (!directions[key] && !directions[key?.toLowerCase?.()]) {
    return;
  }

  const selected = directions[key] ?? directions[key.toLowerCase()];
  if (selected.x === -direction.x && selected.y === -direction.y) {
    return;
  }

  nextDirection = selected;
}

restartButton.addEventListener("click", () => resetGame());
window.addEventListener("keydown", handleDirectionChange);

highScoreEl.textContent = highScore;
resetGame();
requestAnimationFrame(gameLoop);
