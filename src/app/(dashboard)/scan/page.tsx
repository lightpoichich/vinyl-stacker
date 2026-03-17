"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/scan/camera-capture";
import { ImageAnalyzer } from "@/components/scan/image-analyzer";
import { DiscogsResults } from "@/components/scan/discogs-results";
import { AddToCollectionDialog } from "@/components/vinyl/add-to-collection-dialog";
import { toast } from "sonner";
import type { DiscogsSearchResult } from "@/lib/schemas";

export default function ScanPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<DiscogsSearchResult | null>(null);

  function handleCapture(data: string) {
    setImageData(data);
    setSearchQuery("");
  }

  function handleSearchQuery(query: string) {
    setSearchQuery(query);
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
          Scan Vinyl
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Take a photo of a record cover or label to identify it using AI
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Step 1: Capture */}
        <CameraCapture onCapture={handleCapture} />

        {/* Step 2: Analyze */}
        {imageData && (
          <ImageAnalyzer
            imageData={imageData}
            onSearchQuery={handleSearchQuery}
          />
        )}

        {/* Step 3: Results */}
        {searchQuery && (
          <DiscogsResults
            query={searchQuery}
            onAddToCollection={handleAddToCollection}
            onAddToWishlist={handleAddToWishlist}
          />
        )}
      </div>

      <AddToCollectionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        result={selectedResult}
      />
    </div>
  );
}
