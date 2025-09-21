// 史莱姆怪物 - 基础怪物类型

import { BaseMonster } from './BaseMonster';
import type { Vector2D, MonsterState, CharacterStats } from '@/types/game';

export class SlimeMonster extends BaseMonster {
  constructor(position: Vector2D) {
    super(position);
  }

  protected createMonster(position: Vector2D): MonsterState {
    const stats: CharacterStats = {
      hp: 25,
      maxHp: 25,
      attack: 4,
      defense: 1,
      speed: 1.8,
      level: 1,
      exp: 0
    };

    return {
      id: `slime_${Date.now()}_${Math.random()}`,
      type: 'slime',
      position: { ...position },
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

  public getColor(): string {
    // 根据生命值改变颜色
    const healthPercentage = this.getHealthPercentage();
    if (healthPercentage > 0.6) {
      return '#4CAF50'; // 绿色 - 健康
    } else if (healthPercentage > 0.3) {
      return '#8BC34A'; // 浅绿色 - 受伤
    } else {
      return '#CDDC39'; // 黄绿色 - 重伤
    }
  }

  public getSize(): number {
    return 25; // 史莱姆体型较小
  }

  public getAttackRange(): number {
    return 30; // 史莱姆攻击范围较小
  }

  public getSightRange(): number {
    return 80; // 史莱姆感知范围较小
  }

  protected onDeath(): void {
    super.onDeath();
    // 史莱姆死亡特效
    console.log('史莱姆分裂成小碎片消失了！');
  }

  protected onDamage(damage: number): void {
    super.onDamage(damage);
    // 史莱姆受伤时会有弹跳效果
    this.applyKnockbackEffect();
  }

  /**
   * 应用史莱姆特有的弹跳效果
   */
  private applyKnockbackEffect(): void {
    // 史莱姆被攻击时会有额外的弹跳
    const bounceDistance = 10;
    const angle = Math.random() * Math.PI * 2;

    this.monster.position.x += Math.cos(angle) * bounceDistance;
    this.monster.position.y += Math.sin(angle) * bounceDistance;

    // 确保不超出地图边界
    this.monster.position.x = Math.max(20, Math.min(1980, this.monster.position.x));
    this.monster.position.y = Math.max(20, Math.min(1980, this.monster.position.y));
  }

  /**
   * 获取史莱姆的描述信息
   */
  public getSlimeInfo(): string {
    return `
      🟢 史莱姆信息 🟢
      ${this.getMonsterInfo()}
      特殊能力: 被攻击时会弹跳
      攻击范围: ${this.getAttackRange()}px
      感知范围: ${this.getSightRange()}px
    `;
  }
}