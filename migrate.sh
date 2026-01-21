#!/bin/bash

# Alembic migration helper script
# Automatically loads .env.local for DATABASE_URL

set -e

# Check for .env.local
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Please create it from .env.example"
  exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./migrate.sh [command]"
    echo ""
    echo "Commands:"
    echo "  create 'message'  - Create a new migration (auto-detects changes)"
    echo "  upgrade          - Apply all pending migrations"
    echo "  downgrade        - Rollback last migration"
    echo "  current          - Show current migration"
    echo "  history          - Show migration history"
    echo ""
    echo "Examples:"
    echo "  ./migrate.sh create 'add user streak columns'"
    echo "  ./migrate.sh upgrade"
    exit 0
fi

COMMAND=$1
shift

case "$COMMAND" in
    create)
        if [ -z "$1" ]; then
            echo "❌ Error: Migration message required"
            echo "Usage: ./migrate.sh create 'your message here'"
            exit 1
        fi
        echo "🔄 Creating migration: $1"
        uv run alembic revision --autogenerate -m "$1"
        echo "✅ Migration created! Review the file in alembic/versions/"
        ;;
    
    upgrade)
        echo "🔄 Applying migrations..."
        uv run alembic upgrade head
        echo "✅ Migrations applied!"
        ;;
    
    downgrade)
        echo "🔄 Rolling back last migration..."
        uv run alembic downgrade -1
        echo "✅ Rollback complete!"
        ;;
    
    current)
        echo "📍 Current migration:"
        uv run alembic current
        ;;
    
    history)
        echo "📜 Migration history:"
        uv run alembic history
        ;;
    
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Run ./migrate.sh for usage"
        exit 1
        ;;
esac
