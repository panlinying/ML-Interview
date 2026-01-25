#!/bin/bash
# Quick start script for local development

echo "🚀 Starting ML Interview Development Environment"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo "📝 Creating from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "⚡ Please edit .env.local with your actual values:"
    echo "   - DATABASE_URL (get from Neon or local PostgreSQL)"
    echo "   - JWT_SECRET (generate with: openssl rand -hex 32)"
    echo "   - ADMIN_SECRET (generate with: openssl rand -hex 32)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

echo "✅ Environment loaded"
echo ""

# Check if dependencies are installed
if [ ! -d "site/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd site && npm install && cd ..
fi

if [ ! -d ".venv" ]; then
    echo "🐍 Installing Python dependencies..."
    uv sync
fi

echo ""
echo "🎯 Starting services..."
echo ""
echo "Frontend: http://localhost:6090"
echo "Backend:  http://localhost:8090"
echo "API Docs: http://localhost:8090/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Unset these for local development
unset NEXT_PUBLIC_BASE_PATH
unset NEXT_STATIC_EXPORT

# Start both services in background
(cd site && PORT=6090 npm run dev) &
FRONTEND_PID=$!

uv run uvicorn api.index:app --reload --port 8090 &
BACKEND_PID=$!

# Wait for Ctrl+C
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT TERM

wait
