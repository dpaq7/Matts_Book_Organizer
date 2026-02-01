use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    pub id: i64,
    pub goodreads_id: Option<i64>,
    pub title: String,
    pub author: String,
    pub author_sort: Option<String>,
    pub additional_authors: Option<String>,
    pub isbn: Option<String>,
    pub isbn13: Option<String>,
    pub my_rating: i64,
    pub average_rating: Option<f64>,
    pub publisher: Option<String>,
    pub binding: Option<String>,
    pub pages: Option<i64>,
    pub beq: Option<f64>,
    pub edition_published: Option<i64>,
    pub year_published: Option<i64>,
    pub date_read: Option<String>,
    pub year_read: Option<i64>,
    pub date_added: String,
    pub exclusive_shelf: Option<String>,
    pub my_review: Option<String>,
    pub read_count: i64,
    pub owned_copies: i64,
    pub cover_url: Option<String>,
    pub open_library_key: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub book_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookWithShelves {
    #[serde(flatten)]
    pub book: Book,
    pub shelves: Vec<ShelfInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShelfInfo {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShelfWithCount {
    pub id: i64,
    pub name: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewBook {
    pub goodreads_id: Option<i64>,
    pub title: String,
    pub author: String,
    pub author_sort: Option<String>,
    pub additional_authors: Option<String>,
    pub isbn: Option<String>,
    pub isbn13: Option<String>,
    pub my_rating: Option<i64>,
    pub average_rating: Option<f64>,
    pub publisher: Option<String>,
    pub binding: Option<String>,
    pub pages: Option<i64>,
    pub edition_published: Option<i64>,
    pub year_published: Option<i64>,
    pub date_read: Option<String>,
    pub year_read: Option<i64>,
    pub date_added: Option<String>,
    pub exclusive_shelf: Option<String>,
    pub my_review: Option<String>,
    pub read_count: Option<i64>,
    pub owned_copies: Option<i64>,
    pub cover_url: Option<String>,
    pub shelf_names: Option<Vec<String>>,
    pub book_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BooksResult {
    pub books: Vec<Book>,
    pub total: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: i64,
    pub total: i64,
    pub skipped: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    pub total_books: i64,
    pub total_read: i64,
    pub total_beq: f64,
    pub total_beq_traditional: f64,
    pub total_beq_graphic_novel: f64,
    pub avg_pages_traditional: f64,
    pub avg_pages_graphic_novel: f64,
    pub avg_rating: f64,
    pub books_this_year: i64,
    pub beq_this_year: f64,
    pub by_year: Vec<YearStat>,
    pub rating_dist: Vec<RatingCount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YearStat {
    pub year: Option<i64>,
    pub count: i64,
    pub beq: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RatingCount {
    pub rating: i64,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShelfCount {
    pub shelf: Option<String>,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenLibraryBookData {
    pub title: Option<String>,
    pub authors: Option<Vec<OpenLibraryAuthor>>,
    pub publishers: Option<Vec<OpenLibraryPublisher>>,
    pub number_of_pages: Option<i64>,
    pub publish_date: Option<String>,
    pub cover: Option<OpenLibraryCover>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenLibraryAuthor {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenLibraryPublisher {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenLibraryCover {
    pub small: Option<String>,
    pub medium: Option<String>,
    pub large: Option<String>,
}
