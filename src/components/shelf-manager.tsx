"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createShelf, renameShelf, deleteShelf } from "@/lib/tauri";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface ShelfManagerProps {
  shelves: { id: number; name: string; count: number }[];
  onRefresh: () => void;
}

export function ShelfManager({ shelves, onRefresh }: ShelfManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      await createShelf(newName.trim());
      setNewName("");
      onRefresh();
    });
  }

  function handleRename(id: number) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await renameShelf(id, editName.trim());
      setEditingId(null);
      onRefresh();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete shelf "${name}"? Books will not be deleted.`)) return;
    startTransition(async () => {
      await deleteShelf(id);
      onRefresh();
    });
  }

  return (
    <div className="space-y-4 max-w-lg">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="New shelf name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={isPending || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </form>

      <div className="space-y-2">
        {shelves.map((shelf) => (
          <Card key={shelf.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              {editingId === shelf.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleRename(shelf.id)}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(shelf.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">{shelf.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({shelf.count} books)</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setEditingId(shelf.id); setEditName(shelf.name); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(shelf.id, shelf.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {shelves.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No shelves yet. Create one above or import your CSV.</p>
        )}
      </div>
    </div>
  );
}
