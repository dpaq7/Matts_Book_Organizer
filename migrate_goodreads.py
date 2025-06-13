"""
Migration script to import Goodreads JSON export
"""
import json
import sys
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Book, Shelf, ReadingStats
from crud import bulk_create_books, get_or_create_shelf
from schemas import BookCreate

def parse_goodreads_date(date_str: str) -> datetime:
    """Parse Goodreads date format (YYYY/MM/DD)"""
    if not date_str or date_str.strip() == "":
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y/%m/%d")
    except ValueError:
        try:
            # Try alternative format
            return datetime.strptime(date_str.strip(), "%Y-%m-%d")
        except ValueError:
            print(f"Warning: Could not parse date '{date_str}'")
            return None

def parse_beq_value(beq_data: Any) -> float:
    """Parse BEq value from Goodreads data"""
    if isinstance(beq_data, list) and len(beq_data) > 0:
        return float(beq_data[0])
    elif isinstance(beq_data, (int, float)):
        return float(beq_data)
    return None

def convert_goodreads_book(book_data: Dict[str, Any]) -> BookCreate:
    """Convert Goodreads book data to our BookCreate schema"""
    
    # Handle ISBN conversion
    isbn = str(book_data.get("ISBN", "")).strip() if book_data.get("ISBN") else None
    if isbn == "0" or isbn == "":
        isbn = None
    
    isbn13 = book_data.get("ISBN13")
    if isbn13:
        isbn13 = str(isbn13).strip()
        if isbn13 == "0" or isbn13 == "":
            isbn13 = None
    
    # Parse dates
    date_read = parse_goodreads_date(book_data.get("Date Read", ""))
    date_added = parse_goodreads_date(book_data.get("Date Added", ""))
    
    # Parse BEq value
    beq_value = parse_beq_value(book_data.get("BEq"))
    
    return BookCreate(
        goodreads_id=book_data.get("Book Id"),
        title=book_data.get("Title", "").strip(),
        author=book_data.get("Author", "").strip(),
        author_last_first=book_data.get("Author (By Last Name)", "").strip(),
        additional_authors=book_data.get("Additional Authors", "").strip() or None,
        isbn=isbn,
        isbn13=isbn13,
        publisher=book_data.get("Publisher", "").strip() or None,
        binding=book_data.get("Binding", "").strip() or None,
        pages=book_data.get("Pages") if book_data.get("Pages", 0) > 0 else None,
        edition_published=book_data.get("Edition Published") if book_data.get("Edition Published", 0) > 0 else None,
        original_published=book_data.get("Published") if book_data.get("Published", 0) > 0 else None,
        rating=book_data.get("Rating") if book_data.get("Rating", 0) > 0 else None,
        average_rating=book_data.get("Average Rating"),
        my_review=book_data.get("My Review", "").strip() or None,
        private_notes=book_data.get("Private Notes", "").strip() or None,
        spoiler=book_data.get("Spoiler", "").lower() == "true",
        date_read=date_read,
        read_count=book_data.get("Read Count", 0),
        owned_copies=book_data.get("Owned Copies", 0),
        exclusive_shelf=book_data.get("Exclusive Shelf", "").strip() or None
    )

def process_bookshelves(db: Session, book: Book, bookshelves_str: str):
    """Process and assign bookshelves to a book"""
    if not bookshelves_str or bookshelves_str.strip() == "":
        return
    
    # Parse bookshelves (comma-separated)
    shelf_names = [name.strip() for name in bookshelves_str.split(",")]
    
    for shelf_name in shelf_names:
        if shelf_name:
            shelf = get_or_create_shelf(db, shelf_name)
            if shelf not in book.shelves:
                book.shelves.append(shelf)

def migrate_goodreads_data(json_file_path: str, batch_size: int = 100):
    """Main migration function"""
    print(f"Starting migration from {json_file_path}")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Load JSON data
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            goodreads_data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return False
    
    if not isinstance(goodreads_data, list):
        print("Error: JSON file should contain a list of books")
        return False
    
    print(f"Found {len(goodreads_data)} books to import")
    
    db = SessionLocal()
    try:
        # Process books in batches
        total_imported = 0
        for i in range(0, len(goodreads_data), batch_size):
            batch = goodreads_data[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1} ({len(batch)} books)")
            
            # Convert to BookCreate objects
            books_to_create = []
            for book_data in batch:
                try:
                    book_create = convert_goodreads_book(book_data)
                    books_to_create.append((book_create, book_data))
                except Exception as e:
                    print(f"Error converting book '{book_data.get('Title', 'Unknown')}': {e}")
                    continue
            
            # Bulk create books
            if books_to_create:
                book_creates = [bc[0] for bc in books_to_create]
                created_books = bulk_create_books(db, book_creates, update_existing=True)
                
                # Process bookshelves for each created book
                for created_book, (_, original_data) in zip(created_books, books_to_create):
                    bookshelves_str = original_data.get("Bookshelves", "")
                    if bookshelves_str:
                        process_bookshelves(db, created_book, bookshelves_str)
                
                db.commit()
                total_imported += len(created_books)
                print(f"Imported {len(created_books)} books in this batch")
        
        # Final statistics update
        print("Updating reading statistics and BEq calculations...")
        stats = ReadingStats()
        db.add(stats)
        stats.update_stats(db)
        
        print(f"Migration completed! Total books imported: {total_imported}")
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python migrate_goodreads.py <goodreads_export.json>")
        sys.exit(1)
    
    json_file = sys.argv[1]
    success = migrate_goodreads_data(json_file)
    sys.exit(0 if success else 1)