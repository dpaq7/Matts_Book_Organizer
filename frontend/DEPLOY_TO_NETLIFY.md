# Deploy Frontend to Netlify

## Quick Deploy Steps

### Option 1: Drag & Drop Deploy (Fastest)

1. **Build the project**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com) and sign up/login
   - Drag the `build/` folder to the deploy area
   - Your site will be live in seconds!

3. **Update API URL**:
   - Go to Site Settings → Environment Variables
   - Add: `VITE_API_URL = https://your-backend.onrender.com`
   - Trigger a new deploy

### Option 2: GitHub Integration (Recommended for ongoing updates)

1. **Create GitHub repository**:
   ```bash
   # From the frontend directory
   git init
   git add .
   git commit -m "Initial frontend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/book-organizer-frontend.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select the frontend repository
   - Build settings will auto-detect from `netlify.toml`

3. **Configuration**:
   - **Build command**: `npm run build` (auto-detected)
   - **Publish directory**: `build` (auto-detected)
   - **Node version**: 18 (set in netlify.toml)

4. **Environment Variables** (in Netlify dashboard):
   ```
   VITE_API_URL = https://your-backend-app.onrender.com
   ```

5. **Deploy**: Click "Deploy site" - takes 2-3 minutes

## What You Need to Update

### 1. Backend URL
In your Netlify environment variables or netlify.toml, replace:
```
https://your-backend-app.onrender.com
```
With your actual Render backend URL.

### 2. Site Name (Optional)
In Netlify dashboard → Site Settings → Change site name to something memorable like:
- `matts-book-organizer`
- `my-book-library`
- `personal-book-tracker`

## Post-Deployment Checklist

✅ **Frontend deployed** at `https://your-site.netlify.app`  
✅ **API proxy working** - `/api/*` requests go to your backend  
✅ **Books loading** from your Render database  
✅ **Search/filter** working  
✅ **Dark/light mode** toggle functional  
✅ **Mobile responsive** design  
✅ **Statistics page** showing your reading data  

## Troubleshooting

### Books not loading?
- Check Network tab in browser dev tools
- Verify API URL in environment variables
- Make sure your Render backend is awake (first request may take 30s)

### Build failing?
- Check Node version (should be 18+)
- Run `npm install` and `npm run build` locally first
- Check build logs in Netlify dashboard

### Styling issues?
- Clear browser cache
- Check if CSS files are loading in dev tools

## Custom Domain (Optional)

1. **Buy domain** (Namecheap, Google Domains, etc.)
2. **In Netlify**: Site Settings → Domain Management → Add custom domain
3. **Configure DNS**: Point your domain to Netlify's servers
4. **SSL**: Netlify provides free HTTPS automatically

## Cost

- **Netlify**: Free for personal projects
- **Total**: $0/month for frontend hosting! 🎉

Your book organizer will be live and accessible from anywhere with your personal URL!