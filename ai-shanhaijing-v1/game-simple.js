// 简化版Game类用于测试
class Game {
    constructor() {
        this.selectedCharacter = null;
        this.soundEnabled = false;
        this.gameRunning = false;
        console.log('Game实例创建成功');
    }

    init() {
        console.log('Game初始化开始');
        this.setupCharacterSelectionEvents();
        console.log('Game初始化完成');
    }

    setupCharacterSelectionEvents() {
        console.log('设置角色选择事件监听器');
        const characterCards = document.querySelectorAll('.character-card');

        characterCards.forEach(card => {
            card.addEventListener('click', () => {
                console.log('角色卡片被点击');
                this.selectCharacter(card.dataset.character);
            });
        });

        console.log('角色选择事件监听器设置完成');
    }

    selectCharacter(characterType) {
        this.selectedCharacter = characterType;
        console.log('选择角色:', characterType);
        this.startGame();
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

        // 开始游戏循环
        console.log('开始游戏循环...');
        this.gameRunning = true;
        this.gameLoop();

        console.log('=== 游戏启动完成 ===');
    }

    initializePlayer() {
        const characterData = {
            stickman: {
                name: '木棒人',
                level: 1,
                image: 'assets/images/木棒人.png',
                health: 80,
                maxHealth: 80,
                attack: 20,
                defense: 10,
                speed: 12,
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
                speed: 10,
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
                speed: 11,
                skills: ['咖啡飞镖', '瞬移', '咖啡因爆发'],
                color: '#4B0082'
            },
            'ice-camel': {
                name: '冰箱骆驼',
                level: 10,
                image: 'assets/images/冰箱骆驼.png',
                health: 150,
                maxHealth: 150,
                attack: 18,
                defense: 35,
                speed: 8,
                skills: ['骆驼吐沙', '冰冻', '冰箱护盾'],
                color: '#00CED1'
            }
        };

        const data = characterData[this.selectedCharacter];

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
            x: 400,
            y: 300,
            element: null
        };

        console.log('玩家初始化完成:', this.player);
    }

    renderMap() {
        console.log('渲染地图...');
        // 简化的地图渲染
        if (this.gameLayer) {
            this.gameLayer.innerHTML = '<div style="text-align: center; padding: 50px; color: white;"><h2>游戏世界</h2><p>恭喜！游戏已成功启动！</p><p>角色: ' + this.player.name + '</p></div>';
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;

        // 简化的游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    playSound(soundName) {
        // 禁用音效避免问题
        console.log(`音效播放已禁用: ${soundName}`);
        return;
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