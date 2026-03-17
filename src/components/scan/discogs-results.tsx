"use client";

import { useState, useEffect } from "react";
import { DiscogsResultCard } from "@/components/vinyl/discogs-result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { DiscogsSearchResult, DiscogsSearchResponse } from "@/lib/schemas";

interface DiscogsResultsProps {
  query: string;
  onAddToCollection: (result: DiscogsSearchResult) => void;
  onAddToWishlist: (result: DiscogsSearchResult) => void;
}

export function DiscogsResults({
  query,
  onAddToCollection,
  onAddToWishlist,
}: DiscogsResultsProps) {
  const [results, setResults] = useState<DiscogsSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!query.trim()) return;
    setPage(1);
    fetchResults(query, 1);
  }, [query]);

  async function fetchResults(q: string, p: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        type: "release",
        page: p.toString(),
        per_page: "15",
      });
      const res = await fetch(`/api/discogs/search?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message || "Search failed");
      }
      const json = await res.json();
      const data = json.data as DiscogsSearchResponse;
      setResults(data.results);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage: number) {
    fetchResults(query, newPage);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-semibold">
          Discogs Results
        </h3>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-border/50 p-3">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-auto h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
        No results found for &ldquo;{query}&rdquo;. Try adjusting the search query.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-[family-name:var(--font-space-grotesk)] font-semibold">
        Discogs Results
      </h3>
      {results.map((result) => (
        <DiscogsResultCard
          key={result.id}
          result={result}
          onAddToCollection={onAddToCollection}
          onAddToWishlist={onAddToWishlist}
        />
      ))}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
