<template>
  <div class="battle-scene-container">
    <canvas
      ref="battleCanvas"
      class="battle-canvas"
      :width="config.canvasWidth"
      :height="config.canvasHeight"
      @click="handleCanvasClick"
    />

    <!-- 战斗开始对话框 -->
    <div v-if="showStartDialog" class="battle-start-dialog">
      <div class="dialog-content">
        <h2>遭遇敌人！</h2>
        <p>{{ enemyTeam.length }} 个敌人出现了！</p>
        <button @click="startBattle" class="dialog-button">开始战斗</button>
      </div>
    </div>

    <!-- 战斗结束对话框 -->
    <div v-if="showEndDialog" class="battle-end-dialog">
      <div class="dialog-content" :class="battleState?.winner === 'player' ? 'winner-player' : 'winner-enemy'">
        <h2>{{ battleResult }}</h2>
        <p>{{ battleMessage }}</p>
        <div class="dialog-buttons">
          <button @click="returnToGame" class="dialog-button">返回游戏</button>
          <button @click="restartBattle" class="dialog-button secondary">重新战斗</button>
        </div>
      </div>
    </div>

    <!-- 技能详情面板 -->
    <div v-if="selectedSkill" class="skill-details">
      <h3>{{ selectedSkill.name }}</h3>
      <p>{{ selectedSkill.description }}</p>
      <div class="skill-info">
        <span>伤害: {{ selectedSkill.damage }}</span>
        <span>MP消耗: {{ selectedSkill.manaCost }}</span>
        <span>冷却: {{ selectedSkill.cooldown }} 回合</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { BattleSystem } from '@/services/battle/BattleSystem';
import type {
  BattleCharacter,
  BattleState,
  Skill,
  CharacterStats
} from '@/types/game';

// 定义组件属性
interface Props {
  width?: number;
  height?: number;
  enemyTeam?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  width: 1200,
  height: 800,
  enemyTeam: () => []
});

// 定义事件
const emit = defineEmits<{
  'battle-ended': [result: 'victory' | 'defeat'];
  'return-to-game': [];
}>();

// 配置
const config = {
  canvasWidth: props.width,
  canvasHeight: props.height
};

// 组件状态
const battleCanvas = ref<HTMLCanvasElement | null>(null);
const battleSystem = ref<BattleSystem | null>(null);
const battleState = ref<BattleState | null>(null);
const showStartDialog = ref(true);
const showEndDialog = ref(false);
const selectedSkill = ref<Skill | null>(null);

// 玩家角色数据（示例）
const playerCharacters: BattleCharacter[] = [
  {
    id: 'player-1',
    name: '木棒人',
    type: 'player',
    position: { x: 200, y: 300 },
    stats: {
      hp: 80,
      maxHp: 80,
      attack: 20,
      defense: 10,
      speed: 5,
      level: 1,
      exp: 0
    },
    skills: [
      {
        id: 'skill-1',
        name: '木棒重击',
        description: '使用木棒进行强力攻击',
        damage: 25,
        manaCost: 10,
        cooldown: 0,
        currentCooldown: 0,
        type: 'attack',
        animation: 'attack',
        effects: [
          {
            type: 'damage',
            value: 25,
            target: 'enemy'
          }
        ]
      },
      {
        id: 'skill-2',
        name: '快速治疗',
        description: '恢复少量生命值',
        damage: 0,
        manaCost: 15,
        cooldown: 2,
        currentCooldown: 0,
        type: 'heal',
        animation: 'heal',
        effects: [
          {
            type: 'heal',
            value: 30,
            target: 'self'
          }
        ]
      },
      {
        id: 'skill-3',
        name: '狂暴打击',
        description: '消耗MP进行强力攻击',
        damage: 40,
        manaCost: 25,
        cooldown: 3,
        currentCooldown: 0,
        type: 'attack',
        animation: 'special',
        effects: [
          {
            type: 'damage',
            value: 40,
            target: 'enemy'
          }
        ]
      }
    ],
    currentHp: 80,
    currentMp: 50,
    statusEffects: [],
    isAlive: true,
    sprite: 'stickman'
  }
];

// 敌方角色数据（示例）
const enemyCharacters: BattleCharacter[] = [
  {
    id: 'enemy-1',
    name: '史莱姆',
    type: 'enemy',
    position: { x: 1000, y: 300 },
    stats: {
      hp: 25,
      maxHp: 25,
      attack: 4,
      defense: 1,
      speed: 1.8,
      level: 1,
      exp: 0
    },
    skills: [
      {
        id: 'enemy-skill-1',
        name: '黏液攻击',
        description: '发射黏液攻击',
        damage: 8,
        manaCost: 5,
        cooldown: 0,
        currentCooldown: 0,
        type: 'attack',
        animation: 'attack',
        effects: [
          {
            type: 'damage',
            value: 8,
            target: 'enemy'
          }
        ]
      }
    ],
    currentHp: 25,
    currentMp: 30,
    statusEffects: [],
    isAlive: true,
    sprite: 'slime'
  },
  {
    id: 'enemy-2',
    name: '哥布林',
    type: 'enemy',
    position: { x: 1000, y: 420 },
    stats: {
      hp: 45,
      maxHp: 45,
      attack: 8,
      defense: 3,
      speed: 2.5,
      level: 2,
      exp: 0
    },
    skills: [
      {
        id: 'enemy-skill-2',
        name: '利爪攻击',
        description: '使用利爪进行攻击',
        damage: 12,
        manaCost: 8,
        cooldown: 0,
        currentCooldown: 0,
        type: 'attack',
        animation: 'attack',
        effects: [
          {
            type: 'damage',
            value: 12,
            target: 'enemy'
          }
        ]
      }
    ],
    currentHp: 45,
    currentMp: 40,
    statusEffects: [],
    isAlive: true,
    sprite: 'goblin'
  }
];

// 计算属性
const battleResult = computed(() => {
  if (!battleState.value) return '';
  return battleState.value.winner === 'player' ? '战斗胜利！' : '战斗失败！';
});

const battleMessage = computed(() => {
  if (!battleState.value) return '';
  if (battleState.value.winner === 'player') {
    return `经过 ${battleState.value.round} 回合的激战，你获得了胜利！`;
  } else {
    return `你被击败了，再接再厉！`;
  }
});

// 计算属性 - 动态敌人数据
const computedEnemyCharacters = computed(() => {
  if (props.enemyTeam && props.enemyTeam.length > 0) {
    return props.enemyTeam;
  }
  return enemyCharacters;
});

// 生命周期钩子
onMounted(() => {
  if (battleCanvas.value) {
    // 初始化战斗系统
    battleSystem.value = new BattleSystem(
      battleCanvas.value,
      playerCharacters,
      computedEnemyCharacters.value,
      handleBattleStateChange
    );
  }
});

onUnmounted(() => {
  if (battleSystem.value) {
    // 清理战斗系统
    battleSystem.value = null;
  }
});

// 方法
const handleBattleStateChange = (newState: BattleState) => {
  battleState.value = newState;

  // 检查战斗是否结束
  if (newState.turnPhase === 'ended') {
    showEndDialog.value = true;
  }
};

const startBattle = () => {
  showStartDialog.value = false;
  if (battleSystem.value) {
    battleSystem.value.render();
  }
};

const handleCanvasClick = (event: MouseEvent) => {
  if (!battleCanvas.value || !battleSystem.value) return;

  const rect = battleCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('BattleScene: 点击坐标', { x, y });
  console.log('BattleScene: 战斗状态', battleState.value);

  battleSystem.value.handleClick(x, y);
};

const returnToGame = () => {
  emit('return-to-game');
};

const restartBattle = () => {
  showEndDialog.value = false;
  showStartDialog.value = true;

  // 重新初始化战斗系统
  if (battleCanvas.value) {
    battleSystem.value = new BattleSystem(
      battleCanvas.value,
      playerCharacters,
      computedEnemyCharacters.value,
      handleBattleStateChange
    );
  }
};

// 导出战斗系统实例
defineExpose({
  battleSystem,
  battleState
});
</script>

<style scoped>
.battle-scene-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.battle-canvas {
  border: 2px solid #333;
  background-color: #1a1a1a;
  cursor: pointer;
}

.battle-start-dialog,
.battle-end-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #4CAF50;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  z-index: 10;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.dialog-content h2 {
  color: #4CAF50;
  font-size: 32px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.dialog-content p {
  color: #fff;
  font-size: 18px;
  margin-bottom: 30px;
}

.dialog-button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 10px;
}

.dialog-button:hover {
  background: linear-gradient(45deg, #45a049, #4CAF50);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

.dialog-button.secondary {
  background: linear-gradient(45deg, #757575, #616161);
}

.dialog-button.secondary:hover {
  background: linear-gradient(45deg, #616161, #757575);
}

.dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.skill-details {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #2196F3;
  border-radius: 10px;
  padding: 15px;
  color: #fff;
  max-width: 300px;
  z-index: 5;
}

.skill-details h3 {
  color: #2196F3;
  margin: 0 0 10px 0;
  font-size: 18px;
}

.skill-details p {
  margin: 0 0 15px 0;
  font-size: 14px;
  line-height: 1.4;
}

.skill-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.skill-info span {
  background: rgba(33, 150, 243, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
}

.battle-end-dialog .dialog-content.winner-player h2 {
  color: #4CAF50;
}

.battle-end-dialog .dialog-content.winner-enemy h2 {
  color: #F44336;
}

.battle-end-dialog .dialog-content.winner-player {
  border-color: #4CAF50;
}

.battle-end-dialog .dialog-content.winner-enemy {
  border-color: #F44336;
}

/* 动画效果 */
@keyframes dialogAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.battle-start-dialog,
.battle-end-dialog {
  animation: dialogAppear 0.5s ease-out;
}

/* 技能选择高亮 */
.skill-details {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>