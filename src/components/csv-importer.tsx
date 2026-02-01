"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ArrowRight, Check } from "lucide-react";
import { importCsv, previewCsvHeaders, autoDetectColumns } from "@/lib/tauri";

// Our canonical fields that can be mapped
const BOOK_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "author", label: "Author", required: true },
  { key: "author_sort", label: "Author (sorted)" },
  { key: "additional_authors", label: "Additional Authors" },
  { key: "isbn", label: "ISBN" },
  { key: "isbn13", label: "ISBN-13" },
  { key: "my_rating", label: "My Rating" },
  { key: "average_rating", label: "Average Rating" },
  { key: "publisher", label: "Publisher" },
  { key: "binding", label: "Binding" },
  { key: "pages", label: "Pages" },
  { key: "year_published", label: "Year Published" },
  { key: "edition_published", label: "Edition Published" },
  { key: "date_read", label: "Date Read" },
  { key: "year_read", label: "Year Read" },
  { key: "date_added", label: "Date Added" },
  { key: "exclusive_shelf", label: "Status / Shelf" },
  { key: "my_review", label: "Review" },
  { key: "read_count", label: "Read Count" },
  { key: "owned_copies", label: "Owned Copies" },
  { key: "bookshelves", label: "Shelves / Tags" },
  { key: "goodreads_id", label: "Goodreads ID" },
  { key: "book_type", label: "Book Type" },
] as const;

type Step = "upload" | "map" | "done";

export function CsvImporter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [result, setResult] = useState<{ imported: number; total: number; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);

  // Column mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [detectedCount, setDetectedCount] = useState(0);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setResult(null);
    setStep("upload");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);

      try {
        // Get headers and auto-detect columns
        const headers = await previewCsvHeaders(text);
        setCsvHeaders(headers);
        const detected = await autoDetectColumns(headers);
        setColumnMap(detected);
        setDetectedCount(Object.keys(detected).length);
        setStep("map");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read CSV headers");
      }
    };
    reader.readAsText(file);
  }

  function updateMapping(field: string, csvHeader: string) {
    setColumnMap((prev) => {
      const next = { ...prev };
      if (csvHeader === "__none__") {
        delete next[field];
      } else {
        next[field] = csvHeader;
      }
      return next;
    });
  }

  function handleImport() {
    if (!csvText) return;
    startTransition(async () => {
      try {
        const res = await importCsv(csvText, columnMap);
        setResult(res);
        setStep("done");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  const mappedRequired = BOOK_FIELDS.filter((f) => "required" in f && f.required).every(
    (f) => columnMap[f.key]
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Import CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <label className="cursor-pointer text-sm">
            <span className="text-primary underline">Choose a CSV file</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName && <p className="mt-2 text-sm text-muted-foreground">{fileName}</p>}
        </div>

        {/* Step 2: Column Mapping */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Map your CSV columns to book fields
              </p>
              <span className="text-xs text-muted-foreground">
                {detectedCount > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    Auto-detected {detectedCount} columns
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {BOOK_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-sm w-40 shrink-0">
                    {field.label}
                    {"required" in field && field.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Select
                    value={columnMap[field.key] || "__none__"}
                    onValueChange={(v) => updateMapping(field.key, v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="— skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— skip —</SelectItem>
                      {csvHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {columnMap[field.key] && (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {!mappedRequired && (
              <p className="text-xs text-destructive">
                Title and Author are required. Map them above to continue.
              </p>
            )}

            <Button
              onClick={handleImport}
              disabled={isPending || !mappedRequired}
              className="w-full"
            >
              {isPending ? "Importing..." : "Import Books"}
            </Button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "done" && result && (
          <div className="space-y-2">
            <div className="text-sm text-green-600 dark:text-green-400">
              Successfully imported {result.imported} of {result.total} books.
            </div>
            {result.skipped.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Skipped {result.skipped.length} duplicate{result.skipped.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-1 max-h-48 overflow-y-auto space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {result.skipped.map((title, i) => (
                    <li key={i}>• {title}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}
      </CardContent>
    </Card>
  );
}
