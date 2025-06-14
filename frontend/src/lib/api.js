// API client for backend communication
import { browser } from '$app/environment';

// Use environment variable for API URL, with smart defaults
const API_BASE_URL = browser 
  ? (import.meta.env.VITE_API_URL || 
     (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api'))
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

class ApiClient {
  async request(endpoint, options = {}) {
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
  async getBooks(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.shelf) params.append('shelf', filters.shelf);
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request(`/books${query ? `?${query}` : ''}`);
  }

  async getBook(id) {
    return this.request(`/books/${id}`);
  }

  async createBook(book) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  }

  async updateBook(id, book) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  }

  async deleteBook(id) {
    await this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStats() {
    return this.request('/stats');
  }

  async updateStats() {
    await this.request('/stats/update', {
      method: 'POST',
    });
  }

  // Utility methods
  async searchBooks(query, limit = 20) {
    return this.getBooks({ search: query, limit });
  }

  async getBooksByShelf(shelf, limit = 100) {
    return this.getBooks({ shelf, limit });
  }

  async getBooksByRating(rating, limit = 100) {
    return this.getBooks({ rating, limit });
  }
}

export const api = new ApiClient();