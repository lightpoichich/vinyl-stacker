"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { WishlistItem, Condition } from "@/lib/schemas";

interface MoveToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishlistItem | null;
  onSuccess?: () => void;
}

const conditionOptions: { value: Condition; label: string }[] = [
  { value: "M", label: "Mint (M)" },
  { value: "NM", label: "Near Mint (NM)" },
  { value: "VG+", label: "Very Good+ (VG+)" },
  { value: "VG", label: "Very Good (VG)" },
  { value: "G+", label: "Good+ (G+)" },
  { value: "G", label: "Good (G)" },
  { value: "F", label: "Fair (F)" },
  { value: "P", label: "Poor (P)" },
];

export function MoveToCollectionDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: MoveToCollectionDialogProps) {
  const [conditionMedia, setConditionMedia] = useState<string>("");
  const [conditionSleeve, setConditionSleeve] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  async function handleSubmit() {
    setLoading(true);
    try {
      const { moveWishlistToCollection } = await import(
        "@/lib/actions/wishlist"
      );
      const res = await moveWishlistToCollection({
        wishlistItemId: item!.id,
        conditionMedia: (conditionMedia as Condition) || null,
        conditionSleeve: (conditionSleeve as Condition) || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
      });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Moved "${item!.title}" to your collection`);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to move to collection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
          <DialogDescription>
            Moving &ldquo;{item.title}&rdquo; by {item.artist} from your
            wishlist
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Media Condition</Label>
              <Select value={conditionMedia} onValueChange={(val) => setConditionMedia(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sleeve Condition</Label>
              <Select
                value={conditionSleeve}
                onValueChange={(val) => setConditionSleeve(val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movePrice">Purchase Price</Label>
              <Input
                id="movePrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="moveDate">Purchase Date</Label>
              <Input
                id="moveDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move to Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
