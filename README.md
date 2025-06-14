# Matt's Book Organizer

A complete full-stack web application for organizing and managing your book collection. Built with FastAPI backend and SvelteKit frontend, designed for easy deployment and self-hosting.

## 🏗️ Architecture

This is a monorepo containing both backend and frontend:

```
Matt's-Book-Organizer/
├── 📁 backend/           # FastAPI + SQLite backend
│   ├── main.py          # API server
│   ├── requirements.txt # Python dependencies
│   └── ...
├── 📁 frontend/         # SvelteKit frontend
│   ├── src/             # Svelte components
│   ├── package.json     # Node.js dependencies
│   └── ...
├── netlify.toml         # Frontend deployment config
└── README.md           # This file
```

## 🚀 Live Demo

- **Frontend**: Deploy to Netlify (free)
- **Backend**: Deploy to Render (free with $5 credit)
- **Database**: SQLite with persistent storage

## Features

- 📚 **Complete Book Management**: Add, edit, delete, and organize your books
- 🔍 **Advanced Search & Filter**: Search by title, author, publisher, rating, shelf
- 📊 **Reading Statistics**: Track your reading habits with detailed analytics
- 📏 **Book Equivalent (BEq) Calculation**: Clever relative book size comparison
- 📱 **Mobile-Friendly**: Responsive design for access anywhere
- 🚀 **Fast Performance**: SQLite backend optimized for quick queries
- 📥 **Goodreads Import**: Easy migration from Goodreads exports

## Book Equivalent (BEq) Calculation

The BEq system provides a clever way to understand book sizes relative to your reading history:

- **Calculation**: `BEq = Current Book Pages / Your Average Pages Per Book`
- **Example**: If your average book is 425 pages and you're reading a 500-page book: `500/425 = 1.18 BEq`
- **Interpretation**: A 1.18 BEq book is 18% larger than your typical read

## Quick Start

### Backend Setup

1. **Setup backend**:
   ```bash
   # From project root
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Import your Goodreads data**:
   ```bash
   python migrate_goodreads.py "Goodreads Library Export.json"
   ```

3. **Start backend server**:
   ```bash
   uvicorn main:app --reload
   # API available at: http://localhost:8000
   ```

### Frontend Setup

1. **Setup frontend**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   # Frontend available at: http://localhost:5173
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 🚀 Deployment

### Backend (Render)

1. **Connect GitHub repo** to [Render](https://render.com)
2. **Auto-deploys** from `main` branch
3. **Environment**: Python detected automatically
4. **Database**: SQLite with persistent disk storage
5. **Import**: Goodreads data imported on first deploy

### Frontend (Netlify) 

1. **Connect GitHub repo** to [Netlify](https://netlify.com)
2. **Build settings**: Auto-detected from `netlify.toml`
   - Base directory: `frontend/`
   - Build command: `npm run build` 
   - Publish directory: `frontend/build`
3. **Environment variables**:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. **Custom domain**: Free HTTPS included

### Complete Deployment (5 minutes)

1. **Push this repo** to GitHub
2. **Deploy backend** to Render (connects to GitHub)
3. **Deploy frontend** to Netlify (connects to GitHub) 
4. **Update API URL** in Netlify environment variables
5. **Live app!** 🎉

## API Endpoints

### Books
- `GET /books` - List books with filtering and pagination
- `GET /books/{id}` - Get specific book
- `POST /books` - Create new book
- `PUT /books/{id}` - Update book
- `DELETE /books/{id}` - Delete book
- `POST /books/import` - Bulk import books

### Statistics
- `GET /stats` - Get reading statistics
- `POST /stats/update` - Refresh BEq calculations

## Database Schema

### Books Table
- Basic info: title, author, ISBN, pages, publisher
- Ratings: personal rating (1-5), Goodreads average
- Reading tracking: date read, read count, shelves
- BEq values: calculated relative size metrics

### Auto-calculated Fields
- **BEq Value**: Relative book size (e.g., 1.18)
- **BEq Percentage**: Display-friendly percentage (e.g., 118%)
- **Reading Statistics**: Total books, pages, averages

## Technology Stack

### Backend
- **FastAPI** (Python) - High-performance API framework
- **SQLite** - Embedded database with SQLAlchemy ORM
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server for production

### Frontend  
- **SvelteKit** - Modern meta-framework for fast web apps
- **TypeScript** - Type-safe JavaScript development
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool and dev server

### Deployment
- **Backend**: Render (free tier with persistent storage)
- **Frontend**: Netlify (free tier with global CDN)
- **Database**: SQLite file with automatic backups

## Configuration

### Environment Variables
- `DATABASE_URL`: SQLite database path (default: `sqlite:///./books.db`)

### Production Considerations
- SQLite handles thousands of books efficiently
- Automatic backups via Railway/Fly.io volume snapshots
- CORS configured for frontend integration
- Built-in API documentation at `/docs`

## Next Steps

After backend deployment, consider adding:
- **Frontend**: SvelteKit or Next.js interface
- **Authentication**: User accounts and book sharing
- **Advanced Features**: Reading goals, book recommendations
- **Integrations**: Goodreads sync, library catalogs

## Contributing

This is a personal project template. Feel free to fork and customize for your own book collection!