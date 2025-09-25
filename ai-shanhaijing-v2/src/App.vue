<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CharacterSelect from '@/components/game/CharacterSelect.vue';
import GameCanvas from '@/components/game/GameCanvas.vue';
import SimpleGameCanvas from '@/components/game/SimpleGameCanvas.vue';
import BattleScene from '@/components/game/BattleScene.vue';
import type { Component } from 'vue';

// 游戏状态
const currentScreen = ref<'character-select' | 'game' | 'battle' | 'simple'>('character-select');
const selectedCharacter = ref<string>('');
const characterData = ref<any>(null);
const battleEnemies = ref<any[]>([]);

// 组件引用
const characterSelectRef = ref<InstanceType<typeof CharacterSelect> | null>(null);
const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null);
const battleSceneRef = ref<InstanceType<typeof BattleScene> | null>(null);

// 生命周期
onMounted(() => {
  // 初始化游戏
  console.log('AI山海经V2 - 游戏初始化');

  // 监听战斗触发事件
  window.addEventListener('battle-triggered', handleBattleTriggered);
});

// 战斗触发处理
const handleBattleTriggered = (event: any) => {
  console.log('App: 战斗触发', event.detail);

  // 将游戏中的怪物数据转换为战斗角色数据
  const enemies = event.detail.enemies.map((monster: any) => {
    const monsterState = monster.getMonsterState();
    return {
      id: monsterState.id,
      name: monsterState.name,
      type: 'enemy' as const,
      position: { x: 1000, y: 300 + Math.random() * 200 },
      stats: {
        hp: monsterState.stats.hp,
        maxHp: monsterState.stats.maxHp,
        attack: monsterState.stats.attack,
        defense: monsterState.stats.defense,
        speed: monsterState.stats.speed,
        level: monsterState.stats.level,
        exp: 0
      },
      skills: [
        {
          id: 'enemy-attack',
          name: '普通攻击',
          description: '基础攻击',
          damage: monsterState.stats.attack,
          manaCost: 0,
          cooldown: 0,
          currentCooldown: 0,
          type: 'attack' as const,
          animation: 'attack',
          effects: [
            {
              type: 'damage',
              value: monsterState.stats.attack,
              target: 'enemy'
            }
          ]
        }
      ],
      currentHp: monsterState.stats.hp,
      currentMp: 20,
      statusEffects: [],
      isAlive: true,
      sprite: monsterState.type
    };
  });

  battleEnemies.value = enemies;
  currentScreen.value = 'battle';
};

// 战斗结束处理
const handleBattleEnded = (result: 'victory' | 'defeat') => {
  console.log('App: 战斗结束', result);

  // 通知游戏引擎战斗结束
  if (gameCanvasRef.value?.gameEngine) {
    gameCanvasRef.value.gameEngine.endBattle(result);
  }

  // 返回游戏界面
  currentScreen.value = 'game';
};

// 返回游戏处理
const handleReturnToGame = () => {
  currentScreen.value = 'game';

  // 通知游戏引擎战斗结束（默认失败）
  if (gameCanvasRef.value?.gameEngine) {
    gameCanvasRef.value.gameEngine.endBattle('defeat');
  }
};

// 角色选择
const handleCharacterSelected = (characterId: string) => {
  console.log('App: handleCharacterSelected called with', characterId);
  selectedCharacter.value = characterId;

  if (characterSelectRef.value) {
    const characters = characterSelectRef.value.characters;
    characterData.value = characters.find(c => c.id === characterId);

    console.log('App: 选择角色:', characterData.value?.name);
    console.log('App: characterData:', characterData.value);
  }
};

// 开始游戏
const handleStartGame = () => {
  console.log('App: handleStartGame called');
  console.log('App: selectedCharacter:', selectedCharacter.value);
  console.log('App: characterData:', characterData.value);

  if (selectedCharacter.value && characterData.value) {
    console.log('App: 切换到游戏界面');
    currentScreen.value = 'game';

    // 等待游戏界面完全加载后再初始化玩家数据
    setTimeout(() => {
      console.log('App: 尝试获取游戏引擎引用');
      console.log('App: gameCanvasRef.value:', gameCanvasRef.value);
      console.log('App: gameCanvasRef.value?.gameEngine:', gameCanvasRef.value?.gameEngine);

      if (gameCanvasRef.value?.gameEngine) {
        const player = {
          id: 'player-1',
          type: 'player',
          position: { x: 400, y: 300 }, // 修正初始位置到屏幕中心
          velocity: { x: 0, y: 0 },
          stats: characterData.value.attributes,
          skills: [],
          direction: 'down' as const,
          isMoving: false,
          isAlive: true
        };

        console.log('App: 设置玩家数据:', player);
        gameCanvasRef.value.gameEngine.setPlayer(player);

        console.log('App: 启动游戏引擎');
        gameCanvasRef.value.gameEngine.start();

        console.log('App: 游戏开始，角色:', characterData.value.name);

        // 验证游戏状态
        setTimeout(() => {
          const gameState = gameCanvasRef.value?.gameEngine?.getGameState();
          console.log('App: 游戏状态验证:', gameState);
        }, 200);
      } else {
        console.log('App: gameCanvasRef or gameEngine is null');
        console.log('App: 尝试延迟启动');

        // 如果游戏引擎还没准备好，再等一会儿
        setTimeout(() => {
          console.log('App: 延迟后检查游戏引擎');
          console.log('App: gameCanvasRef.value:', gameCanvasRef.value);
          console.log('App: gameCanvasRef.value?.gameEngine:', gameCanvasRef.value?.gameEngine);

          if (gameCanvasRef.value?.gameEngine) {
            const player = {
              id: 'player-1',
              type: 'player',
              position: { x: 400, y: 300 }, // 修正初始位置到屏幕中心
              velocity: { x: 0, y: 0 },
              stats: characterData.value.attributes,
              skills: [],
              direction: 'down' as const,
              isMoving: false,
              isAlive: true
            };

            console.log('App: 延迟设置玩家数据:', player);
            gameCanvasRef.value.gameEngine.setPlayer(player);
            gameCanvasRef.value.gameEngine.start();
            console.log('App: 游戏延迟启动，角色:', characterData.value.name);
          } else {
            console.error('App: 游戏引擎仍然无法获取');
          }
        }, 1000);
      }
    }, 200);
  } else {
    console.log('App: 无法开始游戏，缺少角色数据');
  }
};

// 返回角色选择
const backToCharacterSelect = () => {
  currentScreen.value = 'character-select';
  selectedCharacter.value = '';
  characterData.value = null;
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && currentScreen.value === 'game') {
    backToCharacterSelect();
  }
};

// 注册键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="app-container">
    <!-- 角色选择界面 -->
    <div v-if="currentScreen === 'character-select'" class="screen character-select-screen">
      <CharacterSelect
        ref="characterSelectRef"
        @character-selected="handleCharacterSelected"
        @start-game="handleStartGame"
      />
    </div>

    <!-- 游戏界面 -->
    <div v-else-if="currentScreen === 'game'" class="screen game-screen">
      <div class="game-header">
        <h1>AI山海经 V2</h1>
        <button class="back-btn" @click="backToCharacterSelect">返回选择</button>
        <button class="test-btn" @click="currentScreen = 'simple'">简单测试</button>
      </div>
      <div class="game-container">
        <GameCanvas ref="gameCanvasRef" />
      </div>
      <div class="game-instructions">
        <p>使用 WASD 或方向键移动，鼠标点击寻路，按 ESC 返回角色选择</p>
      </div>
    </div>

    <!-- 简单测试界面 -->
    <div v-else-if="currentScreen === 'simple'" class="screen simple-screen">
      <div class="simple-header">
        <h1>简单游戏测试</h1>
        <button class="back-btn" @click="currentScreen = 'game'">返回游戏</button>
        <button class="back-btn" @click="backToCharacterSelect">返回选择</button>
      </div>
      <SimpleGameCanvas />
    </div>

    <!-- 战斗界面 -->
    <div v-else-if="currentScreen === 'battle'" class="screen battle-screen">
      <BattleScene
        ref="battleSceneRef"
        :width="1200"
        :height="800"
        :enemy-team="battleEnemies"
        @battle-ended="handleBattleEnded"
        @return-to-game="handleReturnToGame"
      />
    </div>

    <!-- 加载界面 -->
    <div v-else class="screen loading-screen">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>游戏加载中...</p>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局中文文字样式修复 */
body {
  font-family: 'Arial', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  letter-spacing: 0px;
  word-spacing: 0px;
  background-color: #1a1a1a;
  color: #fff;
  overflow: visible;
  margin: 0;
  padding: 0;
}

/* 确保所有中文文字正常显示 */
h1, h2, h3, h4, h5, h6, p, span, button, input, textarea, select, option {
  letter-spacing: 0px;
  word-spacing: 0px;
}

/* 特殊处理按钮文字 */
button {
  letter-spacing: 0px !important;
  white-space: nowrap;
}

/* 确保容器文字正常显示 */
.app-container, .screen, .game-header, .game-instructions, .character-select {
  letter-spacing: 0px;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow: visible;
}

.screen {
  width: 100%;
  min-height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
}

.character-select-screen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  overflow: visible;
  min-height: 100vh;
  width: 100vw;
  min-width: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.game-screen {
  background-color: #000;
  display: flex;
  flex-direction: column;
}

.game-header {
  padding: 15px 20px;
  background: linear-gradient(90deg, #2d5a27, #1a3d1a);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.game-header h1 {
  font-size: 24px;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  letter-spacing: 0px;
  text-align: center;
  flex: 1;
}

.back-btn {
  padding: 8px 16px;
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.back-btn:hover {
  background: linear-gradient(45deg, #FF8E8E, #FF6B6B);
  transform: translateY(-2px);
}

.test-btn {
  padding: 8px 16px;
  background: linear-gradient(45deg, #4CAF50, #66BB6A);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
  margin-left: 10px;
}

.test-btn:hover {
  background: linear-gradient(45deg, #66BB6A, #4CAF50);
  transform: translateY(-2px);
}

.game-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
}

.game-instructions {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
  font-size: 14px;
  color: #ccc;
  letter-spacing: 0px;
  word-spacing: 0px;
}

.game-instructions p {
  letter-spacing: 0px;
  word-spacing: 0px;
  white-space: nowrap;
}

.loading-screen {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  font-size: 18px;
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-header {
    padding: 10px 15px;
  }

  .game-header h1 {
    font-size: 20px;
  }

  .back-btn {
    padding: 6px 12px;
    font-size: 14px;
  }

  .game-instructions {
    font-size: 12px;
    padding: 8px 15px;
    letter-spacing: 0px;
    word-spacing: 0px;
  }

  .game-instructions p {
    letter-spacing: 0px;
    word-spacing: 0px;
    white-space: nowrap;
  }
}

.battle-screen {
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
}

.simple-screen {
  background-color: #000;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
}

.simple-header {
  padding: 15px 20px;
  background: linear-gradient(90deg, #2d5a27, #1a3d1a);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.simple-header h1 {
  font-size: 24px;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
