<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CharacterSelect from '@/components/game/CharacterSelect.vue'
import GameCanvas from '@/components/game/GameCanvas.vue'
import SimpleGameCanvas from '@/components/game/SimpleGameCanvas.vue'
import BattleScene from '@/components/game/BattleScene.vue'

const router = useRouter()
const userStore = useUserStore()

// 游戏状态
const currentScreen = ref<'character-select' | 'game' | 'battle' | 'simple'>('character-select')
const selectedCharacter = ref<string>('')
const characterData = ref<any>(null)
const battleEnemies = ref<any[]>([])

// 组件引用
const characterSelectRef = ref<InstanceType<typeof CharacterSelect> | null>(null)
const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null)
const battleSceneRef = ref<InstanceType<typeof BattleScene> | null>(null)

// 检查登录状态
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
}

// 生命周期
onMounted(() => {
  checkAuth()
  
  // 初始化游戏
  console.log('AI山海经V2 - 游戏初始化')
  console.log('当前用户:', userStore.currentUser?.username)

  // 监听战斗触发事件
  window.addEventListener('battle-triggered', handleBattleTriggered)
})

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 战斗触发处理
const handleBattleTriggered = (event: any) => {
  console.log('GameView: 战斗触发', event.detail)

  // 将游戏中的怪物数据转换为战斗角色数据
  const enemies = event.detail.enemies.map((monster: any) => {
    const monsterState = monster.getMonsterState()
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
    }
  })

  battleEnemies.value = enemies
  currentScreen.value = 'battle'
}

// 战斗结束处理
const handleBattleEnded = (result: 'victory' | 'defeat') => {
  console.log('GameView: 战斗结束', result)

  // 通知游戏引擎战斗结束
  if (gameCanvasRef.value?.gameEngine) {
    gameCanvasRef.value.gameEngine.endBattle(result)
  }

  // 返回游戏界面
  currentScreen.value = 'game'
}

// 返回游戏处理
const handleReturnToGame = () => {
  currentScreen.value = 'game'

  // 通知游戏引擎战斗结束（默认失败）
  if (gameCanvasRef.value?.gameEngine) {
    gameCanvasRef.value.gameEngine.endBattle('defeat')
  }
}

// 角色选择
const handleCharacterSelected = (characterId: string) => {
  console.log('GameView: handleCharacterSelected called with', characterId)
  selectedCharacter.value = characterId

  if (characterSelectRef.value) {
    const characters = characterSelectRef.value.characters
    characterData.value = characters.find(c => c.id === characterId)

    console.log('GameView: 选择角色:', characterData.value?.name)
    console.log('GameView: characterData:', characterData.value)
  }
}

// 开始游戏
const handleStartGame = () => {
  console.log('GameView: handleStartGame called')
  console.log('GameView: selectedCharacter:', selectedCharacter.value)
  console.log('GameView: characterData:', characterData.value)

  if (selectedCharacter.value && characterData.value) {
    console.log('GameView: 切换到游戏界面')
    currentScreen.value = 'game'

    // 等待游戏界面完全加载后再初始化玩家数据
    setTimeout(() => {
      console.log('GameView: 尝试获取游戏引擎引用')

      if (gameCanvasRef.value?.gameEngine) {
        const player = {
          id: 'player-1',
          type: 'player',
          position: { x: 400, y: 300 },
          velocity: { x: 0, y: 0 },
          stats: characterData.value.attributes,
          skills: [],
          direction: 'down' as const,
          isMoving: false,
          isAlive: true
        }

        console.log('GameView: 设置玩家数据:', player)
        gameCanvasRef.value.gameEngine.setPlayer(player)
        gameCanvasRef.value.gameEngine.start()
        console.log('GameView: 游戏开始，角色:', characterData.value.name)
      }
    }, 200)
  }
}

// 返回角色选择
const backToCharacterSelect = () => {
  currentScreen.value = 'character-select'
  selectedCharacter.value = ''
  characterData.value = null
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && currentScreen.value === 'game') {
    backToCharacterSelect()
  }
}

// 注册键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="game-view-container">
    <!-- 顶部用户信息栏 -->
    <div class="user-header">
      <div class="user-info">
        <span class="user-icon">👤</span>
        <span class="username">{{ userStore.currentUser?.username }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
    
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
  </div>
</template>

<style scoped>
.game-view-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

.user-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(90deg, #2d3748, #1a202c);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 14px;
}

.user-icon {
  font-size: 20px;
}

.username {
  font-weight: 500;
}

.logout-btn {
  padding: 6px 16px;
  background: linear-gradient(45deg, #e53e3e, #fc8181);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: linear-gradient(45deg, #fc8181, #e53e3e);
  transform: translateY(-1px);
}

.screen {
  width: 100%;
  min-height: calc(100vh - 50px);
  margin-top: 50px;
  position: relative;
}

.character-select-screen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  flex: 1;
  text-align: center;
}

.back-btn, .test-btn {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  font-size: 14px;
}

.back-btn {
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.back-btn:hover {
  transform: translateY(-2px);
}

.test-btn {
  background: linear-gradient(45deg, #4CAF50, #66BB6A);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
  margin-left: 10px;
}

.test-btn:hover {
  transform: translateY(-2px);
}

.game-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.game-instructions {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
  font-size: 14px;
  color: #ccc;
}

.simple-screen {
  background-color: #000;
  display: flex;
  flex-direction: column;
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

.battle-screen {
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .user-header {
    padding: 0 15px;
  }
  
  .user-info {
    font-size: 12px;
  }
  
  .logout-btn {
    padding: 5px 12px;
    font-size: 12px;
  }
}
</style>
