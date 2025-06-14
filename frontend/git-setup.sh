#!/bin/bash

# Frontend Git Setup Script for Netlify Deployment
# Usage: ./git-setup.sh <your-github-repo-url>

set -e

if [ $# -eq 0 ]; then
    echo "❌ Please provide your GitHub repository URL"
    echo "Usage: ./git-setup.sh https://github.com/yourusername/book-organizer-frontend.git"
    exit 1
fi

REPO_URL=$1

echo "🔧 Setting up Git repository for Book Organizer Frontend..."
echo "📍 Repository: $REPO_URL"
echo ""

# Initialize git repository
echo "📦 Initializing git repository..."
git init

# Add all files
echo "📁 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: SvelteKit frontend for Book Organizer

Features:
- 📚 Complete book management (CRUD operations)
- 🔍 Advanced search and filtering
- 📊 Reading statistics with BEq calculations
- 🎨 Dark/light theme toggle
- 📱 Mobile-responsive design
- 🚀 Optimized for Netlify deployment

Tech stack: SvelteKit + TypeScript + TailwindCSS"

# Set up remote and push
echo "🌐 Setting up remote repository..."
git branch -M main
git remote add origin $REPO_URL

echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Frontend successfully pushed to GitHub!"
echo "🔗 Repository: $REPO_URL"
echo ""
echo "🚀 Next steps:"
echo "1. Go to netlify.com and sign up/login"
echo "2. Click 'New site from Git'"
echo "3. Connect your GitHub account"
echo "4. Select the book-organizer-frontend repository"
echo "5. Build settings will auto-detect from netlify.toml"
echo "6. Add environment variable: VITE_API_URL=https://your-backend.onrender.com"
echo "7. Deploy and enjoy your live book organizer! 🎉"