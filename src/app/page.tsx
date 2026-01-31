"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BookTable } from "@/components/book-table";
import { getBooks, getShelves, type Book, type ShelfWithCount, type SortField, type SortDir } from "@/lib/tauri";

export default function HomePage() {
  return <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}><HomeInner /></Suspense>;
}

function HomeInner() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [shelves, setShelves] = useState<ShelfWithCount[]>([]);

  const search = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sortBy") as SortField) || "dateAdded";
  const sortDir = (searchParams.get("sortDir") as SortDir) || "desc";
  const page = parseInt(searchParams.get("page") || "1") || 1;
  const exclusiveShelf = searchParams.get("exclusiveShelf") || "";
  const shelf = searchParams.get("shelf") || "";

  const fetchData = useCallback(async () => {
    try {
      const [booksResult, shelvesResult] = await Promise.all([
        getBooks({ search, sortBy, sortDir, page, limit: 50, exclusiveShelf: exclusiveShelf || undefined, shelf: shelf || undefined }),
        getShelves(),
      ]);
      setBooks(booksResult.books);
      setTotal(booksResult.total);
      setShelves(shelvesResult);
    } catch (e) {
      console.error("Failed to fetch books:", e);
    }
  }, [search, sortBy, sortDir, page, exclusiveShelf, shelf]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [booksResult, shelvesResult] = await Promise.all([
          getBooks({ search, sortBy, sortDir, page, limit: 50, exclusiveShelf: exclusiveShelf || undefined, shelf: shelf || undefined }),
          getShelves(),
        ]);
        if (!cancelled) {
          setBooks(booksResult.books);
          setTotal(booksResult.total);
          setShelves(shelvesResult);
        }
      } catch (e) {
        console.error("Failed to fetch books:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [search, sortBy, sortDir, page, exclusiveShelf, shelf]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Library</h2>
      <BookTable
        books={books}
        total={total}
        page={page}
        limit={50}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        exclusiveShelf={exclusiveShelf}
        shelves={shelves}
        shelf={shelf}
        onRefresh={fetchData}
      />
    </div>
  );
}
