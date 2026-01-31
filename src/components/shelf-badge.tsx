import { Badge } from "@/components/ui/badge";

const shelfColors: Record<string, string> = {
  read: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "to-read": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "currently-reading": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  shelved: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function ShelfBadge({ shelf }: { shelf: string }) {
  return (
    <Badge variant="secondary" className={shelfColors[shelf] || ""}>
      {shelf}
    </Badge>
  );
}
