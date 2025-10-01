// AI山海经 Game类 - 修复版本
class Game {
    constructor() {
        this.selectedCharacter = null;
        this.soundEnabled = false;
        this.gameRunning = false;
        this.camera = { x: 0, y: 0 };
        this.keys = {};
        console.log('Game实例创建成功');
    }

    init() {
        console.log('🎮 Game初始化开始');

        // 确保DOM已加载
        if (document.readyState === 'loading') {
            console.log('⏳ 等待DOM加载完成...');
            document.addEventListener('DOMContentLoaded', () => {
                this.setupCharacterSelectionEvents();
                this.setupControls();
                console.log('✅ Game初始化完成');
            });
        } else {
            console.log('📄 DOM已加载，直接初始化');
            this.setupCharacterSelectionEvents();
            this.setupControls();
            console.log('✅ Game初始化完成');
        }
    }

    setupCharacterSelectionEvents() {
        console.log('🎯 设置角色选择事件监听器');
        const characterCards = document.querySelectorAll('.character-card');
        console.log('📋 找到角色卡片数量:', characterCards.length);

        characterCards.forEach((card, index) => {
            console.log(`🎭 卡片 ${index + 1}:`, card.dataset.character);
            card.addEventListener('click', () => {
                console.log('🖱️ 角色卡片被点击:', card.dataset.character);
                this.selectCharacter(card.dataset.character);
            });
        });

        console.log('✅ 角色选择事件监听器设置完成');
    }

    selectCharacter(characterType) {
        // 播放选择音效
        this.playSelectSound();

        // 播放角色语音
        this.playCharacterVoice(characterType);

        this.selectedCharacter = characterType;
        console.log('选择角色:', characterType);

        // 显示开始游戏按钮和角色信息
        this.showGameStartButton(characterType);

        // 移除所有卡片的选中状态
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 添加选中状态到当前卡片
        document.querySelector(`[data-character="${characterType}"]`).classList.add('selected');
    }

    // 播放选择音效
    playSelectSound() {
        const selectSound = document.getElementById('select-sound');
        if (selectSound) {
            selectSound.currentTime = 0;
            selectSound.play().catch(error => {
                console.log('音效播放失败:', error);
            });
        }
    }

    // 播放角色语音
    playCharacterVoice(characterType) {
        const voiceMap = {
            'stickman': 'stickman-voice',
            'coffee-ninja': 'coffee-ninja-voice',
            'shark': 'shark-voice',
            'tire-frog': 'tire-frog-voice',
            'ice-camel': 'ice-camel-voice'
        };

        const voiceId = voiceMap[characterType];
        if (voiceId) {
            const voiceAudio = document.getElementById(voiceId);
            if (voiceAudio) {
                voiceAudio.currentTime = 0;
                voiceAudio.play().catch(error => {
                    console.log('语音播放失败:', error);
                });
            }
        }
    }

    // 标记当前战斗的怪物为已击败
    markCurrentEnemyDefeated() {
        if (!this.battle || !this.enemies) return;

        const enemyName = this.battle.enemy.name;
        const defeatedEnemy = this.enemies.find(enemy => enemy.name === enemyName);

        if (defeatedEnemy) {
            defeatedEnemy.defeated = true;
            // 隐藏已击败的怪物
            if (defeatedEnemy.element) {
                defeatedEnemy.element.style.display = 'none';
            }
            console.log(`怪物 ${enemyName} 已被击败并标记`);
        }
    }

    // 重置所有怪物的战斗状态
    resetEnemiesBattleStatus() {
        if (!this.enemies || this.enemies.length === 0) return;

        this.enemies.forEach(enemy => {
            enemy.inBattle = false;
        });
        console.log('所有怪物战斗状态已重置');
    }

    // 播放战斗动画
    playBattleAnimation(attacker, skillName) {
        console.log('🎬 播放战斗动画:', attacker, skillName);

        if (attacker === 'player') {
            // 玩家攻击动画
            const playerElement = document.querySelector('.player-battle-character');
            console.log('🎯 找到玩家元素:', playerElement);

            if (playerElement) {
                // 清除之前的动画类
                playerElement.classList.remove('player-attacking', 'camel-spit-attack');

                // 根据技能类型选择动画
                if (skillName === '骆驼吐沙') {
                    console.log('🐪 添加骆驼吐沙动画类');
                    // 强制重排以确保动画能正确触发
                    void playerElement.offsetWidth;
                    playerElement.classList.add('camel-spit-attack');
                    console.log('🐪 元素类列表:', playerElement.className);
                    // 骆驼吐沙动画1.5秒后移除
                    setTimeout(() => {
                        console.log('🐪 移除骆驼吐沙动画类');
                        playerElement.classList.remove('camel-spit-attack');
                    }, 1500);
                } else {
                    console.log('⚔️ 添加普通攻击动画类');
                    // 强制重排以确保动画能正确触发
                    void playerElement.offsetWidth;
                    playerElement.classList.add('player-attacking');
                    console.log('⚔️ 元素类列表:', playerElement.className);
                    // 普通攻击动画0.6秒后移除
                    setTimeout(() => {
                        console.log('⚔️ 移除普通攻击动画类');
                        playerElement.classList.remove('player-attacking');
                    }, 600);
                }
            }

            // 敌人受击动画（延迟时间根据技能类型调整）
            const hitDelay = skillName === '骆驼吐沙' ? 900 : 300;
            setTimeout(() => {
                this.playHitAnimation('enemy');
            }, hitDelay);

        } else if (attacker === 'enemy') {
            // 敌人攻击动画
            const enemyElement = document.querySelector('.enemy-battle-character');
            if (enemyElement) {
                enemyElement.classList.remove('enemy-attacking');
                // 强制重排以确保动画能正确触发
                void enemyElement.offsetWidth;
                enemyElement.classList.add('enemy-attacking');

                // 0.6秒后移除动画类
                setTimeout(() => {
                    enemyElement.classList.remove('enemy-attacking');
                }, 600);
            }

            // 玩家受击动画（延迟0.3秒）
            setTimeout(() => {
                this.playHitAnimation('player');
            }, 300);
        }
    }

    // 播放受击动画
    playHitAnimation(target) {
        if (target === 'player') {
            const playerElement = document.querySelector('.player-battle-character');
            if (playerElement) {
                // 先播放后退动画
                void playerElement.offsetWidth;
                playerElement.classList.add('hit-recoil');
                setTimeout(() => {
                    playerElement.classList.remove('hit-recoil');
                }, 400);

                // 同时播放闪光效果
                void playerElement.offsetWidth;
                playerElement.classList.add('damage-flash');
                setTimeout(() => {
                    playerElement.classList.remove('damage-flash');
                }, 300);
            }
        } else if (target === 'enemy') {
            const enemyElement = document.querySelector('.enemy-battle-character');
            if (enemyElement) {
                // 先播放后退动画
                void enemyElement.offsetWidth;
                enemyElement.classList.add('hit-recoil');
                setTimeout(() => {
                    enemyElement.classList.remove('hit-recoil');
                }, 400);

                // 同时播放闪光效果
                void enemyElement.offsetWidth;
                enemyElement.classList.add('damage-flash');
                setTimeout(() => {
                    enemyElement.classList.remove('damage-flash');
                }, 300);
            }
        }
    }

    // 播放技能音效
    playSkillSound(skillName) {
        if (skillName === '骆驼吐沙') {
            // 冰箱骆驼的特殊技能音效
            const camelSpitSound = document.getElementById('camel-spit-sound');
            if (camelSpitSound) {
                camelSpitSound.currentTime = 0;
                camelSpitSound.play().catch(error => {
                    console.log('骆驼吐沙音效播放失败:', error);
                });
            }
        } else {
            // 其他技能使用通用击打音效
            const skillSound = document.getElementById('skill-sound');
            if (skillSound) {
                skillSound.currentTime = 0;
                skillSound.play().catch(error => {
                    console.log('技能音效播放失败:', error);
                });
            }
        }
    }

    // 播放金币音效
    playGoldSound() {
        const goldSound = document.getElementById('gold-sound');
        if (goldSound) {
            goldSound.currentTime = 0;
            goldSound.play().catch(error => {
                console.log('金币音效播放失败:', error);
            });
        }
    }

    // 显示开始游戏按钮
    showGameStartButton(characterType) {
        const startBtn = document.getElementById('start-game-btn');

        if (startBtn) {
            startBtn.disabled = false;
            startBtn.classList.add('enabled');
        }
    }

    // 开始选中的游戏
    startSelectedGame() {
        if (this.selectedCharacter) {
            this.startGame();
        }
    }

    startGame() {
        console.log('=== 开始启动游戏 ===');
        console.log('选中的角色:', this.selectedCharacter);

        // 切换到游戏界面
        const characterSelect = document.getElementById('character-select');
        const gameScreen = document.getElementById('game-screen');

        if (!characterSelect || !gameScreen) {
            console.error('找不到必要的游戏界面元素！');
            return;
        }

        characterSelect.classList.remove('active');
        gameScreen.classList.add('active');
        console.log('游戏界面切换完成');

        // 禁用音效避免问题
        console.log('游戏开始音效已禁用');

        // 初始化游戏组件
        this.gameLayer = document.getElementById('game-layer');
        console.log('gameLayer元素:', this.gameLayer);

        if (!this.gameLayer) {
            console.error('找不到game-layer元素！');
            return;
        }

        console.log('开始初始化玩家...');
        this.initializePlayer();

        console.log('开始渲染地图...');
        this.renderMap();

        console.log('开始创建玩家角色元素...');
        this.createPlayerElement();

        console.log('开始创建敌人...');
        this.createEnemies();

        // 开始游戏循环
        console.log('开始游戏循环...');
        this.gameRunning = true;
        this.gameLoop();

        console.log('=== 游戏启动完成 ===');
    }

    initializePlayer() {
        console.log('开始初始化玩家角色...');
        console.log('当前选中的角色:', this.selectedCharacter);

        const characterData = {
            stickman: {
                name: '木棒人',
                level: 1,
                image: 'assets/images/木棒人.png',
                health: 80,
                maxHealth: 80,
                attack: 20,
                defense: 10,
                speed: 4,
                skills: ['木棒攻击', '快速移动', '闪避'],
                color: '#8B4513'
            },
            shark: {
                name: '耐克鲨鱼',
                level: 5,
                image: 'assets/images/耐克鲨鱼.png',
                health: 120,
                maxHealth: 120,
                attack: 35,
                defense: 25,
                speed: 5,
                skills: ['鲨鱼咬击', '高速冲击', '耐克加速'],
                color: '#4682B4'
            },
            'coffee-ninja': {
                name: '咖啡忍者',
                level: 4,
                image: 'assets/images/咖啡忍者.png',
                health: 100,
                maxHealth: 100,
                attack: 30,
                defense: 18,
                speed: 6,
                skills: ['咖啡飞镖', '瞬移', '咖啡因爆发'],
                color: '#4B0082'
            },
            'tire-frog': {
                name: '轮胎青蛙',
                level: 8,
                image: 'assets/images/轮胎青蛙.png',
                health: 130,
                maxHealth: 130,
                attack: 25,
                defense: 20,
                speed: 7,
                skills: ['轮胎碾压', '弹跳攻击', '橡胶防御'],
                color: '#32CD32'
            },
            'ice-camel': {
                name: '冰箱骆驼',
                level: 10,
                image: 'assets/images/冰箱骆驼.png',
                health: 150,
                maxHealth: 150,
                attack: 18,
                defense: 35,
                speed: 3,
                skills: ['骆驼吐沙', '冰冻', '冰箱护盾'],
                color: '#00CED1'
            }
        };

        const data = characterData[this.selectedCharacter];

        // 添加调试信息
        console.log('角色数据:', data);
        console.log('角色名称:', data ? data.name : '未找到');
        console.log('角色等级:', data ? data.level : '未找到');

        this.player = {
            id: 'player',
            type: this.selectedCharacter,
            name: data.name,
            level: data.level,
            health: data.health,
            maxHealth: data.maxHealth,
            attack: data.attack,
            defense: data.defense,
            speed: data.speed,
            skills: data.skills,
            color: data.color,
            image: data.image,
            exp: 0,
            gold: 0,
            x: 400,
            y: 300,
            element: null
        };

        console.log('玩家初始化完成:', this.player);
    }

    renderMap() {
        console.log('渲染地图...');
        if (!this.gameLayer) return;

        // 检查玩家数据是否已初始化
        let playerUI = '';
        if (this.player && this.player.name) {
            playerUI = `
                <div style="font-weight: bold; margin-bottom: 10px;">${this.player.name} (等级 ${this.player.level})</div>
                <div>生命值: ${this.player.health}/${this.player.maxHealth}</div>
                <div>攻击: ${this.player.attack} | 防御: ${this.player.defense}</div>
                <div>速度: ${this.player.speed}</div>
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                    使用 WASD 或方向键移动
                </div>
            `;
        } else {
            playerUI = `
                <div style="font-weight: bold; margin-bottom: 10px;">玩家数据未初始化</div>
                <div>请选择角色并开始游戏</div>
            `;
        }

        // 创建游戏世界，设置足够大的尺寸以支持无边界移动
        this.gameLayer.innerHTML = `
            <div class="game-world" style="
                position: relative;
                width: 5000px;
                height: 5000px;
                background: linear-gradient(45deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%);
                overflow: visible;
            ">
                <!-- 玩家角色将通过JavaScript动态添加 -->
            </div>

            <!-- 游戏UI界面 -->
            <div class="game-ui" style="
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 15px;
                border-radius: 10px;
                z-index: 1000;
            ">
                ${playerUI}
            </div>
        `;

        console.log('地图渲染完成');
    }

    createPlayerElement() {
        if (!this.player) return;

        // 角色图片映射
        const playerImages = {
            'stickman': 'assets/images/木棒人.png',
            'coffee-ninja': 'assets/images/咖啡忍者.png',
            'shark': 'assets/images/耐克鲨鱼.png',
            'tire-frog': 'assets/images/轮胎青蛙.png',
            'ice-camel': 'assets/images/冰箱骆驼.png'
        };

        // 创建玩家角色DOM元素
        const playerElement = document.createElement('div');
        playerElement.className = 'player-character';
        playerElement.style.cssText = `
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #FFD700;
            background: linear-gradient(45deg, #4169E1, #1E90FF);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            z-index: 100;
            transition: all 0.1s ease;
            left: ${this.player.x - 40}px;
            top: ${this.player.y - 40}px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-size: 24px;
        `;

        // 使用角色图片
        const playerImageSrc = playerImages[this.selectedCharacter] || 'assets/images/木棒人.png';
        playerElement.innerHTML = `<img src="${playerImageSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" alt="${this.player.name}">`;
        playerElement.title = this.player.name;

        // 添加到游戏世界
        const gameWorld = this.gameLayer.querySelector('.game-world');
        if (gameWorld) {
            gameWorld.appendChild(playerElement);
            this.player.element = playerElement;
            console.log('玩家角色元素创建完成，位置：', this.player.x, this.player.y);
        } else {
            console.error('找不到游戏世界元素！');
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;

        // 更新玩家位置
        this.updatePlayer();

        // 更新敌人位置
        this.updateEnemies();

        // 检测玩家与敌人的碰撞
        this.checkCollisions();

        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    updateEnemies() {
        if (!this.enemies || this.enemies.length === 0) return;

        const currentTime = Date.now();

        this.enemies.forEach(enemy => {
            if (!enemy.element) return;

            // 每隔一定时间改变移动方向
            if (currentTime - enemy.lastMoveTime > 2000 + Math.random() * 3000) {
                enemy.moveDirection = Math.random() * Math.PI * 2;
                enemy.lastMoveTime = currentTime;
            }

            // 计算新位置
            const moveDistance = enemy.speed * 0.5;
            const newX = enemy.x + Math.cos(enemy.moveDirection) * moveDistance;
            const newY = enemy.y + Math.sin(enemy.moveDirection) * moveDistance;

            // 边界检查（确保敌人在地图范围内）
            if (newX >= 50 && newX <= 4950 && newY >= 50 && newY <= 4950) {
                enemy.x = newX;
                enemy.y = newY;

                // 更新DOM元素位置
                enemy.element.style.left = (enemy.x - 35) + 'px';
                enemy.element.style.top = (enemy.y - 35) + 'px';
            } else {
                // 碰到边界时改变方向
                enemy.moveDirection = Math.random() * Math.PI * 2;
            }
        });
    }

    // 检测玩家与敌人的碰撞
    checkCollisions() {
        if (!this.player || !this.enemies || this.enemies.length === 0) return;

        // 如果已经在战斗中，不进行新的碰撞检测
        if (this.battle) return;

        this.enemies.forEach((enemy, index) => {
            if (!enemy.element) return;

            // 跳过已击败的怪物
            if (enemy.defeated) return;

            // 计算玩家与敌人的距离
            const distance = Math.sqrt(
                Math.pow(this.player.x - enemy.x, 2) +
                Math.pow(this.player.y - enemy.y, 2)
            );

            // 碰撞距离阈值（玩家半径40px + 敌人半径35px = 75px）
            const collisionDistance = 75;

            if (distance < collisionDistance) {
                console.log(`检测到碰撞！玩家与${enemy.name}，距离：${distance.toFixed(2)}`);

                // 碰撞视觉效果
                this.showCollisionEffect(enemy);

                // 检查是否可以进入战斗
                if (!enemy.inBattle && !this.battle) {
                    enemy.inBattle = true;

                    // 延迟一点进入战斗，让玩家看到碰撞效果
                    setTimeout(() => {
                        this.startBattle(enemy);
                    }, 500);
                }
            }

            // 接近警告效果（距离小于80px时）
            else if (distance < 80) {
                this.showWarningEffect(enemy, distance);
            }
        });
    }

    // 碰撞视觉效果
    showCollisionEffect(enemy) {
        if (!enemy.element) return;

        // 玩家闪烁效果
        if (this.player.element) {
            this.player.element.style.animation = 'collisionFlash 0.5s ease-in-out';
            setTimeout(() => {
                if (this.player.element) {
                    this.player.element.style.animation = '';
                }
            }, 500);
        }

        // 敌人闪烁效果
        enemy.element.style.animation = 'collisionFlash 0.5s ease-in-out';
        setTimeout(() => {
            if (enemy.element) {
                enemy.element.style.animation = '';
            }
        }, 500);

        console.log(`碰撞效果：${enemy.name}`);
    }

    // 接近警告效果
    showWarningEffect(enemy, distance) {
        if (!enemy.element || enemy.warningShown) return;

        // 显示警告边框
        enemy.element.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.8)';
        enemy.warningShown = true;

        // 1秒后移除警告
        setTimeout(() => {
            if (enemy.element) {
                enemy.element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
                enemy.warningShown = false;
            }
        }, 1000);
    }

    playSound(soundName) {
        // 禁用音效避免问题
        console.log(`音效播放已禁用: ${soundName}`);
        return;
    }

    setupControls() {
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // 战斗技能控制
            if (this.battle && this.battle.turn === 'player' && this.battle.phase === 'action') {
                switch(e.key.toLowerCase()) {
                    case 'j':
                        this.useBattleSkill(0); // 普通攻击
                        break;
                    case 'k':
                        this.useBattleSkill(1); // 技能1
                        break;
                    case 'l':
                        this.useBattleSkill(2); // 技能2
                        break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        console.log('键盘控制已设置');
    }

    updatePlayer() {
        if (!this.player || !this.gameRunning) return;

        const speed = this.player.speed;
        let moved = false;

        // 移动控制 - 无边界限制
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y = this.player.y - speed;
            moved = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y = this.player.y + speed;
            moved = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x = this.player.x - speed;
            moved = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x = this.player.x + speed;
            moved = true;
        }

        // 更新相机位置（跟随玩家）- 确保角色始终在视野中心
        if (this.gameLayer) {
            const gameWorld = this.gameLayer.querySelector('.game-world');
            if (gameWorld) {
                // 移动游戏世界而不是相机，使角色保持在视野中心
                const viewportWidth = this.gameLayer.offsetWidth;
                const viewportHeight = this.gameLayer.offsetHeight;

                // 反向移动游戏世界来模拟相机跟随
                gameWorld.style.transform = `translate(${viewportWidth/2 - this.player.x}px, ${viewportHeight/2 - this.player.y}px)`;
            }
        }

        if (moved) {
            this.updatePlayerPosition();
        }
    }

    updatePlayerPosition() {
        if (!this.player.element) return;

        // 使用绝对定位，角色位置相对于游戏世界
        this.player.element.style.left = (this.player.x - 40) + 'px'; // 40是角色宽度的一半
        this.player.element.style.top = (this.player.y - 40) + 'px'; // 40是角色高度的一半

        // 调试信息
        console.log('角色位置更新：x=', this.player.x, 'y=', this.player.y);
    }

    createNPCs() {
        const npcData = [
            { type: 'stickman', x: 800, y: 600, name: 'NPC木棒人' },
            { type: 'shark', x: 1200, y: 400, name: 'NPC耐克鲨鱼' },
            { type: 'coffee-ninja', x: 600, y: 800, name: 'NPC咖啡忍者' },
            { type: 'ice-camel', x: 1000, y: 1000, name: 'NPC冰箱骆驼' }
        ];

        this.npcs = [];

        npcData.forEach(npc => {
            const npcElement = document.createElement('div');
            npcElement.className = 'npc-character';
            npcElement.style.cssText = `
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 2px solid #ffcc00;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                z-index: 50;
                left: ${npc.x - 25}px;
                top: ${npc.y - 25}px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;

            // 使用对应的角色图片
            const npcImg = document.createElement('img');
            const characterImageMap = {
                'stickman': 'assets/images/木棒人.png',
                'shark': 'assets/images/耐克鲨鱼.png',
                'coffee-ninja': 'assets/images/咖啡忍者.png',
                'ice-camel': 'assets/images/冰箱骆驼.png'
            };
            npcImg.src = characterImageMap[npc.type];
            npcImg.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                opacity: 0.8;
            `;
            npcElement.appendChild(npcImg);

            // 添加NPC名称标签
            const nameLabel = document.createElement('div');
            nameLabel.textContent = npc.name;
            nameLabel.style.cssText = `
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #ffcc00;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                white-space: nowrap;
            `;
            npcElement.appendChild(nameLabel);

            // 添加到游戏世界
            const gameWorld = this.gameLayer.querySelector('.game-world');
            if (gameWorld) {
                gameWorld.appendChild(npcElement);
                this.npcs.push({
                    element: npcElement,
                    x: npc.x,
                    y: npc.y,
                    name: npc.name,
                    type: npc.type
                });
            }
        });

        console.log('NPC创建完成，共创建', this.npcs.length, '个NPC');
    }

    // 创建敌人
    createEnemies() {
        const enemyData = [
            { type: '木棒人', x: 600, y: 400, name: '野生木棒人', health: 60, attack: 15, defense: 8, level: 1, speed: 2, image: 'assets/images/木棒人.png' },
            { type: '咖啡忍者', x: 1000, y: 600, name: '叛逃忍者', health: 90, attack: 20, defense: 12, level: 3, speed: 3, image: 'assets/images/咖啡忍者.png' },
            { type: '耐克鲨鱼', x: 1400, y: 300, name: '耐克鲨鱼', health: 120, attack: 28, defense: 15, level: 4, speed: 4, image: 'assets/images/耐克鲨鱼.png' },
            { type: '轮胎青蛙', x: 1800, y: 800, name: '轮胎青蛙', health: 150, attack: 25, defense: 20, level: 6, speed: 5, image: 'assets/images/轮胎青蛙.png' },
            { type: '冰箱骆驼', x: 800, y: 900, name: '流浪骆驼', health: 180, attack: 22, defense: 25, level: 8, speed: 2, image: 'assets/images/冰箱骆驼.png' },
            { type: '腕龙', x: 1200, y: 200, name: '小腕龙', health: 250, attack: 35, defense: 18, level: 10, speed: 3, image: 'assets/images/腕龙.png' },
            { type: '霸王龙', x: 1600, y: 700, name: '年轻霸王龙', health: 300, attack: 40, defense: 22, level: 12, speed: 4, image: 'assets/images/霸王龙.png' }
        ];

        this.enemies = [];

        enemyData.forEach(enemy => {
            const enemyElement = document.createElement('div');
            enemyElement.className = 'enemy-character';
            enemyElement.style.cssText = `
                position: absolute;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                border: 2px solid #ff0000;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                z-index: 60;
                left: ${enemy.x - 35}px;
                top: ${enemy.y - 35}px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // 敌人图片映射
            const enemyImages = {
                '木棒人': 'assets/images/木棒人.png',
                '咖啡忍者': 'assets/images/咖啡忍者.png',
                '耐克鲨鱼': 'assets/images/耐克鲨鱼.png',
                '轮胎青蛙': 'assets/images/轮胎青蛙.png',
                '冰箱骆驼': 'assets/images/冰箱骆驼.png',
                '腕龙': 'assets/images/腕龙.png',
                '霸王龙': 'assets/images/霸王龙.png'
            };

            // 使用敌人图片
            const enemyImageSrc = enemyImages[enemy.type] || 'assets/images/木棒人.png';
            enemyElement.innerHTML = `<img src="${enemyImageSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" alt="${enemy.name}">`;

            // 添加敌人名称标签
            const nameLabel = document.createElement('div');
            nameLabel.textContent = enemy.name;
            nameLabel.style.cssText = `
                position: absolute;
                bottom: -18px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                color: #ff6666;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                white-space: nowrap;
                font-weight: bold;
            `;
            enemyElement.appendChild(nameLabel);

            // 添加悬停效果（可选）
            enemyElement.addEventListener('mouseenter', () => {
                if (!this.battle) {
                    enemyElement.style.transform = 'scale(1.1)';
                    enemyElement.style.boxShadow = '0 4px 8px rgba(255,0,0,0.6)';
                }
            });

            enemyElement.addEventListener('mouseleave', () => {
                enemyElement.style.transform = 'scale(1)';
                enemyElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
            });

            // 添加到游戏世界
            const gameWorld = this.gameLayer.querySelector('.game-world');
            if (gameWorld) {
                gameWorld.appendChild(enemyElement);
                this.enemies.push({
                    element: enemyElement,
                    ...enemy,
                    inBattle: false, // 初始化战斗状态为false
                    moveTimer: 0,
                    moveDirection: Math.random() * Math.PI * 2, // 随机初始方向
                    lastMoveTime: Date.now()
                });
                console.log('敌人创建成功：', enemy.name, '位置：', enemy.x, enemy.y);
            } else {
                console.error('找不到游戏世界元素，无法创建敌人！');
            }
        });

        console.log('敌人生成完成，共生成', this.enemies.length, '个敌人');
        console.log('所有敌人列表：', this.enemies.map(e => ({ name: e.name, x: e.x, y: e.y })));
    }

    // 开始战斗
    startBattle(enemy) {
        console.log('=== 开始战斗 ===');
        console.log('敌人:', enemy.name);

        // 初始化战斗数据
        this.battle = {
            enemy: {
                name: enemy.name,
                health: enemy.health,
                maxHealth: enemy.health,
                attack: enemy.attack,
                defense: enemy.defense,
                level: enemy.level,
                image: enemy.image
            },
            player: {
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                attack: this.player.attack,
                defense: this.player.defense,
                skills: this.player.skills
            },
            turn: 'player',
            phase: 'start',
            playerDamageDealt: 0,
            playerDamageTaken: 0,
            playerExpGain: enemy.level * 25,
            playerGoldGain: enemy.level * 10
        };

        // 切换到战斗界面
        const gameScreen = document.getElementById('game-screen');
        const battleScreen = document.getElementById('battle-screen');

        if (!gameScreen || !battleScreen) {
            console.error('找不到必要的战斗界面元素！');
            return;
        }

        gameScreen.classList.remove('active');
        battleScreen.classList.add('active');
        console.log('战斗界面切换完成');

        // 初始化战斗界面
        this.initBattleInterface();

        // 开始战斗 - 增加延迟确保界面完全渲染
        setTimeout(() => {
            console.log('🎮 开始战斗回合');
            this.startBattleTurn();
        }, 1500);
    }

    // 初始化战斗界面
    initBattleInterface() {
        if (!this.battle) return;

        console.log('初始化战斗界面...');

        // 更新玩家信息
        const playerImage = document.querySelector('.player-battle-character .battle-character-image');
        const playerHealth = document.querySelector('.player-battle-character .battle-health-fill');
        const playerHealthText = document.querySelector('.player-battle-character .battle-health-text');
        const playerName = document.querySelector('.player-battle-character .battle-character-name');

        if (playerImage) {
            const playerImg = document.createElement('img');
            playerImg.src = this.player.image;
            playerImg.style.cssText = 'width: 160px; height: 160px; border-radius: 50%; object-fit: cover;';
            playerImage.innerHTML = '';
            playerImage.appendChild(playerImg);
        }

        if (playerHealth) {
            const healthPercent = (this.battle.player.health / this.battle.player.maxHealth) * 100;
            playerHealth.style.width = healthPercent + '%';
            playerHealth.style.background = healthPercent > 50 ? '#4CAF50' : healthPercent > 25 ? '#FFC107' : '#F44336';
        }

        if (playerHealthText) {
            playerHealthText.textContent = `${this.battle.player.health}/${this.battle.player.maxHealth}`;
        }

        if (playerName) {
            playerName.textContent = this.player.name;
        }

        // 更新敌人信息
        const enemyImage = document.querySelector('.enemy-battle-character .battle-character-image');
        const enemyHealth = document.querySelector('.enemy-battle-character .battle-health-fill');
        const enemyHealthText = document.querySelector('.enemy-battle-character .battle-health-text');
        const enemyName = document.querySelector('.enemy-battle-character .battle-character-name');

        if (enemyImage) {
            // 使用敌人的实际图片
            const enemyImg = document.createElement('img');
            enemyImg.src = this.battle.enemy.image || 'assets/images/木棒人.png';
            enemyImg.style.cssText = `
                width: 120px;
                height: 120px;
                object-fit: cover;
                border-radius: 10px;
                border: 2px solid #ff4444;
            `;
            enemyImg.alt = this.battle.enemy.name;
            enemyImage.innerHTML = '';
            enemyImage.appendChild(enemyImg);
        }

        if (enemyHealth) {
            const healthPercent = (this.battle.enemy.health / this.battle.enemy.maxHealth) * 100;
            enemyHealth.style.width = healthPercent + '%';
            enemyHealth.style.background = healthPercent > 50 ? '#4CAF50' : healthPercent > 25 ? '#FFC107' : '#F44336';
        }

        if (enemyHealthText) {
            enemyHealthText.textContent = `${this.battle.enemy.health}/${this.battle.enemy.maxHealth}`;
        }

        if (enemyName) {
            enemyName.textContent = this.battle.enemy.name;
        }

        // 更新技能栏
        const skillSlots = document.querySelectorAll('.battle-skill-slot');
        if (skillSlots) {
            skillSlots.forEach((slot, index) => {
                const skillIcon = slot.querySelector('.battle-skill-icon');
                const skillName = slot.querySelector('.battle-skill-name');

                if (index === 0) {
                    // 普通攻击
                    if (skillIcon) skillIcon.innerHTML = '⚔️';
                    if (skillName) skillName.textContent = '普通攻击';
                } else if (index <= this.battle.player.skills.length) {
                    // 角色技能
                    if (skillIcon) skillIcon.innerHTML = '✨';
                    if (skillName) skillName.textContent = this.battle.player.skills[index - 1];
                } else {
                    slot.style.opacity = '0.5';
                }
            });
        }

        // 更新战斗日志
        this.addBattleLog(`遭遇 ${this.battle.enemy.name}！战斗开始！`);

        console.log('战斗界面设置完成');
    }

    // 开始战斗回合
    startBattleTurn() {
        if (!this.battle) return;

        console.log(`开始${this.battle.turn === 'player' ? '玩家' : '敌人'}回合`);

        if (this.battle.turn === 'player') {
            this.battle.phase = 'action';
            this.addBattleLog('请选择你的行动（J-普通攻击，K-技能1，L-技能2）');
        } else {
            // 敌人行动
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    // 使用技能
    useBattleSkill(skillIndex) {
        if (!this.battle || this.battle.turn !== 'player' || this.battle.phase !== 'action') {
            this.addBattleLog('无法使用技能：不是玩家回合或不在行动阶段');
            return;
        }

        let skillName;
        if (skillIndex === 0) {
            skillName = '普通攻击';
        } else if (skillIndex <= this.battle.player.skills.length) {
            skillName = this.battle.player.skills[skillIndex - 1];
        } else {
            this.addBattleLog('技能索引超出范围');
            return;
        }

        this.addBattleLog(`使用技能: ${skillName}`);

        // 播放技能音效
        this.playSkillSound(skillName);

        // 播放攻击动画
        this.playBattleAnimation('player', skillName);

        // 计算伤害
        const baseDamage = this.battle.player.attack;
        const skillDamage = this.getSkillDamage(skillName, baseDamage);
        const damage = Math.max(1, skillDamage - this.battle.enemy.defense + Math.floor(Math.random() * 10) - 5);

        const isCritical = Math.random() < 0.2;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        // 应用伤害
        this.battle.enemy.health = Math.max(0, this.battle.enemy.health - finalDamage);
        this.battle.playerDamageDealt += finalDamage;

        this.addBattleLog(`造成伤害: ${finalDamage}${isCritical ? ' (暴击!)' : ''}`);
        this.addBattleLog(`敌人剩余生命值: ${this.battle.enemy.health}/${this.battle.enemy.maxHealth}`);

        // 更新敌人血量显示
        this.updateBattleHealth('enemy', this.battle.enemy.health, this.battle.enemy.maxHealth);

        // 检查战斗结束
        if (this.battle.enemy.health <= 0) {
            this.endBattle(true);
            return;
        }

        // 切换到敌人回合
        this.battle.turn = 'enemy';
        setTimeout(() => this.startBattleTurn(), 1500); // 给动画更多时间播放
    }

    // 获取技能伤害
    getSkillDamage(skillName, baseDamage) {
        const multipliers = {
            '普通攻击': 1.0,
            '木棒攻击': 1.2,
            '鲨鱼咬击': 1.3,
            '咖啡飞镖': 1.1,
            '骆驼吐沙': 1.0,
            '快速移动': 0.8,
            '高速冲击': 1.4,
            '瞬移': 0.9,
            '冰冻': 1.2,
            '冰箱护盾': 0.7,
            '闪避': 0.6,
            '耐克加速': 1.1,
            '咖啡因爆发': 1.5
        };
        return Math.floor(baseDamage * (multipliers[skillName] || 1.0));
    }

    // 敌人回合
    enemyTurn() {
        if (!this.battle) return;

        const skills = ['普通攻击', '强力攻击', '快速攻击'];
        const skillName = skills[Math.floor(Math.random() * skills.length)];

        this.addBattleLog(`敌人使用${skillName}`);

        // 播放敌人攻击动画
        this.playBattleAnimation('enemy', skillName);

        // 计算伤害
        const baseDamage = this.battle.enemy.attack;
        const skillDamage = this.getEnemySkillDamage(skillName, baseDamage);
        const damage = Math.max(1, skillDamage - this.battle.player.defense + Math.floor(Math.random() * 8) - 4);

        const isCritical = Math.random() < 0.15;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        // 应用伤害
        this.battle.player.health = Math.max(0, this.battle.player.health - finalDamage);
        this.battle.playerDamageTaken += finalDamage;

        this.addBattleLog(`敌人造成伤害: ${finalDamage}${isCritical ? ' (暴击!)' : ''}`);
        this.addBattleLog(`玩家剩余生命值: ${this.battle.player.health}/${this.battle.player.maxHealth}`);

        // 更新玩家血量显示
        this.updateBattleHealth('player', this.battle.player.health, this.battle.player.maxHealth);

        // 检查战斗结束
        if (this.battle.player.health <= 0) {
            this.endBattle(false);
            return;
        }

        // 切换到玩家回合
        this.battle.turn = 'player';
        setTimeout(() => this.startBattleTurn(), 1500); // 给动画更多时间播放
    }

    // 获取敌人技能伤害
    getEnemySkillDamage(skillName, baseDamage) {
        const multipliers = {
            '普通攻击': 1.0,
            '强力攻击': 1.4,
            '快速攻击': 0.8
        };
        return Math.floor(baseDamage * multipliers[skillName]);
    }

    // 更新战斗血量显示
    updateBattleHealth(target, health, maxHealth) {
        const selector = target === 'player' ? '.player-battle-character' : '.enemy-battle-character';
        const healthFill = document.querySelector(`${selector} .battle-health-fill`);
        const healthText = document.querySelector(`${selector} .battle-health-text`);

        if (healthFill) {
            const healthPercent = (health / maxHealth) * 100;
            healthFill.style.width = healthPercent + '%';
            healthFill.style.background = healthPercent > 50 ? '#4CAF50' : healthPercent > 25 ? '#FFC107' : '#F44336';
        }

        if (healthText) {
            healthText.textContent = `${health}/${maxHealth}`;
        }
    }

    // 添加战斗日志
    addBattleLog(message) {
        const battleLog = document.querySelector('.battle-log');
        if (battleLog) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            battleLog.appendChild(logEntry);
            battleLog.scrollTop = battleLog.scrollHeight;
        }
    }

    // 结束战斗
    endBattle(playerVictory) {
        if (!this.battle) return;

        console.log(`战斗结束，${playerVictory ? '胜利' : '失败'}！`);

        // 重置所有怪物的战斗状态
        this.resetEnemiesBattleStatus();

        // 如果胜利，标记当前战斗的怪物为已击败
        if (playerVictory) {
            this.markCurrentEnemyDefeated();
        }

        if (playerVictory) {
            // 显示胜利界面
            const victoryScreen = document.querySelector('.victory-screen');
            if (victoryScreen) {
                document.getElementById('victory-exp').textContent = this.battle.playerExpGain;
                document.getElementById('victory-gold').textContent = this.battle.playerGoldGain;
                document.getElementById('victory-damage').textContent = this.battle.playerDamageDealt;
                document.getElementById('victory-taken').textContent = this.battle.playerDamageTaken;
                victoryScreen.style.display = 'block';

                // 播放金币音效
                this.playGoldSound();
            }

            // 更新玩家经验值和金币
            this.player.exp += this.battle.playerExpGain;
            this.player.gold += this.battle.playerGoldGain;
            this.addBattleLog(`获得经验值: ${this.battle.playerExpGain}`);
            this.addBattleLog(`获得金币: ${this.battle.playerGoldGain}`);
            this.checkLevelUp();
        } else {
            // 战斗失败
            this.addBattleLog('战斗失败！返回游戏...');
            setTimeout(() => {
                this.exitBattle();
            }, 3000);
        }

        // 重置战斗状态
        this.battle = null;
        console.log('战斗状态已重置');
    }

    // 检查升级
    checkLevelUp() {
        const expNeeded = this.player.level * 100;
        if (this.player.exp >= expNeeded) {
            this.player.level++;
            this.player.exp -= expNeeded;
            this.player.maxHealth += 10;
            this.player.health = this.player.maxHealth;
            this.player.attack += 2;
            this.player.defense += 1;
            this.addBattleLog(`恭喜升级！当前等级: ${this.player.level}`);
        }
    }

    // 退出战斗
    exitBattle() {
        const battleScreen = document.getElementById('battle-screen');
        const gameScreen = document.getElementById('game-screen');

        if (battleScreen && gameScreen) {
            battleScreen.classList.remove('active');
            gameScreen.classList.add('active');
        }

        // 重置战斗界面
        const victoryScreen = document.querySelector('.victory-screen');
        if (victoryScreen) {
            victoryScreen.style.display = 'none';
        }

        const battleLog = document.querySelector('.battle-log');
        if (battleLog) {
            battleLog.innerHTML = '';
        }
    }

    // 逃跑
    escapeBattle() {
        if (!this.battle) return;

        this.addBattleLog('尝试逃跑...');

        // 逃跑必定成功但损失一半生命值
        const damage = Math.floor(this.player.health / 2);
        this.player.health = Math.max(1, this.player.health - damage);

        this.addBattleLog(`逃跑成功！损失了 ${damage} 点生命值`);

        setTimeout(() => {
            this.exitBattle();
        }, 1000);
    }

    // 结束战斗界面（胜利后点击继续）
    endBattleScreen() {
        this.exitBattle();
    }
}

// 等待DOM加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，正在启动游戏...');
    window.game = new Game();
    window.game.init();
});

// 备用方案 - 确保游戏能启动
window.addEventListener('load', () => {
    if (!window.game) {
        console.log('使用load事件启动游戏...');
        window.game = new Game();
        window.game.init();
    }
});