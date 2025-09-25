<template>
  <div class="simple-game-canvas">
    <canvas
      ref="canvas"
      class="canvas"
      width="800"
      height="600"
    ></canvas>
    <div class="info">
      <p>简单游戏画布测试</p>
      <p>移动: WASD | 点击: 寻路</p>
      <p>位置: {{ playerPosition.x }}, {{ playerPosition.y }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const playerPosition = ref({ x: 400, y: 300 });
const gameRunning = ref(false);

let animationId: number | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// 键盘状态
const keys = ref<Record<string, boolean>>({});

// 游戏循环
const gameLoop = () => {
  if (!ctx || !canvas.value) return;

  // 清空画布
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 绘制网格
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.value.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.value.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.value.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.value.width, y);
    ctx.stroke();
  }

  // 处理输入
  const speed = 5;
  if (keys.value['w'] || keys.value['ArrowUp']) {
    playerPosition.value.y -= speed;
  }
  if (keys.value['s'] || keys.value['ArrowDown']) {
    playerPosition.value.y += speed;
  }
  if (keys.value['a'] || keys.value['ArrowLeft']) {
    playerPosition.value.x -= speed;
  }
  if (keys.value['d'] || keys.value['ArrowRight']) {
    playerPosition.value.x += speed;
  }

  // 边界检查
  playerPosition.value.x = Math.max(20, Math.min(canvas.value.width - 20, playerPosition.value.x));
  playerPosition.value.y = Math.max(20, Math.min(canvas.value.height - 20, playerPosition.value.y));

  // 绘制玩家
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(playerPosition.value.x, playerPosition.value.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // 绘制玩家眼睛
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(playerPosition.value.x - 8, playerPosition.value.y - 5, 4, 0, Math.PI * 2);
  ctx.arc(playerPosition.value.x + 8, playerPosition.value.y - 5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(playerPosition.value.x - 8, playerPosition.value.y - 5, 2, 0, Math.PI * 2);
  ctx.arc(playerPosition.value.x + 8, playerPosition.value.y - 5, 2, 0, Math.PI * 2);
  ctx.fill();

  // 绘制一些怪物
  const monsters = [
    { x: 200, y: 200, color: '#F44336' },
    { x: 600, y: 200, color: '#FF9800' },
    { x: 200, y: 400, color: '#9C27B0' },
    { x: 600, y: 400, color: '#00BCD4' }
  ];

  monsters.forEach(monster => {
    if (ctx) {
      ctx.fillStyle = monster.color;
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 绘制UI文本
  if (ctx) {
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('简单游戏画布测试', 10, 30);
    ctx.fillText(`位置: ${Math.round(playerPosition.value.x)}, ${Math.round(playerPosition.value.y)}`, 10, 50);
    ctx.fillText('WASD/方向键: 移动', 10, 70);
  }

  animationId = requestAnimationFrame(gameLoop);
};

const startGame = () => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      gameRunning.value = true;
      gameLoop();
      console.log('SimpleGameCanvas: 游戏开始');
    }
  }
};

const stopGame = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
    gameRunning.value = false;
    console.log('SimpleGameCanvas: 游戏停止');
  }
};

// 事件监听
const setupEventListeners = () => {
  window.addEventListener('keydown', (e) => {
    keys.value[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys.value[e.key.toLowerCase()] = false;
  });
};

const cleanupEventListeners = () => {
  window.removeEventListener('keydown', () => {});
  window.removeEventListener('keyup', () => {});
};

onMounted(() => {
  console.log('SimpleGameCanvas: 组件挂载');
  setupEventListeners();
  startGame();
});

onUnmounted(() => {
  console.log('SimpleGameCanvas: 组件卸载');
  stopGame();
  cleanupEventListeners();
});

defineExpose({
  startGame,
  stopGame
});
</script>

<style scoped>
.simple-game-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #000;
  min-height: 100vh;
}

.canvas {
  border: 2px solid #333;
  background: #000;
  cursor: crosshair;
}

.info {
  margin-top: 20px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  color: #fff;
  font-family: Arial, sans-serif;
  text-align: center;
}

.info p {
  margin: 5px 0;
}
</style>