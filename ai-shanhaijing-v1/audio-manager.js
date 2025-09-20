// AI山海经游戏音效管理器
class AudioManager {
    constructor(game) {
        this.game = game;
        this.audioContext = null;
        this.sounds = {};
        this.musicTracks = {};
        this.currentMusic = null;
        this.enabled = true;
        this.volume = 0.7;
        this.musicVolume = 0.5;
        this.init();
    }

    init() {
        this.initializeAudioContext();
        this.createSoundLibrary();
        this.createMusicLibrary();
        this.setupAudioUI();
        this.loadSoundFiles();
    }

    // 初始化音频上下文
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext 初始化成功');
        } catch (error) {
            console.warn('AudioContext 初始化失败:', error);
        }
    }

    // 创建音效库
    createSoundLibrary() {
        this.soundLibrary = {
            // 战斗音效
            battleStart: {
                file: 'assets/sounds/battle-start.mp3',
                fallback: this.generateBattleStartSound.bind(this),
                volume: 0.8
            },
            attack: {
                file: 'assets/sounds/attack.mp3',
                fallback: this.generateAttackSound.bind(this),
                volume: 0.6
            },
            skill: {
                file: 'assets/sounds/skill.mp3',
                fallback: this.generateSkillSound.bind(this),
                volume: 0.7
            },
            hit: {
                file: 'assets/sounds/hit.mp3',
                fallback: this.generateHitSound.bind(this),
                volume: 0.8
            },
            victory: {
                file: 'assets/sounds/victory.mp3',
                fallback: this.generateVictorySound.bind(this),
                volume: 0.9
            },
            defeat: {
                file: 'assets/sounds/defeat.mp3',
                fallback: this.generateDefeatSound.bind(this),
                volume: 0.8
            },

            // 环境音效
            footstep: {
                fallback: this.generateFootstepSound.bind(this),
                volume: 0.3
            },
            pickup: {
                fallback: this.generatePickupSound.bind(this),
                volume: 0.6
            },
            equip: {
                fallback: this.generateEquipSound.bind(this),
                volume: 0.5
            },
            levelUp: {
                fallback: this.generateLevelUpSound.bind(this),
                volume: 0.8
            },

            // UI音效
            buttonClick: {
                fallback: this.generateButtonClickSound.bind(this),
                volume: 0.4
            },
            openMenu: {
                fallback: this.generateOpenMenuSound.bind(this),
                volume: 0.5
            },
            closeMenu: {
                fallback: this.generateCloseMenuSound.bind(this),
                volume: 0.5
            },

            // 背景音乐
            backgroundMusic: {
                file: 'assets/sounds/background-music.mp3',
                loop: true,
                volume: 0.3
            },
            battleMusic: {
                file: 'assets/sounds/battle-music.mp3',
                loop: true,
                volume: 0.5
            }
        };
    }

    // 创建音乐库
    createMusicLibrary() {
        this.musicLibrary = {
            peaceful: {
                file: 'assets/sounds/peaceful.mp3',
                loop: true,
                volume: 0.3
            },
            exploration: {
                file: 'assets/sounds/exploration.mp3',
                loop: true,
                volume: 0.4
            },
            battle: {
                file: 'assets/sounds/battle-music.mp3',
                loop: true,
                volume: 0.6
            },
            victory: {
                file: 'assets/sounds/victory-music.mp3',
                loop: false,
                volume: 0.7
            }
        };
    }

    // 加载音效文件
    loadSoundFiles() {
        Object.keys(this.soundLibrary).forEach(soundKey => {
            const sound = this.soundLibrary[soundKey];
            if (sound.file) {
                this.loadAudioFile(soundKey, sound.file, sound);
            }
        });
    }

    // 加载音频文件
    loadAudioFile(key, file, config) {
        const audio = new Audio();
        audio.src = file;
        audio.preload = 'auto';
        audio.volume = config.volume || this.volume;

        audio.addEventListener('canplaythrough', () => {
            this.sounds[key] = audio;
            console.log(`音效文件加载成功: ${key}`);
        });

        audio.addEventListener('error', () => {
            console.warn(`音效文件加载失败: ${key}, 将使用合成音效`);
            if (config.fallback) {
                this.sounds[key] = { fallback: config.fallback };
            }
        });

        audio.load();
    }

    // 播放音效
    playSound(soundKey, options = {}) {
        if (!this.enabled) return;

        const sound = this.sounds[soundKey];
        if (!sound) {
            console.warn(`音效不存在: ${soundKey}`);
            return;
        }

        try {
            if (sound.fallback) {
                // 使用合成的音效
                sound.fallback();
            } else if (sound.play) {
                // 使用HTML5 Audio
                const volume = options.volume || (sound.volume || this.volume);
                sound.volume = volume;
                sound.currentTime = 0;
                sound.play().catch(error => {
                    console.warn(`播放音效失败: ${soundKey}`, error);
                });
            }
        } catch (error) {
            console.warn(`播放音效失败: ${soundKey}`, error);
        }
    }

    // 播放背景音乐
    playMusic(musicKey, loop = true) {
        if (!this.enabled) return;

        const music = this.musicLibrary[musicKey];
        if (!music) {
            console.warn(`音乐不存在: ${musicKey}`);
            return;
        }

        // 停止当前音乐
        this.stopMusic();

        try {
            if (music.file) {
                const audio = new Audio(music.file);
                audio.volume = music.volume || this.musicVolume;
                audio.loop = loop !== false;
                audio.play().catch(error => {
                    console.warn(`播放音乐失败: ${musicKey}`, error);
                });
                this.currentMusic = audio;
            }
        } catch (error) {
            console.warn(`播放音乐失败: ${musicKey}`, error);
        }
    }

    // 停止背景音乐
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic = null;
        }
    }

    // 设置音效开关
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
        this.saveSettings();
    }

    // 设置音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound.volume !== undefined) {
                sound.volume = this.volume;
            }
        });
        this.saveSettings();
    }

    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
        this.saveSettings();
    }

    // 保存设置
    saveSettings() {
        if (typeof localStorage !== 'undefined') {
            const settings = {
                enabled: this.enabled,
                volume: this.volume,
                musicVolume: this.musicVolume
            };
            localStorage.setItem('shanhaijing_audio_settings', JSON.stringify(settings));
        }
    }

    // 加载设置
    loadSettings() {
        if (typeof localStorage !== 'undefined') {
            const settings = localStorage.getItem('shanhaijing_audio_settings');
            if (settings) {
                try {
                    const parsed = JSON.parse(settings);
                    this.enabled = parsed.enabled !== false;
                    this.volume = parsed.volume || 0.7;
                    this.musicVolume = parsed.musicVolume || 0.5;
                } catch (error) {
                    console.warn('加载音效设置失败:', error);
                }
            }
        }
    }

    // 设置音频UI
    setupAudioUI() {
        const audioControls = document.createElement('div');
        audioControls.id = 'audio-controls';
        audioControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-size: 12px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        audioControls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; font-weight: bold; color: #3498db;">音效控制</div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>音效:</span>
                    <button id="audio-toggle" style="
                        background: ${this.enabled ? '#27ae60' : '#e74c3c'};
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 10px;
                    ">${this.enabled ? '开' : '关'}</button>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>音量:</span>
                    <input type="range" id="audio-volume" min="0" max="1" step="0.1" value="${this.volume}" style="
                        width: 80px;
                        height: 4px;
                        background: #34495e;
                        outline: none;
                        cursor: pointer;
                    ">
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>音乐:</span>
                    <button id="music-toggle" style="
                        background: ${this.currentMusic ? '#27ae60' : '#e74c3c'};
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 10px;
                    ">${this.currentMusic ? '开' : '关'}</button>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>音量:</span>
                    <input type="range" id="music-volume" min="0" max="1" step="0.1" value="${this.musicVolume}" style="
                        width: 80px;
                        height: 4px;
                        background: #34495e;
                        outline: none;
                        cursor: pointer;
                    ">
                </div>

                <button id="hide-audio-controls" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 3px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 9px;
                    margin-top: 5px;
                ">隐藏</button>
            </div>
        `;

        document.body.appendChild(audioControls);

        // 事件监听器
        this.setupAudioControlEvents(audioControls);
    }

    // 设置音频控制事件
    setupAudioControlEvents(controls) {
        // 音效开关
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.setEnabled(!this.enabled);
            this.updateAudioControls();
        });

        // 音效音量
        document.getElementById('audio-volume').addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });

        // 音乐开关
        document.getElementById('music-toggle').addEventListener('click', () => {
            if (this.currentMusic) {
                this.stopMusic();
            } else {
                this.playMusic('peaceful');
            }
            this.updateAudioControls();
        });

        // 音乐音量
        document.getElementById('music-volume').addEventListener('input', (e) => {
            this.setMusicVolume(parseFloat(e.target.value));
        });

        // 隐藏控制面板
        document.getElementById('hide-audio-controls').addEventListener('click', () => {
            controls.style.display = 'none';
            // 显示一个小的按钮来重新打开控制面板
            this.showAudioToggleButton();
        });
    }

    // 更新音频控制显示
    updateAudioControls() {
        const toggleBtn = document.getElementById('audio-toggle');
        const musicBtn = document.getElementById('music-toggle');

        if (toggleBtn) {
            toggleBtn.textContent = this.enabled ? '开' : '关';
            toggleBtn.style.background = this.enabled ? '#27ae60' : '#e74c3c';
        }

        if (musicBtn) {
            musicBtn.textContent = this.currentMusic ? '开' : '关';
            musicBtn.style.background = this.currentMusic ? '#27ae60' : '#e74c3c';
        }
    }

    // 显示音频控制切换按钮
    showAudioToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'show-audio-controls';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;
        toggleBtn.textContent = '🔊';
        toggleBtn.title = '音效控制';

        toggleBtn.addEventListener('click', () => {
            const controls = document.getElementById('audio-controls');
            controls.style.display = 'block';
            toggleBtn.remove();
        });

        document.body.appendChild(toggleBtn);
    }

    // Web Audio API 音效生成方法
    generateBattleStartSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    generateAttackSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    generateSkillSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    generateHitSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    generateVictorySound() {
        if (!this.audioContext) return;

        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.2);

            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime + index * 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.2 + 0.4);

            oscillator.start(this.audioContext.currentTime + index * 0.2);
            oscillator.stop(this.audioContext.currentTime + index * 0.2 + 0.4);
        });
    }

    generateDefeatSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    generateFootstepSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    generatePickupSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    generateEquipSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(349, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(523, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    generateLevelUpSound() {
        if (!this.audioContext) return;

        const notes = [523, 659, 784, 1047]; // C, E, G, C (更高音)
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.15);

            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime + index * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.15 + 0.3);

            oscillator.start(this.audioContext.currentTime + index * 0.15);
            oscillator.stop(this.audioContext.currentTime + index * 0.15 + 0.3);
        });
    }

    generateButtonClickSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    generateOpenMenuSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    generateCloseMenuSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
}