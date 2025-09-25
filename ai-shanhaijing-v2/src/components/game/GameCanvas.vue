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
  console.log('GameCanvas: 组件挂载');
  console.log('GameCanvas: gameCanvas.value:', gameCanvas.value);

  if (gameCanvas.value) {
    console.log('GameCanvas: 创建游戏引擎');
    console.log('GameCanvas: 画布尺寸:', config.canvasWidth, 'x', config.canvasHeight);

    try {
      gameEngine.value = new GameEngine(gameCanvas.value, config);
      console.log('GameCanvas: 游戏引擎创建成功');
      console.log('GameCanvas: 游戏引擎引用:', gameEngine.value);

      // 验证游戏引擎方法
      const methods = ['start', 'stop', 'pause', 'setPlayer', 'getGameState'];
      methods.forEach(method => {
        console.log(`GameCanvas: 检查方法 ${method}:`, typeof gameEngine.value?.[method as keyof typeof gameEngine.value]);
      });

      // 不自动开始游戏，等待玩家数据设置
      console.log('GameCanvas: 游戏引擎初始化完成，等待玩家数据');
    } catch (error) {
      console.error('GameCanvas: 游戏引擎创建失败:', error);
    }
  } else {
    console.error('GameCanvas: 画布元素未找到');
  }
});

onUnmounted(() => {
  if (gameEngine.value) {
    gameEngine.value.destroy();
  }
});

// 添加一个简单的测试渲染
const testCanvas = () => {
  if (gameCanvas.value) {
    const ctx = gameCanvas.value.getContext('2d');
    if (ctx) {
      console.log('GameCanvas: 测试画布渲染');
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText('测试画布', 10, 50);
    } else {
      console.error('GameCanvas: 无法获取2D上下文');
    }
  }
};

// 导出游戏引擎实例供外部使用
defineExpose({
  gameEngine,
  testCanvas
});
</script>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-canvas {
  width: 100%;
  height: 100%;
  background: #000;
  cursor: crosshair;
  border: 2px solid #333;
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