"""
Startup script for Render deployment - handles initial data import
"""
import os
import json
from pathlib import Path

def setup_database():
    """Initialize database and import data if needed"""
    from database import SessionLocal, engine
    from models import Base, Book
    from migrate_goodreads import migrate_goodreads_data
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Check if we need to import data
    db = SessionLocal()
    try:
        book_count = db.query(Book).count()
        if book_count == 0:
            print("Database is empty, checking for Goodreads export...")
            
            # Look for Goodreads export file
            goodreads_file = Path("Goodreads Library Export.json")
            if goodreads_file.exists():
                print(f"Found {goodreads_file}, importing data...")
                success = migrate_goodreads_data(str(goodreads_file))
                if success:
                    print("✅ Data import completed successfully!")
                else:
                    print("❌ Data import failed")
            else:
                print("No Goodreads export found, starting with empty database")
        else:
            print(f"Database already has {book_count} books")
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()