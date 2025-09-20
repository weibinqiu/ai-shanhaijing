<template>
  <div class="game-canvas-container">
    <canvas
      ref="gameCanvas"
      class="game-canvas"
      :width="config.canvasWidth"
      :height="config.canvasHeight"
    />
    <div v-if="!gameRunning" class="game-overlay">
      <div class="game-paused">游戏暂停</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { GameEngine } from '@/services/game/gameEngine';
import type { GameConfig } from '@/types/game';

// 定义组件属性
interface Props {
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 1200,
  height: 800
});

// 游戏配置
const config: GameConfig = {
  canvasWidth: props.width,
  canvasHeight: props.height,
  tileSize: 50,
  maxMonsters: 10,
  maxItems: 5,
  itemSpawnInterval: 30000,
  fps: 60
};

// 组件状态
const gameCanvas = ref<HTMLCanvasElement | null>(null);
const gameEngine = ref<GameEngine | null>(null);
const gameRunning = computed(() => gameEngine.value?.getGameState().gameRunning || false);

// 生命周期钩子
onMounted(() => {
  if (gameCanvas.value) {
    gameEngine.value = new GameEngine(gameCanvas.value, config);

    // 设置初始玩家数据
    const player = {
      id: 'player-1',
      type: 'player',
      position: { x: 500, y: 500 },
      velocity: { x: 0, y: 0 },
      stats: {
        hp: 100,
        maxHp: 100,
        attack: 20,
        defense: 10,
        speed: 5,
        level: 1,
        exp: 0
      },
      skills: [],
      direction: 'down' as const,
      isMoving: false,
      isAlive: true
    };

    gameEngine.value.setPlayer(player);

    // 自动开始游戏
    setTimeout(() => {
      gameEngine.value?.start();
    }, 100);
  }
});

onUnmounted(() => {
  if (gameEngine.value) {
    gameEngine.value.destroy();
  }
});

// 导出游戏引擎实例供外部使用
defineExpose({
  gameEngine
});
</script>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.game-canvas {
  border: 2px solid #333;
  background-color: #1a1a1a;
  cursor: crosshair;
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.game-paused {
  font-size: 48px;
  color: #fff;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}
</style>