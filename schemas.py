"""
Pydantic schemas for request/response models
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ShelfBase(BaseModel):
    name: str
    description: Optional[str] = None

class ShelfCreate(ShelfBase):
    pass

class ShelfResponse(ShelfBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime

class BookBase(BaseModel):
    title: str
    author: str
    author_last_first: Optional[str] = None
    additional_authors: Optional[str] = None
    isbn: Optional[str] = None
    isbn13: Optional[str] = None
    publisher: Optional[str] = None
    binding: Optional[str] = None
    pages: Optional[int] = None
    edition_published: Optional[int] = None
    original_published: Optional[int] = None
    rating: Optional[int] = None
    average_rating: Optional[float] = None
    my_review: Optional[str] = None
    private_notes: Optional[str] = None
    spoiler: Optional[bool] = False
    date_read: Optional[datetime] = None
    read_count: Optional[int] = 0
    owned_copies: Optional[int] = 0
    exclusive_shelf: Optional[str] = None

class BookCreate(BookBase):
    goodreads_id: Optional[int] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    author_last_first: Optional[str] = None
    additional_authors: Optional[str] = None
    isbn: Optional[str] = None
    isbn13: Optional[str] = None
    publisher: Optional[str] = None
    binding: Optional[str] = None
    pages: Optional[int] = None
    edition_published: Optional[int] = None
    original_published: Optional[int] = None
    rating: Optional[int] = None
    average_rating: Optional[float] = None
    my_review: Optional[str] = None
    private_notes: Optional[str] = None
    spoiler: Optional[bool] = None
    date_read: Optional[datetime] = None
    read_count: Optional[int] = None
    owned_copies: Optional[int] = None
    exclusive_shelf: Optional[str] = None

class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    goodreads_id: Optional[int] = None
    date_added: datetime
    beq_value: Optional[float] = None
    beq_percentage: Optional[float] = None
    shelves: List[ShelfResponse] = []

class ReadingStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    total_books_read: int
    total_pages_read: int
    average_pages_per_book: float
    last_updated: datetime

class BulkImportRequest(BaseModel):
    books: List[BookCreate]
    update_existing: bool = False