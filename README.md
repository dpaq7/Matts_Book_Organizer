# Matt's Book Organizer

A fast, modern web application for organizing and managing your book collection. Built with FastAPI and SQLite, designed for self-hosting with Railway or Fly.io.

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

### Local Development

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd matts-book-organizer
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Import your Goodreads data**:
   ```bash
   python migrate_goodreads.py "your_goodreads_export.json"
   ```

3. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```

4. **Access the API**: http://localhost:8000/docs

### Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

### Deploy to Fly.io

1. **Install Fly CLI**: https://fly.io/docs/hands-on/install-flyctl/

2. **Deploy**:
   ```bash
   fly launch
   fly deploy
   ```

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

- **Backend**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Deployment**: Railway/Fly.io
- **Features**: Automatic API docs, type validation, async support

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