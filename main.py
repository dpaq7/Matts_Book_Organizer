"""
Matt's Book Organizer - FastAPI Backend
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import get_db, engine
from models import Base
from schemas import BookResponse, BookCreate, BookUpdate, BulkImportRequest, ReadingStatsResponse
from crud import get_books, get_book, create_book, update_book, delete_book, bulk_create_books

# Initialize database on startup
try:
    from startup import setup_database
    setup_database()
except Exception as e:
    print(f"Startup initialization failed: {e}")
    # Create tables as fallback
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Book Organizer API",
    description="A fast API for managing and organizing your book collection",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Matt's Book Organizer API"}

@app.get("/books", response_model=List[BookResponse])
def read_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    shelf: Optional[str] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    db: Session = Depends(get_db)
):
    """Get books with filtering and pagination"""
    return get_books(db, skip=skip, limit=limit, search=search, shelf=shelf, rating=rating)

@app.get("/books/{book_id}", response_model=BookResponse)
def read_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = get_book(db, book_id=book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@app.post("/books", response_model=BookResponse)
def create_new_book(book: BookCreate, db: Session = Depends(get_db)):
    """Create a new book"""
    return create_book(db=db, book=book)

@app.put("/books/{book_id}", response_model=BookResponse)
def update_existing_book(book_id: int, book: BookUpdate, db: Session = Depends(get_db)):
    """Update an existing book"""
    updated_book = update_book(db=db, book_id=book_id, book=book)
    if updated_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return updated_book

@app.delete("/books/{book_id}")
def delete_existing_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book"""
    success = delete_book(db=db, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book deleted successfully"}

@app.post("/books/import")
def import_books(import_request: BulkImportRequest, db: Session = Depends(get_db)):
    """Bulk import books from JSON data"""
    try:
        imported_books = bulk_create_books(
            db=db, 
            books=import_request.books, 
            update_existing=import_request.update_existing
        )
        return {
            "message": f"Successfully imported {len(imported_books)} books",
            "imported_count": len(imported_books)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/stats", response_model=ReadingStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Get reading statistics"""
    from crud import get_reading_stats
    return get_reading_stats(db)

@app.post("/stats/update")
def update_stats(db: Session = Depends(get_db)):
    """Manually update reading statistics and BEq calculations"""
    from crud import update_reading_stats
    update_reading_stats(db)
    return {"message": "Statistics updated successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)