"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "./rating-stars";
import { createBook, updateBook, lookupISBN, lookupCover, type BookWithShelves, type ShelfWithCount } from "@/lib/tauri";
import { getCoverUrl } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { CoverImage } from "./cover-image";

interface BookFormProps {
  book?: BookWithShelves;
  allShelves: ShelfWithCount[];
}

const exclusiveShelves = ["to-read", "currently-reading", "read", "shelved", "to-read-non-fiction"];

export function BookForm({ book, allShelves }: BookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);

  const [title, setTitle] = useState(book?.title || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const [isbn13, setIsbn13] = useState(book?.isbn13 || "");
  const [publisher, setPublisher] = useState(book?.publisher || "");
  const [pages, setPages] = useState(book?.pages?.toString() || "");
  const [binding, setBinding] = useState(book?.binding || "");
  const [bookType, setBookType] = useState(book?.bookType || "traditional");
  const [yearPublished, setYearPublished] = useState(book?.yearPublished?.toString() || "");
  const [rating, setRating] = useState(book?.myRating || 0);
  const [exclusiveShelf, setExclusiveShelf] = useState(book?.exclusiveShelf || "to-read");
  const [dateRead, setDateRead] = useState(book?.dateRead || "");
  const [review, setReview] = useState(book?.myReview || "");
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl || "");
  const [selectedShelves, setSelectedShelves] = useState<string[]>(
    book?.shelves?.map((s) => s.name) || []
  );

  async function handleIsbnLookup() {
    const lookupIsbn = isbn13 || isbn;
    if (!lookupIsbn) return;
    setFetching(true);
    try {
      const data = await lookupISBN(lookupIsbn);
      const fetchedTitle = data?.title || title;
      const fetchedAuthor = data?.authors?.[0]?.name || author;
      if (data) {
        if (data.title && !title) setTitle(data.title);
        if (data.authors?.[0]?.name && !author) setAuthor(data.authors[0].name);
        if (data.publishers?.[0]?.name && !publisher) setPublisher(data.publishers[0].name);
        if (data.number_of_pages && !pages) setPages(data.number_of_pages.toString());
      }
      // Resolve cover via fallback chain
      const cover = await lookupCover(isbn || null, isbn13 || null, fetchedTitle, fetchedAuthor);
      if (cover) setCoverUrl(cover);
    } finally {
      setFetching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pageNum = parseInt(pages) || null;
    const data = {
      title,
      author,
      authorSort: author.includes(",") ? author : author.split(" ").reverse().join(", "),
      isbn: isbn || null,
      isbn13: isbn13 || null,
      publisher: publisher || null,
      pages: pageNum,
      binding: binding || null,
      bookType,
      yearPublished: parseInt(yearPublished) || null,
      myRating: rating,
      exclusiveShelf,
      dateRead: dateRead || null,
      myReview: review || null,
      coverUrl: coverUrl || getCoverUrl(isbn, isbn13),
      shelfNames: selectedShelves,
    };

    startTransition(async () => {
      if (book) {
        await updateBook(book.id, data);
        router.push(`/book?id=${book.id}`);
      } else {
        const result = await createBook(data);
        router.push(`/book?id=${result.id}`);
      }
    });
  }

  function toggleShelf(name: string) {
    setSelectedShelves((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>ISBN Lookup</Label>
        <div className="flex gap-2">
          <Input placeholder="ISBN or ISBN-13" value={isbn13 || isbn} onChange={(e) => e.target.value.length > 10 ? setIsbn13(e.target.value) : setIsbn(e.target.value)} />
          <Button type="button" variant="secondary" onClick={handleIsbnLookup} disabled={fetching}>
            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1">Fetch</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Enter an ISBN and click Fetch to auto-fill book details from Open Library</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Author *</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Publisher</Label><Input value={publisher} onChange={(e) => setPublisher(e.target.value)} /></div>
        <div className="space-y-2"><Label>Pages</Label><Input type="number" value={pages} onChange={(e) => setPages(e.target.value)} /></div>
        <div className="space-y-2"><Label>Binding</Label><Input value={binding} onChange={(e) => setBinding(e.target.value)} placeholder="Paperback, Hardcover..." /></div>
        <div className="space-y-2">
          <Label>Book Type</Label>
          <Select value={bookType} onValueChange={setBookType}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="graphic_novel">Graphic Novel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Year Published</Label><Input type="number" value={yearPublished} onChange={(e) => setYearPublished(e.target.value)} /></div>
        <div className="space-y-2"><Label>Date Read</Label><Input type="date" value={dateRead?.replace(/\//g, "-") || ""} onChange={(e) => setDateRead(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        <Label>Cover URL</Label>
        <div className="flex gap-3 items-start">
          <Input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://... (paste a cover image URL)"
            className="flex-1"
          />
          <CoverImage url={coverUrl || null} title={title || "Preview"} size="md" />
        </div>
        <p className="text-xs text-muted-foreground">Auto-filled by ISBN Fetch, or paste your own image URL</p>
      </div>

      <div className="space-y-2"><Label>My Rating</Label><RatingStars rating={rating} onChange={setRating} readonly={false} /></div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={exclusiveShelf} onValueChange={setExclusiveShelf}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{exclusiveShelves.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Shelves</Label>
        <div className="flex flex-wrap gap-2">
          {allShelves.map((s) => (
            <Button key={s.id} type="button" variant={selectedShelves.includes(s.name) ? "default" : "outline"} size="sm" onClick={() => toggleShelf(s.name)}>{s.name}</Button>
          ))}
        </div>
      </div>

      <div className="space-y-2"><Label>Review</Label><Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={4} /></div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : book ? "Update Book" : "Add Book"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
