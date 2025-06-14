#!/bin/bash

echo "🔧 Fixing Netlify build issues and deploying..."
echo ""

# Show git status
echo "📋 Current git status:"
git status

echo ""
echo "🔍 Checking if files are staged:"
git diff --cached --name-only

echo ""
echo "📝 Files with changes:"
git diff --name-only

echo ""
echo "🚀 Commands to run:"
echo ""
echo "1. Add all changes:"
echo "   git add ."
echo ""
echo "2. Commit fixes:"
echo '   git commit -m "Fix Svelte import syntax for Netlify build"'
echo ""
echo "3. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "This will trigger a new Netlify build with the fixed import syntax."