// AI山海经游戏存档管理器
class SaveManager {
    constructor(game) {
        this.game = game;
        this.maxSaveSlots = 3;
        this.autoSaveInterval = 60000; // 1分钟自动存档
        this.autoSaveTimer = null;
        this.init();
    }

    init() {
        // 初始化存档系统
        this.createSaveSlots();
        this.startAutoSave();
    }

    // 创建存档槽位
    createSaveSlots() {
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const saveKey = `shanhaijing_save_${i}`;
            if (!localStorage.getItem(saveKey)) {
                // 创建空的存档槽位
                const emptySave = {
                    slot: i,
                    timestamp: null,
                    playerName: '空存档',
                    level: 0,
                    playTime: 0,
                    exists: false
                };
                localStorage.setItem(saveKey, JSON.stringify(emptySave));
            }
        }
    }

    // 保存游戏数据
    saveGame(slot = 0, autoSave = false) {
        if (!this.game.player) return false;

        const saveData = {
            slot: slot,
            timestamp: Date.now(),
            playerName: this.game.player.name,
            level: this.game.player.level,
            playTime: this.getPlayTime(),
            exists: true,
            player: {
                type: this.game.player.type,
                name: this.game.player.name,
                image: this.game.player.image,
                x: this.game.player.x,
                y: this.game.player.y,
                width: this.game.player.width,
                height: this.game.player.height,
                health: this.game.player.health,
                maxHealth: this.game.player.maxHealth,
                attack: this.game.player.attack,
                defense: this.game.player.defense,
                speed: this.game.player.speed,
                level: this.game.player.level,
                exp: this.game.player.exp,
                gold: this.game.player.gold || 0,
                skills: this.game.player.skills,
                skillCooldowns: this.game.player.skillCooldowns,
                direction: this.game.player.direction,
                equipment: this.game.player.equipment || {},
                inventory: this.game.player.inventory || []
            },
            game: {
                mapData: this.game.map ? this.game.map.getSaveData() : null,
                killedMonsters: this.game.killedMonsters || 0,
                completedQuests: this.game.completedQuests || [],
                currentQuest: this.game.currentQuest || null,
                settings: {
                    soundEnabled: this.game.soundEnabled,
                    soundVolume: this.game.soundVolume
                }
            }
        };

        const saveKey = `shanhaijing_save_${slot}`;
        localStorage.setItem(saveKey, JSON.stringify(saveData));

        if (!autoSave) {
            this.showSaveMessage(`存档成功！存档槽位 ${slot + 1}`);
        }

        return true;
    }

    // 读取游戏数据
    loadGame(slot = 0) {
        const saveKey = `shanhaijing_save_${slot}`;
        const saveData = localStorage.getItem(saveKey);

        if (!saveData) {
            this.showSaveMessage(`存档槽位 ${slot + 1} 为空`, 'error');
            return false;
        }

        try {
            const data = JSON.parse(saveData);
            if (!data.exists) {
                this.showSaveMessage(`存档槽位 ${slot + 1} 为空`, 'error');
                return false;
            }

            // 恢复玩家数据
            this.game.player = {
                ...this.game.player,
                ...data.player,
                element: null,
                healthBar: null,
                levelBadge: null,
                isMoving: false
            };

            // 恢复游戏设置
            this.game.soundEnabled = data.game.settings.soundEnabled;
            this.game.soundVolume = data.game.settings.soundVolume;
            this.game.killedMonsters = data.game.killedMonsters;
            this.game.completedQuests = data.game.completedQuests;
            this.game.currentQuest = data.game.currentQuest;

            // 重新创建玩家元素
            this.game.createPlayerElement();
            this.game.updatePlayerUI();

            // 恢复地图数据
            if (data.game.mapData && this.game.map) {
                this.game.map.loadSaveData(data.game.mapData);
            }

            this.showSaveMessage(`读档成功！欢迎回来，${data.player.name}`);
            return true;
        } catch (error) {
            console.error('读档失败:', error);
            this.showSaveMessage(`读档失败！存档可能已损坏`, 'error');
            return false;
        }
    }

    // 获取存档列表
    getSaveList() {
        const saveList = [];
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const saveKey = `shanhaijing_save_${i}`;
            const saveData = localStorage.getItem(saveKey);

            if (saveData) {
                try {
                    const data = JSON.parse(saveData);
                    saveList.push(data);
                } catch (error) {
                    console.error(`读取存档槽位 ${i} 失败:`, error);
                }
            }
        }
        return saveList;
    }

    // 删除存档
    deleteSave(slot) {
        const saveKey = `shanhaijing_save_${slot}`;
        const emptySave = {
            slot: slot,
            timestamp: null,
            playerName: '空存档',
            level: 0,
            playTime: 0,
            exists: false
        };
        localStorage.setItem(saveKey, JSON.stringify(emptySave));
        this.showSaveMessage(`存档槽位 ${slot + 1} 已删除`);
    }

    // 自动存档
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            if (this.game.gameRunning && this.game.player) {
                this.saveGame(0, true); // 使用槽位0进行自动存档
                console.log('自动存档完成');
            }
        }, this.autoSaveInterval);
    }

    // 停止自动存档
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 获取游戏时间
    getPlayTime() {
        // 这里可以根据实际情况计算游戏时间
        return 0;
    }

    // 显示存档消息
    showSaveMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `save-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            border-radius: 5px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 2000);
    }

    // 创建存档界面
    createSaveInterface() {
        const saveInterface = document.createElement('div');
        saveInterface.className = 'save-interface';
        saveInterface.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 500px;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 15px;
            padding: 20px;
            color: white;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        const saveList = this.getSaveList();

        let html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #ecf0f1;">游戏存档</h2>
                <p style="margin: 10px 0; color: #bdc3c7;">选择存档槽位进行存档或读档</p>
            </div>
            <div class="save-slots" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
        `;

        saveList.forEach((save, index) => {
            const date = save.timestamp ? new Date(save.timestamp).toLocaleString('zh-CN') : '无存档';
            const status = save.exists ? 'exists' : 'empty';

            html += `
                <div class="save-slot ${status}" data-slot="${index}" style="
                    background: ${save.exists ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 'linear-gradient(135deg, #7f8c8d, #95a5a6)'};
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                ">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">存档槽位 ${index + 1}</div>
                    ${save.exists ? `
                        <div style="font-size: 14px; margin-bottom: 5px;">${save.playerName}</div>
                        <div style="font-size: 12px; color: #ecf0f1; margin-bottom: 5px;">等级: ${save.level}</div>
                        <div style="font-size: 10px; color: #bdc3c7;">${date}</div>
                    ` : `
                        <div style="font-size: 14px; color: #ecf0f1;">空存档</div>
                    `}
                </div>
            `;
        });

        html += `
            </div>
            <div style="text-align: center;">
                <button id="close-save" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 0 5px;
                ">关闭</button>
            </div>
        `;

        saveInterface.innerHTML = html;

        // 添加事件监听器
        saveInterface.querySelectorAll('.save-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotIndex = parseInt(slot.dataset.slot);
                this.handleSlotClick(slotIndex);
            });

            slot.addEventListener('mouseenter', () => {
                slot.style.transform = 'translateY(-2px)';
                slot.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
            });

            slot.addEventListener('mouseleave', () => {
                slot.style.transform = 'translateY(0)';
                slot.style.boxShadow = 'none';
            });
        });

        saveInterface.querySelector('#close-save').addEventListener('click', () => {
            saveInterface.remove();
        });

        document.body.appendChild(saveInterface);
    }

    // 处理存档槽位点击
    handleSlotClick(slot) {
        const saveList = this.getSaveList();
        const save = saveList[slot];

        // 创建操作菜单
        const menu = document.createElement('div');
        menu.className = 'save-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #34495e, #2c3e50);
            border-radius: 10px;
            padding: 20px;
            color: white;
            z-index: 1001;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        `;

        menu.innerHTML = `
            <h3 style="margin-top: 0; text-align: center;">存档槽位 ${slot + 1}</h3>
            <div style="margin: 15px 0;">
                ${save.exists ? `
                    <p style="margin: 5px 0;">角色: ${save.playerName}</p>
                    <p style="margin: 5px 0;">等级: ${save.level}</p>
                    <p style="margin: 5px 0;">时间: ${new Date(save.timestamp).toLocaleString('zh-CN')}</p>
                ` : '<p style="margin: 5px 0; color: #bdc3c7;">空存档</p>'}
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="save-btn" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">保存</button>
                ${save.exists ? `
                    <button id="load-btn" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                    ">读取</button>
                    <button id="delete-btn" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                    ">删除</button>
                ` : ''}
                <button id="cancel-btn" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">取消</button>
            </div>
        `;

        // 添加按钮事件
        menu.querySelector('#save-btn').addEventListener('click', () => {
            this.saveGame(slot);
            menu.remove();
            document.querySelector('.save-interface').remove();
            this.createSaveInterface(); // 刷新界面
        });

        if (save.exists) {
            menu.querySelector('#load-btn').addEventListener('click', () => {
                if (this.loadGame(slot)) {
                    menu.remove();
                    document.querySelector('.save-interface').remove();
                }
            });

            menu.querySelector('#delete-btn').addEventListener('click', () => {
                if (confirm('确定要删除这个存档吗？')) {
                    this.deleteSave(slot);
                    menu.remove();
                    document.querySelector('.save-interface').remove();
                    this.createSaveInterface(); // 刷新界面
                }
            });
        }

        menu.querySelector('#cancel-btn').addEventListener('click', () => {
            menu.remove();
        });

        document.body.appendChild(menu);
    }
}

// 添加CSS样式
const saveStyles = document.createElement('style');
saveStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .save-slot:hover {
        border-color: #f39c12 !important;
    }
`;
document.head.appendChild(saveStyles);