"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TableBody, TableCell, TableHead, TableHeader, TableRow,
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

// Default column widths in pixels
const DEFAULT_WIDTHS = {
  cover: 48,
  title: 280,
  author: 180,
  rating: 96,
  pages: 72,
  beq: 72,
  status: 112,
  dateRead: 112,
  actions: 40,
};

type ColumnKey = keyof typeof DEFAULT_WIDTHS;

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

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const startX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      onResize(moveEvent.clientX - startX.current);
      startX.current = moveEvent.clientX;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [onResize]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 z-10"
    />
  );
}

export function BookTable({ books, total, page, limit, search, sortBy, sortDir, exclusiveShelf, shelves, shelf, onRefresh }: BookTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [widths, setWidths] = useState<Record<ColumnKey, number>>({ ...DEFAULT_WIDTHS });

  const totalPages = Math.ceil(total / limit);

  const resizeColumn = useCallback((col: ColumnKey, delta: number) => {
    setWidths(prev => ({
      ...prev,
      [col]: Math.max(40, prev[col] + delta),
    }));
  }, []);

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

  const tableWidth = Object.values(widths).reduce((a, b) => a + b, 0);

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

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full caption-bottom text-sm" style={{ tableLayout: "fixed", minWidth: tableWidth }}>
          <colgroup>
            <col style={{ width: widths.cover }} />
            <col style={{ width: widths.title }} />
            <col style={{ width: widths.author }} />
            <col style={{ width: widths.rating }} />
            <col style={{ width: widths.pages }} />
            <col style={{ width: widths.beq }} />
            <col style={{ width: widths.status }} />
            <col style={{ width: widths.dateRead }} />
            <col style={{ width: widths.actions }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="relative">
                <ResizeHandle onResize={(d) => resizeColumn("cover", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none" onClick={() => handleSort("title")}>
                <span className="flex items-center">Title <SortIcon sortBy={sortBy} sortDir={sortDir} field="title" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("title", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none" onClick={() => handleSort("author")}>
                <span className="flex items-center">Author <SortIcon sortBy={sortBy} sortDir={sortDir} field="author" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("author", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none" onClick={() => handleSort("myRating")}>
                <span className="flex items-center">Rating <SortIcon sortBy={sortBy} sortDir={sortDir} field="myRating" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("rating", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none text-right" onClick={() => handleSort("pages")}>
                <span className="flex items-center justify-end">Pages <SortIcon sortBy={sortBy} sortDir={sortDir} field="pages" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("pages", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none text-right" onClick={() => handleSort("beq")}>
                <span className="flex items-center justify-end">BEq <SortIcon sortBy={sortBy} sortDir={sortDir} field="beq" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("beq", d)} />
              </TableHead>
              <TableHead className="relative">
                Status
                <ResizeHandle onResize={(d) => resizeColumn("status", d)} />
              </TableHead>
              <TableHead className="relative cursor-pointer select-none" onClick={() => handleSort("dateRead")}>
                <span className="flex items-center">Date Read <SortIcon sortBy={sortBy} sortDir={sortDir} field="dateRead" /></span>
                <ResizeHandle onResize={(d) => resizeColumn("dateRead", d)} />
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8 !whitespace-normal">No books found. Try adjusting your filters or <Link href="/import" className="underline">import your CSV</Link>.</TableCell></TableRow>
            )}
            {books.map((book) => (
              <TableRow key={book.id} className={isPending ? "opacity-60" : ""}>
                <TableCell><CoverImage url={book.coverUrl} title={book.title} size="sm" /></TableCell>
                <TableCell className="!whitespace-normal break-words"><Link href={`/book?id=${book.id}`} className="font-medium hover:underline">{book.title}</Link></TableCell>
                <TableCell className="text-muted-foreground !whitespace-normal break-words">{book.author}</TableCell>
                <TableCell>{book.myRating ? <RatingStars rating={book.myRating} /> : <span className="text-muted-foreground/40 text-xs">—</span>}</TableCell>
                <TableCell className="text-right text-muted-foreground">{book.pages || "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground">{book.beq?.toFixed(2) || "—"}</TableCell>
                <TableCell>{book.exclusiveShelf && <ShelfBadge shelf={book.exclusiveShelf} />}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(book.dateRead)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(book.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
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
