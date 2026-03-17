"use client";

import { useState, useMemo } from "react";
import { VinylCard } from "@/components/vinyl/vinyl-card";
import { VinylGrid } from "@/components/vinyl/vinyl-grid";
import { FilterBar } from "@/components/vinyl/filter-bar";
import { Library } from "lucide-react";
import type { CollectionItem } from "@/lib/schemas";

interface CollectionPageClientProps {
  items: CollectionItem[];
  genres: string[];
}

export function CollectionPageClient({
  items,
  genres,
}: CollectionPageClientProps) {
  const [filters, setFilters] = useState({
    search: "",
    genre: "",
    condition: "",
    yearFrom: "",
    yearTo: "",
  });

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesArtist = item.artist.toLowerCase().includes(q);
        if (!matchesTitle && !matchesArtist) return false;
      }
      if (filters.genre && !(item.genres || []).includes(filters.genre)) {
        return false;
      }
      if (filters.condition && item.conditionMedia !== filters.condition) {
        return false;
      }
      if (filters.yearFrom && item.year && item.year < parseInt(filters.yearFrom)) {
        return false;
      }
      if (filters.yearTo && item.year && item.year > parseInt(filters.yearTo)) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Collection
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} record{items.length !== 1 ? "s" : ""} in your collection
        </p>
      </div>

      {items.length > 0 ? (
        <>
          <div className="mb-6">
            <FilterBar genres={genres} onFilterChange={setFilters} />
          </div>
          {filtered.length > 0 ? (
            <VinylGrid>
              {filtered.map((item) => (
                <VinylCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  artist={item.artist}
                  coverImageUrl={item.coverImageUrl}
                  year={item.year}
                  format={item.format}
                  conditionMedia={item.conditionMedia}
                  href={`/collection/${item.id}`}
                />
              ))}
            </VinylGrid>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No records match your filters.
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Library className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Your collection is empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan a record or search Discogs to start building your collection
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
