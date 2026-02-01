use crate::db::DbState;
use crate::models::*;
use rusqlite::params;
use tauri::State;

/// SQL for computing a single book's BEq using per-type average
const BEQ_EXPR: &str = "CASE WHEN books.pages > 0 THEN books.pages * 1.0 / NULLIF((SELECT AVG(b2.pages) FROM books b2 WHERE b2.book_type = books.book_type AND b2.exclusive_shelf = 'read' AND b2.pages > 0), 0) ELSE 0 END";

#[tauri::command]
pub fn get_stats(state: State<DbState>) -> Result<Stats, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let total_books: i64 = conn
        .query_row("SELECT count(*) FROM books", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let total_read: i64 = conn
        .query_row("SELECT count(*) FROM books WHERE exclusive_shelf = 'read'", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let total_beq: f64 = conn
        .query_row(
            &format!("SELECT coalesce(sum({}), 0) FROM books WHERE exclusive_shelf = 'read'", BEQ_EXPR),
            [], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let total_beq_traditional: f64 = conn
        .query_row(
            &format!("SELECT coalesce(sum({}), 0) FROM books WHERE exclusive_shelf = 'read' AND book_type = 'traditional'", BEQ_EXPR),
            [], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let total_beq_graphic_novel: f64 = conn
        .query_row(
            &format!("SELECT coalesce(sum({}), 0) FROM books WHERE exclusive_shelf = 'read' AND book_type = 'graphic_novel'", BEQ_EXPR),
            [], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let avg_pages_traditional: f64 = conn
        .query_row(
            "SELECT coalesce(avg(pages), 0) FROM books WHERE book_type = 'traditional' AND exclusive_shelf = 'read' AND pages > 0",
            [], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let avg_pages_graphic_novel: f64 = conn
        .query_row(
            "SELECT coalesce(avg(pages), 0) FROM books WHERE book_type = 'graphic_novel' AND exclusive_shelf = 'read' AND pages > 0",
            [], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let avg_rating: f64 = conn
        .query_row("SELECT coalesce(avg(my_rating), 0) FROM books WHERE exclusive_shelf = 'read' AND my_rating > 0", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let current_year = {
        let secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        // Approximate current year
        (1970 + secs / 31_557_600) as i64
    };

    let books_this_year: i64 = conn
        .query_row("SELECT count(*) FROM books WHERE year_read = ?1", params![current_year], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let beq_this_year: f64 = conn
        .query_row(
            &format!("SELECT coalesce(sum({}), 0) FROM books WHERE year_read = ?1", BEQ_EXPR),
            params![current_year], |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT year_read, count(*), coalesce(sum({}), 0) FROM books WHERE year_read IS NOT NULL GROUP BY year_read ORDER BY year_read DESC",
            BEQ_EXPR
        ))
        .map_err(|e| e.to_string())?;
    let by_year: Vec<YearStat> = stmt
        .query_map([], |row| {
            Ok(YearStat {
                year: row.get(0)?,
                count: row.get(1)?,
                beq: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare("SELECT my_rating, count(*) FROM books WHERE my_rating > 0 GROUP BY my_rating ORDER BY my_rating ASC")
        .map_err(|e| e.to_string())?;
    let rating_dist: Vec<RatingCount> = stmt
        .query_map([], |row| {
            Ok(RatingCount {
                rating: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let round2 = |v: f64| (v * 100.0).round() / 100.0;

    Ok(Stats {
        total_books,
        total_read,
        total_beq: round2(total_beq),
        total_beq_traditional: round2(total_beq_traditional),
        total_beq_graphic_novel: round2(total_beq_graphic_novel),
        avg_pages_traditional: round2(avg_pages_traditional),
        avg_pages_graphic_novel: round2(avg_pages_graphic_novel),
        avg_rating: round2(avg_rating),
        books_this_year,
        beq_this_year: round2(beq_this_year),
        by_year,
        rating_dist,
    })
}

#[tauri::command]
pub fn get_shelf_counts(state: State<DbState>) -> Result<Vec<ShelfCount>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT exclusive_shelf, count(*) FROM books GROUP BY exclusive_shelf")
        .map_err(|e| e.to_string())?;
    let counts: Vec<ShelfCount> = stmt
        .query_map([], |row| {
            Ok(ShelfCount {
                shelf: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(counts)
}
