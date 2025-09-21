// 兽人怪物 - 精英怪物类型

import { BaseMonster } from './BaseMonster';
import type { Vector2D, MonsterState, CharacterStats } from '@/types/game';

export class OrcMonster extends BaseMonster {
  private heavyAttackCooldown: number = 0;
  private isCharging: boolean = false;

  constructor(position: Vector2D) {
    super(position);
  }

  protected createMonster(position: Vector2D): MonsterState {
    const stats: CharacterStats = {
      hp: 70,
      maxHp: 70,
      attack: 12,
      defense: 6,
      speed: 3.2,
      level: 3,
      exp: 0
    };

    return {
      id: `orc_${Date.now()}_${Math.random()}`,
      type: 'orc',
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
      return '#D32F2F'; // 红色 - 健康
    } else if (healthPercentage > 0.3) {
      return '#F44336'; // 浅红色 - 受伤
    } else {
      return '#FFCDD2'; // 粉红色 - 重伤
    }
  }

  public getSize(): number {
    return 35; // 兽人体型较大
  }

  public getAttackRange(): number {
    return 50; // 兽人攻击范围较大
  }

  public getSightRange(): number {
    return 150; // 兽人感知范围较大
  }

  protected onDeath(): void {
    super.onDeath();
    console.log('兽人战士倒下了，经验丰富！');
  }

  protected onDamage(damage: number): void {
    super.onDamage(damage);
    // 兽人受伤时准备重击
    this.prepareHeavyAttack();
  }

  /**
   * 准备重击
   */
  private prepareHeavyAttack(): void {
    const healthPercentage = this.getHealthPercentage();

    // 血量低于30%时准备重击
    if (healthPercentage < 0.3 && this.heavyAttackCooldown <= 0) {
      this.isCharging = true;
      this.heavyAttackCooldown = 5; // 5秒冷却

      console.log('兽人开始蓄力重击！');
    }
  }

  /**
   * 重写更新方法
   */
  public update(player: any, deltaTime: number, gameTime: number): void {
    // 更新重击冷却
    if (this.heavyAttackCooldown > 0) {
      this.heavyAttackCooldown -= deltaTime;
    }

    // 如果正在蓄力，检查是否可以释放重击
    if (this.isCharging && player && this.isPlayerInAttackRange(player.position)) {
      this.performHeavyAttack(player, gameTime);
      this.isCharging = false;
    }

    // 调用父类更新
    super.update(player, deltaTime, gameTime);
  }

  /**
   * 执行重击
   */
  private performHeavyAttack(player: any, gameTime: number): void {
    const heavyDamage = this.monster.stats.attack * 1.5; // 1.5倍伤害
    const actualDamage = Math.max(1, heavyDamage - player.stats.defense);

    // 应用伤害
    player.stats.hp = Math.max(0, player.stats.hp - actualDamage);

    // 设置攻击冷却
    this.monster.attackCooldown = gameTime + 2.5; // 重击后冷却较长

    // 强大的击退效果
    this.applyHeavyKnockback(player);

    console.log(`兽人发动重击，造成 ${actualDamage} 点伤害！`);
  }

  /**
   * 强大的击退效果
   */
  private applyHeavyKnockback(target: any): void {
    const knockbackDistance = 40;
    const direction = this.getDirectionToTarget(target.position);

    target.position.x += direction.x * knockbackDistance;
    target.position.y += direction.y * knockbackDistance;

    // 确保不超出地图边界
    target.position.x = Math.max(0, Math.min(2000, target.position.x));
    target.position.y = Math.max(0, Math.min(2000, target.position.y));
  }

  /**
   * 获取到目标的方向
   */
  private getDirectionToTarget(targetPosition: Vector2D): Vector2D {
    const dx = targetPosition.x - this.monster.position.x;
    const dy = targetPosition.y - this.monster.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      x: dx / distance,
      y: dy / distance
    };
  }

  /**
   * 获取兽人的描述信息
   */
  public getOrcInfo(): string {
    const canHeavyAttack = this.heavyAttackCooldown <= 0 && this.getHealthPercentage() < 0.3;
    return `
      🔴 兽人信息 🔴
      ${this.getMonsterInfo()}
      特殊能力: 血量低于30%时可蓄力重击
      重击伤害: ${Math.round(this.monster.stats.attack * 1.5)}点
      重击冷却: ${Math.max(0, Math.round(this.heavyAttackCooldown))}秒
      当前状态: ${this.isCharging ? '蓄力重击中' : '正常'}${canHeavyAttack ? ' (可重击)' : ''}
      攻击范围: ${this.getAttackRange()}px
      感知范围: ${this.getSightRange()}px
    `;
  }
}