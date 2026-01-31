use crate::db::DbState;
use crate::models::*;
use rusqlite::params;
use tauri::State;

fn row_to_book(row: &rusqlite::Row) -> rusqlite::Result<Book> {
    Ok(Book {
        id: row.get(0)?,
        goodreads_id: row.get(1)?,
        title: row.get(2)?,
        author: row.get(3)?,
        author_sort: row.get(4)?,
        additional_authors: row.get(5)?,
        isbn: row.get(6)?,
        isbn13: row.get(7)?,
        my_rating: row.get::<_, Option<i64>>(8)?.unwrap_or(0),
        average_rating: row.get(9)?,
        publisher: row.get(10)?,
        binding: row.get(11)?,
        pages: row.get(12)?,
        beq: row.get(13)?,
        edition_published: row.get(14)?,
        year_published: row.get(15)?,
        date_read: row.get(16)?,
        year_read: row.get(17)?,
        date_added: row.get::<_, Option<String>>(18)?.unwrap_or_default(),
        exclusive_shelf: row.get(19)?,
        my_review: row.get(20)?,
        read_count: row.get::<_, Option<i64>>(21)?.unwrap_or(0),
        owned_copies: row.get::<_, Option<i64>>(22)?.unwrap_or(0),
        cover_url: row.get(23)?,
        open_library_key: row.get(24)?,
        created_at: row.get(25)?,
        updated_at: row.get(26)?,
    })
}

#[tauri::command]
pub fn get_books(
    state: State<DbState>,
    search: Option<String>,
    shelf: Option<String>,
    exclusive_shelf: Option<String>,
    sort_by: Option<String>,
    sort_dir: Option<String>,
    page: Option<i64>,
    limit: Option<i64>,
) -> Result<BooksResult, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    let sort_col = match sort_by.as_deref() {
        Some("title") => "title",
        Some("author") => "author_sort",
        Some("myRating") => "my_rating",
        Some("pages") => "pages",
        Some("beq") => "beq",
        Some("dateRead") => "date_read",
        Some("yearPublished") => "year_published",
        Some("averageRating") => "average_rating",
        _ => "date_added",
    };
    let dir = if sort_dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };

    let mut conditions: Vec<String> = vec![];
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    if let Some(ref s) = search {
        if !s.is_empty() {
            let pattern = format!("%{}%", s);
            conditions.push("(title LIKE ?1 OR author LIKE ?1 OR isbn LIKE ?1 OR isbn13 LIKE ?1)".to_string());
            param_values.push(Box::new(pattern));
        }
    }

    if let Some(ref es) = exclusive_shelf {
        if !es.is_empty() && es != "all" {
            let idx = param_values.len() + 1;
            conditions.push(format!("exclusive_shelf = ?{}", idx));
            param_values.push(Box::new(es.clone()));
        }
    }

    // Handle shelf filter via subquery
    if let Some(ref shelf_name) = shelf {
        if !shelf_name.is_empty() && shelf_name != "all" {
            let idx = param_values.len() + 1;
            conditions.push(format!(
                "id IN (SELECT bs.book_id FROM book_shelves bs JOIN shelves s ON bs.shelf_id = s.id WHERE s.name = ?{})",
                idx
            ));
            param_values.push(Box::new(shelf_name.clone()));
        }
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    // Count
    let count_sql = format!("SELECT count(*) FROM books {}", where_clause);
    let total: i64 = conn
        .query_row(&count_sql, rusqlite::params_from_iter(param_values.iter().map(|p| p.as_ref())), |r| r.get(0))
        .map_err(|e| e.to_string())?;

    // Query
    let query_sql = format!(
        "SELECT * FROM books {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_clause, sort_col, dir, limit, offset
    );
    let mut stmt = conn.prepare(&query_sql).map_err(|e| e.to_string())?;
    let books: Vec<Book> = stmt
        .query_map(rusqlite::params_from_iter(param_values.iter().map(|p| p.as_ref())), row_to_book)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(BooksResult { books, total })
}

#[tauri::command]
pub fn get_book(state: State<DbState>, id: i64) -> Result<BookWithShelves, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let book = conn
        .query_row("SELECT * FROM books WHERE id = ?1", params![id], row_to_book)
        .map_err(|e| format!("Book not found: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT s.id, s.name FROM book_shelves bs JOIN shelves s ON bs.shelf_id = s.id WHERE bs.book_id = ?1")
        .map_err(|e| e.to_string())?;
    let shelves: Vec<ShelfInfo> = stmt
        .query_map(params![id], |row| {
            Ok(ShelfInfo {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(BookWithShelves { book, shelves })
}

fn link_shelves(conn: &rusqlite::Connection, book_id: i64, shelf_names: &[String]) -> Result<(), String> {
    for name in shelf_names {
        let trimmed = name.trim();
        if trimmed.is_empty() { continue; }
        conn.execute(
            "INSERT OR IGNORE INTO shelves (name) VALUES (?1)",
            params![trimmed],
        ).map_err(|e| e.to_string())?;

        let shelf_id: i64 = conn
            .query_row("SELECT id FROM shelves WHERE name = ?1", params![trimmed], |r| r.get(0))
            .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR IGNORE INTO book_shelves (book_id, shelf_id) VALUES (?1, ?2)",
            params![book_id, shelf_id],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn calculate_beq(pages: Option<i64>) -> Option<f64> {
    pages.filter(|&p| p > 0).map(|p| ((p as f64 / 348.0) * 100.0).round() / 100.0)
}

fn get_cover_url(isbn: &Option<String>, isbn13: &Option<String>) -> Option<String> {
    let id = isbn13.as_deref().or(isbn.as_deref())?;
    if id.is_empty() { return None; }
    Some(format!("https://covers.openlibrary.org/b/isbn/{}-M.jpg", id))
}

#[tauri::command]
pub fn create_book(state: State<DbState>, data: NewBook) -> Result<Book, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let beq = calculate_beq(data.pages);
    let cover_url = data.cover_url.clone().or_else(|| get_cover_url(&data.isbn, &data.isbn13));
    let date_added = data.date_added.clone().unwrap_or_else(|| chrono_today());

    conn.execute(
        "INSERT INTO books (goodreads_id, title, author, author_sort, additional_authors, isbn, isbn13, my_rating, average_rating, publisher, binding, pages, beq, edition_published, year_published, date_read, year_read, date_added, exclusive_shelf, my_review, read_count, owned_copies, cover_url)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23)",
        params![
            data.goodreads_id, data.title, data.author, data.author_sort, data.additional_authors,
            data.isbn, data.isbn13, data.my_rating.unwrap_or(0), data.average_rating,
            data.publisher, data.binding, data.pages, beq, data.edition_published, data.year_published,
            data.date_read, data.year_read, date_added, data.exclusive_shelf.as_deref().unwrap_or("to-read"),
            data.my_review, data.read_count.unwrap_or(0), data.owned_copies.unwrap_or(0), cover_url,
        ],
    ).map_err(|e| e.to_string())?;

    let book_id = conn.last_insert_rowid();

    if let Some(ref names) = data.shelf_names {
        link_shelves(&conn, book_id, names)?;
    }

    conn.query_row("SELECT * FROM books WHERE id = ?1", params![book_id], row_to_book)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_book(state: State<DbState>, id: i64, data: NewBook) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let beq = calculate_beq(data.pages);
    let cover_url = data.cover_url.clone().or_else(|| get_cover_url(&data.isbn, &data.isbn13));

    conn.execute(
        "UPDATE books SET title=?1, author=?2, author_sort=?3, additional_authors=?4, isbn=?5, isbn13=?6,
         my_rating=?7, average_rating=?8, publisher=?9, binding=?10, pages=?11, beq=?12,
         edition_published=?13, year_published=?14, date_read=?15, year_read=?16,
         exclusive_shelf=?17, my_review=?18, read_count=?19, owned_copies=?20, cover_url=?21,
         updated_at=datetime('now') WHERE id=?22",
        params![
            data.title, data.author, data.author_sort, data.additional_authors,
            data.isbn, data.isbn13, data.my_rating.unwrap_or(0), data.average_rating,
            data.publisher, data.binding, data.pages, beq, data.edition_published, data.year_published,
            data.date_read, data.year_read, data.exclusive_shelf, data.my_review,
            data.read_count.unwrap_or(0), data.owned_copies.unwrap_or(0), cover_url, id,
        ],
    ).map_err(|e| e.to_string())?;

    if let Some(ref names) = data.shelf_names {
        conn.execute("DELETE FROM book_shelves WHERE book_id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        link_shelves(&conn, id, names)?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_book(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM books WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn chrono_today() -> String {
    // Simple date without chrono crate
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    // Approximate — good enough for a default
    let days = now / 86400;
    let years = 1970 + days / 365;
    format!("{}/01/01", years)
}
