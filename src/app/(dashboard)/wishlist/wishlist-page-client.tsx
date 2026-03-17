"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VinylGrid } from "@/components/vinyl/vinyl-grid";
import { MoveToCollectionDialog } from "@/components/vinyl/move-to-collection-dialog";
import { Button } from "@/components/ui/button";
import { Disc3, Heart, ArrowRightLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WishlistItem } from "@/lib/schemas";

interface WishlistPageClientProps {
  items: WishlistItem[];
}

export function WishlistPageClient({ items }: WishlistPageClientProps) {
  const router = useRouter();
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleMoveClick(item: WishlistItem) {
    setSelectedItem(item);
    setMoveDialogOpen(true);
  }

  async function handleRemove(item: WishlistItem) {
    setRemovingId(item.id);
    try {
      const { removeFromWishlist } = await import("@/lib/actions/wishlist");
      const res = await removeFromWishlist({ id: item.id });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Removed "${item.title}" from wishlist`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Wishlist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} record{items.length !== 1 ? "s" : ""} on your wishlist
        </p>
      </div>

      {items.length > 0 ? (
        <VinylGrid>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30"
            >
              {/* Cover art */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={`${item.title} by ${item.artist}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Disc3 className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-0.5 p-3">
                <h3 className="line-clamp-1 text-sm font-medium leading-tight">
                  {item.title}
                </h3>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {item.artist}
                </p>
                {item.year && (
                  <p className="text-xs text-muted-foreground/60">
                    {item.year}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-1.5 pt-2">
                  <Button
                    size="xs"
                    className="flex-1 gap-1"
                    onClick={() => handleMoveClick(item)}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Got it!
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => handleRemove(item)}
                    disabled={removingId === item.id}
                  >
                    {removingId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </VinylGrid>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Your wishlist is empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search for records and add them to your wishlist
            </p>
          </div>
        </div>
      )}

      <MoveToCollectionDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        item={selectedItem}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
