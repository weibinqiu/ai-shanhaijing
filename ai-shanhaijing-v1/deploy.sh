#!/bin/bash

# AI山海经手机版自动部署脚本
# 使用方法: ./deploy.sh [nas-user]@[nas-ip]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装，请先安装 rsync"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "ssh 未安装，请先安装 ssh"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 压缩和优化文件
optimize_files() {
    log_info "优化文件..."
    
    # 创建临时目录
    TEMP_DIR="deploy_temp"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # 复制必要文件
    cp index-mobile.html "$TEMP_DIR/index.html"
    cp -r assets "$TEMP_DIR/"
    
    # 创建压缩的CSS和JS（如果存在）
    if [ -f "style.css" ]; then
        # 简单的CSS压缩
        sed 's/\/\*.*\*\///g; s/^\s*//; s/\s*$//; s/\s\s*/ /g' style.css > "$TEMP_DIR/style.min.css"
    fi
    
    if [ -f "game.js" ]; then
        # 简单的JS压缩（移除注释和空白）
        sed 's/\/\/.*$//; s/\/\*.*\*\///g; s/^\s*//; s/\s*$//; s/\s\s*/ /g' game.js > "$TEMP_DIR/game.min.js"
    fi
    
    # 创建README文件
    cat > "$TEMP_DIR/README.txt" << EOF
AI山海经手机网页版
部署时间: $(date)
版本: 1.0

文件说明:
- index.html: 游戏主页面
- assets/images/: 游戏图片资源
- assets/sounds/: 游戏音效资源
- style.min.css: 压缩的样式文件
- game.min.js: 压缩的游戏脚本

访问方式:
1. 通过浏览器访问服务器地址
2. 支持现代移动浏览器
3. 推荐使用Chrome、Safari或Firefox

技术支持:
- 纯HTML5 + CSS3 + JavaScript
- 响应式设计
- 触摸控制支持
EOF
    
    log_success "文件优化完成"
}

# 部署到NAS
deploy_to_nas() {
    local NAS_USER_HOST=$1
    
    if [ -z "$NAS_USER_HOST" ]; then
        log_error "请提供NAS地址，格式: user@ip"
        echo "使用方法: $0 [nas-user]@[nas-ip]"
        exit 1
    fi
    
    log_info "部署到NAS: $NAS_USER_HOST"
    
    # 检查SSH连接
    log_info "测试SSH连接..."
    if ! ssh -o ConnectTimeout=5 "$NAS_USER_HOST" "echo 'SSH连接成功'"; then
        log_error "无法连接到NAS，请检查地址和网络"
        exit 1
    fi
    
    # 创建远程目录
    log_info "创建远程目录..."
    ssh "$NAS_USER_HOST" "
        sudo mkdir -p /var/www/ai-shanhaijing
        sudo chown -R www-data:www-data /var/www/ai-shanhaijing
        sudo chmod -R 755 /var/www/ai-shanhaijing
    "
    
    # 同步文件
    log_info "同步文件到NAS..."
    rsync -avz --progress "$TEMP_DIR/" "$NAS_USER_HOST:/var/www/ai-shanhaijing/"
    
    # 设置权限
    log_info "设置文件权限..."
    ssh "$NAS_USER_HOST" "
        sudo chown -R www-data:www-data /var/www/ai-shanhaijing
        sudo chmod -R 755 /var/www/ai-shanhaijing
        sudo find /var/www/ai-shanhaijing -type f -exec chmod 644 {} \;
    "
    
    log_success "文件同步完成"
}

# 配置Web服务器
configure_webserver() {
    local NAS_USER_HOST=$1
    
    log_info "配置Web服务器..."
    
    # 上传Caddy配置
    scp Caddyfile "$NAS_USER_HOST:/tmp/"
    
    # 安装和配置Caddy
    ssh "$NAS_USER_HOST" "
        # 检查Caddy是否已安装
        if ! command -v caddy &> /dev/null; then
            echo '安装Caddy...'
            # 检测系统类型
            if [ -f /etc/debian_version ]; then
                # Debian/Ubuntu
                sudo apt update
                sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
                sudo apt update
                sudo apt install -y caddy
            elif [ -f /etc/redhat-release ]; then
                # CentOS/RHEL/Fedora
                sudo dnf install -y 'dnf-command(copr)'
                sudo dnf copr enable -y @caddy/caddy
                sudo dnf install -y caddy
            else
                echo '不支持的系统，请手动安装Caddy'
                exit 1
            fi
        fi
        
        # 配置Caddy
        sudo mkdir -p /etc/caddy
        sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile
        sudo chown root:root /etc/caddy/Caddyfile
        sudo chmod 644 /etc/caddy/Caddyfile
        
        # 创建日志目录
        sudo mkdir -p /var/log/caddy
        sudo chown caddy:caddy /var/log/caddy
        
        # 启动Caddy
        sudo systemctl enable caddy
        sudo systemctl start caddy
        sudo systemctl reload caddy
        
        echo 'Caddy配置完成'
    "
    
    log_success "Web服务器配置完成"
}

# 显示访问信息
show_access_info() {
    local NAS_USER_HOST=$1
    local NAS_IP=$(echo "$NAS_USER_HOST" | cut -d'@' -f2)
    
    log_success "部署完成！"
    echo
    echo "========================================"
    echo "🎮 AI山海经手机版访问信息"
    echo "========================================"
    echo "📱 访问地址:"
    echo "   http://$NAS_IP"
    echo "   https://$NAS_IP (如果配置了SSL)"
    echo
    echo "🔧 管理命令:"
    echo "   查看Caddy状态: ssh $NAS_USER_HOST 'sudo systemctl status caddy'"
    echo "   查看访问日志: ssh $NAS_USER_HOST 'tail -f /var/log/caddy/ai-shanhaijing-access.log'"
    echo "   重启Caddy: ssh $NAS_USER_HOST 'sudo systemctl restart caddy'"
    echo
    echo "📁 文件位置:"
    echo "   网站文件: /var/www/ai-shanhaijing"
    echo "   Caddy配置: /etc/caddy/Caddyfile"
    echo "   日志文件: /var/log/caddy/"
    echo
    echo "🛠️ 故障排除:"
    echo "   1. 检查防火墙: sudo ufw status"
    echo "   2. 检查端口: sudo netstat -tulpn | grep :80"
    echo "   3. 查看Caddy日志: sudo journalctl -u caddy -f"
    echo "========================================"
}

# 主函数
main() {
    echo "========================================"
    echo "🚀 AI山海经手机版自动部署脚本"
    echo "========================================"
    echo
    
    # 检查参数
    if [ $# -eq 0 ]; then
        log_error "请提供NAS地址"
        echo "使用方法: $0 [nas-user]@[nas-ip]"
        echo "示例: $0 admin@192.168.1.100"
        exit 1
    fi
    
    NAS_USER_HOST=$1
    
    # 执行部署步骤
    check_dependencies
    optimize_files
    deploy_to_nas "$NAS_USER_HOST"
    
    # 询问是否配置Web服务器
    echo
    read -p "是否自动配置Web服务器? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_webserver "$NAS_USER_HOST"
    else
        log_info "跳过Web服务器配置"
        log_info "请手动配置Web服务器指向目录: /var/www/ai-shanhaijing"
    fi
    
    # 清理临时文件
    rm -rf deploy_temp
    
    show_access_info "$NAS_USER_HOST"
}

# 运行主函数
main "$@"