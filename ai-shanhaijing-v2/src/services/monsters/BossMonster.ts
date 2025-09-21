// Boss怪物 - 强大的首领怪物

import { BaseMonster } from './BaseMonster';
import type { Vector2D, MonsterState, CharacterStats } from '@/types/game';
import { MonsterFactory } from '../spawners/MonsterFactory';

export class BossMonster extends BaseMonster {
  private phase: number = 1; // Boss阶段
  private skillCooldowns: { [key: string]: number } = {};
  private lastSpawnTime: number = 0;
  private minions: BaseMonster[] = [];

  constructor(position: Vector2D) {
    super(position);
    this.initializeBossSkills();
  }

  protected createMonster(position: Vector2D): MonsterState {
    const stats: CharacterStats = {
      hp: 180,
      maxHp: 180,
      attack: 20,
      defense: 12,
      speed: 2.2,
      level: 5,
      exp: 0
    };

    return {
      id: `boss_${Date.now()}_${Math.random()}`,
      type: 'boss',
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
    // 根据Boss阶段改变颜色
    switch (this.phase) {
      case 1:
        return '#4A148C'; // 深紫色 - 第一阶段
      case 2:
        return '#6A1B9A'; // 紫色 - 第二阶段
      case 3:
        return '#8E24AA'; // 浅紫色 - 第三阶段
      default:
        return '#4A148C';
    }
  }

  public getSize(): number {
    return 50; // Boss体型最大
  }

  public getAttackRange(): number {
    return 80; // Boss攻击范围最大
  }

  public getSightRange(): number {
    return 200; // Boss感知范围最大
  }

  protected onDeath(): void {
    super.onDeath();
    console.log('🎉 Boss被击败了！世界恢复了和平！');

    // 清理小怪
    this.minions.forEach(minion => minion.setDead());
    this.minions = [];
  }

  protected onDamage(damage: number): void {
    super.onDamage(damage);

    // 检查是否需要进入下一阶段
    this.checkPhaseTransition();

    // 受伤时有可能召唤小怪
    if (Math.random() < 0.3) { // 30%概率
      this.summonMinions();
    }
  }

  /**
   * 初始化Boss技能
   */
  private initializeBossSkills(): void {
    this.skillCooldowns = {
      'meteor': 0,
      'summon': 0,
      'rage': 0,
      'heal': 0
    };
  }

  /**
   * 重写更新方法
   */
  public update(player: any, deltaTime: number, gameTime: number): void {
    // 更新技能冷却
    this.updateSkillCooldowns(deltaTime);

    // 更新小怪
    this.updateMinions(player, deltaTime, gameTime);

    // Boss技能逻辑
    if (player && player.isAlive) {
      this.executeBossSkills(player, gameTime);
    }

    // 调用父类更新
    super.update(player, deltaTime, gameTime);
  }

  /**
   * 更新技能冷却
   */
  private updateSkillCooldowns(deltaTime: number): void {
    for (const skill in this.skillCooldowns) {
      if (this.skillCooldowns[skill] > 0) {
        this.skillCooldowns[skill] -= deltaTime;
      }
    }
  }

  /**
   * 执行Boss技能
   */
  private executeBossSkills(player: any, gameTime: number): void {
    const distance = this.getDistanceToPlayer(player);

    // 根据阶段和距离使用不同技能
    switch (this.phase) {
      case 1:
        this.executePhase1Skills(player, gameTime, distance);
        break;
      case 2:
        this.executePhase2Skills(player, gameTime, distance);
        break;
      case 3:
        this.executePhase3Skills(player, gameTime, distance);
        break;
    }
  }

  /**
   * 第一阶段技能
   */
  private executePhase1Skills(player: any, gameTime: number, distance: number): void {
    // 召唤技能
    if (this.skillCooldowns.summon <= 0 && distance < 150) {
      this.summonMinions();
      this.skillCooldowns.summon = 15; // 15秒冷却
    }

    // 普通攻击加强
    if (distance <= this.getAttackRange()) {
      this.enhancedAttack(player, gameTime);
    }
  }

  /**
   * 第二阶段技能
   */
  private executePhase2Skills(player: any, gameTime: number, distance: number): void {
    // 流星技能
    if (this.skillCooldowns.meteor <= 0 && distance < 200) {
      this.meteorStrike(player, gameTime);
      this.skillCooldowns.meteor = 10; // 10秒冷却
    }

    // 愤怒技能
    if (this.getHealthPercentage() < 0.5 && this.skillCooldowns.rage <= 0) {
      this.rageMode();
      this.skillCooldowns.rage = 20; // 20秒冷却
    }
  }

  /**
   * 第三阶段技能
   */
  private executePhase3Skills(player: any, gameTime: number, distance: number): void {
    // 治疗技能
    if (this.getHealthPercentage() < 0.3 && this.skillCooldowns.heal <= 0) {
      this.bossHeal();
      this.skillCooldowns.heal = 25; // 25秒冷却
    }

    // 全部技能都可以使用
    this.executePhase1Skills(player, gameTime, distance);
    this.executePhase2Skills(player, gameTime, distance);
  }

  /**
   * 检查阶段转换
   */
  private checkPhaseTransition(): void {
    const healthPercentage = this.getHealthPercentage();

    if (healthPercentage <= 0.33 && this.phase < 3) {
      this.phase = 3;
      console.log('Boss进入第三阶段！全力战斗！');
    } else if (healthPercentage <= 0.66 && this.phase < 2) {
      this.phase = 2;
      console.log('Boss进入第二阶段！力量增强！');
    }
  }

  /**
   * 召唤小怪
   */
  private summonMinions(): void {
    if (this.minions.length >= 3) return; // 最多3个小怪

    const currentTime = Date.now();
    if (currentTime - this.lastSpawnTime < 5000) return; // 5秒内不能重复召唤

    const summonPositions = [
      { x: this.monster.position.x + 60, y: this.monster.position.y + 60 },
      { x: this.monster.position.x - 60, y: this.monster.position.y - 60 },
      { x: this.monster.position.x + 60, y: this.monster.position.y - 60 }
    ];

    summonPositions.forEach(pos => {
      if (this.minions.length < 3) {
        const minion = MonsterFactory.createRandomMonster(pos, ['boss']);
        this.minions.push(minion);
      }
    });

    this.lastSpawnTime = currentTime;
    console.log('Boss召唤了小怪！');
  }

  /**
   * 流星打击
   */
  private meteorStrike(player: any, gameTime: number): void {
    const damage = 30;
    const actualDamage = Math.max(1, damage - player.stats.defense);

    player.stats.hp = Math.max(0, player.stats.hp - actualDamage);

    console.log(`Boss发动流星打击，造成 ${actualDamage} 点伤害！`);
  }

  /**
   * 愤怒模式
   */
  private rageMode(): void {
    this.monster.stats.attack *= 1.5;
    this.monster.stats.speed *= 1.3;

    console.log('Boss进入愤怒模式！攻击力和速度大幅提升！');
  }

  /**
   * Boss治疗
   */
  private bossHeal(): void {
    const healAmount = 40;
    this.monster.stats.hp = Math.min(
      this.monster.stats.maxHp,
      this.monster.stats.hp + healAmount
    );

    console.log(`Boss恢复了 ${healAmount} 点生命值！`);
  }

  /**
   * 强化攻击
   */
  private enhancedAttack(player: any, gameTime: number): void {
    if (gameTime < (this.monster.attackCooldown || 0)) return;

    const damage = this.monster.stats.attack * 1.2;
    const actualDamage = Math.max(1, damage - player.stats.defense);

    player.stats.hp = Math.max(0, player.stats.hp - actualDamage);
    this.monster.attackCooldown = gameTime + 2;

    console.log(`Boss发动强化攻击，造成 ${actualDamage} 点伤害！`);
  }

  /**
   * 更新小怪
   */
  private updateMinions(player: any, deltaTime: number, gameTime: number): void {
    // 更新所有小怪
    this.minions.forEach(minion => {
      if (minion.isAlive()) {
        minion.update(player, deltaTime, gameTime);
      }
    });

    // 清理死亡的小怪
    this.minions = this.minions.filter(minion => minion.isAlive());
  }

  /**
   * 获取到玩家的距离
   */
  private getDistanceToPlayer(player: any): number {
    const dx = player.position.x - this.monster.position.x;
    const dy = player.position.y - this.monster.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 获取Boss的描述信息
   */
  public getBossInfo(): string {
    return `
      👑 Boss信息 👑
      ${this.getMonsterInfo()}
      当前阶段: 第${this.phase}阶段
      小怪数量: ${this.minions.length}
      技能冷却:
        - 召唤: ${Math.max(0, Math.round(this.skillCooldowns.summon || 0))}秒
        - 流星: ${Math.max(0, Math.round(this.skillCooldowns.meteor || 0))}秒
        - 愤怒: ${Math.max(0, Math.round(this.skillCooldowns.rage || 0))}秒
        - 治疗: ${Math.max(0, Math.round(this.skillCooldowns.heal || 0))}秒
    `;
  }

  /**
   * 获取所有小怪
   */
  public getMinions(): BaseMonster[] {
    return [...this.minions];
  }
}