#!/bin/bash

# AI山海经V2 开发服务器启动脚本
# 解决页面刷新后服务器崩溃的问题

echo "🚀 启动AI山海经V2开发服务器..."
echo "📍 项目目录: $(pwd)"
echo "⏰ 启动时间: $(date)"

# 检查Node.js版本
echo "🔍 检查Node.js版本..."
node_version=$(node --version)
echo "📦 Node.js版本: $node_version"

# 检查npm版本
npm_version=$(npm --version)
echo "📦 npm版本: $npm_version"

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "vite" 2>/dev/null || true

# 等待进程完全停止
sleep 2

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo "💡 本地地址: http://localhost:3000/"
echo "💡 网络地址: http://$(hostname -I | awk '{print $1}'):3000/"
echo "⚡ 按Ctrl+C停止服务器"
echo ""

# 使用exec确保进程正确接收信号
exec npm run dev