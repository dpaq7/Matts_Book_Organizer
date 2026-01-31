"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";

export function CoverImage({ url, title, size = "sm" }: { url: string | null; title: string; size?: "sm" | "md" | "lg" }) {
  const [error, setError] = useState(false);

  const dims = { sm: "h-12 w-8", md: "h-24 w-16", lg: "h-48 w-32" }[size];

  if (!url || error) {
    return (
      <div className={`${dims} bg-muted rounded flex items-center justify-center shrink-0`}>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className={`${dims} object-cover rounded shrink-0`}
      onError={() => setError(true)}
      onLoad={(e) => {
        // Open Library returns a 1x1 transparent pixel when no cover exists
        const img = e.currentTarget;
        if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
          setError(true);
        }
      }}
    />
  );
}
