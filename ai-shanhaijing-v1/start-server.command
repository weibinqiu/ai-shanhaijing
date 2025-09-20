#!/bin/bash
echo "正在启动AI山海经游戏服务器..."
echo "服务器启动后，请在浏览器中访问: http://localhost:7777"
echo "按 Ctrl+C 停止服务器"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 7777