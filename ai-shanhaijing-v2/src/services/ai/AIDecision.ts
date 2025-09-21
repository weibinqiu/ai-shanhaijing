// AI决策系统 - 负责怪物的行为决策

import type { Vector2D, AIPerception, AIDecision } from '@/types/game';
import { GameUtils } from '@/utils/gameUtils';

export class DecisionSystem {
  /**
   * 做出行为决策
   * @param monster 怪物状态
   * @param perception 感知信息
   * @param gameTime 游戏时间
   * @returns 决策结果
   */
  public makeDecision(
    monster: any,
    perception: AIPerception,
    gameTime: number
  ): AIDecision {
    const currentState = monster.aiState || 'idle';

    // 根据当前状态和感知信息做出决策
    switch (currentState) {
      case 'idle':
        return this.makeIdleDecision(monster, perception);
      case 'chasing':
        return this.makeChasingDecision(monster, perception);
      case 'attacking':
        return this.makeAttackingDecision(monster, perception, gameTime);
      default:
        return this.getDefaultDecision();
    }
  }

  /**
   * 空闲状态决策
   */
  private makeIdleDecision(monster: any, perception: AIPerception): AIDecision {
    if (perception.playerInRange) {
      // 发现玩家，开始追踪
      return {
        action: 'move',
        target: null, // 将在移动逻辑中设置目标
        priority: 8
      };
    }

    // 继续巡逻
    return {
      action: 'move',
      target: this.getPatrolTarget(monster),
      priority: 3
    };
  }

  /**
   * 追踪状态决策
   */
  private makeChasingDecision(monster: any, perception: AIPerception): AIDecision {
    // 检查是否可以攻击
    if (this.canAttack(monster, perception)) {
      return {
        action: 'attack',
        target: null,
        priority: 9
      };
    }

    // 检查是否应该停止追踪
    if (this.shouldStopChasing(monster, perception)) {
      return {
        action: 'idle',
        target: null,
        priority: 5
      };
    }

    // 继续追踪玩家
    return {
      action: 'move',
      target: null, // 将在移动逻辑中设置为玩家位置
      priority: 7
    };
  }

  /**
   * 攻击状态决策
   */
  private makeAttackingDecision(monster: any, perception: AIPerception, gameTime: number): AIDecision {
    const attackCooldown = monster.attackCooldown || 0;

    // 检查攻击冷却
    if (gameTime < attackCooldown) {
      // 攻击冷却中，继续追踪或保持位置
      if (perception.playerInRange) {
        return {
          action: 'move',
          target: null,
          priority: 6
        };
      } else {
        return {
          action: 'idle',
          target: null,
          priority: 4
        };
      }
    }

    // 检查是否还可以攻击
    if (this.canAttack(monster, perception)) {
      // 再次攻击
      return {
        action: 'attack',
        target: null,
        priority: 10
      };
    }

    // 玩家脱离攻击范围，继续追踪
    return {
      action: 'move',
      target: null,
      priority: 7
    };
  }

  /**
   * 默认决策
   */
  private getDefaultDecision(): AIDecision {
    return {
      action: 'idle',
      target: null,
      priority: 1
    };
  }

  /**
   * 检查是否可以攻击
   */
  private canAttack(monster: any, perception: AIPerception): boolean {
    return perception.playerInRange && perception.playerDistance <= 50; // 攻击范围
  }

  /**
   * 检查是否应该停止追踪
   */
  private shouldStopChasing(monster: any, perception: AIPerception): boolean {
    return !perception.playerInRange || perception.playerDistance > 200; // 追踪限制
  }

  /**
   * 获取巡逻目标
   */
  private getPatrolTarget(monster: any): Vector2D | null {
    // 如果有巡逻目标且未到达，继续前往
    if (monster.patrolTarget) {
      const distance = GameUtils.distance(monster.position, monster.patrolTarget);
      if (distance > 20) { // 未到达
        return monster.patrolTarget;
      }
    }

    // 生成新的巡逻目标
    const patrolRadius = 100; // 巡逻半径
    const angle = Math.random() * Math.PI * 2;
    const newTarget = {
      x: monster.position.x + Math.cos(angle) * patrolRadius,
      y: monster.position.y + Math.sin(angle) * patrolRadius
    };

    // 限制在地图范围内
    newTarget.x = Math.max(50, Math.min(1950, newTarget.x));
    newTarget.y = Math.max(50, Math.min(1950, newTarget.y));

    // 更新巡逻目标
    monster.patrolTarget = newTarget;
    return newTarget;
  }

  /**
   * 获取状态转换
   * @param currentState 当前状态
   * @param decision 决策
   * @returns 新的状态
   */
  public getStateTransition(currentState: string, decision: AIDecision): string {
    const stateTransitionMap: { [key: string]: { [key: string]: string } } = {
      'idle': {
        'move': 'chasing',
        'attack': 'attacking',
        'idle': 'idle'
      },
      'chasing': {
        'move': 'chasing',
        'attack': 'attacking',
        'idle': 'idle'
      },
      'attacking': {
        'move': 'chasing',
        'attack': 'attacking',
        'idle': 'idle'
      }
    };

    return stateTransitionMap[currentState]?.[decision.action] || currentState;
  }

  /**
   * 计算决策优先级权重
   * @param monster 怪物状态
   * @param perception 感知信息
   * @param decision 决策
   * @returns 加权后的优先级
   */
  public calculateDecisionWeight(
    monster: any,
    perception: AIPerception,
    decision: AIDecision
  ): number {
    let weight = decision.priority;

    // 根据怪物血量调整权重
    const healthPercentage = monster.stats.hp / monster.stats.maxHp;
    if (healthPercentage < 0.3) {
      // 血量低时，攻击优先级降低（虽然没有逃跑，但会减少攻击倾向）
      if (decision.action === 'attack') {
        weight *= 0.8;
      }
    }

    // 根据玩家距离调整权重
    if (perception.playerDistance < 50) {
      // 玩家很近时，攻击优先级提高
      if (decision.action === 'attack') {
        weight *= 1.2;
      }
    }

    return weight;
  }
}