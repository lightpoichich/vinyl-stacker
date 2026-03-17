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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { DiscogsSearchResult, Condition } from "@/lib/schemas";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DiscogsSearchResult | null;
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

export function AddToCollectionDialog({
  open,
  onOpenChange,
  result,
}: AddToCollectionDialogProps) {
  const [conditionMedia, setConditionMedia] = useState<string>("");
  const [conditionSleeve, setConditionSleeve] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!result) return null;

  // Parse artist from title (Discogs format: "Artist - Title")
  const parts = result.title.split(" - ");
  const artist = parts.length > 1 ? parts[0].trim() : "Unknown Artist";
  const title = parts.length > 1 ? parts.slice(1).join(" - ").trim() : result.title;

  async function handleSubmit() {
    setLoading(true);
    try {
      const { addToCollection } = await import("@/lib/actions/collection");
      const res = await addToCollection({
        discogsReleaseId: result!.id,
        title,
        artist,
        coverImageUrl: result!.cover_image || null,
        year: result!.year ? parseInt(result!.year, 10) : null,
        genres: result!.genre || [],
        styles: result!.style || [],
        format: result!.format?.join(", ") || null,
        label: result!.label?.[0] || null,
        catno: result!.catno || null,
        country: result!.country || null,
        conditionMedia: (conditionMedia as Condition) || null,
        conditionSleeve: (conditionSleeve as Condition) || null,
        notes: notes || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
      });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Added "${title}" to your collection`);
        onOpenChange(false);
        resetForm();
      }
    } catch {
      toast.error("Failed to add to collection");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setConditionMedia("");
    setConditionSleeve("");
    setNotes("");
    setPurchasePrice("");
    setPurchaseDate("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Adding &ldquo;{title}&rdquo; by {artist}
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
              <Select value={conditionSleeve} onValueChange={(val) => setConditionSleeve(val ?? "")}>
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
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this record..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
