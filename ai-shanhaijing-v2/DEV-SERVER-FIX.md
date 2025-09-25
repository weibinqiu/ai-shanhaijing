# AI山海经V2 开发服务器问题解决方案

## 问题描述
开发服务器在页面刷新后容易出现崩溃或无法访问的情况。

## 解决方案

### 方案1：使用优化的启动脚本（推荐）

**Mac/Linux用户：**
```bash
./start-dev.sh
```

**Windows用户：**
```cmd
start-dev.bat
```

### 方案2：手动启动

1. 清理残留进程：
```bash
# Mac/Linux
pkill -f "vite"

# Windows
taskkill /f /im node.exe
```

2. 重新启动服务器：
```bash
npm run dev
```

### 方案3：使用配置优化

已优化的配置包括：
- 启用文件监听轮询（解决文件系统监听问题）
- 绑定到所有网络接口（提高网络稳定性）
- 严格端口模式（避免端口冲突）
- 启用CORS支持
- 优化热重载配置

## 配置详情

### vite.config.ts 优化
```typescript
server: {
  port: 3000,
  host: '0.0.0.0',
  open: true,
  watch: {
    usePolling: true,
    interval: 100
  },
  middlewareMode: false,
  cors: true,
  strictPort: true,
  hmr: {
    overlay: true,
    port: 3000
  }
}
```

## 故障排除

### 如果仍然遇到问题：

1. **检查端口占用：**
```bash
# Mac/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. **清理npm缓存：**
```bash
npm cache clean --force
```

3. **重新安装依赖：**
```bash
rm -rf node_modules package-lock.json
npm install
```

4. **更新Node.js版本：**
确保使用Node.js 20.19.0或更高版本

## 访问地址

- **本地访问：** http://localhost:3000/
- **网络访问：** http://your-ip:3000/
- **Vue DevTools：** http://localhost:3000/__devtools__/

## 注意事项

1. 首次运行前确保已安装所有依赖
2. 如果遇到权限问题，确保脚本有执行权限
3. 在公司网络环境下可能需要配置防火墙规则
4. 建议使用Chrome或Firefox浏览器进行测试

## 常见问题

**Q: 为什么页面刷新后服务器会崩溃？**
A: 这通常是由于文件系统监听机制问题，优化后的配置使用轮询模式解决。

**Q: 如何检查服务器是否正常运行？**
A: 查看控制台输出，应该显示"VITE v7.1.6 ready in X ms"和本地地址。

**Q: 可以在手机上访问吗？**
A: 可以，使用同一网络下的手机访问 http://your-ip:3000/