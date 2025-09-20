// 游戏引擎核心类

import type { GameState, GameConfig, InputState, Vector2D } from '@/types/game';
import { GameUtils } from '@/utils/gameUtils';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private config: GameConfig;
  private inputState: InputState;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private gameLoopId: number | null = null;

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
      mapSize: { x: 2000, y: 2000 }
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

    // 更新怪物
    this.gameState.monsters.forEach(monster => {
      this.updateMonster(monster, deltaTime);
    });

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

    // 渲染怪物
    this.gameState.monsters.forEach(monster => {
      this.renderCharacter(monster);
    });

    // 渲染玩家
    if (this.gameState.player) {
      this.renderCharacter(this.gameState.player);
    }
  }

  private renderMap(): void {
    // 简单的地图背景
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, this.gameState.mapSize.x, this.gameState.mapSize.y);

    // 绘制网格
    this.ctx.strokeStyle = '#1a3d1a';
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
  }

  private renderCharacter(character: any): void {
    this.ctx.save();
    this.ctx.translate(character.position.x, character.position.y);

    // 绘制角色
    this.ctx.fillStyle = character.type === 'player' ? '#4CAF50' : '#F44336';
    this.ctx.fillRect(-20, -20, 40, 40);

    // 绘制血条
    const healthBarWidth = 40;
    const healthBarHeight = 4;
    const healthPercentage = character.stats.hp / character.stats.maxHp;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-healthBarWidth / 2, -30, healthBarWidth, healthBarHeight);

    this.ctx.fillStyle = healthPercentage > 0.6 ? '#4CAF50' :
                         healthPercentage > 0.3 ? '#FFC107' : '#F44336';
    this.ctx.fillRect(-healthBarWidth / 2, -30, healthBarWidth * healthPercentage, healthBarHeight);

    // 绘制等级
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Lv.${character.stats.level}`, 0, -35);

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

  // 公共方法
  public getGameState(): GameState {
    return this.gameState;
  }

  public getInputState(): InputState {
    return this.inputState;
  }

  public setPlayer(player: any): void {
    this.gameState.player = player;
    this.gameState.camera.target = player;
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

  private cleanupEventListeners(): void {
    // 清理事件监听器
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    window.removeEventListener('blur', () => {});
  }
}