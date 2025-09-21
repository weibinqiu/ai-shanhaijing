// 哥布林怪物 - 普通怪物类型

import { BaseMonster } from './BaseMonster';
import type { Vector2D, MonsterState, CharacterStats } from '@/types/game';

export class GoblinMonster extends BaseMonster {
  constructor(position: Vector2D) {
    super(position);
  }

  protected createMonster(position: Vector2D): MonsterState {
    const stats: CharacterStats = {
      hp: 45,
      maxHp: 45,
      attack: 8,
      defense: 3,
      speed: 2.5,
      level: 2,
      exp: 0
    };

    return {
      id: `goblin_${Date.now()}_${Math.random()}`,
      type: 'goblin',
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
    const healthPercentage = this.getHealthPercentage();
    if (healthPercentage > 0.6) {
      return '#8D6E63'; // 棕色 - 健康
    } else if (healthPercentage > 0.3) {
      return '#A1887F'; // 浅棕色 - 受伤
    } else {
      return '#BCAAA4'; // 米色 - 重伤
    }
  }

  public getSize(): number {
    return 30; // 哥布林体型中等
  }

  public getAttackRange(): number {
    return 40; // 哥布林攻击范围中等
  }

  public getSightRange(): number {
    return 120; // 哥布林感知范围中等
  }

  protected onDeath(): void {
    super.onDeath();
    console.log('哥布林倒下了，掉落了一些物品！');
  }

  protected onDamage(damage: number): void {
    super.onDamage(damage);
    // 哥布林受伤时有激怒效果
    this.applyRageEffect();
  }

  /**
   * 哥布林特有的激怒效果
   */
  private applyRageEffect(): void {
    const healthPercentage = this.getHealthPercentage();

    // 血量低于50%时进入激怒状态
    if (healthPercentage < 0.5) {
      // 临时提升攻击力
      const rageBonus = 2;
      this.monster.stats.attack = 10 + rageBonus;

      // 提升移动速度
      this.monster.stats.speed = 3.5;

      console.log('哥布林进入激怒状态，攻击力和速度提升！');
    }
  }

  /**
   * 重写更新方法以处理特殊效果
   */
  public update(player: any, deltaTime: number, gameTime: number): void {
    // 检查激怒状态是否应该结束
    const healthPercentage = this.getHealthPercentage();
    if (healthPercentage >= 0.5) {
      // 恢复正常状态
      this.monster.stats.attack = 10;
      this.monster.stats.speed = 3;
    }

    // 调用父类更新
    super.update(player, deltaTime, gameTime);
  }

  /**
   * 获取哥布林的描述信息
   */
  public getGoblinInfo(): string {
    const isRaging = this.getHealthPercentage() < 0.5;
    return `
      🟤 哥布林信息 🟤
      ${this.getMonsterInfo()}
      特殊能力: 血量低于50%时激怒${isRaging ? ' (激怒中)' : ''}
      攻击范围: ${this.getAttackRange()}px
      感知范围: ${this.getSightRange()}px
      激怒效果: 攻击力+2, 速度+0.5
    `;
  }
}