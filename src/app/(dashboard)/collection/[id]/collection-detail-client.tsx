"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConditionBadge } from "@/components/vinyl/condition-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Disc3,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  Loader2,
} from "lucide-react";
import type { CollectionItem, Condition } from "@/lib/schemas";

interface CollectionDetailClientProps {
  item: CollectionItem;
  tracklist: { position: string; title: string; duration: string }[];
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

export function CollectionDetailClient({
  item,
  tracklist,
}: CollectionDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Edit form state
  const [conditionMedia, setConditionMedia] = useState(
    item.conditionMedia || ""
  );
  const [conditionSleeve, setConditionSleeve] = useState(
    item.conditionSleeve || ""
  );
  const [notes, setNotes] = useState(item.notes || "");
  const [purchasePrice, setPurchasePrice] = useState(
    item.purchasePrice?.toString() || ""
  );
  const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate || "");

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove this record from your collection?")) {
      return;
    }
    setDeleteLoading(true);
    try {
      const { removeFromCollection } = await import(
        "@/lib/actions/collection"
      );
      const res = await removeFromCollection({ id: item.id });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success("Removed from collection");
        router.push("/collection");
      }
    } catch {
      toast.error("Failed to remove from collection");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEdit() {
    setEditLoading(true);
    try {
      const { updateCollectionItem } = await import(
        "@/lib/actions/collection"
      );
      const res = await updateCollectionItem({
        id: item.id,
        conditionMedia: (conditionMedia as Condition) || null,
        conditionSleeve: (conditionSleeve as Condition) || null,
        notes: notes || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
      });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.success("Updated successfully");
        setEditOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back nav */}
      <Link
        href="/collection"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Collection
      </Link>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Cover art */}
        <div className="w-full shrink-0 md:w-64">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted">
            {item.coverImageUrl ? (
              <img
                src={item.coverImageUrl}
                alt={`${item.title} by ${item.artist}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Disc3 className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
            {item.title}
          </h1>
          <p className="text-lg text-muted-foreground">{item.artist}</p>

          {/* Conditions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {item.conditionMedia && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Media:</span>
                <ConditionBadge
                  condition={item.conditionMedia}
                  showLabel
                />
              </div>
            )}
            {item.conditionSleeve && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sleeve:</span>
                <ConditionBadge
                  condition={item.conditionSleeve}
                  showLabel
                />
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.year && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{item.year}</span>
              </div>
            )}
            {item.format && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Disc3 className="h-4 w-4" />
                <span>{item.format}</span>
              </div>
            )}
            {item.label && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>
                  {item.label}
                  {item.catno ? ` (${item.catno})` : ""}
                </span>
              </div>
            )}
            {item.country && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{item.country}</span>
              </div>
            )}
            {item.purchasePrice != null && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>${item.purchasePrice.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {item.genres && item.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {genre}
                </span>
              ))}
              {(item.styles || []).map((style) => (
                <span
                  key={style}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {style}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-medium">Notes</h3>
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      {tracklist.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
            Tracklist
          </h2>
          <div className="rounded-xl border border-border/50 bg-card">
            {tracklist.map((track, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/30 px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="w-8 shrink-0 text-xs text-muted-foreground">
                  {track.position}
                </span>
                <span className="flex-1">{track.title}</span>
                {track.duration && (
                  <span className="text-xs text-muted-foreground">
                    {track.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Media Condition</Label>
                <Select
                  value={conditionMedia}
                  onValueChange={(val) => setConditionMedia(val ?? "")}
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
                <Label htmlFor="editPrice">Purchase Price</Label>
                <Input
                  id="editPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editDate">Purchase Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
