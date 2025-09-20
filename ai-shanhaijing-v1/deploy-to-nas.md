# AI山海经 NAS部署指南

## 项目概述

AI山海经是一个基于HTML5 + CSS3 + JavaScript的2D RPG游戏，具有以下特性：
- 纯前端游戏，无需后端数据库
- 包含存档系统、装备系统、音效系统
- 支持本地存储和音效播放
- 响应式设计，支持移动设备

## 部署环境要求

### NAS系统要求
- **系统**: 飞牛OS (基于Linux)
- **Web服务器**: Nginx/Apache/Caddy (推荐Caddy，自动HTTPS)
- **Node.js**: 可选 (用于简单HTTP服务器)
- **存储空间**: 至少100MB

### 网络要求
- 固定IP地址或DDNS域名
- 端口转发: 80 (HTTP) 和 443 (HTTPS)
- 防火墙允许Web访问

## 部署步骤

### 第一步: 准备文件

#### 1.1 复制项目文件
在本地Mac上打包项目文件：

```bash
# 进入项目目录
cd /Users/mac/plan-optimizer/ai-shanhaijing

# 创建部署包
tar -czf ai-shanhaijing-deploy.tar.gz \
    index.html \
    style.css \
    game.js \
    save-manager.js \
    equipment-system.js \
    audio-manager.js \
    assets/ \
    *.command \
    *.md
```

#### 1.2 文件清单
```
ai-shanhaijing/
├── index.html              # 主游戏文件
├── style.css              # 样式文件
├── game.js                # 游戏主逻辑
├── save-manager.js        # 存档系统
├── equipment-system.js    # 装备系统
├── audio-manager.js       # 音效系统
├── assets/                # 资源文件夹
│   ├── images/           # 角色图片
│   │   ├── 木棒人.png
│   │   ├── 耐克鲨鱼.png
│   │   ├── 咖啡忍者.png
│   │   └── 冰箱骆驼.png
│   └── sounds/           # 音效文件
│       ├── 木棒人.m4a
│       ├── 耐克鲨鱼.m4a
│       └── 咖啡忍者.m4a
├── start-server.command   # 开发服务器启动脚本
└── README.md             # 项目说明
```

### 第二步: NAS文件传输

#### 2.1 使用SCP传输文件
```bash
# 在Mac终端执行 (请替换nas_ip为您的NAS IP地址)
scp ai-shanhaijing-deploy.tar.gz user@nas_ip:/home/user/

# 或者使用SFTP
sftp user@nas_ip
put ai-shanhaijing-deploy.tar.gz
```

#### 2.2 在NAS上解压文件
```bash
# SSH连接到NAS
ssh user@nas_ip

# 解压文件
tar -xzf ai-shanhaijing-deploy.tar.gz

# 创建网站目录
sudo mkdir -p /var/www/ai-shanhaijing

# 移动文件到网站目录
sudo mv ai-shanhaijing/* /var/www/ai-shanhaijing/

# 设置权限
sudo chown -R www-data:www-data /var/www/ai-shanhaijing
sudo chmod -R 755 /var/www/ai-shanhaijing
```

### 第三步: 配置Web服务器

#### 3.1 使用Caddy (推荐)
Caddy自动配置HTTPS，适合新手。

```bash
# 安装Caddy (如果未安装)
curl -sS https://webinstall.dev/caddy | bash

# 创建Caddy配置
sudo nano /etc/caddy/Caddyfile
```

添加以下配置：
```
ai-shanhaijing.your-domain.com {
    root * /var/www/ai-shanhaijing
    file_server
    encode zstd gzip
    handle /assets/* {
        file_server
    }
    handle {
        try_files {path} /index.html
    }

    # 日志配置
    log {
        output file /var/log/caddy/ai-shanhaijing.log
    }
}
```

启动Caddy：
```bash
# 启动Caddy服务
sudo systemctl enable --now caddy
```

#### 3.2 使用Nginx
如果您的NAS已安装Nginx：

```bash
# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/ai-shanhaijing
```

添加配置：
```nginx
server {
    listen 80;
    server_name ai-shanhaijing.your-domain.com;
    root /var/www/ai-shanhaijing;
    index index.html;

    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|m4a)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

启用配置：
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/ai-shanhaijing /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx
```

### 第四步: 配置域名和DDNS

#### 4.1 配置DDNS (如果没有固定IP)
推荐使用免费DDNS服务：
- DuckDNS (https://duckdns.org)
- No-IP (https://noip.com)

#### 4.2 配置路由器端口转发
在路由器管理界面设置：
- **外部端口**: 80, 443
- **内部IP**: NAS的局域网IP地址
- **内部端口**: 80, 443

### 第五步: 防火墙配置

```bash
# 在NAS上开放HTTP/HTTPS端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 或者使用firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 访问和测试

### 访问游戏
通过以下地址访问游戏：
- 本地访问: http://nas-local-ip
- 互联网访问: http://your-domain.com

### 功能测试清单
- [ ] 页面正常加载
- [ ] 角色卡片显示正常
- [ ] 音效文件能播放
- [ ] 存档功能正常
- [ ] 装备系统正常
- [ ] 移动设备适配

## 维护和监控

### 日志检查
```bash
# Caddy日志
tail -f /var/log/caddy/ai-shanhaijing.log

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 备份脚本
创建自动备份脚本 `/usr/local/bin/backup-ai-shanhaijing.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup/ai-shanhaijing"
DATE=$(date +%Y%m%d_%H%M%S)
WEB_DIR="/var/www/ai-shanhaijing"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份网站文件
tar -czf $BACKUP_DIR/ai-shanhaijing_$DATE.tar.gz -C $WEB_DIR .

# 保留最近7天的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: ai-shanhaijing_$DATE.tar.gz"
```

设置定时任务：
```bash
# 编辑crontab
sudo crontab -e

# 添加每日备份任务 (每天凌晨2点)
0 2 * * * /usr/local/bin/backup-ai-shanhaijing.sh
```

## 故障排除

### 常见问题

#### 1. 音效文件无法播放
**问题**: 浏览器控制台显示音效加载失败
**解决**:
- 检查文件权限
- 确认MIME类型配置
- 检查跨域设置

#### 2. 存档功能不工作
**问题**: 游戏存档无法保存
**解决**:
- 检查localStorage可用性
- 确认HTTPS访问 (HTTP可能有限制)

#### 3. 页面404错误
**问题**: 某些页面无法访问
**解决**:
- 检查文件路径
- 确认Web服务器配置
- 检查文件权限

#### 4. 性能问题
**问题**: 游戏运行缓慢
**解决**:
- 启用gzip压缩
- 配置浏览器缓存
- 优化图片大小

### 性能优化建议

1. **启用压缩**: 在Web服务器中启用gzip/zstd压缩
2. **缓存配置**: 设置静态文件的长期缓存
3. **CDN**: 考虑使用CDN加速静态资源
4. **图片优化**: 压缩图片文件大小

## 安全建议

1. **HTTPS强制**: 重定向HTTP到HTTPS
2. **目录保护**: 禁止目录列表
3. **文件权限**: 严格的文件权限设置
4. **定期更新**: 保持Web服务器和系统更新

## 联系支持

如果在部署过程中遇到问题，请：
1. 检查本文档的故障排除部分
2. 查看Web服务器错误日志
3. 确认网络连接和防火墙设置

---

*最后更新: 2025年9月*