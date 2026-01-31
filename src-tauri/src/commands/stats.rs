use crate::db::DbState;
use crate::models::*;
use rusqlite::params;
use tauri::State;

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
        .query_row("SELECT coalesce(sum(beq), 0) FROM books WHERE exclusive_shelf = 'read'", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let avg_rating: f64 = conn
        .query_row("SELECT coalesce(avg(my_rating), 0) FROM books WHERE exclusive_shelf = 'read' AND my_rating > 0", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let current_year = 2025_i64; // Could use system time but this is fine

    let books_this_year: i64 = conn
        .query_row("SELECT count(*) FROM books WHERE year_read = ?1", params![current_year], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let beq_this_year: f64 = conn
        .query_row("SELECT coalesce(sum(beq), 0) FROM books WHERE year_read = ?1", params![current_year], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    // Books by year
    let mut stmt = conn
        .prepare("SELECT year_read, count(*), coalesce(sum(beq), 0) FROM books WHERE year_read IS NOT NULL GROUP BY year_read ORDER BY year_read DESC")
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

    // Rating distribution
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

    Ok(Stats {
        total_books,
        total_read,
        total_beq: (total_beq * 100.0).round() / 100.0,
        avg_rating: (avg_rating * 100.0).round() / 100.0,
        books_this_year,
        beq_this_year: (beq_this_year * 100.0).round() / 100.0,
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
