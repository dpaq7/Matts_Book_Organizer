use crate::models::OpenLibraryBookData;
use std::collections::HashMap;

#[tauri::command]
pub async fn lookup_isbn(isbn: String) -> Result<Option<OpenLibraryBookData>, String> {
    let url = format!(
        "https://openlibrary.org/api/books?bibkeys=ISBN:{}&format=json&jscmd=data",
        isbn
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let data: HashMap<String, OpenLibraryBookData> = resp
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let key = format!("ISBN:{}", isbn);
    Ok(data.get(&key).cloned())
}
