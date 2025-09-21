// 怪物生成器 - 负责怪物的生成和管理

import type { Vector2D } from '@/types/game';
import { MonsterFactory } from './MonsterFactory';
import { BaseMonster } from '../monsters/BaseMonster';

export interface SpawnConfig {
  maxMonsters: number;
  spawnInterval: number; // 秒
  initialMonsters: Array<{
    type: string;
    position: Vector2D;
  }>;
  spawnWeights: { [key: string]: number };
  safeZone: {
    center: Vector2D;
    radius: number;
  };
}

export class MonsterSpawner {
  private monsters: BaseMonster[] = [];
  private config: SpawnConfig;
  private lastSpawnTime: number = 0;
  private gameTime: number = 0;

  constructor(config: Partial<SpawnConfig> = {}) {
    this.config = this.getDefaultConfig(config);
    this.spawnInitialMonsters();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(config: Partial<SpawnConfig>): SpawnConfig {
    return {
      maxMonsters: config.maxMonsters || 10,
      spawnInterval: config.spawnInterval || 30, // 30秒
      initialMonsters: config.initialMonsters || [
        { type: 'slime', position: { x: 300, y: 300 } },
        { type: 'slime', position: { x: 500, y: 400 } },
        { type: 'slime', position: { x: 700, y: 300 } },
        { type: 'goblin', position: { x: 400, y: 600 } },
        { type: 'goblin', position: { x: 800, y: 500 } },
        { type: 'orc', position: { x: 600, y: 800 } }
      ],
      spawnWeights: config.spawnWeights || {
        slime: 5,
        goblin: 3,
        orc: 2
      },
      safeZone: config.safeZone || {
        center: { x: 1000, y: 1000 },
        radius: 200
      }
    };
  }

  /**
   * 生成初始怪物
   */
  private spawnInitialMonsters(): void {
    this.monsters = MonsterFactory.createMonsters(this.config.initialMonsters);
    console.log(`生成了 ${this.monsters.length} 个初始怪物`);
  }

  /**
   * 更新生成器
   */
  public update(player: any, deltaTime: number, gameTime: number): void {
    this.gameTime = gameTime;

    // 更新所有怪物
    this.updateMonsters(player, deltaTime, gameTime);

    // 清理死亡怪物
    this.cleanupDeadMonsters();

    // 检查是否需要生成新怪物
    this.checkSpawning(player);
  }

  /**
   * 更新所有怪物
   */
  private updateMonsters(player: any, deltaTime: number, gameTime: number): void {
    this.monsters.forEach(monster => {
      if (monster.isAlive()) {
        monster.update(player, deltaTime, gameTime);
      }
    });
  }

  /**
   * 清理死亡怪物
   */
  private cleanupDeadMonsters(): void {
    const aliveMonsters = this.monsters.filter(monster => monster.isAlive());
    const deadCount = this.monsters.length - aliveMonsters.length;

    if (deadCount > 0) {
      console.log(`清理了 ${deadCount} 个死亡怪物`);
    }

    this.monsters = aliveMonsters;
  }

  /**
   * 检查生成条件
   */
  private checkSpawning(player: any): void {
    // 检查怪物数量
    if (this.monsters.length >= this.config.maxMonsters) {
      return;
    }

    // 检查生成间隔
    if (this.gameTime - this.lastSpawnTime < this.config.spawnInterval) {
      return;
    }

    // 生成新怪物
    this.spawnMonster(player);
    this.lastSpawnTime = this.gameTime;
  }

  /**
   * 生成新怪物
   */
  private spawnMonster(player: any): void {
    const position = this.findSafeSpawnPosition(player);

    if (position) {
      const monster = MonsterFactory.createWeightedRandomMonster(position);
      this.monsters.push(monster);
      console.log(`生成了 ${MonsterFactory.getMonsterChineseName(monster.getType())}，当前怪物数量: ${this.monsters.length}`);
    }
  }

  /**
   * 找到安全的生成位置
   */
  private findSafeSpawnPosition(player: any): Vector2D | null {
    const maxAttempts = 10;
    const mapBounds = { minX: 50, maxX: 1950, minY: 50, maxY: 1950 };

    for (let i = 0; i < maxAttempts; i++) {
      const position = {
        x: Math.random() * (mapBounds.maxX - mapBounds.minX) + mapBounds.minX,
        y: Math.random() * (mapBounds.maxY - mapBounds.minY) + mapBounds.minY
      };

      // 检查是否在安全区内
      if (this.isInSafeZone(position)) {
        continue;
      }

      // 检查是否距离玩家太近
      if (player && player.isAlive) {
        const distanceToPlayer = Math.sqrt(
          Math.pow(position.x - player.position.x, 2) +
          Math.pow(position.y - player.position.y, 2)
        );

        if (distanceToPlayer < 150) { // 距离玩家至少150px
          continue;
        }
      }

      // 检查是否与其他怪物太近
      const tooClose = this.monsters.some(monster => {
        const distance = Math.sqrt(
          Math.pow(position.x - monster.getPosition().x, 2) +
          Math.pow(position.y - monster.getPosition().y, 2)
        );
        return distance < 50; // 距离其他怪物至少50px
      });

      if (!tooClose) {
        return position;
      }
    }

    return null; // 没有找到合适位置
  }

  /**
   * 检查是否在安全区内
   */
  private isInSafeZone(position: Vector2D): boolean {
    const distance = Math.sqrt(
      Math.pow(position.x - this.config.safeZone.center.x, 2) +
      Math.pow(position.y - this.config.safeZone.center.y, 2)
    );
    return distance < this.config.safeZone.radius;
  }

  /**
   * 手动生成Boss
   */
  public spawnBoss(position: Vector2D): BaseMonster | null {
    if (this.monsters.length >= this.config.maxMonsters) {
      console.log('怪物数量已达上限，无法生成Boss');
      return null;
    }

    const boss = MonsterFactory.createMonster('boss', position);
    this.monsters.push(boss);
    console.log('👑 Boss出现了！');
    return boss;
  }

  /**
   * 获取所有怪物
   */
  public getMonsters(): BaseMonster[] {
    return [...this.monsters];
  }

  /**
   * 获取存活的怪物
   */
  public getAliveMonsters(): BaseMonster[] {
    return this.monsters.filter(monster => monster.isAlive());
  }

  /**
   * 根据类型获取怪物
   */
  public getMonstersByType(type: string): BaseMonster[] {
    return this.monsters.filter(monster => monster.getType() === type);
  }

  /**
   * 获取怪物数量
   */
  public getMonsterCount(): number {
    return this.monsters.length;
  }

  /**
   * 获取存活怪物数量
   */
  public getAliveMonsterCount(): number {
    return this.monsters.filter(monster => monster.isAlive()).length;
  }

  /**
   * 获取每种类型的怪物数量
   */
  public getMonsterCountByType(): { [key: string]: number } {
    const count: { [key: string]: number } = {};

    this.monsters.forEach(monster => {
      const type = monster.getType();
      count[type] = (count[type] || 0) + 1;
    });

    return count;
  }

  /**
   * 清除所有怪物
   */
  public clearAllMonsters(): void {
    this.monsters.forEach(monster => monster.setDead());
    this.monsters = [];
    console.log('清除了所有怪物');
  }

  /**
   * 移除指定怪物
   */
  public removeMonster(monsterId: string): void {
    const index = this.monsters.findIndex(monster => monster.getMonsterState().id === monsterId);
    if (index !== -1) {
      this.monsters[index].setDead();
      this.monsters.splice(index, 1);
      console.log(`移除了怪物: ${monsterId}`);
    }
  }

  /**
   * 重置生成器
   */
  public reset(): void {
    this.clearAllMonsters();
    this.spawnInitialMonsters();
    this.lastSpawnTime = 0;
    console.log('生成器已重置');
  }

  /**
   * 获取生成器信息
   */
  public getSpawnerInfo(): string {
    const countByType = this.getMonsterCountByType();
    const aliveCount = this.getAliveMonsterCount();

    let info = `🎯 怪物生成器信息 🎯\n`;
    info += `存活怪物: ${aliveCount}/${this.monsters.length}\n`;
    info += `最大限制: ${this.config.maxMonsters}\n`;
    info += `生成间隔: ${this.config.spawnInterval}秒\n`;
    info += `下次生成: ${Math.max(0, Math.round(this.config.spawnInterval - (this.gameTime - this.lastSpawnTime)))}秒\n`;
    info += `\n怪物分布:\n`;

    for (const [type, count] of Object.entries(countByType)) {
      info += `  ${MonsterFactory.getMonsterChineseName(type)}: ${count}只\n`;
    }

    return info;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<SpawnConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('生成器配置已更新');
  }

  /**
   * 强制生成怪物（用于测试）
   */
  public forceSpawn(type: string, position: Vector2D): BaseMonster | null {
    if (this.monsters.length >= this.config.maxMonsters) {
      return null;
    }

    if (!MonsterFactory.isValidMonsterType(type)) {
      console.log(`无效的怪物类型: ${type}`);
      return null;
    }

    const monster = MonsterFactory.createMonster(type, position);
    this.monsters.push(monster);
    return monster;
  }
}