"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { fixMissingCovers, clearDatabase } from "@/lib/tauri";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const [fixing, setFixing] = useState(false);
  const [coverResult, setCoverResult] = useState<{ fixed: number; checked: number } | null>(null);

  async function handleFixCovers() {
    setFixing(true);
    setCoverResult(null);
    try {
      const res = await fixMissingCovers();
      setCoverResult(res);
    } finally {
      setFixing(false);
    }
  }

  async function handleClearDatabase() {
    await clearDatabase();
    window.location.href = "/";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Re-fetch Covers
          </CardTitle>
          <CardDescription>
            Search Google Books and Open Library for cover art on books that are missing covers or have invalid placeholder images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleFixCovers} disabled={fixing}>
            {fixing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
            {fixing ? "Fetching..." : "Re-fetch Covers"}
          </Button>
          {coverResult && (
            <p className="text-sm text-muted-foreground">
              Updated {coverResult.fixed} of {coverResult.checked} covers.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Clear Database
          </CardTitle>
          <CardDescription>
            Permanently delete all books, shelves, and reading data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear Database</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Database</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This cannot be undone. All books, shelves, and reading data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearDatabase}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
