// 怪物基类 - 定义所有怪物的共同属性和行为

import type { MonsterState, Vector2D, CharacterStats } from '@/types/game';
import { MonsterAI } from '../ai/MonsterAI';

export abstract class BaseMonster {
  protected monster: MonsterState;
  protected ai: MonsterAI;

  constructor(position: Vector2D) {
    this.ai = new MonsterAI();
    this.monster = this.createMonster(position);
  }

  /**
   * 创建怪物状态 - 子类需要实现
   */
  protected abstract createMonster(position: Vector2D): MonsterState;

  /**
   * 获取怪物状态
   */
  public getMonsterState(): MonsterState {
    return this.monster;
  }

  /**
   * 更新怪物
   */
  public update(
    player: any,
    deltaTime: number,
    gameTime: number
  ): void {
    this.ai.updateMonster(this.monster, player, deltaTime, gameTime);
  }

  /**
   * 受到伤害
   */
  public takeDamage(damage: number): boolean {
    this.monster.stats.hp = Math.max(0, this.monster.stats.hp - damage);

    // 检查是否死亡
    if (this.monster.stats.hp <= 0) {
      this.monster.isAlive = false;
      this.onDeath();
      return true;
    }

    this.onDamage(damage);
    return false;
  }

  /**
   * 治疗效果
   */
  public heal(amount: number): void {
    this.monster.stats.hp = Math.min(
      this.monster.stats.maxHp,
      this.monster.stats.hp + amount
    );
    this.onHeal(amount);
  }

  /**
   * 获取怪物颜色（用于渲染）
   */
  public abstract getColor(): string;

  /**
   * 获取怪物大小（用于渲染）
   */
  public abstract getSize(): number;

  /**
   * 获取怪物类型
   */
  public getType(): string {
    return this.monster.type;
  }

  /**
   * 检查是否还活着
   */
  public isAlive(): boolean {
    return this.monster.isAlive;
  }

  /**
   * 获取当前位置
   */
  public getPosition(): Vector2D {
    return { ...this.monster.position };
  }

  /**
   * 设置位置
   */
  public setPosition(position: Vector2D): void {
    this.monster.position = { ...position };
  }

  /**
   * 获取当前AI状态
   */
  public getAIState(): string {
    return this.monster.aiState;
  }

  /**
   * 获取生命值百分比
   */
  public getHealthPercentage(): number {
    return this.monster.stats.hp / this.monster.stats.maxHp;
  }

  /**
   * 死亡事件 - 子类可以重写
   */
  protected onDeath(): void {
    console.log(`怪物 ${this.monster.type} (${this.monster.id}) 死亡了`);
  }

  /**
   * 受伤事件 - 子类可以重写
   */
  protected onDamage(damage: number): void {
    // 可以添加受伤特效
    console.log(`怪物 ${this.monster.type} 受到 ${damage} 点伤害，剩余生命值: ${this.monster.stats.hp}`);
  }

  /**
   * 治疗事件 - 子类可以重写
   */
  protected onHeal(amount: number): void {
    console.log(`怪物 ${this.monster.type} 恢复了 ${amount} 点生命值，当前生命值: ${this.monster.stats.hp}`);
  }

  /**
   * 获取攻击范围
   */
  public getAttackRange(): number {
    return 50; // 默认攻击范围
  }

  /**
   * 获取感知范围
   */
  public getSightRange(): number {
    return 120; // 默认感知范围
  }

  /**
   * 检查玩家是否在攻击范围内
   */
  public isPlayerInAttackRange(playerPosition: Vector2D): boolean {
    const distance = Math.sqrt(
      Math.pow(this.monster.position.x - playerPosition.x, 2) +
      Math.pow(this.monster.position.y - playerPosition.y, 2)
    );
    return distance <= this.getAttackRange();
  }

  /**
   * 检查玩家是否在感知范围内
   */
  public isPlayerInSightRange(playerPosition: Vector2D): boolean {
    const distance = Math.sqrt(
      Math.pow(this.monster.position.x - playerPosition.x, 2) +
      Math.pow(this.monster.position.y - playerPosition.y, 2)
    );
    return distance <= this.getSightRange();
  }

  /**
   * 获取怪物描述信息
   */
  public getMonsterInfo(): string {
    return `
      怪物类型: ${this.monster.type}
      生命值: ${this.monster.stats.hp}/${this.monster.stats.maxHp}
      攻击力: ${this.monster.stats.attack}
      防御力: ${this.monster.stats.defense}
      速度: ${this.monster.stats.speed}
      等级: ${this.monster.stats.level}
      AI状态: ${this.monster.aiState}
      位置: (${Math.round(this.monster.position.x)}, ${Math.round(this.monster.position.y)})
    `;
  }

  /**
   * 重置怪物状态
   */
  public reset(): void {
    this.monster.stats.hp = this.monster.stats.maxHp;
    this.monster.isAlive = true;
    this.monster.aiState = 'idle';
    this.monster.velocity = { x: 0, y: 0 };
    this.monster.isMoving = false;
    this.monster.attackCooldown = 0;
    this.monster.lastAttackTime = 0;
    this.monster.patrolTarget = null;
    this.monster.lastPlayerSighting = null;
  }

  /**
   * 强制设置死亡状态
   */
  public setDead(): void {
    this.monster.isAlive = false;
    this.monster.stats.hp = 0;
    this.onDeath();
  }
}