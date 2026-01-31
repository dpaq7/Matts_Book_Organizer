"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, Upload, BarChart3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "All Books", icon: BookOpen },
  { href: "/shelves", label: "Shelves", icon: Library },
  { href: "/books/new", label: "Add Book", icon: Plus },
  { href: "/import", label: "Import CSV", icon: Upload },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-muted/30 p-4 flex flex-col gap-1 shrink-0">
      <h1 className="text-lg font-semibold mb-4 px-2">Matt&apos;s Books</h1>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 px-2">
        <span className="text-xs text-muted-foreground/50">v0.1.0</span>
      </div>
    </aside>
  );
}
