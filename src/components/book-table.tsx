"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CoverImage } from "./cover-image";
import { RatingStars } from "./rating-stars";
import { ShelfBadge } from "./shelf-badge";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteBook, type Book, type SortField, type SortDir } from "@/lib/tauri";
import { formatDate } from "@/lib/utils";

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
  return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
}

interface BookTableProps {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  search: string;
  sortBy: SortField;
  sortDir: SortDir;
  exclusiveShelf: string;
  shelves: { name: string; count: number }[];
  shelf: string;
  onRefresh?: () => void;
}

export function BookTable({ books, total, page, limit, search, sortBy, sortDir, exclusiveShelf, shelves, shelf, onRefresh }: BookTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | number>) {
    const params = new URLSearchParams();
    const merged = { search, sortBy, sortDir, page, exclusiveShelf, shelf, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "" && v !== "all") params.set(k, String(v));
    }
    return `/?${params.toString()}`;
  }

  function handleSort(field: SortField) {
    const newDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
    startTransition(() => router.push(buildUrl({ sortBy: field, sortDir: newDir, page: 1 })));
  }

  function handleSearch() {
    startTransition(() => router.push(buildUrl({ search: searchInput, page: 1 })));
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this book?")) return;
    startTransition(async () => {
      await deleteBook(id);
      onRefresh?.();
    });
  }

  const exclusiveShelves = ["all", "read", "currently-reading", "to-read", "shelved", "to-read-non-fiction"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
          <Input placeholder="Search title, author, ISBN..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
        <Select value={exclusiveShelf || "all"} onValueChange={(v) => startTransition(() => router.push(buildUrl({ exclusiveShelf: v, page: 1 })))}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {exclusiveShelves.map((s) => (<SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={shelf || "all"} onValueChange={(v) => startTransition(() => router.push(buildUrl({ shelf: v, page: 1 })))}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Shelf" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shelves</SelectItem>
            {shelves.map((s) => (<SelectItem key={s.name} value={s.name}>{s.name} ({s.count})</SelectItem>))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} book{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("title")}><span className="flex items-center">Title <SortIcon sortBy={sortBy} sortDir={sortDir} field="title" /></span></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("author")}><span className="flex items-center">Author <SortIcon sortBy={sortBy} sortDir={sortDir} field="author" /></span></TableHead>
              <TableHead className="cursor-pointer select-none w-24" onClick={() => handleSort("myRating")}><span className="flex items-center">Rating <SortIcon sortBy={sortBy} sortDir={sortDir} field="myRating" /></span></TableHead>
              <TableHead className="cursor-pointer select-none w-20 text-right" onClick={() => handleSort("pages")}><span className="flex items-center justify-end">Pages <SortIcon sortBy={sortBy} sortDir={sortDir} field="pages" /></span></TableHead>
              <TableHead className="cursor-pointer select-none w-20 text-right" onClick={() => handleSort("beq")}><span className="flex items-center justify-end">BEq <SortIcon sortBy={sortBy} sortDir={sortDir} field="beq" /></span></TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="cursor-pointer select-none w-28" onClick={() => handleSort("dateRead")}><span className="flex items-center">Date Read <SortIcon sortBy={sortBy} sortDir={sortDir} field="dateRead" /></span></TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No books found. Try adjusting your filters or <Link href="/import" className="underline">import your CSV</Link>.</TableCell></TableRow>
            )}
            {books.map((book) => (
              <TableRow key={book.id} className={isPending ? "opacity-60" : ""}>
                <TableCell><CoverImage url={book.coverUrl} title={book.title} size="sm" /></TableCell>
                <TableCell><Link href={`/book?id=${book.id}`} className="font-medium hover:underline">{book.title}</Link></TableCell>
                <TableCell className="text-muted-foreground">{book.author}</TableCell>
                <TableCell>{book.myRating ? <RatingStars rating={book.myRating} /> : <span className="text-muted-foreground/40 text-xs">—</span>}</TableCell>
                <TableCell className="text-right text-muted-foreground">{book.pages || "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground">{book.beq?.toFixed(2) || "—"}</TableCell>
                <TableCell>{book.exclusiveShelf && <ShelfBadge shelf={book.exclusiveShelf} />}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(book.dateRead)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(book.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => startTransition(() => router.push(buildUrl({ page: page - 1 })))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => startTransition(() => router.push(buildUrl({ page: page + 1 })))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
