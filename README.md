# Matt's Book Organizer

A native desktop app for managing a personal book library. Built with Tauri v2 (Rust backend) and Next.js (React frontend).

## Features

- **Library management** — Add, edit, delete, and browse books with cover art from Open Library
- **CSV import** — Import from Goodreads, StoryGraph, LibraryThing, or any CSV with flexible column mapping and auto-detection
- **ISBN lookup** — Fetch book metadata (title, author, publisher, page count) from Open Library by ISBN
- **Shelves** — Organize books into custom shelves and status categories (read, currently-reading, to-read)
- **Search, sort, filter** — Full-text search by title/author, sort by any column, filter by shelf
- **BEq tracking** — Book Equivalent metric (pages ÷ 348) for normalized reading volume
- **Stats dashboard** — Total books, books by year, rating distribution, BEq totals
- **Cover art** — Automatic cover images via Open Library's ISBN cover API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust, rusqlite (bundled SQLite), reqwest, csv |
| Frontend | Next.js 16 (static export), React 19, TypeScript |
| UI | [shadcn/ui](https://ui.shadcn.com/), Tailwind CSS, Lucide icons |
| Data | SQLite (stored in `~/Library/Application Support/com.matts-book-organizer/`) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (latest stable)
- macOS (for `.dmg` builds) — Linux and Windows builds are possible with Tauri but untested

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode (launches Next.js dev server + Tauri window)
npm run tauri dev

# Build for production (.dmg on macOS)
npm run tauri build
```

The production build outputs to `src-tauri/target/release/bundle/`.

## Project Structure

```
src/                    # Frontend (Next.js)
├── app/                # Pages (home, book detail, add book, shelves, stats, import)
├── components/         # React components (book table, form, CSV importer, shelf manager)
│   └── ui/             # shadcn/ui primitives
└── lib/
    ├── tauri.ts        # Typed IPC wrapper for all Tauri commands
    └── utils.ts        # Helpers (BEq calculation, date formatting, cover URLs)

src-tauri/              # Backend (Rust)
├── src/
│   ├── main.rs         # Entry point
│   ├── lib.rs          # Tauri builder, command registration
│   ├── db.rs           # SQLite initialization, schema, managed state
│   ├── models.rs       # Serde structs for all data types
│   └── commands/       # IPC command handlers
│       ├── books.rs    # CRUD + search/sort/filter/paginate
│       ├── shelves.rs  # Shelf CRUD with book counts
│       ├── import.rs   # CSV import with flexible column mapping
│       ├── metadata.rs # Open Library ISBN lookup
│       └── stats.rs    # Aggregated reading statistics
├── Cargo.toml
└── tauri.conf.json
```

## CSV Import

The importer auto-detects columns from these formats:

- **Goodreads** — `Title`, `Author`, `ISBN13`, `My Rating`, `Bookshelves`, `Exclusive Shelf`, etc.
- **StoryGraph** — `Star Rating`, `Number of Pages`, etc.
- **LibraryThing** — `Primary Author`, `Page Count`, `Collections`, etc.

For other CSV formats, a column mapping UI lets you manually assign each CSV header to a book field. Only **Title** and **Author** are required.

## License

MIT
