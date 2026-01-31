"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  onChange,
  readonly = true,
}: {
  rating: number;
  onChange?: (r: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
            !readonly && "cursor-pointer hover:text-yellow-400"
          )}
          onClick={() => !readonly && onChange?.(i === rating ? 0 : i)}
        />
      ))}
    </div>
  );
}
