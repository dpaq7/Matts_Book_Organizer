#!/bin/bash

echo "🔍 Git Debug Information"
echo "======================="
echo ""

echo "📁 Current working directory:"
pwd
echo ""

echo "📋 Git status:"
git status
echo ""

echo "📝 Files that have been modified but not staged:"
git diff --name-only
echo ""

echo "📦 Files that are staged but not committed:"
git diff --cached --name-only
echo ""

echo "🔄 Last few commits:"
git log --oneline -n 5
echo ""

echo "🌿 Current branch:"
git branch --show-current
echo ""

echo "📡 Remote information:"
git remote -v
echo ""

echo "🔍 Check if JavaScript files exist:"
echo "stores.js exists:" $([ -f "frontend/src/lib/stores.js" ] && echo "YES" || echo "NO")
echo "api.js exists:" $([ -f "frontend/src/lib/api.js" ] && echo "YES" || echo "NO")
echo "stores.ts exists:" $([ -f "frontend/src/lib/stores.ts" ] && echo "YES" || echo "NO")
echo "api.ts exists:" $([ -f "frontend/src/lib/api.ts" ] && echo "YES" || echo "NO")
echo ""

echo "🚀 To manually fix:"
echo "1. git add ."
echo "2. git commit -m 'Convert to JavaScript files'"
echo "3. git push origin main"