// AI山海经游戏装备系统
class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // weapon, armor, accessory, consumable
        this.rarity = data.rarity || 'common'; // common, rare, epic, legendary
        this.level = data.level || 1;
        this.description = data.description || '';
        this.icon = data.icon || 'assets/images/items/default.png';
        this.value = data.value || 0;
        this.stackable = data.stackable || false;
        this.maxStack = data.maxStack || 1;
        this.quantity = data.quantity || 1;

        // 装备属性
        this.equipmentStats = {
            attack: data.attack || 0,
            defense: data.defense || 0,
            health: data.health || 0,
            speed: data.speed || 0,
            critical: data.critical || 0,
            dodge: data.dodge || 0
        };

        // 特殊效果
        this.effects = data.effects || [];
        this.requirements = data.requirements || {};

        // 使用效果
        this.useEffect = data.useEffect || null;
    }

    // 检查是否满足使用条件
    canUse(player) {
        if (this.requirements.level && player.level < this.requirements.level) {
            return false;
        }
        if (this.requirements.class && !this.requirements.class.includes(player.type)) {
            return false;
        }
        return true;
    }

    // 使用物品
    use(player) {
        if (!this.canUse(player)) return false;

        if (this.useEffect) {
            return this.useEffect(player, this);
        }

        return true;
    }

    // 获取物品颜色
    getRarityColor() {
        const colors = {
            common: '#9e9e9e',
            rare: '#2196f3',
            epic: '#9c27b0',
            legendary: '#ff9800'
        };
        return colors[this.rarity] || colors.common;
    }

    // 获取物品描述
    getFullDescription() {
        let desc = `${this.name}\n`;
        desc += `稀有度: ${this.getRarityText()}\n`;
        desc += `等级: ${this.level}\n\n`;

        if (this.equipmentStats.attack > 0) desc += `攻击力: +${this.equipmentStats.attack}\n`;
        if (this.equipmentStats.defense > 0) desc += `防御力: +${this.equipmentStats.defense}\n`;
        if (this.equipmentStats.health > 0) desc += `生命值: +${this.equipmentStats.health}\n`;
        if (this.equipmentStats.speed > 0) desc += `速度: +${this.equipmentStats.speed}\n`;
        if (this.equipmentStats.critical > 0) desc += `暴击: +${this.equipmentStats.critical}%\n`;
        if (this.equipmentStats.dodge > 0) desc += `闪避: +${this.equipmentStats.dodge}%\n`;

        if (this.requirements.level) {
            desc += `\n需要等级: ${this.requirements.level}`;
        }

        if (this.description) {
            desc += `\n\n${this.description}`;
        }

        return desc;
    }

    getRarityText() {
        const rarityTexts = {
            common: '普通',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return rarityTexts[this.rarity] || '普通';
    }
}

class Equipment {
    constructor(game) {
        this.game = game;
        this.slots = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.inventory = [];
        this.maxInventorySize = 20;
        this.init();
    }

    init() {
        this.initializeEquipment();
        this.createEquipmentUI();
        this.setupEventListeners();
    }

    // 初始化装备系统
    initializeEquipment() {
        // 创建物品数据库
        this.itemDatabase = {
            // 武器
            wooden_sword: new Item({
                id: 'wooden_sword',
                name: '木剑',
                type: 'weapon',
                rarity: 'common',
                level: 1,
                attack: 5,
                description: '简单的木剑，适合新手使用',
                icon: 'assets/images/items/wooden-sword.png'
            }),

            iron_sword: new Item({
                id: 'iron_sword',
                name: '铁剑',
                type: 'weapon',
                rarity: 'rare',
                level: 5,
                attack: 12,
                description: '锋利的铁剑，战斗力提升',
                icon: 'assets/images/items/iron-sword.png'
            }),

            flame_sword: new Item({
                id: 'flame_sword',
                name: '烈焰剑',
                type: 'weapon',
                rarity: 'epic',
                level: 10,
                attack: 25,
                critical: 10,
                description: '燃烧着烈焰的魔剑',
                icon: 'assets/images/items/flame-sword.png'
            }),

            // 防具
            leather_armor: new Item({
                id: 'leather_armor',
                name: '皮甲',
                type: 'armor',
                rarity: 'common',
                level: 1,
                defense: 3,
                health: 10,
                description: '轻便的皮甲',
                icon: 'assets/images/items/leather-armor.png'
            }),

            iron_armor: new Item({
                id: 'iron_armor',
                name: '铁甲',
                type: 'armor',
                rarity: 'rare',
                level: 5,
                defense: 8,
                health: 25,
                description: '坚固的铁甲',
                icon: 'assets/images/items/iron-armor.png'
            }),

            dragon_armor: new Item({
                id: 'dragon_armor',
                name: '龙鳞甲',
                type: 'armor',
                rarity: 'legendary',
                level: 15,
                defense: 20,
                health: 50,
                dodge: 5,
                description: '传说中的龙鳞甲',
                icon: 'assets/images/items/dragon-armor.png'
            }),

            // 饰品
            health_ring: new Item({
                id: 'health_ring',
                name: '生命之戒',
                type: 'accessory',
                rarity: 'rare',
                level: 3,
                health: 30,
                description: '增加生命值的戒指',
                icon: 'assets/images/items/health-ring.png'
            }),

            speed_boots: new Item({
                id: 'speed_boots',
                name: '速度之靴',
                type: 'accessory',
                rarity: 'rare',
                level: 4,
                speed: 2,
                dodge: 8,
                description: '提升移动速度的靴子',
                icon: 'assets/images/items/speed-boots.png'
            }),

            // 消耗品
            health_potion: new Item({
                id: 'health_potion',
                name: '生命药水',
                type: 'consumable',
                rarity: 'common',
                level: 1,
                value: 50,
                stackable: true,
                maxStack: 10,
                description: '恢复50点生命值',
                useEffect: (player, item) => {
                    const healAmount = Math.min(item.value, player.maxHealth - player.health);
                    player.health += healAmount;
                    player.game.showFloatingText(player.x, player.y, `+${healAmount} 生命值`, '#4caf50');
                    player.game.updatePlayerUI();
                    return true;
                }
            }),

            attack_potion: new Item({
                id: 'attack_potion',
                name: '攻击药水',
                type: 'consumable',
                rarity: 'common',
                level: 1,
                value: 10,
                duration: 30000, // 30秒
                stackable: true,
                maxStack: 5,
                description: '30秒内增加10点攻击力',
                useEffect: (player, item) => {
                    player.attack += item.value;
                    player.game.showFloatingText(player.x, player.y, `+${item.value} 攻击力`, '#ff6b6b');
                    player.game.updatePlayerUI();

                    // 设置定时器移除效果
                    setTimeout(() => {
                        player.attack -= item.value;
                        player.game.showFloatingText(player.x, player.y, '攻击力效果消失', '#cccccc');
                        player.game.updatePlayerUI();
                    }, item.duration);

                    return true;
                }
            })
        };
    }

    // 装备物品
    equipItem(item, slot) {
        if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') {
            return false;
        }

        // 检查等级要求
        if (!item.canUse(this.game.player)) {
            this.showEquipmentMessage('等级不足，无法装备此物品', 'error');
            return false;
        }

        // 卸下当前装备
        const currentItem = this.slots[slot];
        if (currentItem) {
            this.unequipItem(slot);
        }

        // 装备新物品
        this.slots[slot] = item;
        this.applyEquipmentStats(item, true);

        // 从背包中移除
        this.removeFromInventory(item);

        // 播放装备音效
        if (this.game.playSound) {
            this.game.playSound('equip');
        }

        this.showEquipmentMessage(`成功装备 ${item.name}`, 'success');
        this.updateEquipmentUI();
        return true;
    }

    // 卸下装备
    unequipItem(slot) {
        const item = this.slots[slot];
        if (!item) return false;

        // 检查背包空间
        if (this.inventory.length >= this.maxInventorySize) {
            this.showEquipmentMessage('背包空间不足', 'error');
            return false;
        }

        // 移除装备效果
        this.applyEquipmentStats(item, false);
        this.slots[slot] = null;

        // 添加到背包
        this.addToInventory(item);

        this.showEquipmentMessage(`成功卸下 ${item.name}`, 'success');
        this.updateEquipmentUI();
        return true;
    }

    // 应用装备属性
    applyEquipmentStats(item, add) {
        const multiplier = add ? 1 : -1;
        const player = this.game.player;

        player.attack += item.equipmentStats.attack * multiplier;
        player.defense += item.equipmentStats.defense * multiplier;
        player.maxHealth += item.equipmentStats.health * multiplier;

        if (add) {
            // 装备时增加生命值
            player.health += item.equipmentStats.health;
        } else {
            // 卸下时减少生命值，但不能低于1
            player.health = Math.max(1, player.health - item.equipmentStats.health);
        }

        player.speed += item.equipmentStats.speed * multiplier;

        // 更新UI
        this.game.updatePlayerUI();
    }

    // 添加到背包
    addToInventory(item) {
        // 检查是否可以堆叠
        if (item.stackable) {
            const existingItem = this.inventory.find(invItem => invItem.id === item.id);
            if (existingItem && existingItem.quantity < existingItem.maxStack) {
                const canAdd = Math.min(item.quantity, existingItem.maxStack - existingItem.quantity);
                existingItem.quantity += canAdd;
                item.quantity -= canAdd;

                if (item.quantity === 0) {
                    return true;
                }
            }
        }

        // 添加新物品
        if (this.inventory.length < this.maxInventorySize) {
            this.inventory.push(item);
            return true;
        }

        return false;
    }

    // 从背包移除
    removeFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.inventory.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    // 使用物品
    useItem(item) {
        if (item.use(this.game.player)) {
            this.removeFromInventory(item);
            this.updateInventoryUI();
        }
    }

    // 创建装备UI
    createEquipmentUI() {
        const equipmentUI = document.createElement('div');
        equipmentUI.id = 'equipment-ui';
        equipmentUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 15px;
            color: white;
            z-index: 1000;
            display: none;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        equipmentUI.innerHTML = `
            <div style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #ecf0f1;">装备系统</h2>
                </div>

                <div style="flex: 1; display: flex; gap: 20px;">
                    <!-- 装备栏 -->
                    <div style="flex: 1; background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 15px;">
                        <h3 style="margin-top: 0; color: #3498db;">装备栏</h3>
                        <div id="equipment-slots" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <div class="equipment-slot" data-slot="weapon">
                                <div class="slot-title">武器</div>
                                <div class="slot-content"></div>
                            </div>
                            <div class="equipment-slot" data-slot="armor">
                                <div class="slot-title">防具</div>
                                <div class="slot-content"></div>
                            </div>
                            <div class="equipment-slot" data-slot="accessory">
                                <div class="slot-title">饰品</div>
                                <div class="slot-content"></div>
                            </div>
                        </div>

                        <!-- 装备属性预览 -->
                        <div style="margin-top: 20px;">
                            <h4 style="color: #e74c3c;">装备属性</h4>
                            <div id="equipment-stats" style="font-size: 14px; line-height: 1.5;">
                                <div>攻击力: <span id="total-attack">0</span></div>
                                <div>防御力: <span id="total-defense">0</span></div>
                                <div>生命值: <span id="total-health">0</span></div>
                                <div>速度: <span id="total-speed">0</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 背包 -->
                    <div style="flex: 1; background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 15px;">
                        <h3 style="margin-top: 0; color: #f39c12;">背包 (<span id="inventory-count">0</span>/<span id="inventory-max">20</span>)</h3>
                        <div id="inventory-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-height: 300px; overflow-y: auto;">
                            <!-- 背包物品将在这里动态生成 -->
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button id="close-equipment" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(equipmentUI);

        // 添加样式
        const equipmentStyles = document.createElement('style');
        equipmentStyles.textContent = `
            .equipment-slot {
                background: rgba(52, 73, 94, 0.5);
                border: 2px solid #34495e;
                border-radius: 8px;
                padding: 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .equipment-slot:hover {
                border-color: #3498db;
                transform: translateY(-2px);
            }

            .equipment-slot.occupied {
                border-color: #27ae60;
                background: rgba(39, 174, 96, 0.2);
            }

            .slot-title {
                font-size: 12px;
                color: #bdc3c7;
                margin-bottom: 5px;
            }

            .slot-content {
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: #ecf0f1;
            }

            .inventory-item {
                background: rgba(52, 152, 219, 0.3);
                border: 1px solid #3498db;
                border-radius: 5px;
                padding: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .inventory-item:hover {
                background: rgba(52, 152, 219, 0.5);
                transform: scale(1.05);
            }

            .inventory-item .item-icon {
                width: 30px;
                height: 30px;
                margin: 0 auto 2px;
                background: #34495e;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .inventory-item .item-name {
                font-size: 10px;
                color: #ecf0f1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .inventory-item .item-quantity {
                position: absolute;
                top: 2px;
                right: 2px;
                background: #e74c3c;
                color: white;
                border-radius: 10px;
                padding: 2px 4px;
                font-size: 9px;
            }

            .equipment-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
            }
        `;
        document.head.appendChild(equipmentStyles);
    }

    // 更新装备UI
    updateEquipmentUI() {
        this.updateEquipmentSlots();
        this.updateInventoryUI();
        this.updateEquipmentStats();
    }

    // 更新装备槽位
    updateEquipmentSlots() {
        Object.keys(this.slots).forEach(slot => {
            const slotElement = document.querySelector(`[data-slot="${slot}"]`);
            const contentElement = slotElement.querySelector('.slot-content');

            if (this.slots[slot]) {
                const item = this.slots[slot];
                contentElement.innerHTML = `
                    <div style="color: ${item.getRarityColor()}; font-weight: bold; font-size: 10px;">
                        ${item.name}
                    </div>
                `;
                slotElement.classList.add('occupied');
            } else {
                contentElement.innerHTML = '<div style="color: #7f8c8d;">空</div>';
                slotElement.classList.remove('occupied');
            }
        });
    }

    // 更新背包UI
    updateInventoryUI() {
        const grid = document.getElementById('inventory-grid');
        const count = document.getElementById('inventory-count');

        grid.innerHTML = '';
        count.textContent = this.inventory.length;

        this.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-icon">📦</div>
                <div class="item-name" style="color: ${item.getRarityColor()}">${item.name}</div>
                ${item.quantity > 1 ? `<div class="item-quantity">${item.quantity}</div>` : ''}
            `;

            itemElement.addEventListener('click', () => {
                this.handleItemClick(item);
            });

            grid.appendChild(itemElement);
        });
    }

    // 更新装备属性显示
    updateEquipmentStats() {
        const player = this.game.player;
        document.getElementById('total-attack').textContent = player.attack;
        document.getElementById('total-defense').textContent = player.defense;
        document.getElementById('total-health').textContent = player.maxHealth;
        document.getElementById('total-speed').textContent = player.speed;
    }

    // 处理物品点击
    handleItemClick(item) {
        if (item.type === 'consumable') {
            this.useItem(item);
        } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
            this.equipItem(item, item.type);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        const equipmentUI = document.getElementById('equipment-ui');

        // 装备槽位点击事件
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotType = slot.dataset.slot;
                if (this.slots[slotType]) {
                    this.unequipItem(slotType);
                }
            });
        });

        // 关闭按钮
        document.getElementById('close-equipment').addEventListener('click', () => {
            equipmentUI.style.display = 'none';
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && equipmentUI.style.display === 'block') {
                equipmentUI.style.display = 'none';
            }
        });
    }

    // 显示装备界面
    showEquipmentUI() {
        const equipmentUI = document.getElementById('equipment-ui');
        equipmentUI.style.display = 'block';
        this.updateEquipmentUI();
    }

    // 显示装备消息
    showEquipmentMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'equipment-message';
        messageDiv.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 2000);
    }

    // 随机掉落装备
    dropLoot(x, y, monsterLevel) {
        const dropRate = 0.3; // 30%掉落率
        if (Math.random() > dropRate) return;

        const possibleItems = Object.values(this.itemDatabase).filter(item => {
            return item.type !== 'consumable' && item.level <= monsterLevel + 2;
        });

        if (possibleItems.length === 0) return;

        const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        const lootItem = new Item({
            ...randomItem,
            quantity: 1
        });

        // 创建掉落物品
        const lootElement = document.createElement('div');
        lootElement.className = 'loot-item';
        lootElement.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 30px;
            height: 30px;
            background: ${lootItem.getRarityColor()};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
            animation: bounce 1s infinite;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        lootElement.innerHTML = '📦';
        lootElement.title = lootItem.name;

        lootElement.addEventListener('click', () => {
            if (this.addToInventory(lootItem)) {
                lootElement.remove();
                this.game.showFloatingText(x, y, `获得 ${lootItem.name}`, lootItem.getRarityColor());
                if (this.game.playSound) {
                    this.game.playSound('pickup');
                }
                this.updateInventoryUI();
            } else {
                this.game.showFloatingText(x, y, '背包已满', '#e74c3c');
            }
        });

        this.game.gameLayer.appendChild(lootElement);

        // 5秒后自动消失
        setTimeout(() => {
            if (lootElement.parentNode) {
                lootElement.remove();
            }
        }, 5000);
    }
}

// 添加CSS动画
const lootStyles = document.createElement('style');
lootStyles.textContent = `
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
`;
document.head.appendChild(lootStyles);