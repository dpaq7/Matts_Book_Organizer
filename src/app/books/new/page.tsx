"use client";

import { useEffect, useState } from "react";
import { BookForm } from "@/components/book-form";
import { getShelves, type ShelfWithCount } from "@/lib/tauri";

export default function NewBookPage() {
  const [shelves, setShelves] = useState<ShelfWithCount[]>([]);
  useEffect(() => { getShelves().then(setShelves); }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Book</h2>
      <BookForm allShelves={shelves} />
    </div>
  );
}
