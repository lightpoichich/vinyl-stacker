"use client";

import { Button } from "@/components/ui/button";
import { Disc3, Plus, Heart } from "lucide-react";
import type { DiscogsSearchResult } from "@/lib/schemas";

interface DiscogsResultCardProps {
  result: DiscogsSearchResult;
  onAddToCollection?: (result: DiscogsSearchResult) => void;
  onAddToWishlist?: (result: DiscogsSearchResult) => void;
}

export function DiscogsResultCard({
  result,
  onAddToCollection,
  onAddToWishlist,
}: DiscogsResultCardProps) {
  const yearDisplay = result.year || "Unknown year";
  const formatDisplay = result.format?.join(", ") || "Unknown format";

  return (
    <div className="flex gap-3 rounded-xl border border-border/50 bg-card p-3 transition-colors hover:border-primary/20">
      {/* Thumbnail */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {result.thumb ? (
          <img
            src={result.thumb}
            alt={result.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Disc3 className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="line-clamp-1 text-sm font-medium">{result.title}</h4>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {yearDisplay} - {formatDisplay}
        </p>
        {result.label && result.label.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground/60">
            {result.label[0]}
            {result.catno ? ` - ${result.catno}` : ""}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          {onAddToCollection && (
            <Button
              size="xs"
              className="gap-1"
              onClick={() => onAddToCollection(result)}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
          {onAddToWishlist && (
            <Button
              size="xs"
              variant="outline"
              className="gap-1"
              onClick={() => onAddToWishlist(result)}
            >
              <Heart className="h-3 w-3" />
              Wishlist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
