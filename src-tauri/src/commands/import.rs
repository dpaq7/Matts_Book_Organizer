use crate::db::DbState;
use crate::models::*;
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

/// Extract a 4-digit year from a date string like "2024/05/15", "2024-05-15", "May 15, 2024", etc.
fn extract_year(date_str: &str) -> Option<i64> {
    // Find the first 4-digit number that looks like a year (1900-2099)
    let mut i = 0;
    let bytes = date_str.as_bytes();
    while i + 3 < bytes.len() {
        if bytes[i].is_ascii_digit() && bytes[i+1].is_ascii_digit() && bytes[i+2].is_ascii_digit() && bytes[i+3].is_ascii_digit() {
            if let Ok(y) = date_str[i..i+4].parse::<i64>() {
                if (1900..=2099).contains(&y) {
                    return Some(y);
                }
            }
        }
        i += 1;
    }
    None
}

/// Known aliases: maps common CSV header variations → our canonical field names
fn default_aliases() -> HashMap<String, String> {
    let pairs = vec![
        // Goodreads format
        ("Book Id", "goodreads_id"),
        ("Title", "title"),
        ("Author", "author"),
        ("Author l-f", "author_sort"),
        ("Author (By Last Name)", "author_sort"),
        ("Additional Authors", "additional_authors"),
        ("ISBN", "isbn"),
        ("ISBN13", "isbn13"),
        ("My Rating", "my_rating"),
        ("Rating", "my_rating"),
        ("Average Rating", "average_rating"),
        ("Publisher", "publisher"),
        ("Binding", "binding"),
        ("Number of Pages", "pages"),
        ("Pages", "pages"),
        ("Year Published", "year_published"),
        ("Original Publication Year", "year_published"),
        ("Published", "year_published"),
        ("Edition Published", "edition_published"),
        ("Date Read", "date_read"),
        ("Year Read", "year_read"),
        ("Date Added", "date_added"),
        ("Exclusive Shelf", "exclusive_shelf"),
        ("My Review", "my_review"),
        ("Review", "my_review"),
        ("Read Count", "read_count"),
        ("Owned Copies", "owned_copies"),
        ("Bookshelves", "bookshelves"),
        ("Shelves", "bookshelves"),
        ("Tags", "bookshelves"),
        // StoryGraph
        ("Star Rating", "my_rating"),
        ("Date Read ", "date_read"),
        // LibraryThing
        ("Primary Author", "author"),
        ("Secondary Author", "additional_authors"),
        ("Publication", "publisher"),
        ("Date", "year_published"),
        ("Page Count", "pages"),
        ("Collections", "bookshelves"),
        // Book type
        ("Book Type", "book_type"),
        ("Type", "book_type"),
        ("Format", "book_type"),
    ];
    pairs
        .into_iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

/// Returns the CSV headers so the frontend can build a column mapping UI.
#[tauri::command]
pub fn preview_csv_headers(csv_text: String) -> Result<Vec<String>, String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_reader(csv_text.as_bytes());

    let headers = reader.headers().map_err(|e| e.to_string())?.clone();
    Ok(headers.iter().map(|h| h.trim().to_string()).collect())
}

/// Auto-detect which CSV headers map to our fields using known aliases.
/// Returns a map of our_field → csv_header.
#[tauri::command]
pub fn auto_detect_columns(csv_headers: Vec<String>) -> HashMap<String, String> {
    let aliases = default_aliases();
    let mut result: HashMap<String, String> = HashMap::new();

    for header in &csv_headers {
        let trimmed = header.trim();
        if let Some(field) = aliases.get(trimmed) {
            // Don't overwrite if we already have a mapping for this field
            result.entry(field.clone()).or_insert_with(|| trimmed.to_string());
        }
    }

    result
}

/// Import CSV with an explicit column mapping.
/// `column_map` maps our canonical field name → actual CSV header name.
/// If column_map is empty/null, falls back to auto-detection.
#[tauri::command]
pub fn import_csv(
    state: State<DbState>,
    csv_text: String,
    column_map: Option<HashMap<String, String>>,
) -> Result<ImportResult, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_reader(csv_text.as_bytes());

    let headers = reader.headers().map_err(|e| e.to_string())?.clone();

    // Build the mapping: our_field → csv_header
    let mapping = match column_map {
        Some(m) if !m.is_empty() => m,
        _ => {
            let csv_headers: Vec<String> = headers.iter().map(|h| h.trim().to_string()).collect();
            auto_detect_columns(csv_headers)
        }
    };

    // Helper: look up a field using the mapping
    let get_index = |field: &str| -> Option<usize> {
        mapping
            .get(field)
            .and_then(|csv_header| headers.iter().position(|h| h.trim() == csv_header))
    };

    let mut imported: i64 = 0;
    let mut total: i64 = 0;
    let mut skipped: Vec<String> = Vec::new();

    for result in reader.records() {
        total += 1;
        let record = match result {
            Ok(r) => r,
            Err(_) => continue,
        };

        let get = |field: &str| -> String {
            get_index(field)
                .and_then(|i| record.get(i))
                .unwrap_or("")
                .trim()
                .to_string()
        };

        let clean_isbn = |raw: String| -> Option<String> {
            let cleaned = raw.replace(['=', '"'], "").trim().to_string();
            if cleaned.is_empty() {
                None
            } else {
                Some(cleaned)
            }
        };

        let title = get("title");
        let author = get("author");
        if title.is_empty() && author.is_empty() {
            continue;
        }

        let isbn = clean_isbn(get("isbn"));
        let isbn13 = clean_isbn(get("isbn13"));

        // Dedup check: isbn13 → isbn → goodreads_id → title+author
        let goodreads_id: Option<i64> = get("goodreads_id").parse().ok();
        let is_dup = (|| {
            if let Some(ref id) = isbn13 {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM books WHERE isbn13 = ?1", params![id], |r| r.get(0),
                ).unwrap_or(0);
                if count > 0 { return true; }
            }
            if let Some(ref id) = isbn {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM books WHERE isbn = ?1", params![id], |r| r.get(0),
                ).unwrap_or(0);
                if count > 0 { return true; }
            }
            if let Some(id) = goodreads_id {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM books WHERE goodreads_id = ?1", params![id], |r| r.get(0),
                ).unwrap_or(0);
                if count > 0 { return true; }
            }
            if !title.is_empty() && !author.is_empty() {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM books WHERE LOWER(title) = LOWER(?1) AND LOWER(author) = LOWER(?2)",
                    params![title, author], |r| r.get(0),
                ).unwrap_or(0);
                if count > 0 { return true; }
            }
            false
        })();

        if is_dup {
            let label = if author.is_empty() {
                title.clone()
            } else {
                format!("{} by {}", title, author)
            };
            skipped.push(label);
            continue;
        }

        let pages: Option<i64> = get("pages").parse().ok();
        let book_type_raw = get("book_type");
        let book_type = if book_type_raw.is_empty() { "traditional".to_string() } else { book_type_raw };
        let cover_url = isbn13
            .as_ref()
            .or(isbn.as_ref())
            .filter(|id| !id.is_empty())
            .map(|id| format!("https://covers.openlibrary.org/b/isbn/{}-M.jpg", id));

        conn.execute(
            "INSERT INTO books (goodreads_id, title, author, author_sort, additional_authors, isbn, isbn13,
             my_rating, average_rating, publisher, binding, pages, edition_published, year_published,
             date_read, year_read, date_added, exclusive_shelf, my_review, read_count, owned_copies, cover_url, book_type)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)",
            params![
                get("goodreads_id").parse::<i64>().ok(),
                title,
                author,
                get("author_sort"),
                get("additional_authors"),
                isbn,
                isbn13,
                get("my_rating").parse::<i64>().unwrap_or(0),
                get("average_rating").parse::<f64>().ok(),
                get("publisher"),
                get("binding"),
                pages,
                get("edition_published").parse::<i64>().ok(),
                get("year_published").parse::<i64>().ok(),
                {
                    let v = get("date_read");
                    if v.is_empty() { None } else { Some(v) }
                },
                {
                    // Try explicit year_read first, then extract from date_read
                    let yr = get("year_read");
                    if let Ok(y) = yr.parse::<i64>() {
                        Some(y)
                    } else {
                        let dr = get("date_read");
                        extract_year(&dr)
                    }
                },
                {
                    let v = get("date_added");
                    if v.is_empty() {
                        "2025/01/01".to_string()
                    } else {
                        v
                    }
                },
                {
                    let v = get("exclusive_shelf");
                    if v.is_empty() {
                        "to-read".to_string()
                    } else {
                        v
                    }
                },
                {
                    let v = get("my_review");
                    if v.is_empty() { None } else { Some(v) }
                },
                get("read_count").parse::<i64>().unwrap_or(0),
                get("owned_copies").parse::<i64>().unwrap_or(0),
                cover_url,
                book_type,
            ],
        )
        .map_err(|e| e.to_string())?;

        let book_id = conn.last_insert_rowid();

        // Parse bookshelves
        let bookshelves = get("bookshelves");
        if !bookshelves.is_empty() {
            for shelf_name in bookshelves.split(',') {
                let name = shelf_name.trim();
                if name.is_empty() {
                    continue;
                }
                conn.execute(
                    "INSERT OR IGNORE INTO shelves (name) VALUES (?1)",
                    params![name],
                )
                .ok();
                if let Ok(shelf_id) = conn.query_row(
                    "SELECT id FROM shelves WHERE name = ?1",
                    params![name],
                    |r| r.get::<_, i64>(0),
                ) {
                    conn.execute(
                        "INSERT OR IGNORE INTO book_shelves (book_id, shelf_id) VALUES (?1, ?2)",
                        params![book_id, shelf_id],
                    )
                    .ok();
                }
            }
        }

        imported += 1;
    }

    Ok(ImportResult { imported, total, skipped })
}
