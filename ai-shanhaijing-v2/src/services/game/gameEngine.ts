// 游戏引擎核心类

import type { GameState, GameConfig, InputState, Vector2D, BattleCharacter } from '@/types/game';
import { GameUtils } from '@/utils/gameUtils';
import { MonsterSpawner } from '../spawners/MonsterSpawner';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private config: GameConfig;
  private inputState: InputState;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private gameLoopId: number | null = null;
  private monsterSpawner: MonsterSpawner;
  private inBattle: boolean = false;
  private battleTriggerDistance: number = 100;
  private battleCooldown: number = 0; // 战斗结束后的冷却时间

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.canvas.width = config.canvasWidth;
    this.canvas.height = config.canvasHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = context;

    this.config = config;
    this.inputState = this.initializeInput();
    this.gameState = this.initializeGameState();
    this.monsterSpawner = new MonsterSpawner();

    this.setupEventListeners();
    this.setupCanvasSettings();
  }

  private initializeInput(): InputState {
    return {
      keys: {},
      mousePosition: { x: 0, y: 0 },
      mouseClick: null
    };
  }

  private initializeGameState(): GameState {
    return {
      player: null,
      monsters: [],
      items: [],
      camera: {
        position: { x: 0, y: 0 },
        target: null,
        smoothness: 0.1
      },
      gameRunning: false,
      gameTime: 0,
      mapSize: { x: 2000, y: 2000 } // 设置更大的地图尺寸
    };
  }

  private setupEventListeners(): void {
    // 键盘事件
    window.addEventListener('keydown', (e) => {
      this.inputState.keys[e.key.toLowerCase()] = true;
      this.preventDefaultBehavior(e);
    });

    window.addEventListener('keyup', (e) => {
      this.inputState.keys[e.key.toLowerCase()] = false;
      this.preventDefaultBehavior(e);
    });

    // 鼠标事件
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mouseClick = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    // 窗口失焦时暂停
    window.addEventListener('blur', () => {
      if (this.gameState.gameRunning) {
        this.pause();
      }
    });
  }

  private setupCanvasSettings(): void {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  private preventDefaultBehavior(e: Event): void {
    const preventKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
    if (preventKeys.includes((e as KeyboardEvent).key.toLowerCase())) {
      e.preventDefault();
    }
  }

  // 游戏控制方法
  public start(): void {
    console.log('GameEngine: 开始游戏');
    console.log('GameEngine: 玩家状态:', this.gameState.player ? '已设置' : '未设置');
    console.log('GameEngine: 画布尺寸:', this.config.canvasWidth, 'x', this.config.canvasHeight);

    this.gameState.gameRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public pause(): void {
    this.gameState.gameRunning = false;
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  public resume(): void {
    if (!this.gameState.gameRunning) {
      this.start();
    }
  }

  public stop(): void {
    this.gameState.gameRunning = false;
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  // 游戏主循环
  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.gameState.gameRunning) {
      this.accumulator += deltaTime;

      // 固定时间步长更新
      const fixedTimeStep = 1 / this.config.fps;
      while (this.accumulator >= fixedTimeStep) {
        this.update(fixedTimeStep);
        this.accumulator -= fixedTimeStep;
      }

      this.render();
    }

    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  // 游戏更新逻辑
  private update(deltaTime: number): void {
    if (!this.gameState.gameRunning) return;

    this.gameState.gameTime += deltaTime;

    // 更新战斗冷却时间
    if (this.battleCooldown > 0) {
      this.battleCooldown -= deltaTime;
      if (this.battleCooldown <= 0) {
        this.battleCooldown = 0;
        console.log('战斗冷却时间结束');
      }
    }

    // 检查战斗触发
    if (!this.inBattle) {
      this.checkBattleTrigger();
    }

    // 更新相机
    this.updateCamera(deltaTime);

    // 更新输入状态
    this.updateInput();

    // 更新游戏对象
    this.updateGameObjects(deltaTime);

    // 处理碰撞
    this.handleCollisions();

    // 清理过期的鼠标点击
    if (this.inputState.mouseClick) {
      this.inputState.mouseClick = null;
    }
  }

  private updateCamera(deltaTime: number): void {
    if (this.gameState.camera.target) {
      const targetPos = this.gameState.camera.target.position;
      const screenCenter = {
        x: this.config.canvasWidth / 2,
        y: this.config.canvasHeight / 2
      };

      const idealCameraPos = {
        x: targetPos.x - screenCenter.x,
        y: targetPos.y - screenCenter.y
      };

      this.gameState.camera.position = GameUtils.lerpVector(
        this.gameState.camera.position,
        idealCameraPos,
        this.gameState.camera.smoothness
      );

      // 限制相机范围
      this.gameState.camera.position = GameUtils.clampVector(
        this.gameState.camera.position,
        { x: 0, y: 0 },
        {
          x: this.gameState.mapSize.x - this.config.canvasWidth,
          y: this.gameState.mapSize.y - this.config.canvasHeight
        }
      );
    }
  }

  private updateInput(): void {
    // 输入状态更新逻辑
    // 这里可以添加输入处理的逻辑
  }

  private updateGameObjects(deltaTime: number): void {
    // 更新玩家
    if (this.gameState.player) {
      this.updatePlayer(this.gameState.player, deltaTime);
    }

    // 更新怪物生成器和怪物
    this.monsterSpawner.update(this.gameState.player, deltaTime, this.gameState.gameTime);

    // 更新游戏状态中的怪物列表
    this.updateGameStateMonsters();

    // 更新道具
    this.gameState.items.forEach(item => {
      this.updateItem(item, deltaTime);
    });
  }

  private updatePlayer(player: any, deltaTime: number): void {
    // 玩家更新逻辑
    this.handlePlayerMovement(player, deltaTime);
  }

  private updateMonster(monster: any, deltaTime: number): void {
    // 怪物更新逻辑
  }

  private updateItem(item: any, deltaTime: number): void {
    // 道具更新逻辑
    if (Date.now() - item.spawnTime > item.duration) {
      item.isActive = false;
    }
  }

  private handlePlayerMovement(player: any, deltaTime: number): void {
    const speed = player.stats.speed;
    const moveDistance = speed * deltaTime * 60; // 60 FPS基准

    let moveX = 0;
    let moveY = 0;

    // WASD移动
    if (this.inputState.keys['w'] || this.inputState.keys['arrowup']) {
      moveY = -moveDistance;
    }
    if (this.inputState.keys['s'] || this.inputState.keys['arrowdown']) {
      moveY = moveDistance;
    }
    if (this.inputState.keys['a'] || this.inputState.keys['arrowleft']) {
      moveX = -moveDistance;
    }
    if (this.inputState.keys['d'] || this.inputState.keys['arrowright']) {
      moveX = moveDistance;
    }

    // 鼠标点击移动
    if (this.inputState.mouseClick) {
      const targetPos = this.screenToWorld(this.inputState.mouseClick);
      const direction = GameUtils.normalize(GameUtils.subtract(targetPos, player.position));

      moveX = direction.x * moveDistance;
      moveY = direction.y * moveDistance;
    }

    // 应用移动
    if (moveX !== 0 || moveY !== 0) {
      const newPosition = {
        x: player.position.x + moveX,
        y: player.position.y + moveY
      };

      // 边界检查
      newPosition.x = GameUtils.clamp(newPosition.x, 0, this.gameState.mapSize.x);
      newPosition.y = GameUtils.clamp(newPosition.y, 0, this.gameState.mapSize.y);

      player.position = newPosition;
      player.isMoving = true;

      // 更新方向
      if (Math.abs(moveX) > Math.abs(moveY)) {
        player.direction = moveX > 0 ? 'right' : 'left';
      } else {
        player.direction = moveY > 0 ? 'down' : 'up';
      }
    } else {
      player.isMoving = false;
    }
  }

  private handleCollisions(): void {
    // 碰撞检测逻辑
  }

  // 渲染方法
  private render(): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // 绘制正确的游戏背景
    this.ctx.fillStyle = '#87CEEB'; // 天蓝色背景
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // 显示基础调试信息
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('游戏引擎运行中...', 10, 30);
    this.ctx.fillText(`游戏状态: ${this.gameState.gameRunning ? '运行中' : '已停止'}`, 10, 50);
    this.ctx.fillText(`玩家数据: ${this.gameState.player ? '已设置' : '未设置'}`, 10, 70);
    this.ctx.fillText(`怪物数量: ${this.monsterSpawner.getAliveMonsterCount()}`, 10, 90);

    // 如果玩家不存在，显示提示信息
    if (!this.gameState.player) {
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('等待玩家数据...', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
      this.ctx.fillText('请先选择角色', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 40);
      return;
    }

    // 设置相机变换
    this.ctx.save();
    this.ctx.translate(-this.gameState.camera.position.x, -this.gameState.camera.position.y);

    // 渲染游戏对象
    this.renderGameObjects();

    // 恢复变换
    this.ctx.restore();

    // 渲染UI（不受相机影响）
    this.renderUI();
  }

  private renderGameObjects(): void {
    // 渲染地图
    this.renderMap();

    // 渲染道具
    this.gameState.items.forEach(item => {
      if (item.isActive) {
        this.renderItem(item);
      }
    });

    // 渲染怪物（从生成器获取）
    this.monsterSpawner.getAliveMonsters().forEach(monster => {
      this.renderMonster(monster);
    });

    // 渲染Boss的小怪
    this.renderBossMinions();

    // 渲染玩家
    if (this.gameState.player) {
      this.renderCharacter(this.gameState.player);
    }
  }

  private renderMap(): void {
    // 绘制草地背景
    this.ctx.fillStyle = '#90EE90'; // 浅绿色草地
    this.ctx.fillRect(0, 0, this.gameState.mapSize.x, this.gameState.mapSize.y);

    // 绘制网格
    this.ctx.strokeStyle = 'rgba(26, 61, 26, 0.3)';
    this.ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x <= this.gameState.mapSize.x; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.gameState.mapSize.y);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.gameState.mapSize.y; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.gameState.mapSize.x, y);
      this.ctx.stroke();
    }

    // 绘制主要区域
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 2;

    // 中心区域
    this.ctx.strokeRect(500, 500, 1000, 1000);

    // 安全区域（怪物不会生成的区域）
    this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(50, 50, 500, 500);
    this.ctx.setLineDash([]);

    // 绘制地图边界
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(0, 0, this.gameState.mapSize.x, this.gameState.mapSize.y);
  }

  private renderCharacter(character: any): void {
    this.ctx.save();
    this.ctx.translate(character.position.x, character.position.y);

    // 绘制角色阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 25, 15, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制角色主体
    if (character.type === 'player') {
      // 玩家 - 绿色圆形
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
      this.ctx.fill();

      // 玩家边框
      this.ctx.strokeStyle = '#2E7D32';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // 玩家眼睛
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(-8, -5, 4, 0, Math.PI * 2);
      this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(-8, -5, 2, 0, Math.PI * 2);
      this.ctx.arc(8, -5, 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // 其他角色 - 红色方形
      this.ctx.fillStyle = '#F44336';
      this.ctx.fillRect(-20, -20, 40, 40);

      this.ctx.strokeStyle = '#D32F2F';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-20, -20, 40, 40);
    }

    // 绘制血条背景
    const healthBarWidth = 50;
    const healthBarHeight = 6;
    const healthBarY = -35;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);

    // 绘制血条
    const healthPercentage = character.stats.hp / character.stats.maxHp;
    this.ctx.fillStyle = healthPercentage > 0.6 ? '#4CAF50' :
                         healthPercentage > 0.3 ? '#FFC107' : '#F44336';
    this.ctx.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

    // 绘制等级标签
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.font = 'bold 12px Arial';
    this.ctx.strokeText(`Lv.${character.stats.level}`, 0, -45);
    this.ctx.fillText(`Lv.${character.stats.level}`, 0, -45);

    this.ctx.restore();
  }

  private renderItem(item: any): void {
    this.ctx.save();
    this.ctx.translate(item.position.x, item.position.y);

    // 根据道具类型绘制不同颜色
    const colors: { [key: string]: string } = {
      health: '#4CAF50',
      attack: '#F44336',
      defense: '#2196F3',
      exp: '#FFC107'
    };

    this.ctx.fillStyle = colors[item.type] || '#FFF';
    this.ctx.fillRect(-15, -15, 30, 30);

    // 绘制发光效果
    const time = Date.now() / 1000;
    const alpha = 0.3 + 0.2 * Math.sin(time * 4);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillRect(-20, -20, 40, 40);

    this.ctx.restore();
  }

  /**
   * 渲染怪物
   */
  private renderMonster(monster: any): void {
    if (!monster.isAlive()) return;

    this.ctx.save();
    this.ctx.translate(monster.getPosition().x, monster.getPosition().y);

    const size = monster.getSize();
    const monsterState = monster.getMonsterState();

    // 绘制怪物阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, size/2 + 5, size/3, size/4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制怪物主体
    this.ctx.fillStyle = monster.getColor();
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制怪物边框
    this.ctx.strokeStyle = this.darkenColor(monster.getColor());
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 绘制怪物眼睛
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(-size/4, -size/6, size/8, 0, Math.PI * 2);
    this.ctx.arc(size/4, -size/6, size/8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(-size/4, -size/6, size/12, 0, Math.PI * 2);
    this.ctx.arc(size/4, -size/6, size/12, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制血条
    this.renderMonsterHealthBar(monster, size);

    // 绘制等级和名称
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.font = 'bold 10px Arial';
    this.ctx.strokeText(`Lv.${monsterState.stats.level}`, 0, -size/2 - 5);
    this.ctx.fillText(`Lv.${monsterState.stats.level}`, 0, -size/2 - 5);

    // 绘制怪物名称
    this.ctx.font = '8px Arial';
    const monsterName = monster.getName ? monster.getName() : monster.getType();
    this.ctx.strokeText(monsterName, 0, -size/2 - 18);
    this.ctx.fillText(monsterName, 0, -size/2 - 18);

    // 绘制状态指示
    this.renderMonsterStatus(monster, size);

    this.ctx.restore();
  }

  /**
   * 颜色加深函数
   */
  private darkenColor(color: string): string {
    // 简单的颜色加深逻辑
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 40);
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 40);
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 40);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  /**
   * 渲染怪物血条
   */
  private renderMonsterHealthBar(monster: any, size: number): void {
    const monsterState = monster.getMonsterState();
    const healthPercentage = monsterState.stats.hp / monsterState.stats.maxHp;
    const healthBarWidth = size * 0.8;
    const healthBarHeight = 6;
    const healthBarY = -size/2 - 12;

    // 血条背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(-healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);

    // 血条边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(-healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);

    // 血条填充
    const fillColor = healthPercentage > 0.6 ? '#4CAF50' :
                     healthPercentage > 0.3 ? '#FFC107' : '#F44336';
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(-healthBarWidth/2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

    // 显示血量数值
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.font = 'bold 8px Arial';
    const healthText = `${monsterState.stats.hp}/${monsterState.stats.maxHp}`;
    this.ctx.strokeText(healthText, 0, healthBarY - 3);
    this.ctx.fillText(healthText, 0, healthBarY - 3);
  }

  /**
   * 渲染怪物状态
   */
  private renderMonsterStatus(monster: any, size: number): void {
    const monsterState = monster.getMonsterState();

    // 根据AI状态显示不同的效果
    if (monsterState.aiState === 'chasing') {
      // 追踪状态 - 显示红色边框
      this.ctx.strokeStyle = '#FF5252';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-size/2 - 2, -size/2 - 2, size + 4, size + 4);
    } else if (monsterState.aiState === 'attacking') {
      // 攻击状态 - 显示发光效果
      this.ctx.shadowColor = '#FF5252';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = monster.getColor();
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * 渲染Boss的小怪
   */
  private renderBossMinions(): void {
    // 查找Boss并渲染其小怪
    const bossMonsters = this.monsterSpawner.getMonstersByType('boss');

    bossMonsters.forEach(boss => {
      const bossMinions = (boss as any).getMinions?.() || [];
      bossMinions.forEach((minion: any) => {
        if (minion.isAlive()) {
          this.renderMonster(minion);
        }
      });
    });
  }

  /**
   * 更新游戏状态中的怪物列表
   */
  private updateGameStateMonsters(): void {
    // 更新游戏状态中的怪物列表（用于兼容性）
    this.gameState.monsters = this.monsterSpawner.getAliveMonsters().map(monster => {
      return monster.getMonsterState();
    });
  }

  private renderUI(): void {
    // 渲染游戏信息
    if (this.gameState.player) {
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'left';

      this.ctx.fillText(`生命值: ${this.gameState.player.stats.hp}/${this.gameState.player.stats.maxHp}`, 10, 30);
      this.ctx.fillText(`等级: ${this.gameState.player.stats.level}`, 10, 50);
      this.ctx.fillText(`经验值: ${this.gameState.player.stats.exp}`, 10, 70);
    }

    // 渲染FPS
    const fps = Math.round(1 / GameUtils.deltaTime());
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`FPS: ${fps}`, this.config.canvasWidth - 10, 30);

    // 渲染调试信息
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 90, 300, 180);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(10, 90, 300, 180);

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🎮 游戏调试信息', 20, 110);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '11px Arial';
    const debugInfo = this.getDebugInfo().split('\n').slice(1, -1); // 移除首尾行
    debugInfo.forEach((line, index) => {
      this.ctx.fillText(line.trim(), 20, 130 + index * 14);
    });
  }

  // 工具方法
  private screenToWorld(screenPos: Vector2D): Vector2D {
    return {
      x: screenPos.x + this.gameState.camera.position.x,
      y: screenPos.y + this.gameState.camera.position.y
    };
  }

  private worldToScreen(worldPos: Vector2D): Vector2D {
    return {
      x: worldPos.x - this.gameState.camera.position.x,
      y: worldPos.y - this.gameState.camera.position.y
    };
  }

  /**
   * 检查战斗触发
   */
  private checkBattleTrigger(): void {
    if (!this.gameState.player) return;

    // 如果还在战斗冷却中，不检查战斗触发
    if (this.battleCooldown > 0) {
      return;
    }

    const player = this.gameState.player;
    const aliveMonsters = this.monsterSpawner.getAliveMonsters();

    for (const monster of aliveMonsters) {
      const monsterPosition = monster.getPosition();
      const distance = GameUtils.distance(player.position, monsterPosition);

      if (distance <= this.battleTriggerDistance) {
        this.triggerBattle([monster]);
        break;
      }
    }
  }

  /**
   * 触发战斗
   */
  private triggerBattle(monsters: any[]): void {
    this.inBattle = true;
    this.gameState.gameRunning = false;

    // 暂停游戏循环
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }

    // 触发战斗事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('battle-triggered', {
        detail: {
          player: this.gameState.player,
          enemies: monsters
        }
      }));
    }

    console.log('战斗触发！');
  }

  /**
   * 结束战斗
   */
  public endBattle(result: 'victory' | 'defeat'): void {
    this.inBattle = false;
    this.gameState.gameRunning = true;

    // 移除被击败的怪物
    if (result === 'victory') {
      this.monsterSpawner.clearAllMonsters();
    } else if (result === 'defeat') {
      // 失败时也清除附近的怪物，避免连续触发战斗
      this.clearNearbyMonsters();
    }

    // 设置战斗冷却时间，防止立即再次触发战斗
    this.battleCooldown = 3.0; // 3秒冷却时间

    // 重新开始游戏循环
    this.lastTime = performance.now();
    this.gameLoop();

    console.log('战斗结束，结果：', result);
  }

  /**
   * 清除附近的怪物
   */
  private clearNearbyMonsters(): void {
    if (!this.gameState.player) return;

    const player = this.gameState.player;
    const aliveMonsters = this.monsterSpawner.getAliveMonsters();
    const clearRadius = 200; // 清除200像素范围内的怪物

    aliveMonsters.forEach(monster => {
      const monsterPosition = monster.getPosition();
      const distance = GameUtils.distance(player.position, monsterPosition);

      if (distance <= clearRadius) {
        this.monsterSpawner.removeMonster(monster.getMonsterState().id);
      }
    });

    console.log('清除了附近的怪物');
  }

  /**
   * 检查是否在战斗中
   */
  public isInBattle(): boolean {
    return this.inBattle;
  }

  // 公共方法
  public getGameState(): GameState {
    return this.gameState;
  }

  public getInputState(): InputState {
    return this.inputState;
  }

  public setPlayer(player: any): void {
    console.log('GameEngine: 设置玩家数据', player);
    this.gameState.player = player;
    this.gameState.camera.target = player;

    // 确保相机位置正确，将玩家放在屏幕中心
    if (player && player.position) {
      this.gameState.camera.position = {
        x: player.position.x - this.config.canvasWidth / 2,
        y: player.position.y - this.config.canvasHeight / 2
      };

      // 限制相机范围
      this.gameState.camera.position.x = Math.max(0, Math.min(this.gameState.camera.position.x, this.gameState.mapSize.x - this.config.canvasWidth));
      this.gameState.camera.position.y = Math.max(0, Math.min(this.gameState.camera.position.y, this.gameState.mapSize.y - this.config.canvasHeight));
    }
  }

  public addMonster(monster: any): void {
    this.gameState.monsters.push(monster);
  }

  public addItem(item: any): void {
    this.gameState.items.push(item);
  }

  public removeMonster(id: string): void {
    this.gameState.monsters = this.gameState.monsters.filter(m => m.id !== id);
  }

  public removeItem(id: string): void {
    this.gameState.items = this.gameState.items.filter(i => i.id !== id);
  }

  public destroy(): void {
    this.stop();
    this.cleanupEventListeners();
  }

  // 怪物管理方法
  public getMonsterSpawner(): MonsterSpawner {
    return this.monsterSpawner;
  }

  public spawnBoss(position: { x: number; y: number }): void {
    this.monsterSpawner.spawnBoss(position);
  }

  public forceSpawnMonster(type: string, position: { x: number; y: number }): void {
    this.monsterSpawner.forceSpawn(type, position);
  }

  public clearAllMonsters(): void {
    this.monsterSpawner.clearAllMonsters();
  }

  public getMonsterInfo(): string {
    return this.monsterSpawner.getSpawnerInfo();
  }

  // 调试方法
  public getDebugInfo(): string {
    const monsterCount = this.monsterSpawner.getAliveMonsterCount();
    const playerHealth = this.gameState.player?.stats.hp || 0;
    const gameTime = Math.round(this.gameState.gameTime);
    const cameraPos = this.gameState.camera.position;
    const playerPos = this.gameState.player?.position || { x: 0, y: 0 };

    return `
🎮 游戏调试信息 🎮
游戏时间: ${gameTime}秒
玩家生命: ${playerHealth}
存活怪物: ${monsterCount}只
怪物上限: ${this.monsterSpawner.getMonsterCount()}
相机位置: (${Math.round(cameraPos.x)}, ${Math.round(cameraPos.y)})
玩家位置: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})
游戏状态: ${this.gameState.gameRunning ? '运行中' : '已停止'}
地图尺寸: ${this.gameState.mapSize.x}x${this.gameState.mapSize.y}
画布尺寸: ${this.config.canvasWidth}x${this.config.canvasHeight}
    `;
  }

  private cleanupEventListeners(): void {
    // 清理事件监听器
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    window.removeEventListener('blur', () => {});
  }
}