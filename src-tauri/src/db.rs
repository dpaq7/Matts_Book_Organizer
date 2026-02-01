use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_db(app: &AppHandle) -> Result<DbState, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    std::fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app dir: {}", e))?;

    let db_path = app_dir.join("books.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    conn.execute_batch("PRAGMA journal_mode = WAL;").ok();
    conn.execute_batch("PRAGMA foreign_keys = ON;").ok();
    conn.execute_batch("PRAGMA busy_timeout = 5000;").ok();

    create_tables(&conn)?;
    run_migrations(&conn)?;

    Ok(DbState {
        conn: Mutex::new(conn),
    })
}

fn create_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goodreads_id INTEGER,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            author_sort TEXT,
            additional_authors TEXT,
            isbn TEXT,
            isbn13 TEXT,
            my_rating INTEGER DEFAULT 0,
            average_rating REAL,
            publisher TEXT,
            binding TEXT,
            pages INTEGER,
            beq REAL,
            edition_published INTEGER,
            year_published INTEGER,
            date_read TEXT,
            year_read INTEGER,
            date_added TEXT NOT NULL DEFAULT (date('now')),
            exclusive_shelf TEXT DEFAULT 'to-read',
            my_review TEXT,
            read_count INTEGER DEFAULT 0,
            owned_copies INTEGER DEFAULT 0,
            cover_url TEXT,
            open_library_key TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS shelves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS book_shelves (
            book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
            shelf_id INTEGER NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
            PRIMARY KEY (book_id, shelf_id)
        );

        CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
        CREATE INDEX IF NOT EXISTS idx_books_author_sort ON books(author_sort);
        CREATE INDEX IF NOT EXISTS idx_books_exclusive_shelf ON books(exclusive_shelf);
        CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
        CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
        ",
    )
    .map_err(|e| format!("Failed to create tables: {}", e))
}

fn run_migrations(conn: &Connection) -> Result<(), String> {
    // Migration 1: Add book_type column
    let has_book_type: bool = conn
        .prepare("SELECT COUNT(*) FROM pragma_table_info('books') WHERE name = 'book_type'")
        .and_then(|mut s| s.query_row([], |r| r.get::<_, i64>(0)))
        .unwrap_or(0) > 0;

    if !has_book_type {
        conn.execute_batch("ALTER TABLE books ADD COLUMN book_type TEXT NOT NULL DEFAULT 'traditional'")
            .map_err(|e| format!("Migration failed (book_type): {}", e))?;
    }

    Ok(())
}
