<template>
  <div class="character-select">
    <div class="character-select-container">
      <h1 class="game-title">AI山海经 V2</h1>
      <p class="subtitle">选择你的角色</p>

      <div class="character-options">
        <div
          v-for="character in characters"
          :key="character.id"
          class="character-card"
          :class="{ selected: selectedCharacter === character.id }"
          @click="selectCharacter(character.id)"
        >
          <!-- 粒子爆炸效果 -->
          <div class="particle-container" v-if="selectedCharacter === character.id">
            <div
              v-for="i in 12"
              :key="i"
              class="particle"
              :style="getParticleStyle(i)"
            ></div>
          </div>

          <div class="character-avatar">
            <img :src="character.image" :alt="character.name" />
            <div class="avatar-glow" v-if="selectedCharacter === character.id"></div>
          </div>
          <h3>{{ character.title }}</h3>

          <!-- 进度条显示 -->
          <div class="character-stats">
            <div class="stat" v-for="stat in character.stats" :key="stat.label">
              <span class="stat-label">{{ stat.label }}</span>
              <div class="stat-bar-container">
                <div class="stat-bar">
                  <div class="stat-fill" :style="{ width: stat.value + '%' }"></div>
                </div>
                <span class="stat-number" v-if="selectedCharacter === character.id">
                  {{ getStatValue(stat.label, character.attributes) }}
                </span>
              </div>
            </div>
          </div>

          <div class="character-abilities">
            <span v-for="ability in character.abilities" :key="ability" class="ability">
              {{ ability }}
            </span>
          </div>
          <button class="select-btn" :disabled="selectedCharacter === character.id">
            选择{{ character.name }}
          </button>
        </div>
      </div>

      <button
        v-if="selectedCharacter"
        class="start-game-btn"
        @click="startGame"
      >
        开始游戏
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 定义事件
const emit = defineEmits<{
  'character-selected': [characterId: string];
  'start-game': [];
}>();

// 角色数据
const characters = [
  {
    id: 'stickman',
    name: '木棒人',
    title: 'Lv.1 木棒人',
    image: '/images/木棒人.png',
    stats: [
      { label: '攻击力', value: 70 },
      { label: '防御力', value: 50 },
      { label: '速度', value: 85 }
    ],
    abilities: ['木棒攻击', '快速移动', '闪避'],
    attributes: {
      hp: 80,
      maxHp: 80,
      attack: 20,
      defense: 10,
      speed: 5,
      level: 1,
      exp: 0
    }
  },
  {
    id: 'ninja',
    name: '咖啡忍者',
    title: 'Lv.4 咖啡忍者',
    image: '/images/咖啡忍者.png',
    stats: [
      { label: '攻击力', value: 80 },
      { label: '防御力', value: 60 },
      { label: '速度', value: 90 }
    ],
    abilities: ['手里剑', '隐身术', '咖啡加速'],
    attributes: {
      hp: 90,
      maxHp: 90,
      attack: 25,
      defense: 15,
      speed: 6,
      level: 4,
      exp: 0
    }
  },
  {
    id: 'shark',
    name: '耐克鲨鱼',
    title: 'Lv.5 耐克鲨鱼',
    image: '/images/耐克鲨鱼.png',
    stats: [
      { label: '攻击力', value: 90 },
      { label: '防御力', value: 80 },
      { label: '速度', value: 70 }
    ],
    abilities: ['鲨鱼咬击', '高速冲击', '耐克加速'],
    attributes: {
      hp: 120,
      maxHp: 120,
      attack: 35,
      defense: 25,
      speed: 4,
      level: 5,
      exp: 0
    }
  },
  {
    id: 'frog',
    name: '轮胎青蛙',
    title: 'Lv.8 轮胎青蛙',
    image: '/images/轮胎青蛙.png',
    stats: [
      { label: '攻击力', value: 85 },
      { label: '防御力', value: 70 },
      { label: '速度', value: 95 }
    ],
    abilities: ['轮胎弹跳', '青蛙冲击', '橡胶防御'],
    attributes: {
      hp: 100,
      maxHp: 100,
      attack: 30,
      defense: 20,
      speed: 8,
      level: 8,
      exp: 0
    }
  },
  {
    id: 'camel',
    name: '冰箱骆驼',
    title: 'Lv.10 冰箱骆驼',
    image: '/images/冰箱骆驼.png',
    stats: [
      { label: '攻击力', value: 60 },
      { label: '防御力', value: 95 },
      { label: '速度', value: 40 }
    ],
    abilities: ['骆驼吐沙', '冰冻', '冰箱护盾'],
    attributes: {
      hp: 150,
      maxHp: 150,
      attack: 15,
      defense: 35,
      speed: 3,
      level: 10,
      exp: 0
    }
  }
];

// 状态管理
const selectedCharacter = ref<string>('');
const audioElements = ref<{[key: string]: HTMLAudioElement}>({});
const audioContextInitialized = ref(false);

// 初始化音频上下文
const initAudioContext = () => {
  if (audioContextInitialized.value) return;

  // 创建一个虚拟的音频上下文来启用音频
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  audioContext.resume().then(() => {
    audioContextInitialized.value = true;
    console.log('音频上下文已初始化');
  });
};

// 预加载音效
const preloadSounds = () => {
  const soundFiles = {
    stickman: '/sound/木棍人tungtungtungtungsahur_爱给网_aigei_com.mp3',
    shark: '/sound/耐克鲨鱼_爱给网_aigei_com.mp3',
    ninja: '/sound/咖啡忍者.m4a',
    camel: '/sound/冰箱骆驼.m4a',
    frog: '/sound/轮胎青蛙_爱给网_aigei_com.mp3'
  };

  Object.entries(soundFiles).forEach(([characterId, src]) => {
    const audio = new Audio(src);
    audio.volume = 1.0;
    audio.load();
    audioElements.value[characterId] = audio;
  });

  console.log('音效预加载完成');
};

// 音效播放方法
const playCharacterSound = (characterId: string) => {
  try {
    // 首先初始化音频上下文
    initAudioContext();

    const audio = audioElements.value[characterId];
    if (!audio) {
      console.log(`未找到 ${characterId} 的音效`);
      return;
    }

    // 重置音频时间到开始位置
    audio.currentTime = 0;

    // 播放音效
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`成功播放 ${characterId} 音效`);
      }).catch(error => {
        console.log('音频播放失败:', error);
        // 如果是自动播放策略问题，尝试在用户交互后播放
        document.addEventListener('click', function playOnInteraction() {
          initAudioContext();
          audio.currentTime = 0;
          audio.play().catch(e => console.log('重试播放失败:', e));
          document.removeEventListener('click', playOnInteraction);
        }, { once: true });
      });
    }
  } catch (error) {
    console.error('音效播放出错:', error);
  }
};

// 方法
const selectCharacter = (characterId: string) => {
  console.log('CharacterSelect: selectCharacter called with', characterId);

  // 每次选择都播放音效
  playCharacterSound(characterId);

  selectedCharacter.value = characterId;
  emit('character-selected', characterId);
};

const startGame = () => {
  console.log('CharacterSelect: startGame called, selectedCharacter:', selectedCharacter.value);
  if (selectedCharacter.value) {
    emit('start-game');
  } else {
    console.log('CharacterSelect: No character selected, cannot start game');
  }
};

// 获取属性值的方法
const getStatValue = (statLabel: string, attributes: any): number => {
  switch (statLabel) {
    case '攻击力':
      return attributes.attack;
    case '防御力':
      return attributes.defense;
    case '速度':
      return attributes.speed;
    default:
      return 0;
  }
};

// 获取粒子样式的方法
const getParticleStyle = (index: number) => {
  const angle = (index * 30) * (Math.PI / 180); // 每个粒子相隔30度
  const distance = 80; // 粒子飞行的距离
  const duration = 1 + Math.random() * 0.5; // 随机持续时间

  return {
    '--angle': angle + 'rad',
    '--distance': distance + 'px',
    '--duration': duration + 's',
    '--delay': (index * 0.05) + 's'
  } as any;
};

// 组件挂载时预加载音效
onMounted(() => {
  preloadSounds();
});

// 导出选中的角色数据
defineExpose({
  selectedCharacter,
  characters
});
</script>

<style scoped>
/* 确保组件内中文文字正常显示 */
.character-select, .character-select-container, .game-title, .subtitle,
.character-card, .character-name, .character-desc, .ability,
.select-btn, .start-game-btn {
  letter-spacing: 0px;
  word-spacing: 0px;
}

/* 按钮文字特殊处理 */
.select-btn, .start-game-btn {
  letter-spacing: 0px !important;
  white-space: nowrap;
}

.character-select {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
  position: relative;
  overflow-y: visible;
}

.character-select-container {
  text-align: center;
  max-width: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.game-title {
  font-size: 48px;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-weight: bold;
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: 0px;
  text-align: center;
  width: 100%;
  display: block;
}

.subtitle {
  font-size: 24px;
  color: #fff;
  margin-bottom: 40px;
  opacity: 0.9;
}

.character-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  max-width: 1350px;
  margin-left: auto;
  margin-right: auto;
  justify-content: center;
}

.character-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 300px;
}

.character-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.character-card.selected {
  border-color: #4CAF50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  animation: pulse 2s infinite, cardGlow 3s ease-in-out infinite;
  transform: translateY(-5px);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.8);
  }
  100% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  }
}

@keyframes cardGlow {
  0%, 100% {
    border-color: #4CAF50;
    background: rgba(255, 255, 255, 0.1);
  }
  25% {
    border-color: #8BC34A;
    background: rgba(139, 195, 74, 0.15);
  }
  50% {
    border-color: #CDDC39;
    background: rgba(205, 220, 57, 0.2);
  }
  75% {
    border-color: #8BC34A;
    background: rgba(139, 195, 74, 0.15);
  }
}

.character-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  position: relative;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.character-card:hover .character-avatar img {
  transform: scale(1.1);
}

.character-card.selected .character-avatar img {
  transform: scale(1.15);
}

.avatar-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
  animation: avatarGlow 2s ease-in-out infinite;
}

@keyframes avatarGlow {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 粒子爆炸效果 */
.particle-container {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 140px;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #FFD700, #FFA500);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: particleExplode var(--duration) ease-out var(--delay) forwards;
  opacity: 0;
}

@keyframes particleExplode {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform:
      translate(
        calc(-50% + cos(var(--angle)) * var(--distance)),
        calc(-50% + sin(var(--angle)) * var(--distance))
      )
      scale(0.5);
  }
}

.character-card h3 {
  color: #fff;
  font-size: 24px;
  margin-bottom: 15px;
}

.character-stats {
  margin-bottom: 15px;
}

.stat {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.stat-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.stat-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.stat-number {
  min-width: 35px;
  font-size: 13px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  text-align: right;
  animation: numberGlow 2s ease-in-out infinite;
}

@keyframes numberGlow {
  0%, 100% {
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  50% {
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 25px rgba(255, 215, 0, 0.6);
  }
}

.character-abilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  justify-content: center;
}

.ability {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ability::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.ability:hover::before {
  left: 100%;
}

.ability:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.3);
}

.character-card.selected .ability {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
  animation: abilityPulse 2s ease-in-out infinite;
}

@keyframes abilityPulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.6);
  }
}

.select-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #45a049, #4CAF50);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

.select-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.select-btn:not(:disabled) {
  position: relative;
  overflow: hidden;
}

.select-btn:not(:disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.select-btn:not(:disabled):active::after {
  width: 300px;
  height: 300px;
}

.start-game-btn {
  padding: 15px 40px;
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
  position: relative;
  z-index: 100;
  margin-top: 20px;
}

.start-game-btn:hover {
  background: linear-gradient(45deg, #FF8E8E, #FF6B6B);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

/* Mac大屏幕 - 确保5列显示 */
@media (min-width: 1400px) {
  .character-options {
    grid-template-columns: repeat(5, 1fr);
    max-width: 1400px;
    gap: 25px;
  }
}

/* 中大屏幕 - 确保4-5列显示 */
@media (min-width: 1200px) and (max-width: 1399px) {
  .character-options {
    grid-template-columns: repeat(4, 1fr);
    max-width: 1100px;
    gap: 20px;
  }
}

/* 中等屏幕 */
@media (max-width: 1199px) {
  .character-options {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    max-width: 1000px;
    gap: 20px;
  }
}

@media (max-width: 999px) {
  .character-options {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    max-width: 900px;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .character-options {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
    max-width: 100%;
  }

  .game-title {
    font-size: 36px;
    font-weight: bold;
    line-height: 1.2;
    white-space: nowrap;
    letter-spacing: 0px;
    text-align: center;
    width: 100%;
    display: block;
  }

  .subtitle {
    font-size: 18px;
  }

  .character-card {
    min-height: 280px;
    padding: 12px;
  }

  .character-select-container {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .character-options {
    grid-template-columns: 1fr;
    gap: 15px;
    max-width: 100%;
  }

  .character-card {
    min-height: 260px;
    padding: 10px;
  }
}
</style>