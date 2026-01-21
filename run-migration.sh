#!/bin/bash

# Run database migrations with environment variables loaded

set -e

echo "🔄 Running database migrations..."

# Check for .env.local
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Please create it from .env.example"
  exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Run migrations
uv run python scripts/migrate.py

echo "✅ Migrations complete!"
