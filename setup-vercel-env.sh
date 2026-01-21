#!/bin/bash

# Setup Vercel Environment Variables
# This script removes all existing variables and adds the correct ones

set -e

echo "🚀 Setting up Vercel Environment Variables"
echo ""

# Check if logged in to Vercel
if ! npx vercel whoami &>/dev/null; then
    echo "❌ Not logged in to Vercel. Please run: npx vercel login"
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Link to project (if not already linked)
echo "🔗 Linking to Vercel project..."
npx vercel link --yes

echo ""
echo "📋 Current environment variables:"
npx vercel env ls

echo ""
read -p "⚠️  Do you want to REMOVE ALL existing variables? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing all existing environment variables..."
    
    # Get list of all environment variable names
    ENV_NAMES=$(npx vercel env ls --json 2>/dev/null | jq -r '.[].key' 2>/dev/null || echo "")
    
    if [ -n "$ENV_NAMES" ]; then
        for ENV_NAME in $ENV_NAMES; do
            echo "  Removing: $ENV_NAME"
            echo "y" | npx vercel env rm "$ENV_NAME" production 2>/dev/null || true
            echo "y" | npx vercel env rm "$ENV_NAME" preview 2>/dev/null || true
            echo "y" | npx vercel env rm "$ENV_NAME" development 2>/dev/null || true
        done
        echo "✅ All variables removed"
    else
        echo "ℹ️  No variables to remove"
    fi
else
    echo "⏭️  Skipping removal"
fi

echo ""
echo "➕ Adding new environment variables..."

# Add NEXT_PUBLIC_API_URL
echo "  Adding: NEXT_PUBLIC_API_URL"
echo "https://www.aceinterview.online/api" | npx vercel env add NEXT_PUBLIC_API_URL production

# Add NEXT_STATIC_EXPORT
echo "  Adding: NEXT_STATIC_EXPORT"
echo "true" | npx vercel env add NEXT_STATIC_EXPORT production

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📋 Final environment variables:"
npx vercel env ls

echo ""
echo "🎉 Done! Your Vercel environment is ready."
echo ""
echo "Next steps:"
echo "  1. Deploy: npx vercel --prod"
echo "  2. Or push to GitHub and Vercel will auto-deploy"
