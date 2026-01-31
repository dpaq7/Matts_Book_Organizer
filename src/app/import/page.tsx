import { CsvImporter } from "@/components/csv-importer";

export default function ImportPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Import Books</h2>
      <p className="text-muted-foreground mb-6">
        Upload a Goodreads CSV export to import your book library.
      </p>
      <CsvImporter />
    </div>
  );
}
