#!/bin/bash

# AI山海经手机版部署前检查脚本

echo "========================================"
echo "🔍 AI山海经手机版部署前检查"
echo "========================================"

# 检查文件是否存在
echo "📁 检查必要文件..."
required_files=(
    "index-mobile.html"
    "assets/images/木棒人.png"
    "assets/images/耐克鲨鱼.png"
    "assets/images/咖啡忍者.png"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    else
        echo "✅ $file"
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo
    echo "❌ 缺少以下文件:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

# 检查文件大小
echo
echo "📊 文件大小统计..."
total_size=$(du -sh . | cut -f1)
echo "总大小: $total_size"

# 检查图片文件
echo
echo "🖼️ 图片文件检查..."
find assets/images -name "*.png" -o -name "*.jpg" | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "   $file: $size"
done

# 检查是否有大文件（>1MB）
echo
echo "⚠️ 大文件检查..."
find . -type f -size +1M | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "   大文件: $file ($size)"
done

# 生成测试报告
echo
echo "📋 部署检查报告"
echo "========================================"
echo "✅ 所有必要文件存在"
echo "✅ 文件大小: $total_size"
echo "✅ 图片资源完整"
echo "✅ 移动端版本已准备"
echo
echo "🚀 准备就绪，可以运行部署脚本"
echo "   ./deploy.sh [user]@[nas-ip]"
echo "========================================"