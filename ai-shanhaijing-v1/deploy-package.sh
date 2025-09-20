#!/bin/bash

# AI山海经部署打包脚本
# 此脚本用于在Mac上创建部署包

echo "🎮 AI山海经部署打包脚本"
echo "=================================="

# 设置变量
PROJECT_DIR="/Users/mac/plan-optimizer/ai-shanhaijing"
DEPLOY_NAME="ai-shanhaijing-deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_FILE="${DEPLOY_NAME}_${TIMESTAMP}.tar.gz"

# 进入项目目录
cd "$PROJECT_DIR" || {
    echo "❌ 无法进入项目目录: $PROJECT_DIR"
    exit 1
}

echo "📁 当前目录: $(pwd)"

# 检查必需文件
echo "🔍 检查必需文件..."
required_files=(
    "index.html"
    "style.css"
    "game.js"
    "save-manager.js"
    "equipment-system.js"
    "audio-manager.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    else
        echo "✅ $file"
    fi
done

# 检查资源文件夹
echo "🔍 检查资源文件夹..."
if [[ ! -d "assets" ]]; then
    missing_files+=("assets/")
    echo "❌ assets/ 文件夹不存在"
else
    echo "✅ assets/ 文件夹存在"

    # 检查图片文件
    echo "🔍 检查图片文件..."
    image_files=(
        "assets/images/木棒人.png"
        "assets/images/耐克鲨鱼.png"
        "assets/images/咖啡忍者.png"
        "assets/images/冰箱骆驼.png"
    )

    for img in "${image_files[@]}"; do
        if [[ ! -f "$img" ]]; then
            missing_files+=("$img")
        else
            echo "✅ $img"
        fi
    done

    # 检查音效文件
    echo "🔍 检查音效文件..."
    sound_files=(
        "assets/sounds/木棒人.m4a"
        "assets/sounds/耐克鲨鱼.m4a"
        "assets/sounds/咖啡忍者.m4a"
    )

    for sound in "${sound_files[@]}"; do
        if [[ ! -f "$sound" ]]; then
            missing_files+=("$sound")
        else
            echo "✅ $sound"
        fi
    done
fi

# 如果有缺失文件，提示用户
if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ 以下文件缺失:"
    printf '%s\n' "${missing_files[@]}"
    echo ""
    echo "请确保所有文件都存在后再重新运行此脚本。"
    exit 1
fi

echo ""
echo "✅ 所有必需文件检查通过"

# 创建临时目录
TEMP_DIR="/tmp/${DEPLOY_NAME}_${TIMESTAMP}"
echo "📦 创建临时目录: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制文件
echo "📋 复制文件到临时目录..."
cp index.html style.css game.js save-manager.js equipment-system.js audio-manager.js "$TEMP_DIR/"
cp -r assets "$TEMP_DIR/"

# 复制文档文件
echo "📚 复制文档文件..."
cp deploy-to-nas.md nas-deployment-checklist.md README.md "$TEMP_DIR/" 2>/dev/null || echo "⚠️  部分文档文件不存在，跳过"

# 创建NAS启动脚本
echo "🔧 创建NAS启动脚本..."
cat > "$TEMP_DIR/nas-setup.sh" << 'EOF'
#!/bin/bash

# AI山海经 NAS自动设置脚本
# 请在NAS上以root权限运行此脚本

set -e  # 遇到错误立即退出

echo "🎮 AI山海经 NAS自动设置脚本"
echo "=================================="

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   echo "❌ 此脚本必须以root权限运行"
   echo "请使用: sudo ./nas-setup.sh"
   exit 1
fi

# 设置变量
WEB_ROOT="/var/www/ai-shanhaijing"
SERVICE_NAME="ai-shanhaijing"
BACKUP_DIR="/backup/ai-shanhaijing"

echo "📁 创建网站目录..."
mkdir -p "$WEB_ROOT"
mkdir -p "$BACKUP_DIR"

echo "👤 设置文件权限..."
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"

echo "🔧 安装Caddy..."
# 检查Caddy是否已安装
if ! command -v caddy &> /dev/null; then
    # 安装Caddy
    curl -sS https://webinstall.dev/caddy | bash
else
    echo "✅ Caddy已安装"
fi

echo "📝 配置Caddy..."
# 创建Caddy配置
cat > /etc/caddy/Caddyfile << 'CADDYEOF'
http://:80 {
    root * /var/www/ai-shanhaijing
    file_server
    encode zstd gzip

    # 静态文件缓存
    handle /assets/* {
        file_server
        header Cache-Control "public, max-age=31536000"
    }

    # SPA路由支持
    handle {
        try_files {path} /index.html
    }

    # 日志配置
    log {
        output file /var/log/caddy/ai-shanhaijing.log
    }
}
CADDYEOF

echo "🚀 启动Caddy服务..."
systemctl enable --now caddy

echo "🔥 配置防火墙..."
# 检查防火墙类型
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --reload
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

echo "💾 创建备份脚本..."
cat > /usr/local/bin/backup-ai-shanhaijing.sh << 'BACKEOF'
#!/bin/bash
BACKUP_DIR="/backup/ai-shanhaijing"
DATE=$(date +%Y%m%d_%H%M%S)
WEB_DIR="/var/www/ai-shanhaijing"

mkdir -p "$BACKUP_DIR"

# 备份网站文件
tar -czf "$BACKUP_DIR/ai-shanhaijing_$DATE.tar.gz" -C "$WEB_DIR" .

# 保留最近7天的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: ai-shanhaijing_$DATE.tar.gz"
BACKEOF

chmod +x /usr/local/bin/backup-ai-shanhaijing.sh

echo "⏰ 设置定时备份..."
# 添加到crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-ai-shanhaijing.sh") | crontab -

echo "📊 创建状态检查脚本..."
cat > /usr/local/bin/check-ai-shanhaijing.sh << 'CHECKEOF'
#!/bin/bash
WEB_ROOT="/var/www/ai-shanhaijing"
LOG_FILE="/var/log/caddy/ai-shanhaijing.log"

echo "🎮 AI山海经状态检查"
echo "=================="

echo "📁 Web服务器状态:"
systemctl is-active caddy

echo ""
echo "📂 文件检查:"
if [[ -d "$WEB_ROOT" ]]; then
    echo "✅ 网站目录存在"
    echo "📄 文件数量: $(find "$WEB_ROOT" -type f | wc -l)"
else
    echo "❌ 网站目录不存在"
fi

echo ""
echo "🔥 防火墙状态:"
if command -v ufw &> /dev/null; then
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-all
fi

echo ""
echo "💾 备份状态:"
if [[ -d "/backup/ai-shanhaijing" ]]; then
    echo "📦 备份文件数量: $(find /backup/ai-shanhaijing -name "*.tar.gz" | wc -l)"
    echo "📅 最新备份: $(ls -t /backup/ai-shanhaijing/*.tar.gz 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo '无备份文件')"
else
    echo "❌ 备份目录不存在"
fi

echo ""
echo "📊 最近日志:"
if [[ -f "$LOG_FILE" ]]; then
    tail -5 "$LOG_FILE"
else
    echo "❌ 日志文件不存在"
fi
CHECKEOF

chmod +x /usr/local/bin/check-ai-shanhaijing.sh

echo ""
echo "✅ 安装完成！"
echo ""
echo "🌐 访问方式:"
echo "   本地访问: http://localhost"
echo "   局域网访问: http://[NAS的局域网IP]"
echo ""
echo "🔧 管理命令:"
echo "   检查状态: /usr/local/bin/check-ai-shanhaijing.sh"
echo "   手动备份: /usr/local/bin/backup-ai-shanhaijing.sh"
echo "   查看日志: tail -f /var/log/caddy/ai-shanhaijing.log"
echo "   重启服务: systemctl restart caddy"
echo ""
echo "📁 重要目录:"
echo "   网站文件: /var/www/ai-shanhaijing"
echo "   备份文件: /backup/ai-shanhaijing"
echo "   配置文件: /etc/caddy/Caddyfile"
echo ""
echo "⚠️  下一步:"
echo "   1. 配置路由器端口转发 (80端口到NAS)"
echo "   2. 设置DDNS域名 (如需要外网访问)"
echo "   3. 测试所有功能是否正常"
EOF

chmod +x "$TEMP_DIR/nas-setup.sh"

# 创建快速部署脚本
echo "🚀 创建快速部署脚本..."
cat > "$TEMP_DIR/quick-deploy.sh" << 'QEOF'
#!/bin/bash

# AI山海经快速部署脚本
# 使用方法: ./quick-deploy.sh <NAS_IP> <NAS_USER>

if [[ $# -lt 2 ]]; then
    echo "❌ 使用方法: $0 <NAS_IP> <NAS_USER>"
    echo "示例: $0 192.168.1.100 admin"
    exit 1
fi

NAS_IP="$1"
NAS_USER="$2"
DEPLOY_FILE="ai-shanhaijing-deploy.tar.gz"

echo "🎮 AI山海经快速部署"
echo "NAS IP: $NAS_IP"
echo "NAS用户: $NAS_USER"
echo "=================="

# 检查部署文件是否存在
if [[ ! -f "$DEPLOY_FILE" ]]; then
    echo "❌ 找不到部署文件: $DEPLOY_FILE"
    echo "请先运行 deploy-package.sh 创建部署包"
    exit 1
fi

# 传输文件
echo "📡 传输文件到NAS..."
scp "$DEPLOY_FILE" "$NAS_USER@$NAS_IP:/home/$NAS_USER/"

if [[ $? -ne 0 ]]; then
    echo "❌ 文件传输失败"
    exit 1
fi

# SSH到NAS并执行设置
echo "🔧 在NAS上执行安装..."
ssh "$NAS_USER@$NAS_IP" << 'REMOTE_EOF'
    # 解压文件
    tar -xzf ai-shanhaijing-deploy.tar.gz

    # 运行设置脚本
    sudo ./nas-setup.sh

    # 清理
    rm -rf ai-shanhaijing-deploy.tar.gz ai-shanhaijing nas-setup.sh quick-deploy.sh
REMOTE_EOF

if [[ $? -eq 0 ]]; then
    echo "✅ 部署成功！"
    echo "🌐 访问地址: http://$NAS_IP"
else
    echo "❌ 部署失败，请检查错误信息"
fi
QEOF

chmod +x "$TEMP_DIR/quick-deploy.sh"

# 创建部署包
echo "📦 创建部署包..."
cd /tmp
tar -czf "$PROJECT_DIR/$DEPLOY_FILE" "${DEPLOY_NAME}_${TIMESTAMP}/"
cd "$PROJECT_DIR"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 计算文件大小
FILE_SIZE=$(du -h "$DEPLOY_FILE" | cut -f1)

echo ""
echo "✅ 部署包创建成功！"
echo "📄 文件名: $DEPLOY_FILE"
echo "📏 文件大小: $FILE_SIZE"
echo ""
echo "📦 包含内容:"
echo "   - 游戏核心文件 (HTML, CSS, JS)"
echo "   - 资源文件 (图片、音效)"
echo "   - NAS自动安装脚本"
echo "   - 快速部署脚本"
echo "   - 部署文档和检查清单"
echo ""
echo "🚀 快速部署方法:"
echo "   1. 将部署包传输到目标机器"
echo "   2. 解压: tar -xzf $DEPLOY_FILE"
echo "   3. 进入目录: cd ${DEPLOY_NAME}_${TIMESTAMP}"
echo "   4. 运行快速部署: ./quick-deploy.sh <NAS_IP> <NAS_USER>"
echo ""
echo "🔧 手动部署方法:"
echo "   1. 将部署包传输到NAS: scp $DEPLOY_FILE user@nas_ip:/home/user/"
echo "   2. SSH到NAS: ssh user@nas_ip"
echo "   3. 解压: tar -xzf $DEPLOY_FILE"
echo "   4. 运行安装脚本: sudo ./nas-setup.sh"
echo ""
echo "📚 更多信息请参考:"
echo "   - deploy-to-nas.md (详细部署指南)"
echo "   - nas-deployment-checklist.md (部署检查清单)"