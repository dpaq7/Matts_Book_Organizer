use crate::db::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleBooksResponse {
    total_items: Option<i64>,
    items: Option<Vec<GoogleBooksItem>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleBooksItem {
    volume_info: Option<GoogleBooksVolumeInfo>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleBooksVolumeInfo {
    image_links: Option<GoogleBooksImageLinks>,
}

#[derive(Debug, Deserialize)]
struct GoogleBooksImageLinks {
    thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FixCoversResult {
    pub fixed: i64,
    pub checked: i64,
}

/// Extract and clean a thumbnail URL from a Google Books response.
fn extract_google_thumbnail(resp: &GoogleBooksResponse) -> Option<String> {
    let url = resp
        .items
        .as_ref()?
        .first()?
        .volume_info
        .as_ref()?
        .image_links
        .as_ref()?
        .thumbnail
        .as_ref()?;

    // Fix http → https and request larger image
    let cleaned = url
        .replace("http://", "https://")
        .replace("&zoom=1", "&zoom=0")
        .replace("zoom=1", "zoom=0");
    Some(cleaned)
}

/// Try Google Books API by ISBN.
async fn google_books_by_isbn(client: &reqwest::Client, isbn: &str) -> Option<String> {
    let url = format!(
        "https://www.googleapis.com/books/v1/volumes?q=isbn:{}&maxResults=1",
        isbn
    );
    let resp: GoogleBooksResponse = client.get(&url).send().await.ok()?.json().await.ok()?;
    extract_google_thumbnail(&resp)
}

/// Try Google Books API by title + author.
async fn google_books_by_title_author(
    client: &reqwest::Client,
    title: &str,
    author: &str,
) -> Option<String> {
    let query = format!("intitle:{}+inauthor:{}", title, author);
    let url = format!(
        "https://www.googleapis.com/books/v1/volumes?q={}&maxResults=1",
        urlencoding::encode(&query)
    );
    let resp: GoogleBooksResponse = client.get(&url).send().await.ok()?.json().await.ok()?;
    extract_google_thumbnail(&resp)
}

/// Validate an Open Library cover URL via HEAD request.
/// Returns false for 1x1 pixel responses (~43 bytes).
async fn validate_image_url(client: &reqwest::Client, url: &str) -> bool {
    let resp = match client.head(url).send().await {
        Ok(r) => r,
        Err(_) => return false,
    };
    if !resp.status().is_success() {
        return false;
    }
    // Open Library returns a tiny image when no cover exists
    resp.headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok())
        .is_some_and(|len| len > 1000)
}

/// The fallback chain: Google Books (ISBN) → Open Library (ISBN, validated) → Google Books (title+author).
pub async fn resolve_cover_url(
    client: &reqwest::Client,
    isbn: Option<&str>,
    isbn13: Option<&str>,
    title: &str,
    author: &str,
) -> Option<String> {
    let isbn_val = isbn13
        .or(isbn)
        .filter(|s| !s.is_empty());

    // 1. Google Books by ISBN
    if let Some(id) = isbn_val {
        if let Some(url) = google_books_by_isbn(client, id).await {
            return Some(url);
        }
    }

    // 2. Open Library by ISBN (validate with HEAD request)
    if let Some(id) = isbn_val {
        let ol_url = format!("https://covers.openlibrary.org/b/isbn/{}-M.jpg", id);
        if validate_image_url(client, &ol_url).await {
            return Some(ol_url);
        }
    }

    // 3. Google Books by title + author
    if !title.is_empty() && !author.is_empty() {
        if let Some(url) = google_books_by_title_author(client, title, author).await {
            return Some(url);
        }
    }

    None
}

/// Look up a single book's cover using the fallback chain.
#[tauri::command]
pub async fn lookup_cover(
    isbn: Option<String>,
    isbn13: Option<String>,
    title: String,
    author: String,
) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .connect_timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    Ok(resolve_cover_url(
        &client,
        isbn.as_deref(),
        isbn13.as_deref(),
        &title,
        &author,
    )
    .await)
}

/// Re-fetch covers for books with no cover or an invalid Open Library placeholder.
#[tauri::command]
#[allow(clippy::type_complexity)]
pub async fn fix_missing_covers(state: State<'_, DbState>) -> Result<FixCoversResult, String> {
    // Collect candidates: books with NULL cover OR openlibrary cover (may be placeholder)
    let candidates: Vec<(i64, Option<String>, Option<String>, String, String, Option<String>)> = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, isbn, isbn13, title, author, cover_url FROM books \
                 WHERE cover_url IS NULL OR cover_url LIKE '%openlibrary%'",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, Option<String>>(5)?,
                ))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect::<Vec<_>>();
        rows
    };
    // Lock is dropped here

    let checked = candidates.len() as i64;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .connect_timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    let mut updates: Vec<(i64, String)> = Vec::new();

    for (id, isbn, isbn13, title, author, existing_cover) in &candidates {
        // If book already has an openlibrary URL, validate it first — skip if it's real
        if let Some(ref url) = existing_cover {
            if url.contains("openlibrary") && validate_image_url(&client, url).await {
                continue; // existing cover is valid, no need to re-fetch
            }
        }

        if let Some(url) = resolve_cover_url(
            &client,
            isbn.as_deref(),
            isbn13.as_deref(),
            title,
            author,
        )
        .await
        {
            updates.push((*id, url));
        }
    }

    // Batch update with lock
    let fixed = updates.len() as i64;
    {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        for (id, url) in &updates {
            conn.execute(
                "UPDATE books SET cover_url = ?1 WHERE id = ?2",
                params![url, id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(FixCoversResult { fixed, checked })
}
