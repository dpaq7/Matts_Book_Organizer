import { invoke } from "@tauri-apps/api/core";

// ─── Types ───────────────────────────────────────────────────────────

export interface Book {
  id: number;
  goodreadsId: number | null;
  title: string;
  author: string;
  authorSort: string | null;
  additionalAuthors: string | null;
  isbn: string | null;
  isbn13: string | null;
  myRating: number;
  averageRating: number | null;
  publisher: string | null;
  binding: string | null;
  pages: number | null;
  beq: number | null;
  editionPublished: number | null;
  yearPublished: number | null;
  dateRead: string | null;
  yearRead: number | null;
  dateAdded: string;
  exclusiveShelf: string | null;
  myReview: string | null;
  readCount: number;
  ownedCopies: number;
  coverUrl: string | null;
  openLibraryKey: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BookWithShelves extends Book {
  shelves: ShelfInfo[];
}

export interface ShelfInfo {
  id: number;
  name: string;
}

export interface ShelfWithCount {
  id: number;
  name: string;
  count: number;
}

export interface BooksResult {
  books: Book[];
  total: number;
}

export interface ImportResult {
  imported: number;
  total: number;
}

export interface Stats {
  totalBooks: number;
  totalRead: number;
  totalBeq: number;
  avgRating: number;
  booksThisYear: number;
  beqThisYear: number;
  byYear: { year: number | null; count: number; beq: number }[];
  ratingDist: { rating: number; count: number }[];
}

export interface ShelfCount {
  shelf: string | null;
  count: number;
}

export interface OpenLibraryBookData {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  number_of_pages?: number;
  publish_date?: string;
  cover?: { small?: string; medium?: string; large?: string };
}

export interface NewBook {
  goodreadsId?: number | null;
  title: string;
  author: string;
  authorSort?: string | null;
  additionalAuthors?: string | null;
  isbn?: string | null;
  isbn13?: string | null;
  myRating?: number | null;
  averageRating?: number | null;
  publisher?: string | null;
  binding?: string | null;
  pages?: number | null;
  beq?: number | null;
  editionPublished?: number | null;
  yearPublished?: number | null;
  dateRead?: string | null;
  yearRead?: number | null;
  dateAdded?: string | null;
  exclusiveShelf?: string | null;
  myReview?: string | null;
  readCount?: number | null;
  ownedCopies?: number | null;
  coverUrl?: string | null;
  shelfNames?: string[];
}

export type SortField = "title" | "author" | "myRating" | "pages" | "beq" | "dateRead" | "dateAdded" | "yearPublished" | "averageRating";
export type SortDir = "asc" | "desc";

// ─── Commands ────────────────────────────────────────────────────────

export async function getBooks(opts?: {
  search?: string;
  shelf?: string;
  exclusiveShelf?: string;
  sortBy?: SortField;
  sortDir?: SortDir;
  page?: number;
  limit?: number;
}): Promise<BooksResult> {
  return invoke("get_books", {
    search: opts?.search || null,
    shelf: opts?.shelf || null,
    exclusiveShelf: opts?.exclusiveShelf || null,
    sortBy: opts?.sortBy || null,
    sortDir: opts?.sortDir || null,
    page: opts?.page || null,
    limit: opts?.limit || null,
  });
}

export async function getBook(id: number): Promise<BookWithShelves> {
  return invoke("get_book", { id });
}

export async function createBook(data: NewBook): Promise<Book> {
  return invoke("create_book", { data });
}

export async function updateBook(id: number, data: NewBook): Promise<void> {
  return invoke("update_book", { id, data });
}

export async function deleteBook(id: number): Promise<void> {
  return invoke("delete_book", { id });
}

export async function getShelves(): Promise<ShelfWithCount[]> {
  return invoke("get_shelves");
}

export async function createShelf(name: string): Promise<ShelfWithCount> {
  return invoke("create_shelf", { name });
}

export async function renameShelf(id: number, name: string): Promise<void> {
  return invoke("rename_shelf", { id, name });
}

export async function deleteShelf(id: number): Promise<void> {
  return invoke("delete_shelf", { id });
}

export async function previewCsvHeaders(csvText: string): Promise<string[]> {
  return invoke("preview_csv_headers", { csvText });
}

export async function autoDetectColumns(csvHeaders: string[]): Promise<Record<string, string>> {
  return invoke("auto_detect_columns", { csvHeaders });
}

export async function importCsv(csvText: string, columnMap?: Record<string, string>): Promise<ImportResult> {
  return invoke("import_csv", { csvText, columnMap: columnMap || null });
}

export async function lookupISBN(isbn: string): Promise<OpenLibraryBookData | null> {
  return invoke("lookup_isbn", { isbn });
}

export async function getStats(): Promise<Stats> {
  return invoke("get_stats");
}

export async function getShelfCounts(): Promise<ShelfCount[]> {
  return invoke("get_shelf_counts");
}
