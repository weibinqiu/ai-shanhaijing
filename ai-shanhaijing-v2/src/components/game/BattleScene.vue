<template>
  <div class="battle-scene-container">
    <!-- 战斗背景 -->
    <div class="battle-background">
      <div class="battle-grid"></div>
    </div>

    <!-- 战斗场景 -->
    <div class="battle-scene">
      <!-- 玩家区域 -->
      <div class="battle-player-area">
        <div v-for="character in playerCharacters" :key="character.id"
             class="battle-character player-battle-character"
             :class="{
               'attacking': isCharacterAttacking(character.id),
               'damaged': isCharacterDamaged(character.id),
               'victorious': battleState?.winner === 'player'
             }">
          <div class="battle-character-image">
            <img :src="getCharacterImage(character.sprite)" :alt="character.name" />
          </div>
          <div class="battle-health-bar">
            <div class="battle-health-fill" :style="{ width: getHealthPercentage(character) + '%' }"></div>
            <div class="battle-health-text">{{ character.currentHp }}/{{ character.stats.maxHp }}</div>
          </div>
          <div class="battle-character-name">{{ character.name }}</div>
          <div class="battle-level">Lv.{{ character.stats.level }}</div>
        </div>
      </div>

      <!-- 敌人区域 -->
      <div class="battle-enemy-area">
        <div v-for="character in computedEnemyCharacters" :key="character.id"
             class="battle-character enemy-battle-character"
             :class="{
               'attacking': isCharacterAttacking(character.id),
               'damaged': isCharacterDamaged(character.id),
               'defeated': !character.isAlive
             }">
          <div class="battle-character-image">
            <img :src="getCharacterImage(character.sprite)" :alt="character.name" />
          </div>
          <div class="battle-health-bar">
            <div class="battle-health-fill" :style="{ width: getHealthPercentage(character) + '%' }"></div>
            <div class="battle-health-text">{{ character.currentHp }}/{{ character.stats.maxHp }}</div>
          </div>
          <div class="battle-character-name">{{ character.name }}</div>
          <div class="battle-level">Lv.{{ character.stats.level }}</div>
        </div>
      </div>

      <!-- 战斗UI -->
      <div class="battle-ui">
        <!-- 回合指示器 -->
        <div class="battle-turn-indicator" v-if="battleState">
          <div class="turn-text">{{ getCurrentTurnText() }}</div>
        </div>

        <!-- 技能栏 -->
        <div class="battle-skill-bar" v-if="battleState?.currentTurn === 'player'">
          <div v-for="(skill, index) in getCurrentPlayerSkills()" :key="skill.id"
               class="battle-skill-slot"
               :class="{
                 'disabled': isSkillDisabled(skill),
                 'selected': selectedSkill?.id === skill.id
               }"
               @click="selectSkill(skill)">
            <div class="battle-skill-icon">
              <span class="skill-key">{{ getSkillKey(index) }}</span>
              {{ getSkillEmoji(skill.type) }}
            </div>
            <div class="battle-skill-name">{{ skill.name }}</div>
            <div class="battle-skill-cost">MP: {{ skill.manaCost }}</div>
            <div v-if="skill.currentCooldown > 0" class="battle-cooldown">
              冷却: {{ skill.currentCooldown }}
            </div>
          </div>
        </div>

        <!-- 战斗日志 -->
        <div class="battle-log">
          <div v-for="(log, index) in battleLogs" :key="index"
               class="log-entry"
               :class="log.type">
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗开始对话框 -->
    <div v-if="showStartDialog" class="battle-start-dialog">
      <div class="dialog-content">
        <h2>遭遇敌人！</h2>
        <p>{{ computedEnemyCharacters.length }} 个敌人出现了！</p>
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
      <button @click="useSelectedSkill" class="use-skill-button" :disabled="isSkillDisabled(selectedSkill)">
        使用技能
      </button>
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
const battleLogs = ref<Array<{ message: string; type: string }>>([]);
const attackingCharacters = ref<Set<string>>(new Set());
const damagedCharacters = ref<Set<string>>(new Set());

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

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (battleSystem.value) {
    // 清理战斗系统
    battleSystem.value = null;
  }

  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
});

// 辅助方法
const getHealthPercentage = (character: BattleCharacter) => {
  return Math.round((character.currentHp / character.stats.maxHp) * 100);
};

const getCharacterImage = (sprite: string) => {
  const imageMap: { [key: string]: string } = {
    'stickman': '/images/木棒人.png',
    'ninja': '/images/咖啡忍者.png',
    'shark': '/images/耐克鲨鱼.png',
    'frog': '/images/轮胎青蛙.png',
    'camel': '/images/冰箱骆驼.png',
    'slime': '/images/史莱姆.png',
    'goblin': '/images/哥布林.png',
    'orc': '/images/兽人.png'
  };
  return imageMap[sprite] || '/images/木棒人.png';
};

const getSkillEmoji = (type: string) => {
  const emojiMap: { [key: string]: string } = {
    'attack': '⚔️',
    'heal': '💚',
    'defense': '🛡️',
    'special': '✨'
  };
  return emojiMap[type] || '⚔️';
};

const getSkillKey = (index: number) => {
  return ['Q', 'W', 'E'][index] || `${index + 1}`;
};

const getCurrentPlayerSkills = () => {
  return playerCharacters[0]?.skills || [];
};

const getCurrentTurnText = () => {
  if (!battleState.value) return '';
  return battleState.value.currentTurn === 'player' ? '你的回合' : '敌人回合';
};

const isSkillDisabled = (skill: Skill) => {
  if (!battleState.value || battleState.value.currentTurn !== 'player') return true;
  const player = playerCharacters[0];
  return player.currentMp < skill.manaCost || skill.currentCooldown > 0;
};

const isCharacterAttacking = (characterId: string) => {
  return attackingCharacters.value.has(characterId);
};

const isCharacterDamaged = (characterId: string) => {
  return damagedCharacters.value.has(characterId);
};

const selectSkill = (skill: Skill) => {
  if (!isSkillDisabled(skill)) {
    selectedSkill.value = skill;
  }
};

const useSelectedSkill = () => {
  if (selectedSkill.value && battleSystem.value) {
    // 触发攻击动画
    attackingCharacters.value.add(playerCharacters[0].id);
    setTimeout(() => {
      attackingCharacters.value.delete(playerCharacters[0].id);
    }, 500);

    // 使用技能
    battleSystem.value.selectSkill(selectedSkill.value.id);

    // 添加战斗日志
    battleLogs.value.push({
      message: `使用了 ${selectedSkill.value.name}！`,
      type: 'player-action'
    });

    selectedSkill.value = null;
  }
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (!battleState.value || battleState.value.currentTurn !== 'player') return;

  const key = event.key.toLowerCase();
  const skills = getCurrentPlayerSkills();

  // Q, W, E 键对应技能
  if (key === 'q' && skills[0]) selectSkill(skills[0]);
  if (key === 'w' && skills[1]) selectSkill(skills[1]);
  if (key === 'e' && skills[2]) selectSkill(skills[2]);

  // 空格键使用选中的技能
  if (key === ' ' && selectedSkill.value) {
    event.preventDefault();
    useSelectedSkill();
  }

  // ESC键取消选择
  if (key === 'escape') {
    selectedSkill.value = null;
  }
};

// 方法
const handleBattleStateChange = (newState: BattleState) => {
  battleState.value = newState;

  // 添加战斗状态日志
  if (newState.currentTurn === 'enemy') {
    battleLogs.value.push({
      message: '敌人开始行动...',
      type: 'enemy-turn'
    });
  }

  // 检查战斗是否结束
  if (newState.turnPhase === 'ended') {
    showEndDialog.value = true;

    if (newState.winner === 'player') {
      battleLogs.value.push({
        message: '战斗胜利！',
        type: 'victory'
      });
    } else {
      battleLogs.value.push({
        message: '战斗失败...',
        type: 'defeat'
      });
    }
  }
};

const startBattle = () => {
  showStartDialog.value = false;
  battleLogs.value = [];

  // 添加开始战斗日志
  battleLogs.value.push({
    message: '战斗开始！',
    type: 'start'
  });

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
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
  font-family: 'Arial', sans-serif;
}

/* 战斗背景 */
.battle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  background-size: 100px 100px;
  animation: battleBackgroundMove 20s linear infinite;
}

@keyframes battleBackgroundMove {
  0% { background-position: 0 0; }
  100% { background-position: 100px 100px; }
}

/* 战斗场景布局 */
.battle-scene {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
}

/* 玩家和敌人区域 */
.battle-player-area,
.battle-enemy-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  min-height: 200px;
}

.battle-player-area {
  order: 1;
}

.battle-enemy-area {
  order: 3;
}

/* 角色容器 */
.battle-character {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

/* 玩家角色样式 */
.player-battle-character {
  border-color: rgba(0, 255, 0, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
}

.player-battle-character:hover {
  border-color: rgba(0, 255, 0, 0.8);
  transform: scale(1.05);
}

/* 敌人角色样式 */
.enemy-battle-character {
  border-color: rgba(255, 0, 0, 0.5);
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
}

.enemy-battle-character:hover {
  border-color: rgba(255, 0, 0, 0.8);
  transform: scale(1.05);
}

/* 角色图像 */
.battle-character-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.battle-character-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 血条设计 */
.battle-health-bar {
  width: 160px;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  margin: 8px 0;
  position: relative;
}

.battle-health-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.enemy-battle-character .battle-health-fill {
  background: linear-gradient(90deg, #ff4444, #ff6666);
}

.battle-health-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* 角色名称和等级 */
.battle-character-name {
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-top: 5px;
}

.battle-level {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 215, 0, 0.8);
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
}

/* 战斗UI */
.battle-ui {
  order: 2;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 800px;
  margin: 0 auto;
}

/* 回合指示器 */
.battle-turn-indicator {
  text-align: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.turn-text {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 技能栏 */
.battle-skill-bar {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.battle-skill-slot {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.battle-skill-slot:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
  transform: scale(1.05);
}

.battle-skill-slot.selected {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.2);
}

.battle-skill-slot.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.battle-skill-slot.disabled:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.battle-skill-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ffd700, #ff6b6b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 10px;
}

.skill-key {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 215, 0, 0.8);
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
}

.battle-skill-name {
  font-size: 12px;
  color: white;
  text-align: center;
  font-weight: bold;
}

.battle-skill-cost {
  font-size: 10px;
  color: #87CEEB;
  margin-top: 2px;
}

.battle-cooldown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

/* 战斗日志 */
.battle-log {
  height: 100px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 5px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 14px;
  animation: logSlideIn 0.3s ease-out;
}

.log-entry.player-action {
  background: rgba(0, 255, 0, 0.2);
  color: #90EE90;
}

.log-entry.enemy-turn {
  background: rgba(255, 0, 0, 0.2);
  color: #FFB6C1;
}

.log-entry.victory {
  background: rgba(255, 215, 0, 0.3);
  color: #FFD700;
  font-weight: bold;
}

.log-entry.defeat {
  background: rgba(255, 0, 0, 0.3);
  color: #FF6B6B;
  font-weight: bold;
}

.log-entry.start {
  background: rgba(0, 255, 255, 0.2);
  color: #87CEEB;
}

@keyframes logSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 战斗对话框 */
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
  backdrop-filter: blur(10px);
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

/* 技能详情面板 */
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
  backdrop-filter: blur(10px);
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
  margin-bottom: 15px;
}

.skill-info span {
  background: rgba(33, 150, 243, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
}

.use-skill-button {
  width: 100%;
  background: linear-gradient(45deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.use-skill-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #1976D2, #2196F3);
  transform: translateY(-1px);
}

.use-skill-button:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.6;
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

/* 角色动画 */
.battle-character.attacking {
  animation: battleAttack 0.5s ease-in-out;
}

.battle-character.damaged {
  animation: battleDamage 0.5s ease-in-out;
}

.battle-character.victorious {
  animation: battleVictory 1s ease-in-out infinite alternate;
}

.battle-character.defeated {
  opacity: 0.3;
  filter: grayscale(100%);
}

@keyframes battleAttack {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) translateX(20px); }
  100% { transform: scale(1); }
}

@keyframes battleDamage {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes battleVictory {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.1) rotate(5deg); }
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

/* 响应式设计 */
@media (max-width: 768px) {
  .battle-scene {
    padding: 10px;
    gap: 10px;
  }

  .battle-player-area,
  .battle-enemy-area {
    min-height: 150px;
  }

  .battle-character {
    width: 120px;
    height: 120px;
  }

  .battle-character-image {
    width: 80px;
    height: 80px;
  }

  .battle-health-bar {
    width: 100px;
    height: 8px;
  }

  .battle-skill-slot {
    width: 80px;
    height: 80px;
  }

  .battle-skill-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .skill-details {
    max-width: 250px;
    font-size: 12px;
  }
}
</style>