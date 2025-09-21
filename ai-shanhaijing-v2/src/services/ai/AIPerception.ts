// AI感知系统 - 负责怪物的环境感知和信息收集

import type { Vector2D, CharacterState, AIPerception } from '@/types/game';
import { GameUtils } from '@/utils/gameUtils';

export class PerceptionSystem {
  // 感知配置
  private perceptionConfig = {
    // 怪物类型对应的感知半径
    slime: { sightRange: 80, attackRange: 30 },
    goblin: { sightRange: 120, attackRange: 40 },
    orc: { sightRange: 150, attackRange: 50 },
    boss: { sightRange: 200, attackRange: 80 }
  };

  /**
   * 感知环境信息
   * @param monster 怪物状态
   * @param player 玩家状态
   * @param gameTime 游戏时间
   * @returns 感知信息
   */
  public perceive(
    monster: any,
    player: CharacterState | null,
    gameTime: number
  ): AIPerception {
    // 快速返回：如果没有玩家或玩家死亡，直接返回默认感知
    if (!player || !player.isAlive) {
      return {
        playerInRange: false,
        playerDistance: Infinity,
        obstacles: [],
        escapeRoute: null
      };
    }

    const monsterType = monster.type || 'slime';
    const config = this.perceptionConfig[monsterType as keyof typeof this.perceptionConfig] ||
                   this.perceptionConfig.slime;

    // 优化距离计算：使用平方距离避免开平方运算
    const dx = player.position.x - monster.position.x;
    const dy = player.position.y - monster.position.y;
    const distanceSquared = dx * dx + dy * dy;
    const sightRangeSquared = config.sightRange * config.sightRange;

    // 只有在范围内才计算实际距离
    if (distanceSquared <= sightRangeSquared) {
      const distance = Math.sqrt(distanceSquared);
      return {
        playerInRange: true,
        playerDistance: distance,
        obstacles: [],
        escapeRoute: null
      };
    }

    return {
      playerInRange: false,
      playerDistance: Math.sqrt(distanceSquared),
      obstacles: [],
      escapeRoute: null
    };
  }

  /**
   * 检查玩家是否在攻击范围内
   * @param monster 怪物状态
   * @param player 玩家状态
   * @returns 是否在攻击范围内
   */
  public isPlayerInAttackRange(monster: any, player: CharacterState | null): boolean {
    if (!player || !player.isAlive) return false;

    const monsterType = monster.type || 'slime';
    const config = this.perceptionConfig[monsterType as keyof typeof this.perceptionConfig] ||
                   this.perceptionConfig.slime;

    const distance = GameUtils.distance(monster.position, player.position);
    return distance <= config.attackRange;
  }

  /**
   * 获取怪物的感知配置
   * @param monsterType 怪物类型
   * @returns 感知配置
   */
  public getPerceptionConfig(monsterType: string) {
    return this.perceptionConfig[monsterType as keyof typeof this.perceptionConfig] ||
           this.perceptionConfig.slime;
  }

  /**
   * 计算追踪方向
   * @param monster 怪物位置
   * @param player 玩家位置
   * @returns 标准化的方向向量
   */
  public getChaseDirection(monsterPos: Vector2D, playerPos: Vector2D): Vector2D {
    return GameUtils.normalize(GameUtils.subtract(playerPos, monsterPos));
  }

  /**
   * 检查是否应该停止追踪
   * @param monster 怪物状态
   * @param player 玩家状态
   * @returns 是否应该停止追踪
   */
  public shouldStopChasing(monster: any, player: CharacterState | null): boolean {
    if (!player || !player.isAlive) return true;

    const monsterType = monster.type || 'slime';
    const config = this.perceptionConfig[monsterType as keyof typeof this.perceptionConfig] ||
                   this.perceptionConfig.slime;

    const distance = GameUtils.distance(monster.position, player.position);
    // 玩家脱离感知范围时停止追踪
    return distance > config.sightRange * 1.2; // 给予一些缓冲范围
  }
}