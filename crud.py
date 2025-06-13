"""
CRUD operations for the book organizer
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from models import Book, Shelf, ReadingStats
from schemas import BookCreate, BookUpdate, ShelfCreate

def get_books(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    shelf: Optional[str] = None,
    rating: Optional[int] = None
) -> List[Book]:
    """Get books with filtering and pagination"""
    query = db.query(Book)
    
    # Apply filters
    if search:
        search_filter = or_(
            Book.title.ilike(f"%{search}%"),
            Book.author.ilike(f"%{search}%"),
            Book.publisher.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if shelf:
        query = query.filter(Book.exclusive_shelf == shelf)
    
    if rating:
        query = query.filter(Book.rating == rating)
    
    return query.offset(skip).limit(limit).all()

def get_book(db: Session, book_id: int) -> Optional[Book]:
    """Get a single book by ID"""
    return db.query(Book).filter(Book.id == book_id).first()

def get_book_by_goodreads_id(db: Session, goodreads_id: int) -> Optional[Book]:
    """Get a book by Goodreads ID"""
    return db.query(Book).filter(Book.goodreads_id == goodreads_id).first()

def create_book(db: Session, book: BookCreate) -> Book:
    """Create a new book"""
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    # Update reading stats and BEq values
    update_reading_stats(db)
    
    return db_book

def update_book(db: Session, book_id: int, book: BookUpdate) -> Optional[Book]:
    """Update an existing book"""
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        return None
    
    # Update only provided fields
    update_data = book.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)
    
    db.commit()
    db.refresh(db_book)
    
    # Update reading stats if relevant fields changed
    if any(field in update_data for field in ['pages', 'date_read']):
        update_reading_stats(db)
    
    return db_book

def delete_book(db: Session, book_id: int) -> bool:
    """Delete a book"""
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        return False
    
    db.delete(db_book)
    db.commit()
    
    # Update reading stats
    update_reading_stats(db)
    
    return True

def bulk_create_books(db: Session, books: List[BookCreate], update_existing: bool = False) -> List[Book]:
    """Bulk create books from import"""
    created_books = []
    
    for book_data in books:
        # Check if book already exists by Goodreads ID
        existing_book = None
        if book_data.goodreads_id:
            existing_book = get_book_by_goodreads_id(db, book_data.goodreads_id)
        
        if existing_book and update_existing:
            # Update existing book
            update_data = book_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if value is not None:  # Only update non-null values
                    setattr(existing_book, field, value)
            created_books.append(existing_book)
        elif not existing_book:
            # Create new book
            db_book = Book(**book_data.model_dump())
            db.add(db_book)
            created_books.append(db_book)
    
    db.commit()
    
    # Update reading stats after bulk import
    update_reading_stats(db)
    
    return created_books

def get_or_create_shelf(db: Session, shelf_name: str) -> Shelf:
    """Get existing shelf or create new one"""
    shelf = db.query(Shelf).filter(Shelf.name == shelf_name).first()
    if not shelf:
        shelf = Shelf(name=shelf_name)
        db.add(shelf)
        db.commit()
        db.refresh(shelf)
    return shelf

def update_reading_stats(db: Session):
    """Update reading statistics and BEq calculations"""
    stats = db.query(ReadingStats).first()
    if not stats:
        stats = ReadingStats()
        db.add(stats)
    
    stats.update_stats(db)

def get_reading_stats(db: Session) -> ReadingStats:
    """Get current reading statistics"""
    stats = db.query(ReadingStats).first()
    if not stats:
        stats = ReadingStats()
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats