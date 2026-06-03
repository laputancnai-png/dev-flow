#!/bin/bash

# DevFlow 一键启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 正在启动 DevFlow..."

# 1. 启动后端 (Port: 3000)
echo "📦 正在启动后端服务 (localhost:3000)..."
cd backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!

# 2. 启动前端 (Port: 6171)
echo "💻 正在启动前端服务 (localhost:6171)..."
cd ../frontend
# 使用 --port 强制指定 6171 端口
npm run dev -- --port 6171 > /dev/null 2>&1 &
FRONTEND_PID=$!

# 检查服务是否启动
sleep 2
echo ""
echo "✅ DevFlow 已启动！"
echo "🌐 前端地址: http://localhost:6171"
echo "🔗 后端 API: http://localhost:3000/v1"
echo ""
echo "输入 Ctrl+C 可以停止所有服务。"

# 捕获退出信号，清理后台进程
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 保持脚本运行，等待进程
wait
