#!/bin/bash

# Deploy Matt's Book Organizer Frontend to Netlify
# This script prepares the monorepo for Netlify deployment

set -e

echo "🚀 Preparing Matt's Book Organizer for Netlify deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    echo "   (where main.py and frontend/ directory are located)"
    exit 1
fi

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "❌ This is not a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git remote add origin https://github.com/dpaq7/Matts_Book_Organizer.git"
    exit 1
fi

echo "📦 Adding files to git..."
git add .

echo "💾 Creating commit with frontend..."
git commit -m "Add SvelteKit frontend for Netlify deployment

Features added:
- 📱 Complete SvelteKit frontend with TypeScript
- 🎨 Dark/light theme toggle with TailwindCSS  
- 📚 Full book management (add, edit, delete, search)
- 📊 Rich statistics dashboard with BEq calculations
- 🔍 Advanced search and filtering
- 📱 Mobile-responsive design
- ⚡ Optimized for Netlify deployment from subdirectory

Deployment structure:
- Backend: Continue deploying to Render from root
- Frontend: Deploy to Netlify from frontend/ subdirectory
- Configuration: netlify.toml handles subdirectory build

Ready for production! 🎉"

echo "⬆️ Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Repository updated successfully!"
echo "🔗 GitHub: https://github.com/dpaq7/Matts_Book_Organizer"
echo ""
echo "🚀 Next steps for Netlify deployment:"
echo ""
echo "1. 🌐 Go to netlify.com and sign up/login"
echo "2. 🔗 Click 'New site from Git'"  
echo "3. 📂 Connect your GitHub account"
echo "4. 📋 Select 'Matts_Book_Organizer' repository"
echo "5. ⚙️  Build settings (auto-detected from netlify.toml):"
echo "   - Base directory: frontend/"
echo "   - Build command: npm run build"
echo "   - Publish directory: frontend/build"
echo "6. 🔧 Add environment variable:"
echo "   - Name: VITE_API_URL"
echo "   - Value: https://your-backend-app.onrender.com"
echo "7. 🚀 Click 'Deploy site'"
echo ""
echo "⏱️  Deployment takes 2-3 minutes"
echo "🎉 Your book organizer will be live at: https://your-site.netlify.app"
echo ""
echo "💡 Pro tip: Update the API URL in step 6 with your actual Render backend URL!"