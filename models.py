"""
SQLAlchemy database models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association table for many-to-many relationship between books and shelves
book_shelves = Table(
    'book_shelves',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True),
    Column('shelf_id', Integer, ForeignKey('shelves.id'), primary_key=True),
    Column('position', Integer)  # Position on shelf
)

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    goodreads_id = Column(Integer, unique=True, index=True, nullable=True)
    
    # Basic book info
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True, nullable=False)
    author_last_first = Column(String, index=True)
    additional_authors = Column(String)
    
    # ISBN and publishing info
    isbn = Column(String, index=True)
    isbn13 = Column(String, index=True)
    publisher = Column(String)
    binding = Column(String)
    pages = Column(Integer)
    edition_published = Column(Integer)
    original_published = Column(Integer)
    
    # Ratings and reviews
    rating = Column(Integer)  # User's rating (1-5)
    average_rating = Column(Float)  # Goodreads average
    my_review = Column(Text)
    private_notes = Column(Text)
    spoiler = Column(Boolean, default=False)
    
    # Reading tracking
    date_read = Column(DateTime)
    date_added = Column(DateTime, default=datetime.utcnow)
    read_count = Column(Integer, default=0)
    owned_copies = Column(Integer, default=0)
    exclusive_shelf = Column(String, index=True)  # read, currently-reading, to-read
    
    # Book Equivalent calculation
    beq_value = Column(Float)  # Calculated BEq value
    beq_percentage = Column(Float)  # BEq as percentage for display
    
    # Relationships
    shelves = relationship("Shelf", secondary=book_shelves, back_populates="books")
    
    def calculate_beq(self, avg_pages: float) -> float:
        """Calculate Book Equivalent value"""
        if self.pages and avg_pages > 0:
            self.beq_value = round(self.pages / avg_pages, 2)
            self.beq_percentage = round(self.beq_value * 100, 0)
            return self.beq_value
        return 1.0

class Shelf(Base):
    __tablename__ = "shelves"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    books = relationship("Book", secondary=book_shelves, back_populates="shelves")

class ReadingStats(Base):
    __tablename__ = "reading_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    total_books_read = Column(Integer, default=0)
    total_pages_read = Column(Integer, default=0)
    average_pages_per_book = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def update_stats(self, session):
        """Recalculate reading statistics"""
        from sqlalchemy import func
        
        # Get stats for books that have been read (have date_read)
        stats = session.query(
            func.count(Book.id).label('total_books'),
            func.sum(Book.pages).label('total_pages'),
            func.avg(Book.pages).label('avg_pages')
        ).filter(
            Book.date_read.isnot(None),
            Book.pages.isnot(None),
            Book.pages > 0
        ).first()
        
        if stats and stats.total_books:
            self.total_books_read = stats.total_books
            self.total_pages_read = stats.total_pages or 0
            self.average_pages_per_book = round(stats.avg_pages or 0, 2)
            self.last_updated = datetime.utcnow()
            
            # Update BEq values for all books
            books = session.query(Book).filter(Book.pages.isnot(None)).all()
            for book in books:
                book.calculate_beq(self.average_pages_per_book)
            
            session.commit()