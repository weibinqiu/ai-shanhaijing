@echo off
chcp 65001 > nul
title AI山海经V2 开发服务器

echo 🚀 启动AI山海经V2开发服务器...
echo 📍 项目目录: %CD%
echo ⏰ 启动时间: %date% %time%

echo 🔍 检查Node.js版本...
node --version
echo 📦 Node.js版本检查完成

echo 🔍 检查npm版本...
npm --version
echo 📦 npm版本检查完成

echo 🧹 清理残留进程...
taskkill /f /im node.exe 2>nul

echo ⏳ 等待进程完全停止...
timeout /t 2 /nobreak > nul

if not exist "node_modules" (
    echo 📥 安装依赖...
    npm install
)

echo 🎯 启动开发服务器...
echo 💡 本地地址: http://localhost:3000/
echo 💡 按Ctrl+C停止服务器
echo.

npm run dev

pause