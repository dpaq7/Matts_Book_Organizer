// API client for backend communication
import { browser } from '$app/environment';

// Use environment variable for API URL, with smart defaults
const API_BASE_URL = browser 
  ? (import.meta.env.VITE_API_URL || 
     (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api'))
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export interface Book {
  id: number;
  goodreads_id?: number;
  title: string;
  author: string;
  author_last_first?: string;
  additional_authors?: string;
  isbn?: string;
  isbn13?: string;
  publisher?: string;
  binding?: string;
  pages?: number;
  edition_published?: number;
  original_published?: number;
  rating?: number;
  average_rating?: number;
  my_review?: string;
  private_notes?: string;
  spoiler?: boolean;
  date_read?: string;
  date_added: string;
  read_count?: number;
  owned_copies?: number;
  exclusive_shelf?: string;
  beq_value?: number;
  beq_percentage?: number;
  shelves: Shelf[];
}

export interface Shelf {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ReadingStats {
  total_books_read: number;
  total_pages_read: number;
  average_pages_per_book: number;
  last_updated: string;
}

export interface BookFilters {
  search?: string;
  shelf?: string;
  rating?: number;
  skip?: number;
  limit?: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Books
  async getBooks(filters: BookFilters = {}): Promise<Book[]> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.shelf) params.append('shelf', filters.shelf);
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<Book[]>(`/books${query ? `?${query}` : ''}`);
  }

  async getBook(id: number): Promise<Book> {
    return this.request<Book>(`/books/${id}`);
  }

  async createBook(book: Partial<Book>): Promise<Book> {
    return this.request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  }

  async updateBook(id: number, book: Partial<Book>): Promise<Book> {
    return this.request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  }

  async deleteBook(id: number): Promise<void> {
    await this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStats(): Promise<ReadingStats> {
    return this.request<ReadingStats>('/stats');
  }

  async updateStats(): Promise<void> {
    await this.request('/stats/update', {
      method: 'POST',
    });
  }

  // Utility methods
  async searchBooks(query: string, limit = 20): Promise<Book[]> {
    return this.getBooks({ search: query, limit });
  }

  async getBooksByShelf(shelf: string, limit = 100): Promise<Book[]> {
    return this.getBooks({ shelf, limit });
  }

  async getBooksByRating(rating: number, limit = 100): Promise<Book[]> {
    return this.getBooks({ rating, limit });
  }
}

export const api = new ApiClient();