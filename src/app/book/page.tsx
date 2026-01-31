"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBook, getShelves, type BookWithShelves, type ShelfWithCount } from "@/lib/tauri";
import { BookForm } from "@/components/book-form";
import { CoverImage } from "@/components/cover-image";
import { RatingStars } from "@/components/rating-stars";
import { ShelfBadge } from "@/components/shelf-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default function BookDetailPage() {
  return <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}><BookDetailInner /></Suspense>;
}

function BookDetailInner() {
  const searchParams = useSearchParams();
  const id = parseInt(searchParams.get("id") || "0");
  const edit = searchParams.get("edit") === "true";

  const [book, setBook] = useState<BookWithShelves | null>(null);
  const [shelves, setShelves] = useState<ShelfWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const b = await getBook(id);
        setBook(b);
        if (edit) {
          const s = await getShelves();
          setShelves(s);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, edit]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!book) return <p className="text-muted-foreground">Book not found.</p>;

  if (edit) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Edit Book</h2>
        <BookForm book={book} allShelves={shelves} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-6 mb-6">
        <CoverImage url={book.coverUrl} title={book.title} size="lg" />
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold">{book.title}</h2>
          <p className="text-lg text-muted-foreground">{book.author}</p>
          {book.additionalAuthors && (
            <p className="text-sm text-muted-foreground">with {book.additionalAuthors}</p>
          )}
          <div className="flex items-center gap-3">
            {book.myRating ? <RatingStars rating={book.myRating} /> : null}
            {book.exclusiveShelf && <ShelfBadge shelf={book.exclusiveShelf} />}
          </div>
          {book.shelves && book.shelves.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {book.shelves.map((s) => (
                <Badge key={s.id} variant="outline">{s.name}</Badge>
              ))}
            </div>
          )}
          <Link href={`/book?id=${book.id}&edit=true`}>
            <Button variant="outline" size="sm" className="mt-2">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Detail label="Publisher" value={book.publisher} />
        <Detail label="Binding" value={book.binding} />
        <Detail label="Pages" value={book.pages?.toString()} />
        <Detail label="BEq" value={book.beq?.toFixed(2)} />
        <Detail label="ISBN" value={book.isbn} />
        <Detail label="ISBN-13" value={book.isbn13} />
        <Detail label="Published" value={book.yearPublished?.toString()} />
        <Detail label="Edition" value={book.editionPublished?.toString()} />
        <Detail label="Date Read" value={formatDate(book.dateRead)} />
        <Detail label="Date Added" value={formatDate(book.dateAdded)} />
        <Detail label="Read Count" value={book.readCount?.toString()} />
        <Detail label="Owned Copies" value={book.ownedCopies?.toString()} />
        <Detail label="Avg Rating" value={book.averageRating?.toFixed(2)} />
      </div>

      {book.myReview && (
        <>
          <Separator className="my-4" />
          <div>
            <h3 className="font-semibold mb-2">Review</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{book.myReview}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}
