# 战斗音效文件说明

## 需要添加的音效文件

请在 `assets/sounds/` 目录下添加以下音效文件：

### 1. 战斗开始音效
- `battle-start.mp3` - 战斗开始时的音效
- `battle-start.ogg` - 备用格式

### 2. 攻击音效
- `attack.mp3` - 普通攻击音效
- `attack.ogg` - 备用格式

### 3. 技能音效
- `skill.mp3` - 技能释放音效
- `skill.ogg` - 备用格式

### 4. 击中音效
- `hit.mp3` - 攻击击中目标的音效
- `hit.ogg` - 备用格式

### 5. 胜利音效
- `victory.mp3` - 战斗胜利音效
- `victory.ogg` - 备用格式

### 6. 失败音效
- `defeat.mp3` - 战斗失败音效
- `defeat.ogg` - 备用格式

## 音效要求

### 格式
- **主要格式**: MP3 (推荐)
- **备用格式**: OGG (为了更好的浏览器兼容性)

### 质量建议
- **比特率**: 128-192 kbps
- **采样率**: 44.1 kHz
- **时长**: 1-3秒
- **音量**: 统一标准化

### 音效类型建议
- **战斗开始**: 紧张的鼓声或战斗号角
- **攻击**: 刀剑碰撞或打击声
- **技能**: 魔法音效或能量释放声
- **击中**: 受伤或撞击声
- **胜利**: 凯旋或庆祝音乐
- **失败**: 悲伤或失败音乐

## 音效控制

游戏中已内置音效控制功能：

### 开启/关闭音效
```javascript
// 开启音效
game.setSoundEnabled(true);

// 关闭音效
game.setSoundEnabled(false);
```

### 调整音量
```javascript
// 设置音量 (0.0 - 1.0)
game.setSoundVolume(0.5);
```

## 技术说明

音效系统使用HTML5 Audio API实现：
- 自动预加载音效文件
- 支持多重音效同时播放
- 包含错误处理和降级机制
- 在某些浏览器中可能需要用户交互才能播放音频

## 免费音效资源

你可以从以下网站获取免费的音效资源：
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Adobe Stock Audio](https://stock.adobe.com/audio/free)
- [Pixabay Music](https://pixabay.com/music/)

确保使用的音效文件符合相应的许可协议。