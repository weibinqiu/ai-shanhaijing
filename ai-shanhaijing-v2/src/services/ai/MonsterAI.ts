// 怪物AI核心系统 - 统一管理所有怪物的AI行为

import type { CharacterState, MonsterState, Vector2D } from '@/types/game';
import { PerceptionSystem } from './AIPerception';
import { DecisionSystem } from './AIDecision';
import { GameUtils } from '@/utils/gameUtils';

export class MonsterAI {
  private perceptionSystem: PerceptionSystem;
  private decisionSystem: DecisionSystem;

  constructor() {
    this.perceptionSystem = new PerceptionSystem();
    this.decisionSystem = new DecisionSystem();
  }

  /**
   * 更新怪物AI状态
   * @param monster 怪物状态
   * @param player 玩家状态
   * @param deltaTime 时间增量
   * @param gameTime 游戏时间
   */
  public updateMonster(
    monster: MonsterState,
    player: CharacterState | null,
    deltaTime: number,
    gameTime: number
  ): void {
    if (!monster.isAlive) return;

    // 感知环境
    const perception = this.perceptionSystem.perceive(monster, player, gameTime);

    // 做出决策
    const decision = this.decisionSystem.makeDecision(monster, perception, gameTime);

    // 执行决策
    this.executeDecision(monster, decision, player, perception, gameTime);

    // 更新怪物状态（仅在有移动时更新）
    if (monster.isMoving) {
      this.updateMonsterState(monster, deltaTime);
    }

    // 处理攻击冷却（仅在冷却中时更新）
    if (monster.attackCooldown > 0) {
      this.updateCooldowns(monster, deltaTime);
    }
  }

  /**
   * 执行决策
   */
  private executeDecision(
    monster: MonsterState,
    decision: any,
    player: CharacterState | null,
    perception: any,
    gameTime: number
  ): void {
    switch (decision.action) {
      case 'move':
        this.handleMovement(monster, decision, player, perception);
        break;
      case 'attack':
        this.handleAttack(monster, player, gameTime);
        break;
      case 'idle':
        this.handleIdle(monster);
        break;
    }

    // 更新AI状态
    const newState = this.decisionSystem.getStateTransition(monster.aiState, decision);
    if (newState !== monster.aiState) {
      this.changeAIState(monster, newState);
    }
  }

  /**
   * 处理移动行为
   */
  private handleMovement(
    monster: MonsterState,
    decision: any,
    player: CharacterState | null,
    perception: any
  ): void {
    let targetPosition: Vector2D | null = null;

    // 确定移动目标
    if (perception.playerInRange && monster.aiState === 'chasing') {
      // 追踪玩家
      if (player) {
        targetPosition = player.position;
      }
    } else if (decision.target) {
      // 前往决策目标
      targetPosition = decision.target;
    } else if (monster.patrolTarget) {
      // 前往巡逻目标
      targetPosition = monster.patrolTarget;
    }

    if (targetPosition) {
      // 计算移动方向
      const direction = GameUtils.normalize(
        GameUtils.subtract(targetPosition, monster.position)
      );

      // 设置速度
      const speed = monster.stats.speed;
      monster.velocity = {
        x: direction.x * speed,
        y: direction.y * speed
      };

      // 更新方向
      this.updateDirection(monster, direction);
      monster.isMoving = true;
    } else {
      // 停止移动
      monster.velocity = { x: 0, y: 0 };
      monster.isMoving = false;
    }
  }

  /**
   * 处理攻击行为
   */
  private handleAttack(
    monster: MonsterState,
    player: CharacterState | null,
    gameTime: number
  ): void {
    if (!player || !player.isAlive) return;

    // 检查攻击冷却
    if (gameTime < (monster.attackCooldown || 0)) return;

    // 检查攻击范围
    const distance = GameUtils.distance(monster.position, player.position);
    const attackRange = this.perceptionSystem.getPerceptionConfig(monster.type).attackRange;

    if (distance <= attackRange) {
      // 执行攻击
      this.performAttack(monster, player, gameTime);
    }
  }

  /**
   * 执行攻击
   */
  private performAttack(
    monster: MonsterState,
    player: CharacterState,
    gameTime: number
  ): void {
    // 计算伤害
    const damage = Math.max(1, monster.stats.attack - player.stats.defense);

    // 应用伤害到玩家
    player.stats.hp = Math.max(0, player.stats.hp - damage);

    // 设置攻击冷却
    const attackCooldown = this.getAttackCooldown(monster.type);
    monster.attackCooldown = gameTime + attackCooldown;

    // 记录攻击时间（用于动画和特效）
    monster.lastAttackTime = gameTime;

    // 攻击击退效果
    this.applyKnockback(monster, player);

    console.log(`怪物 ${monster.type} 攻击了玩家，造成 ${damage} 点伤害`);
  }

  /**
   * 应用击退效果
   */
  private applyKnockback(attacker: MonsterState, target: CharacterState): void {
    const knockbackDistance = 20;
    const direction = GameUtils.normalize(
      GameUtils.subtract(target.position, attacker.position)
    );

    const knockback = {
      x: direction.x * knockbackDistance,
      y: direction.y * knockbackDistance
    };

    // 应用击退（确保不会超出地图边界）
    target.position.x = Math.max(0, Math.min(2000, target.position.x + knockback.x));
    target.position.y = Math.max(0, Math.min(2000, target.position.y + knockback.y));
  }

  /**
   * 处理空闲行为
   */
  private handleIdle(monster: MonsterState): void {
    // 停止移动
    monster.velocity = { x: 0, y: 0 };
    monster.isMoving = false;
  }

  /**
   * 更新怪物状态
   */
  private updateMonsterState(monster: MonsterState, deltaTime: number): void {
    // 更新位置
    if (monster.velocity.x !== 0 || monster.velocity.y !== 0) {
      monster.position.x += monster.velocity.x * deltaTime * 60;
      monster.position.y += monster.velocity.y * deltaTime * 60;

      // 限制在地图范围内
      monster.position.x = Math.max(20, Math.min(1980, monster.position.x));
      monster.position.y = Math.max(20, Math.min(1980, monster.position.y));
    }

    // 检查是否还活着
    if (monster.stats.hp <= 0) {
      monster.isAlive = false;
    }
  }

  /**
   * 更新冷却时间
   */
  private updateCooldowns(monster: MonsterState, deltaTime: number): void {
    // 攻击冷却由游戏时间管理，这里不需要额外处理
  }

  /**
   * 更新怪物朝向
   */
  private updateDirection(monster: MonsterState, direction: Vector2D): void {
    // 根据移动方向更新朝向
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      monster.direction = direction.x > 0 ? 'right' : 'left';
    } else {
      monster.direction = direction.y > 0 ? 'down' : 'up';
    }
  }

  /**
   * 改变AI状态
   */
  private changeAIState(monster: MonsterState, newState: string): void {
    const oldState = monster.aiState;
    monster.aiState = newState as any;

    // 状态转换时的额外逻辑
    if (oldState !== newState) {
      this.onStateChanged(monster, oldState, newState);
    }
  }

  /**
   * 状态转换事件
   */
  private onStateChanged(monster: MonsterState, oldState: string, newState: string): void {
    // 可以在这里添加状态转换时的特效或音效
    console.log(`怪物 ${monster.id} 状态从 ${oldState} 变为 ${newState}`);
  }

  /**
   * 获取攻击冷却时间
   */
  private getAttackCooldown(monsterType: string): number {
    const cooldownMap: { [key: string]: number } = {
      'slime': 2.0,    // 2秒
      'goblin': 1.5,  // 1.5秒
      'orc': 1.8,     // 1.8秒
      'boss': 2.5      // 2.5秒
    };

    return cooldownMap[monsterType] || 2.0;
  }

  /**
   * 创建怪物状态
   */
  public createMonster(
    type: string,
    position: Vector2D,
    stats: any
  ): MonsterState {
    return {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      position,
      velocity: { x: 0, y: 0 },
      stats,
      skills: [],
      direction: 'down',
      isMoving: false,
      isAlive: true,
      aiState: 'idle',
      lastPlayerSighting: null,
      patrolTarget: null,
      attackCooldown: 0,
      lastAttackTime: 0
    };
  }

  /**
   * 获取感知系统（用于调试和外部访问）
   */
  public getPerceptionSystem(): PerceptionSystem {
    return this.perceptionSystem;
  }

  /**
   * 获取决策系统（用于调试和外部访问）
   */
  public getDecisionSystem(): DecisionSystem {
    return this.decisionSystem;
  }
}