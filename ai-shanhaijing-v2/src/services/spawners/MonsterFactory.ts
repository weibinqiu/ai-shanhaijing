// 怪物工厂 - 负责创建各种类型的怪物

import type { Vector2D } from '@/types/game';
import { SlimeMonster } from '../monsters/SlimeMonster';
import { GoblinMonster } from '../monsters/GoblinMonster';
import { OrcMonster } from '../monsters/OrcMonster';
import { BossMonster } from '../monsters/BossMonster';
import { BaseMonster } from '../monsters/BaseMonster';

export class MonsterFactory {
  /**
   * 创建指定类型的怪物
   * @param type 怪物类型
   * @param position 生成位置
   * @returns 怪物实例
   */
  public static createMonster(type: string, position: Vector2D): BaseMonster {
    switch (type.toLowerCase()) {
      case 'slime':
        return new SlimeMonster(position);
      case 'goblin':
        return new GoblinMonster(position);
      case 'orc':
        return new OrcMonster(position);
      case 'boss':
        return new BossMonster(position);
      default:
        console.warn(`未知的怪物类型: ${type}，默认创建史莱姆`);
        return new SlimeMonster(position);
    }
  }

  /**
   * 创建随机怪物
   * @param position 生成位置
   * @param excludeTypes 排除的怪物类型
   * @returns 随机怪物实例
   */
  public static createRandomMonster(position: Vector2D, excludeTypes: string[] = []): BaseMonster {
    const availableTypes = ['slime', 'goblin', 'orc'].filter(
      type => !excludeTypes.includes(type)
    );

    if (availableTypes.length === 0) {
      return new SlimeMonster(position);
    }

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return this.createMonster(randomType, position);
  }

  /**
   * 批量创建怪物
   * @param monsterConfig 怪物配置数组
   * @returns 怪物实例数组
   */
  public static createMonsters(monsterConfig: Array<{
    type: string;
    position: Vector2D;
  }>): BaseMonster[] {
    return monsterConfig.map(config =>
      this.createMonster(config.type, config.position)
    );
  }

  /**
   * 获取怪物类型权重
   * @returns 怪物类型及其权重
   */
  public static getMonsterWeights(): { [key: string]: number } {
    return {
      slime: 5,    // 史莱姆最常见
      goblin: 3,  // 哥布林中等
      orc: 1,     // 兽人较少见
      boss: 0     // Boss不随机生成
    };
  }

  /**
   * 根据权重创建随机怪物
   * @param position 生成位置
   * @returns 根据权重创建的怪物
   */
  public static createWeightedRandomMonster(position: Vector2D): BaseMonster {
    const weights = this.getMonsterWeights();
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return this.createMonster(type, position);
      }
    }

    // 如果权重计算有问题，默认创建史莱姆
    return new SlimeMonster(position);
  }

  /**
   * 获取所有可用的怪物类型
   * @returns 怪物类型数组
   */
  public static getAvailableMonsterTypes(): string[] {
    return ['slime', 'goblin', 'orc', 'boss'];
  }

  /**
   * 检查怪物类型是否有效
   * @param type 怪物类型
   * @returns 是否有效
   */
  public static isValidMonsterType(type: string): boolean {
    return this.getAvailableMonsterTypes().includes(type.toLowerCase());
  }

  /**
   * 获取怪物类型的中文名称
   * @param type 怪物类型
   * @returns 中文名称
   */
  public static getMonsterChineseName(type: string): string {
    const nameMap: { [key: string]: string } = {
      slime: '史莱姆',
      goblin: '哥布林',
      orc: '兽人',
      boss: 'Boss'
    };

    return nameMap[type.toLowerCase()] || '未知怪物';
  }

  /**
   * 获取怪物类型的描述信息
   * @param type 怪物类型
   * @returns 描述信息
   */
  public static getMonsterDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      slime: '史莱姆 - 基础怪物，移动缓慢但数量众多',
      goblin: '哥布林 - 普通怪物，平衡的攻击和防御',
      orc: '兽人 - 精英怪物，高攻击力，危险敌人',
      boss: 'Boss - 强大的首领怪物，需要团队配合'
    };

    return descriptions[type.toLowerCase()] || '未知怪物类型';
  }
}