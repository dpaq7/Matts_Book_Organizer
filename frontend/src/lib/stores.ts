// Svelte stores for global state management
import { writable, derived } from 'svelte/store';
import type { Book, ReadingStats, BookFilters } from './api';

// Theme store
export const isDarkMode = writable(false);

// Books store
export const books = writable<Book[]>([]);
export const currentBook = writable<Book | null>(null);
export const isLoading = writable(false);
export const error = writable<string | null>(null);

// Filters store
export const filters = writable<BookFilters>({
  search: '',
  shelf: '',
  rating: undefined,
  skip: 0,
  limit: 50
});

// Statistics store
export const stats = writable<ReadingStats | null>(null);

// Derived stores
export const filteredBooks = derived(
  [books, filters],
  ([$books, $filters]) => {
    let filtered = $books;

    // Client-side filtering for immediate feedback
    if ($filters.search) {
      const searchLower = $filters.search.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.publisher?.toLowerCase().includes(searchLower)
      );
    }

    if ($filters.shelf) {
      filtered = filtered.filter(book => book.exclusive_shelf === $filters.shelf);
    }

    if ($filters.rating) {
      filtered = filtered.filter(book => book.rating === $filters.rating);
    }

    return filtered;
  }
);

export const booksByShelf = derived(books, ($books) => {
  const shelves: Record<string, Book[]> = {};
  
  $books.forEach(book => {
    if (book.exclusive_shelf) {
      if (!shelves[book.exclusive_shelf]) {
        shelves[book.exclusive_shelf] = [];
      }
      shelves[book.exclusive_shelf].push(book);
    }
  });

  return shelves;
});

export const favoriteBooks = derived(books, ($books) => 
  $books.filter(book => book.rating === 5)
);

export const recentlyRead = derived(books, ($books) => 
  $books
    .filter(book => book.date_read)
    .sort((a, b) => new Date(b.date_read!).getTime() - new Date(a.date_read!).getTime())
    .slice(0, 10)
);

// Helper functions
export function clearError() {
  error.set(null);
}

export function setLoading(loading: boolean) {
  isLoading.set(loading);
}

export function updateFilters(newFilters: Partial<BookFilters>) {
  filters.update(current => ({ ...current, ...newFilters }));
}