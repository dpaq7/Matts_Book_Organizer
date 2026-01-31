use crate::db::DbState;
use crate::models::*;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn get_shelves(state: State<DbState>) -> Result<Vec<ShelfWithCount>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT s.id, s.name, COUNT(bs.book_id) as count
             FROM shelves s
             LEFT JOIN book_shelves bs ON s.id = bs.shelf_id
             GROUP BY s.id
             ORDER BY s.name ASC",
        )
        .map_err(|e| e.to_string())?;

    let shelves: Vec<ShelfWithCount> = stmt
        .query_map([], |row| {
            Ok(ShelfWithCount {
                id: row.get(0)?,
                name: row.get(1)?,
                count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(shelves)
}

#[tauri::command]
pub fn create_shelf(state: State<DbState>, name: String) -> Result<ShelfWithCount, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO shelves (name) VALUES (?1)", params![name])
        .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(ShelfWithCount {
        id,
        name,
        count: 0,
    })
}

#[tauri::command]
pub fn rename_shelf(state: State<DbState>, id: i64, name: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE shelves SET name = ?1 WHERE id = ?2", params![name, id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_shelf(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM shelves WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
