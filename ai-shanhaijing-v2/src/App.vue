<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CharacterSelect from '@/components/game/CharacterSelect.vue';
import GameCanvas from '@/components/game/GameCanvas.vue';
import BattleScene from '@/components/game/BattleScene.vue';
import type { Component } from 'vue';

// 游戏状态
const currentScreen = ref<'character-select' | 'game' | 'battle'>('character-select');
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

    // 初始化游戏角色数据
    setTimeout(() => {
      if (gameCanvasRef.value?.gameEngine) {
        const player = {
          id: 'player-1',
          type: 'player',
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          stats: characterData.value.attributes,
          skills: [],
          direction: 'down' as const,
          isMoving: false,
          isAlive: true
        };

        gameCanvasRef.value.gameEngine.setPlayer(player);

        console.log('App: 游戏开始，角色:', characterData.value.name);
      } else {
        console.log('App: gameCanvasRef or gameEngine is null');
      }
    }, 100);
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
      </div>
      <div class="game-container">
        <GameCanvas ref="gameCanvasRef" />
      </div>
      <div class="game-instructions">
        <p>使用 WASD 或方向键移动，鼠标点击寻路，按 ESC 返回角色选择</p>
      </div>
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

body {
  font-family: 'Arial', sans-serif;
  background-color: #1a1a1a;
  color: #fff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.screen {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.character-select-screen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
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
}

.back-btn:hover {
  background: linear-gradient(45deg, #FF8E8E, #FF6B6B);
  transform: translateY(-2px);
}

.game-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.game-instructions {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
  font-size: 14px;
  color: #ccc;
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
</style>
