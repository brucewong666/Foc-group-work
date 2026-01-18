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

let snake;
let direction;
let nextDirection;
let food;
let score;
let highScore = Number.parseInt(localStorage.getItem("snakeHighScore") || "0", 10);
let speed = 7;
let lastFrameTime = 0;
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
  paused = false;
  gameOver = false;
  statusEl.textContent = "";
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
  } while (snake.some((segment) => segment.x === position.x && segment.y === position.y));
  food = position;
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

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    context.fillStyle = isHead ? "#34d399" : "#10b981";
    context.strokeStyle = "#064e3b";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(
      segment.x * gridSize + 2,
      segment.y * gridSize + 2,
      gridSize - 4,
      gridSize - 4,
      6
    );
    context.fill();
    context.stroke();
  });
}

function updateSnake() {
  direction = nextDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount
  ) {
    endGame();
    return;
  }

  if (snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    speed = Math.min(15, speed + 0.4);
    placeFood();
  } else {
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
  drawSnake();
}

function gameLoop(timestamp) {
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }
  const frameDuration = 1000 / speed;
  const delta = timestamp - lastFrameTime;

  if (!paused && !gameOver && delta >= frameDuration) {
    updateSnake();
    updateScore();
    lastFrameTime = timestamp;
  }

  render();
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
