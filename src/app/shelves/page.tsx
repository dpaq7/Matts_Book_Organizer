"use client";

import { useEffect, useState } from "react";
import { getShelves, type ShelfWithCount } from "@/lib/tauri";
import { ShelfManager } from "@/components/shelf-manager";

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<ShelfWithCount[]>([]);

  function refresh() {
    getShelves().then(setShelves);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Shelves</h2>
      <ShelfManager shelves={shelves} onRefresh={refresh} />
    </div>
  );
}
