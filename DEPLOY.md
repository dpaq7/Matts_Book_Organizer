# Deploy to Render

## Quick Deploy Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Matt's Book Organizer"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**:
   - Go to [render.com](https://render.com) and sign up
   - Click "New Web Service"
   - Connect your GitHub repository
   - Select this repository

3. **Render will auto-detect**:
   - ✅ Python environment
   - ✅ Build command from `render.yaml`
   - ✅ Start command from `render.yaml`
   - ✅ Persistent disk for SQLite database

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your app will be live at: `https://your-app-name.onrender.com`

## Important Notes

- **First deploy**: Takes 5-10 minutes as it imports your Goodreads data
- **Database**: Persistent SQLite storage on 1GB disk
- **Free tier**: 750 hours/month (more than enough for personal use)
- **Cold starts**: 30-second wake up after 15 minutes of inactivity
- **HTTPS**: Automatic SSL certificate
- **Custom domain**: Available on free tier

## After Deployment

1. **Test your API**: `https://your-app.onrender.com/docs`
2. **Check logs**: Render dashboard shows import progress
3. **Access database**: Use the `/stats` endpoint to verify data

## File Structure for Render
```
├── render.yaml          # Render deployment config
├── requirements.txt     # Python dependencies  
├── main.py             # FastAPI application
├── startup.py          # Database initialization
├── Goodreads Library Export.json  # Your book data (auto-imported)
└── books.db            # SQLite database (created automatically)
```

## Troubleshooting

- **Import fails**: Check logs in Render dashboard
- **Database empty**: Ensure `Goodreads Library Export.json` is in root directory
- **Slow response**: First request after sleep takes 30 seconds (normal)

Your book organizer will be live and accessible from anywhere! 🚀