// 游戏基础类型定义

export interface Vector2D {
  x: number;
  y: number;
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  exp: number;
}

export interface Skill {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
}

export interface CharacterState {
  id: string;
  type: string;
  position: Vector2D;
  velocity: Vector2D;
  stats: CharacterStats;
  skills: Skill[];
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  isAlive: boolean;
}

export interface MonsterState extends CharacterState {
  aiState: 'idle' | 'chasing' | 'attacking' | 'fleeing';
  lastPlayerSighting: Vector2D | null;
  patrolTarget: Vector2D | null;
  attackCooldown: number;
  lastAttackTime: number;
}

export interface ItemState {
  id: string;
  type: 'health' | 'attack' | 'defense' | 'exp';
  position: Vector2D;
  spawnTime: number;
  duration: number;
  isActive: boolean;
}

export interface CameraState {
  position: Vector2D;
  target: CharacterState | null;
  smoothness: number;
}

export interface GameState {
  player: CharacterState | null;
  monsters: MonsterState[];
  items: ItemState[];
  camera: CameraState;
  gameRunning: boolean;
  gameTime: number;
  mapSize: Vector2D;
}

export interface InputState {
  keys: { [key: string]: boolean };
  mousePosition: Vector2D;
  mouseClick: Vector2D | null;
}

export interface AudioState {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

export interface SaveData {
  player: CharacterState;
  gameSettings: {
    audio: AudioState;
    controls: any;
  };
  timestamp: number;
  version: string;
}

// 游戏配置
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  tileSize: number;
  maxMonsters: number;
  maxItems: number;
  itemSpawnInterval: number;
  fps: number;
}

// AI相关类型
export interface AIPerception {
  playerInRange: boolean;
  playerDistance: number;
  obstacles: any[];
  escapeRoute: Vector2D | null;
}

export interface AIDecision {
  action: 'move' | 'attack' | 'idle' | 'flee';
  target: Vector2D | null;
  priority: number;
}

// 渲染相关类型
export interface RenderObject {
  id: string;
  position: Vector2D;
  size: Vector2D;
  rotation: number;
  scale: Vector2D;
  alpha: number;
  visible: boolean;
}

export interface AnimationFrame {
  duration: number;
  texture: string;
  sourceRect: { x: number; y: number; width: number; height: number };
}

export interface Animation {
  id: string;
  frames: AnimationFrame[];
  loop: boolean;
  currentFrame: number;
  currentTime: number;
  isPlaying: boolean;
}

// 战斗系统类型
export interface Skill {
  id: string;
  name: string;
  description: string;
  damage: number;
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  type: 'attack' | 'defense' | 'heal' | 'special';
  animation: string;
  effects: SkillEffect[];
}

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff';
  value: number;
  duration?: number;
  target: 'self' | 'enemy' | 'all';
}

export interface BattleCharacter {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  position: Vector2D;
  stats: CharacterStats;
  skills: Skill[];
  currentHp: number;
  currentMp: number;
  statusEffects: StatusEffect[];
  isAlive: boolean;
  sprite: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  value: number;
  duration: number;
  remainingTime: number;
}

export interface BattleState {
  playerTeam: BattleCharacter[];
  enemyTeam: BattleCharacter[];
  currentTurn: 'player' | 'enemy';
  turnPhase: 'selecting' | 'acting' | 'animating' | 'ended';
  selectedCharacter: BattleCharacter | null;
  selectedSkill: Skill | null;
  targetCharacter: BattleCharacter | null;
  battleLog: BattleLogEntry[];
  round: number;
  winner: 'player' | 'enemy' | null;
}

export interface BattleLogEntry {
  id: string;
  message: string;
  type: 'action' | 'damage' | 'heal' | 'status' | 'system';
  timestamp: number;
}

export interface BattleAction {
  id: string;
  type: 'attack' | 'skill' | 'defend' | 'item';
  actor: BattleCharacter;
  target?: BattleCharacter;
  skill?: Skill;
  damage?: number;
  healing?: number;
  critical: boolean;
  effectiveness: 'normal' | 'effective' | 'resisted';
}