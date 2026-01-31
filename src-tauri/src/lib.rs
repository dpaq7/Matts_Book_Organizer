mod commands;
mod db;
mod models;

use db::init_db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_state = init_db(app.handle())
                .expect("Failed to initialize database");
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::books::get_books,
            commands::books::get_book,
            commands::books::create_book,
            commands::books::update_book,
            commands::books::delete_book,
            commands::shelves::get_shelves,
            commands::shelves::create_shelf,
            commands::shelves::rename_shelf,
            commands::shelves::delete_shelf,
            commands::import::preview_csv_headers,
            commands::import::auto_detect_columns,
            commands::import::import_csv,
            commands::metadata::lookup_isbn,
            commands::stats::get_stats,
            commands::stats::get_shelf_counts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
