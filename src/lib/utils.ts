import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const normalized = dateStr.replace(/\//g, "-");
  try {
    const d = new Date(normalized);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function getCoverUrl(isbn: string | null | undefined, isbn13: string | null | undefined): string | null {
  const id = isbn13 || isbn;
  if (!id) return null;
  return `https://covers.openlibrary.org/b/isbn/${id}-M.jpg`;
}
