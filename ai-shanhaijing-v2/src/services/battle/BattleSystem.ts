// 回合制战斗系统核心

import type {
  BattleCharacter,
  BattleState,
  Skill,
  BattleAction,
  BattleLogEntry,
  StatusEffect,
  CharacterStats,
  Vector2D
} from '@/types/game';
import { GameUtils } from '@/utils/gameUtils';

export class BattleSystem {
  private battleState: BattleState;
  private onStateChange: (state: BattleState) => void;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement,
    playerCharacters: BattleCharacter[],
    enemyCharacters: BattleCharacter[],
    onStateChange: (state: BattleState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

    // 初始化战斗状态
    this.battleState = {
      playerTeam: playerCharacters.map(char => this.initializeBattleCharacter(char)),
      enemyTeam: enemyCharacters.map(char => this.initializeBattleCharacter(char)),
      currentTurn: 'player',
      turnPhase: 'selecting',
      selectedCharacter: null,
      selectedSkill: null,
      targetCharacter: null,
      battleLog: [],
      round: 1,
      winner: null
    };

    this.addBattleLog('战斗开始！', 'system');
    this.onStateChange(this.battleState);
  }

  /**
   * 初始化战斗角色
   */
  private initializeBattleCharacter(character: BattleCharacter): BattleCharacter {
    return {
      ...character,
      currentHp: character.stats.maxHp,
      currentMp: 50, // 初始MP
      statusEffects: [],
      isAlive: true
    };
  }

  /**
   * 获取当前战斗状态
   */
  public getBattleState(): BattleState {
    return { ...this.battleState };
  }

  /**
   * 选择角色
   */
  public selectCharacter(characterId: string): boolean {
    if (this.battleState.turnPhase !== 'selecting') return false;
    if (this.battleState.currentTurn !== 'player') return false;

    const character = this.battleState.playerTeam.find(c => c.id === characterId);
    if (!character || !character.isAlive) return false;

    this.battleState.selectedCharacter = character;
    this.onStateChange(this.battleState);
    return true;
  }

  /**
   * 选择技能
   */
  public selectSkill(skillId: string): boolean {
    if (!this.battleState.selectedCharacter) return false;
    if (this.battleState.turnPhase !== 'selecting') return false;

    const skill = this.battleState.selectedCharacter.skills.find(s => s.id === skillId);
    if (!skill) return false;

    // 检查MP和冷却时间
    if (this.battleState.selectedCharacter.currentMp < skill.manaCost) {
      this.addBattleLog('MP不足！', 'system');
      return false;
    }

    if (skill.currentCooldown > 0) {
      this.addBattleLog(`${skill.name} 冷却中...`, 'system');
      return false;
    }

    this.battleState.selectedSkill = skill;
    this.onStateChange(this.battleState);
    return true;
  }

  /**
   * 选择目标
   */
  public selectTarget(targetId: string): boolean {
    if (!this.battleState.selectedSkill) return false;
    if (this.battleState.turnPhase !== 'selecting') return false;

    const target = this.battleState.enemyTeam.find(c => c.id === targetId);
    if (!target || !target.isAlive) return false;

    this.battleState.targetCharacter = target;
    this.executeAction();
    return true;
  }

  /**
   * 执行行动
   */
  private executeAction(): void {
    if (!this.battleState.selectedCharacter || !this.battleState.selectedSkill || !this.battleState.targetCharacter) {
      return;
    }

    this.battleState.turnPhase = 'acting';

    const action = this.createBattleAction();
    this.processBattleAction(action);
    this.updateCooldowns();

    // 结束玩家回合
    this.endPlayerTurn();
  }

  /**
   * 创建战斗行动
   */
  private createBattleAction(): BattleAction {
    const actor = this.battleState.selectedCharacter!;
    const skill = this.battleState.selectedSkill!;
    const target = this.battleState.targetCharacter!;

    const baseDamage = this.calculateDamage(actor, target, skill);
    const critical = Math.random() < 0.15; // 15%暴击率
    const effectiveness = this.calculateEffectiveness(skill, target);

    const finalDamage = Math.floor(baseDamage * (critical ? 1.5 : 1) * this.getEffectivenessMultiplier(effectiveness));

    return {
      id: `action_${Date.now()}`,
      type: 'skill',
      actor,
      target,
      skill,
      damage: finalDamage,
      critical,
      effectiveness
    };
  }

  /**
   * 处理战斗行动
   */
  private processBattleAction(action: BattleAction): void {
    const { actor, target, skill, damage } = action;

    // 消耗MP
    actor.currentMp = Math.max(0, actor.currentMp - (skill?.manaCost || 0));

    // 处理技能效果
    skill?.effects.forEach(effect => {
      switch (effect.type) {
        case 'damage':
          if (target?.isAlive) {
            target.currentHp = Math.max(0, target.currentHp - (damage || 0));
            this.addBattleLog(
              `${actor.name} 使用 ${skill?.name || '技能'} 对 ${target.name} 造成 ${damage || 0} 点伤害${action.critical ? ' (暴击!)' : ''}`,
              'damage'
            );

            if (target.currentHp <= 0) {
              target.isAlive = false;
              this.addBattleLog(`${target.name} 被击败了！`, 'system');
            }
          }
          break;

        case 'heal':
          const healAmount = Math.floor(effect.value * (1 + actor.stats.attack / 100));
          actor.currentHp = Math.min(actor.stats.maxHp, actor.currentHp + healAmount);
          this.addBattleLog(`${actor.name} 恢复了 ${healAmount} 点生命值`, 'heal');
          break;

        case 'buff':
          this.applyStatusEffect(actor, {
            id: `buff_${Date.now()}`,
            name: skill?.name || '增益效果',
            type: 'buff',
            value: effect.value,
            duration: effect.duration || 3,
            remainingTime: effect.duration || 3
          });
          this.addBattleLog(`${actor.name} 获得了 ${skill?.name || '增益效果'} 效果`, 'status');
          break;

        case 'debuff':
          if (target?.isAlive) {
            this.applyStatusEffect(target, {
              id: `debuff_${Date.now()}`,
              name: skill?.name || '减益效果',
              type: 'debuff',
              value: effect.value,
              duration: effect.duration || 3,
              remainingTime: effect.duration || 3
            });
            this.addBattleLog(`${target?.name} 受到了 ${skill?.name || '减益效果'} 效果`, 'status');
          }
          break;
      }
    });
  }

  /**
   * 计算伤害
   */
  private calculateDamage(actor: BattleCharacter, target: BattleCharacter, skill: Skill): number {
    const baseDamage = skill.damage + actor.stats.attack;
    const defense = target.stats.defense;
    const variance = 0.8 + Math.random() * 0.4; // 0.8-1.2随机浮动
    return Math.floor((baseDamage - defense * 0.3) * variance);
  }

  /**
   * 计算效果
   */
  private calculateEffectiveness(skill: Skill, target: BattleCharacter): 'normal' | 'effective' | 'resisted' {
    // 简单的效果计算，可以根据需要扩展
    if (skill.type === 'special' && target.stats.defense < 5) {
      return 'effective';
    }
    if (skill.type === 'attack' && target.stats.defense > 15) {
      return 'resisted';
    }
    return 'normal';
  }

  /**
   * 获取效果倍数
   */
  private getEffectivenessMultiplier(effectiveness: 'normal' | 'effective' | 'resisted'): number {
    switch (effectiveness) {
      case 'effective': return 1.5;
      case 'resisted': return 0.7;
      default: return 1.0;
    }
  }

  /**
   * 应用状态效果
   */
  private applyStatusEffect(character: BattleCharacter, effect: StatusEffect): void {
    // 移除同类型的效果
    character.statusEffects = character.statusEffects.filter(e => e.type !== effect.type);
    character.statusEffects.push(effect);
  }

  /**
   * 更新冷却时间
   */
  private updateCooldowns(): void {
    if (this.battleState.selectedCharacter && this.battleState.selectedSkill) {
      this.battleState.selectedSkill.currentCooldown = this.battleState.selectedSkill.cooldown;
    }
  }

  /**
   * 结束玩家回合
   */
  private endPlayerTurn(): void {
    // 重置选择
    this.battleState.selectedCharacter = null;
    this.battleState.selectedSkill = null;
    this.battleState.targetCharacter = null;

    // 检查战斗是否结束
    if (this.checkBattleEnd()) {
      return;
    }

    // 切换到敌方回合
    this.battleState.currentTurn = 'enemy';
    this.battleState.turnPhase = 'acting';
    this.onStateChange(this.battleState);

    // 延迟执行敌方行动
    setTimeout(() => {
      this.executeEnemyTurn();
    }, 1500);
  }

  /**
   * 执行敌方回合
   */
  private executeEnemyTurn(): void {
    const aliveEnemies = this.battleState.enemyTeam.filter(e => e.isAlive);
    const alivePlayers = this.battleState.playerTeam.filter(p => p.isAlive);

    if (aliveEnemies.length === 0 || alivePlayers.length === 0) {
      this.checkBattleEnd();
      return;
    }

    // 简单的AI：每个存活的敌人随机攻击一个玩家
    aliveEnemies.forEach(enemy => {
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const damage = Math.floor(enemy.stats.attack * (0.8 + Math.random() * 0.4) - target.stats.defense * 0.3);
      const finalDamage = Math.max(1, damage);

      target.currentHp = Math.max(0, target.currentHp - finalDamage);
      this.addBattleLog(
        `${enemy.name} 攻击 ${target.name} 造成 ${finalDamage} 点伤害`,
        'damage'
      );

      if (target.currentHp <= 0) {
        target.isAlive = false;
        this.addBattleLog(`${target.name} 被击败了！`, 'system');
      }
    });

    // 检查战斗是否结束
    if (this.checkBattleEnd()) {
      return;
    }

    // 开始新的回合
    this.startNewRound();
  }

  /**
   * 开始新的回合
   */
  private startNewRound(): void {
    this.battleState.round++;
    this.battleState.currentTurn = 'player';
    this.battleState.turnPhase = 'selecting';

    // 更新状态效果和冷却时间
    this.updateStatusEffects();
    this.updateAllCooldowns();

    this.addBattleLog(`--- 第 ${this.battleState.round} 回合 ---`, 'system');
    this.onStateChange(this.battleState);
  }

  /**
   * 更新状态效果
   */
  private updateStatusEffects(): void {
    const allCharacters = [...this.battleState.playerTeam, ...this.battleState.enemyTeam];

    allCharacters.forEach(character => {
      character.statusEffects = character.statusEffects.filter(effect => {
        effect.remainingTime--;
        return effect.remainingTime > 0;
      });
    });
  }

  /**
   * 更新所有冷却时间
   */
  private updateAllCooldowns(): void {
    const allCharacters = [...this.battleState.playerTeam, ...this.battleState.enemyTeam];

    allCharacters.forEach(character => {
      character.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--;
        }
      });
    });
  }

  /**
   * 检查战斗是否结束
   */
  private checkBattleEnd(): boolean {
    const alivePlayers = this.battleState.playerTeam.filter(p => p.isAlive);
    const aliveEnemies = this.battleState.enemyTeam.filter(e => e.isAlive);

    if (alivePlayers.length === 0) {
      this.battleState.winner = 'enemy';
      this.battleState.turnPhase = 'ended';
      this.addBattleLog('战斗失败！', 'system');
      this.onStateChange(this.battleState);
      return true;
    }

    if (aliveEnemies.length === 0) {
      this.battleState.winner = 'player';
      this.battleState.turnPhase = 'ended';
      this.addBattleLog('战斗胜利！', 'system');
      this.onStateChange(this.battleState);
      return true;
    }

    return false;
  }

  /**
   * 添加战斗日志
   */
  private addBattleLog(message: string, type: 'action' | 'damage' | 'heal' | 'status' | 'system'): void {
    const logEntry: BattleLogEntry = {
      id: `log_${Date.now()}`,
      message,
      type,
      timestamp: Date.now()
    };
    this.battleState.battleLog.push(logEntry);

    // 限制日志长度
    if (this.battleState.battleLog.length > 50) {
      this.battleState.battleLog = this.battleState.battleLog.slice(-50);
    }
  }

  /**
   * 渲染战斗场景
   */
  public render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制背景
    this.renderBackground();

    // 绘制战斗角色
    this.renderBattleCharacters();

    // 绘制UI
    this.renderBattleUI();
  }

  /**
   * 绘制背景
   */
  private renderBackground(): void {
    // 绘制战斗背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制地面
    this.ctx.fillStyle = '#2d2d44';
    this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
  }

  /**
   * 绘制战斗角色
   */
  private renderBattleCharacters(): void {
    // 绘制玩家队伍（左侧）
    this.battleState.playerTeam.forEach((character, index) => {
      if (character.isAlive) {
        this.renderCharacter(character, 200, 300 + index * 120);
      }
    });

    // 绘制敌方队伍（右侧）
    this.battleState.enemyTeam.forEach((character, index) => {
      if (character.isAlive) {
        this.renderCharacter(character, this.canvas.width - 200, 300 + index * 120);
      }
    });
  }

  /**
   * 绘制单个角色
   */
  private renderCharacter(character: BattleCharacter, x: number, y: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);

    // 绘制角色（暂时用圆形代替）
    this.ctx.fillStyle = character.type === 'player' ? '#4CAF50' : '#F44336';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制角色名称
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(character.name, 0, -60);

    // 绘制血条
    this.renderHealthBar(character, 0, -80);

    // 绘制MP条
    this.renderMPBar(character, 0, -90);

    // 绘制状态效果
    this.renderStatusEffects(character, 50, -40);

    this.ctx.restore();
  }

  /**
   * 绘制血条
   */
  private renderHealthBar(character: BattleCharacter, x: number, y: number): void {
    const barWidth = 80;
    const barHeight = 8;
    const healthPercentage = character.currentHp / character.stats.maxHp;

    // 背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

    // 血条
    this.ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' :
                           healthPercentage > 0.25 ? '#FFC107' : '#F44336';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth * healthPercentage, barHeight);

    // 边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);

    // HP文字
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${character.currentHp}/${character.stats.maxHp}`, x, y - 2);
  }

  /**
   * 绘制MP条
   */
  private renderMPBar(character: BattleCharacter, x: number, y: number): void {
    const barWidth = 80;
    const barHeight = 6;
    const mpPercentage = character.currentMp / 50;

    // 背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

    // MP条
    this.ctx.fillStyle = '#2196F3';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth * mpPercentage, barHeight);

    // 边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);

    // MP文字
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${character.currentMp}/50`, x, y - 1);
  }

  /**
   * 绘制状态效果
   */
  private renderStatusEffects(character: BattleCharacter, x: number, y: number): void {
    character.statusEffects.forEach((effect, index) => {
      this.ctx.fillStyle = effect.type === 'buff' ? '#4CAF50' : '#F44336';
      this.ctx.fillRect(x + index * 25, y, 20, 20);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(effect.remainingTime.toString(), x + index * 25 + 10, y + 14);
    });
  }

  /**
   * 绘制战斗UI
   */
  private renderBattleUI(): void {
    // 绘制回合信息
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`第 ${this.battleState.round} 回合 - ${this.battleState.currentTurn === 'player' ? '玩家' : '敌方'}回合`, this.canvas.width / 2, 30);

    // 绘制技能选择UI（仅在玩家选择阶段显示）
    if (this.battleState.turnPhase === 'selecting' && this.battleState.currentTurn === 'player') {
      this.renderSkillSelection();
    }

    // 绘制战斗日志
    this.renderBattleLog();
  }

  /**
   * 绘制技能选择
   */
  private renderSkillSelection(): void {
    if (!this.battleState.selectedCharacter) return;

    const skills = this.battleState.selectedCharacter.skills;
    const startX = 50;
    const startY = this.canvas.height - 150;

    skills.forEach((skill, index) => {
      const x = startX + index * 150;
      const y = startY;

      // 技能框
      this.ctx.fillStyle = (skill.currentCooldown > 0 || (this.battleState.selectedCharacter?.currentMp || 0) < (skill.manaCost || 0))
        ? 'rgba(100, 100, 100, 0.7)'
        : 'rgba(76, 175, 80, 0.7)';
      this.ctx.fillRect(x, y, 140, 100);

      // 技能边框
      this.ctx.strokeStyle = skill === this.battleState.selectedSkill ? '#FFD700' : '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, 140, 100);

      // 技能名称
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(skill.name, x + 70, y + 30);

      // 技能描述
      this.ctx.font = '12px Arial';
      this.ctx.fillText(skill.description, x + 70, y + 50);

      // MP消耗
      this.ctx.fillStyle = '#2196F3';
      this.ctx.fillText(`MP: ${skill.manaCost}`, x + 70, y + 70);

      // 冷却时间
      if (skill.currentCooldown > 0) {
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillText(`冷却: ${skill.currentCooldown}`, x + 70, y + 90);
      }
    });
  }

  /**
   * 绘制战斗日志
   */
  private renderBattleLog(): void {
    const logX = this.canvas.width - 300;
    const logY = 60;
    const logHeight = 200;

    // 日志背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(logX, logY, 280, logHeight);

    // 日志标题
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('战斗日志', logX + 10, logY + 20);

    // 显示最近的日志
    const recentLogs = this.battleState.battleLog.slice(-8);
    recentLogs.forEach((log, index) => {
      this.ctx.font = '12px Arial';

      // 根据日志类型设置颜色
      switch (log.type) {
        case 'damage':
          this.ctx.fillStyle = '#F44336';
          break;
        case 'heal':
          this.ctx.fillStyle = '#4CAF50';
          break;
        case 'status':
          this.ctx.fillStyle = '#FFC107';
          break;
        case 'system':
          this.ctx.fillStyle = '#2196F3';
          break;
        default:
          this.ctx.fillStyle = '#fff';
      }

      this.ctx.fillText(log.message, logX + 10, logY + 40 + index * 20);
    });
  }

  /**
   * 处理点击事件
   */
  public handleClick(x: number, y: number): void {
    if (this.battleState.turnPhase !== 'selecting' || this.battleState.currentTurn !== 'player') {
      return;
    }

    // 检查是否点击了技能选择
    if (!this.battleState.selectedCharacter) {
      // 选择角色
      this.battleState.playerTeam.forEach((character, index) => {
        if (character.isAlive) {
          const charX = 200;
          const charY = 300 + index * 120;
          const distance = Math.sqrt((x - charX) ** 2 + (y - charY) ** 2);
          if (distance < 40) {
            this.selectCharacter(character.id);
            this.render();
          }
        }
      });
    } else if (!this.battleState.selectedSkill) {
      // 选择技能
      const skills = this.battleState.selectedCharacter.skills;
      const startX = 50;
      const startY = this.canvas.height - 150;

      skills.forEach((skill, index) => {
        const skillX = startX + index * 150;
        const skillY = startY;

        if (x >= skillX && x <= skillX + 140 && y >= skillY && y <= skillY + 100) {
          this.selectSkill(skill.id);
          this.render();
        }
      });
    } else {
      // 选择目标
      this.battleState.enemyTeam.forEach((character, index) => {
        if (character.isAlive) {
          const charX = this.canvas.width - 200;
          const charY = 300 + index * 120;
          const distance = Math.sqrt((x - charX) ** 2 + (y - charY) ** 2);
          if (distance < 40) {
            this.selectTarget(character.id);
            this.render();
          }
        }
      });
    }
  }

  /**
   * 更新战斗状态
   */
  public update(deltaTime: number): void {
    // 战斗系统的更新逻辑
    this.render();
  }
}