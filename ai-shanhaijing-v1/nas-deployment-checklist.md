# AI山海经 NAS部署检查清单

## 部署前准备

### 系统环境检查
- [ ] NAS系统为飞牛OS (基于Linux)
- [ ] NAS有固定IP地址或配置了DDNS
- [ ] NAS可以通过SSH远程访问
- [ ] 确认NAS有足够的存储空间 (至少100MB)
- [ ] 检查NAS网络连接正常

### 权限和访问
- [ ] 具有NAS的管理员权限或sudo权限
- [ ] 可以安装软件包 (Caddy/Nginx)
- [ ] 可以修改系统配置文件
- [ ] 可以配置防火墙规则

### 工具准备
- [ ] Mac终端可以访问 (用于文件传输)
- [ ] SCP/SFTP客户端可用
- [ ] 文本编辑器 (用于修改配置文件)

## 第一步: 文件准备和传输

### 本地文件准备
- [ ] 进入项目目录: `cd /Users/mac/plan-optimizer/ai-shanhaijing`
- [ ] 检查所有必需文件存在:
  - [ ] `index.html` (主游戏文件)
  - [ ] `style.css` (样式文件)
  - [ ] `game.js` (游戏主逻辑)
  - [ ] `save-manager.js` (存档系统)
  - [ ] `equipment-system.js` (装备系统)
  - [ ] `audio-manager.js` (音效系统)
  - [ ] `assets/` 文件夹包含:
    - [ ] `images/` 文件夹:
      - [ ] `木棒人.png`
      - [ ] `耐克鲨鱼.png`
      - [ ] `咖啡忍者.png`
      - [ ] `冰箱骆驼.png`
    - [ ] `sounds/` 文件夹:
      - [ ] `木棒人.m4a`
      - [ ] `耐克鲨鱼.m4a`
      - [ ] `咖啡忍者.m4a`

### 打包文件
- [ ] 创建部署包: `tar -czf ai-shanhaijing-deploy.tar.gz [文件列表]`
- [ ] 验证tar.gz文件创建成功
- [ ] 记录文件大小 (应该小于50MB)

### 传输文件到NAS
- [ ] 确认NAS的IP地址: `[记录NAS_IP]`
- [ ] 确认NAS用户名: `[记录NAS_USER]`
- [ ] 使用SCP传输: `scp ai-shanhaijing-deploy.tar.gz user@nas_ip:/home/user/`
- [ ] 验证文件传输成功 (检查文件大小匹配)

## 第二步: NAS系统配置

### SSH连接到NAS
- [ ] SSH连接: `ssh user@nas_ip`
- [ ] 成功登录到NAS系统
- [ ] 检查当前用户权限: `whoami` 和 `sudo -l`

### 创建网站目录
- [ ] 创建网站根目录: `sudo mkdir -p /var/www/ai-shanhaijing`
- [ ] 解压文件: `tar -xzf ai-shanhaijing-deploy.tar.gz`
- [ ] 移动文件: `sudo mv ai-shanhaijing/* /var/www/ai-shanhaijing/`
- [ ] 设置正确权限:
  - [ ] `sudo chown -R www-data:www-data /var/www/ai-shanhaijing`
  - [ ] `sudo chmod -R 755 /var/www/ai-shanhaijing`
- [ ] 验证文件结构: `ls -la /var/www/ai-shanhaijing/`

### 检查Web服务器
选择并安装一个Web服务器:

#### 选项A: Caddy (推荐)
- [ ] 安装Caddy: `curl -sS https://webinstall.dev/caddy | bash`
- [ ] 创建配置目录: `sudo mkdir -p /etc/caddy`
- [ ] 创建Caddyfile: `sudo nano /etc/caddy/Caddyfile`
- [ ] 配置域名: `[记录您的域名]`
- [ ] 启动Caddy: `sudo systemctl enable --now caddy`
- [ ] 检查状态: `sudo systemctl status caddy`

#### 选项B: Nginx
- [ ] 安装Nginx: `sudo apt install nginx` 或使用系统包管理器
- [ ] 创建站点配置: `sudo nano /etc/nginx/sites-available/ai-shanhaijing`
- [ ] 启用站点: `sudo ln -s /etc/nginx/sites-available/ai-shanhaijing /etc/nginx/sites-enabled/`
- [ ] 测试配置: `sudo nginx -t`
- [ ] 重启Nginx: `sudo systemctl restart nginx`

## 第三步: 网络配置

### 防火墙配置
- [ ] 开放HTTP端口 (80):
  - 使用ufw: `sudo ufw allow 80/tcp`
  - 或使用firewalld: `sudo firewall-cmd --permanent --add-service=http`
- [ ] 开放HTTPS端口 (443):
  - 使用ufw: `sudo ufw allow 443/tcp`
  - 或使用firewalld: `sudo firewall-cmd --permanent --add-service=https`
- [ ] 重新加载防火墙: `sudo ufw reload` 或 `sudo firewall-cmd --reload`

### 路由器配置
- [ ] 登录路由器管理界面
- [ ] 找到端口转发/虚拟服务器设置
- [ ] 添加端口转发规则:
  - **外部端口**: 80
  - **内部端口**: 80
  - **内部IP**: NAS的局域网IP
  - **协议**: TCP
  - **规则名称**: AI_ShanHaiJing_HTTP
- [ ] 添加HTTPS转发规则:
  - **外部端口**: 443
  - **内部端口**: 443
  - **内部IP**: NAS的局域网IP
  - **协议**: TCP
  - **规则名称**: AI_ShanHaiJing_HTTPS

### 域名配置 (如需要)
- [ ] 注册DDNS域名 (如DuckDNS, No-IP等)
- [ ] 配置DDNS客户端指向您的动态IP
- [ ] 等待DNS传播完成 (通常5-15分钟)

## 第四步: 功能测试

### 本地网络测试
- [ ] 局域网访问: `http://[NAS局域网IP]`
- [ ] 页面正常加载
- [ ] 角色卡片显示正确
- [ ] 图片资源加载正常
- [ ] 音效文件能播放

### 互联网访问测试
- [ ] 外部访问: `http://[您的域名或公网IP]`
- [ ] HTTPS访问: `https://[您的域名]` (如果使用Caddy)
- [ ] 检查所有功能正常:
  - [ ] 角色选择功能
  - [ ] 游戏启动功能
  - [ ] 音效播放功能
  - [ ] 存档功能
  - [ ] 装备系统

### 移动设备测试
- [ ] 手机浏览器访问
- [ ] 触摸操作正常
- [ ] 响应式布局正常
- [ ] 音效在移动设备上播放

## 第五步: 维护设置

### 日志配置
- [ ] 创建日志目录: `sudo mkdir -p /var/log/ai-shanhaijing`
- [ ] 配置Web服务器日志
- [ ] 测试日志写入正常

### 备份设置
- [ ] 创建备份脚本: `/usr/local/bin/backup-ai-shanhaijing.sh`
- [ ] 设置脚本权限: `sudo chmod +x /usr/local/bin/backup-ai-shanhaijing.sh`
- [ ] 创建备份目录: `sudo mkdir -p /backup/ai-shanhaijing`
- [ ] 测试备份脚本运行正常
- [ ] 设置定时任务:
  - [ ] 编辑crontab: `sudo crontab -e`
  - [ ] 添加备份任务: `0 2 * * * /usr/local/bin/backup-ai-shanhaijing.sh`
  - [ ] 验证crontab保存成功

### 监控设置
- [ ] 配置磁盘空间监控
- [ ] 设置服务运行状态检查
- [ ] 配置日志文件轮转

## 部署完成确认

### 最终检查清单
- [ ] 游戏可以通过互联网访问
- [ ] 所有功能正常工作
- [ ] HTTPS证书有效 (如果使用HTTPS)
- [ ] 备份系统正常运行
- [ ] 日志记录正常
- [ ] 防火墙规则正确
- [ ] 端口转发正常工作

### 性能验证
- [ ] 页面加载速度 < 3秒
- [ ] 图片和音效文件加载正常
- [ ] 游戏运行流畅无卡顿
- [ ] 内存使用合理

### 安全验证
- [ ] 目录列表已禁用
- [ ] 敏感文件不可访问
- [ ] HTTPS强制跳转工作
- [ ] 文件权限设置正确

## 故障排除记录

### 常见问题检查
- [ ] 音效文件无法播放
  - [ ] 检查文件路径
  - [ ] 验证MIME类型配置
  - [ ] 确认文件权限
- [ ] 存档功能不工作
  - [ ] 检查HTTPS访问
  - [ ] 验证localStorage可用性
- [ ] 页面404错误
  - [ ] 检查Web服务器配置
  - [ ] 验证文件存在
- [ ] 性能问题
  - [ ] 启用压缩
  - [ ] 配置缓存

## 部署成功！

### 后续维护任务
- [ ] 定期检查日志文件
- [ ] 验证备份文件创建
- [ ] 监控磁盘空间使用
- [ ] 保持系统更新
- [ ] 定期测试所有功能

### 文档保存
- [ ] 保存部署配置副本
- [ ] 记录重要密码和密钥
- [ ] 保存管理员联系信息

---

*请逐步完成以上项目，并在完成后勾选对应项。遇到问题时请查阅deploy-to-nas.md文档或联系技术支持。*