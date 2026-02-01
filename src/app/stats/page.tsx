"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats } from "@/lib/tauri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Star, BarChart3, Calendar } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { getStats().then(setStats); }, []);

  if (!stats) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reading Stats</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={stats.totalBooks} />
        <StatCard icon={BookOpen} label="Books Read" value={stats.totalRead} />
        <StatCard icon={BarChart3} label="Total BEq" value={stats.totalBeq} />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating} />
        <StatCard icon={Calendar} label="Books This Year" value={stats.booksThisYear} />
        <StatCard icon={BarChart3} label="BEq This Year" value={stats.beqThisYear} />
        <StatCard icon={BarChart3} label="BEq_B (Traditional)" value={stats.totalBeqTraditional} subtitle={stats.avgPagesTraditional > 0 ? `÷ ${Math.round(stats.avgPagesTraditional)} avg pp` : undefined} />
        <StatCard icon={BarChart3} label="BEq_G (Graphic Novel)" value={stats.totalBeqGraphicNovel} subtitle={stats.avgPagesGraphicNovel > 0 ? `÷ ${Math.round(stats.avgPagesGraphicNovel)} avg pp` : undefined} />
      </div>

      {/* Books by Year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Books by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.byYear.map((row) => (
              <div key={row.year} className="flex items-center gap-3">
                <span className="text-sm font-medium w-12">{row.year}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded"
                    style={{ width: `${Math.min((row.count / Math.max(...stats.byYear.map((r) => r.count))) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-20">
                  {row.count} books ({row.beq.toFixed(1)} BEq)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const row = stats.ratingDist.find((r) => r.rating === rating);
              const count = row?.count || 0;
              const max = Math.max(...stats.ratingDist.map((r) => r.count), 1);
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-12">{"★".repeat(rating)}</span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400/70 rounded"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle }: { icon: React.ElementType; label: string; value: number; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
