// 快速检查脚本 - 用于诊断游戏启动问题
(function() {
    console.log('🔍 开始AI山海经游戏启动检查...\n');

    let issues = [];
    let successes = [];

    function check(name, condition, message) {
        if (condition) {
            successes.push(`✅ ${name}: ${message}`);
            console.log(`✅ ${name}: ${message}`);
        } else {
            issues.push(`❌ ${name}: ${message}`);
            console.error(`❌ ${name}: ${message}`);
        }
    }

    function warn(name, condition, message) {
        if (condition) {
            successes.push(`⚠️ ${name}: ${message}`);
            console.warn(`⚠️ ${name}: ${message}`);
        } else {
            successes.push(`✅ ${name}: ${message}`);
            console.log(`✅ ${name}: ${message}`);
        }
    }

    // 检查必需的类
    check('SaveManager类', typeof SaveManager !== 'undefined', 'SaveManager类已定义');
    check('Equipment类', typeof Equipment !== 'undefined', 'Equipment类已定义');
    check('Item类', typeof Item !== 'undefined', 'Item类已定义');
    check('AudioManager类', typeof AudioManager !== 'undefined', 'AudioManager类已定义');
    check('Game类', typeof Game !== 'undefined', 'Game类已定义');

    // 检查必需的HTML元素
    check('角色选择界面', document.getElementById('character-select') !== null, 'character-select元素存在');
    check('游戏界面', document.getElementById('game-screen') !== null, 'game-screen元素存在');
    check('战斗界面', document.getElementById('battle-screen') !== null, 'battle-screen元素存在');
    check('游戏层', document.getElementById('game-layer') !== null, 'game-layer元素存在');

    // 检查关键方法
    if (typeof Game !== 'undefined') {
        try {
            const gameTest = new Game();
            check('Game实例化', true, 'Game类可以正常实例化');
            check('selectCharacter方法', typeof gameTest.selectCharacter === 'function', 'selectCharacter方法存在');
            check('startGame方法', typeof gameTest.startGame === 'function', 'startGame方法存在');
            check('playSound方法', typeof gameTest.playSound === 'function', 'playSound方法存在');
        } catch (error) {
            issues.push(`❌ Game实例化失败: ${error.message}`);
            console.error(`❌ Game实例化失败: ${error.message}`);
        }
    }

    // 检查资源文件
    const testResources = [
        'assets/images/木棒人.png',
        'assets/images/耐克鲨鱼.png',
        'assets/images/咖啡忍者.png',
        'assets/images/冰箱骆驼.png'
    ];

    testResources.forEach(resource => {
        const img = new Image();
        img.onload = () => {
            successes.push(`✅ 资源文件: ${resource} 可访问`);
            console.log(`✅ 资源文件: ${resource} 可访问`);
        };
        img.onerror = () => {
            warn(`资源文件: ${resource}`, true, '无法访问（这可能影响游戏）');
        };
        img.src = resource;
    });

    // 显示总结
    setTimeout(() => {
        console.log('\n📊 检查结果总结:');
        console.log(`✅ 成功: ${successes.length} 项`);
        console.log(`❌ 问题: ${issues.length} 项`);

        if (issues.length > 0) {
            console.log('\n🔧 发现的问题:');
            issues.forEach(issue => console.log(`  ${issue}`));
            console.log('\n💡 建议解决方案:');
            console.log('1. 检查所有JavaScript文件是否正确加载');
            console.log('2. 确保图片资源文件存在于正确位置');
            console.log('3. 查看浏览器控制台是否有详细错误信息');
            console.log('4. 尝试清除浏览器缓存后重新加载');
        } else {
            console.log('\n🎉 所有检查都通过了！游戏应该可以正常启动。');
            console.log('如果仍然有问题，请检查浏览器控制台的详细错误信息。');
        }

        console.log('\n📋 成功项目:');
        successes.forEach(success => console.log(`  ${success}`));
    }, 2000);

    // 提供快速测试功能
    window.quickTest = {
        startGame: function() {
            console.log('🚀 开始快速游戏测试...');
            try {
                if (typeof Game === 'undefined') {
                    throw new Error('Game类未定义');
                }
                const game = new Game();
                game.selectedCharacter = 'stickman';
                game.startGame();
                console.log('✅ 游戏启动测试成功');
            } catch (error) {
                console.error('❌ 游戏启动测试失败:', error);
            }
        },

        checkCharacterSelect: function() {
            console.log('🎯 测试角色选择...');
            try {
                const cards = document.querySelectorAll('.character-card');
                console.log(`找到 ${cards.length} 个角色卡片`);
                if (cards.length > 0) {
                    cards[0].click();
                    console.log('✅ 角色选择测试成功');
                } else {
                    console.error('❌ 未找到角色卡片');
                }
            } catch (error) {
                console.error('❌ 角色选择测试失败:', error);
            }
        }
    };

    console.log('\n🛠️  可用的测试函数:');
    console.log('  quickTest.startGame() - 测试游戏启动');
    console.log('  quickTest.checkCharacterSelect() - 测试角色选择');
    console.log('\n检查完成！\n');
})();