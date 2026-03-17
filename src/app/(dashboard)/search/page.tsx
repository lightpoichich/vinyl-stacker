"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiscogsResults } from "@/components/scan/discogs-results";
import { AddToCollectionDialog } from "@/components/vinyl/add-to-collection-dialog";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { DiscogsSearchResult } from "@/lib/schemas";

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<DiscogsSearchResult | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      setSearchQuery(input.trim());
    }
  }

  function handleAddToCollection(result: DiscogsSearchResult) {
    setSelectedResult(result);
    setAddDialogOpen(true);
  }

  async function handleAddToWishlist(result: DiscogsSearchResult) {
    try {
      const { addToWishlist } = await import("@/lib/actions/wishlist");
      const parts = result.title.split(" - ");
      const artist = parts.length > 1 ? parts[0].trim() : "Unknown Artist";
      const title =
        parts.length > 1 ? parts.slice(1).join(" - ").trim() : result.title;

      const res = await addToWishlist({
        discogsReleaseId: result.id,
        title,
        artist,
        coverImageUrl: result.cover_image || null,
        year: result.year ? parseInt(result.year, 10) : null,
        genres: result.genre || [],
        styles: result.style || [],
        format: result.format?.join(", ") || null,
        label: result.label?.[0] || null,
      });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Added "${title}" to your wishlist`);
      }
    } catch {
      toast.error("Failed to add to wishlist");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Search Discogs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search the Discogs database for vinyl records
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Artist, album, or label..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={!input.trim()}>
          Search
        </Button>
      </form>

      {searchQuery && (
        <DiscogsResults
          query={searchQuery}
          onAddToCollection={handleAddToCollection}
          onAddToWishlist={handleAddToWishlist}
        />
      )}

      <AddToCollectionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        result={selectedResult}
      />
    </div>
  );
}
