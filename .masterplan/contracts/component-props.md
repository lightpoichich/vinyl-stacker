# Component Props Contract

> Immutable. Only the Conductor may modify this document.

## Shared Types

```ts
// Re-exported from Zod schemas
type CollectionItem = z.infer<typeof CollectionItemSchema>;
type WishlistItem = z.infer<typeof WishlistItemSchema>;
type DiscogsSearchResult = z.infer<typeof DiscogsSearchResultSchema>;
type DiscogsRelease = z.infer<typeof DiscogsReleaseSchema>;
type Condition = z.infer<typeof ConditionSchema>;
```

## Component Interfaces

### VinylCard
```ts
interface VinylCardProps {
  id: string;
  title: string;
  artist: string;
  coverImageUrl: string | null;
  year: number | null;
  format: string | null;
  conditionMedia?: Condition | null; // only for collection items
  href: string; // link destination
}
```
Used in: Collection grid, Wishlist grid

### VinylGrid
```ts
interface VinylGridProps {
  items: VinylCardProps[];
  emptyMessage: string;
  loading?: boolean;
}
```
Used in: `/collection`, `/wishlist`

### DiscogsResultCard
```ts
interface DiscogsResultCardProps {
  result: DiscogsSearchResult;
  onSelect: (result: DiscogsSearchResult) => void;
  isInCollection?: boolean; // grey out if already owned
  isInWishlist?: boolean;
}
```
Used in: `/scan`, `/search`

### ConditionBadge
```ts
interface ConditionBadgeProps {
  condition: Condition | null;
  type: 'media' | 'sleeve';
}
```
Color mapping:
- M → emerald
- NM → green
- VG+ → lime
- VG → yellow
- G+ → amber
- G → orange
- F → red
- P → red/dark

### FilterBar
```ts
interface FilterBarProps {
  genres: string[]; // available genres from user's collection
  onFilterChange: (filters: CollectionFilters) => void;
  currentFilters: CollectionFilters;
}

interface CollectionFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: Condition;
  search?: string;
}
```

### AddToCollectionDialog
```ts
interface AddToCollectionDialogProps {
  release: DiscogsRelease; // full Discogs release details
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (item: CollectionItem) => void;
}
```
Fields: conditionMedia, conditionSleeve, notes, purchasePrice, purchaseDate

### MoveToCollectionDialog
```ts
interface MoveToCollectionDialogProps {
  wishlistItem: WishlistItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (item: CollectionItem) => void;
}
```
Fields: conditionMedia, conditionSleeve, purchasePrice, purchaseDate

### CameraCapture
```ts
interface CameraCaptureProps {
  onCapture: (imageData: string) => void; // base64 data URL
  onFileSelect: (file: File) => void; // fallback file upload
}
```

### ImageAnalyzer
```ts
interface ImageAnalyzerProps {
  imageData: string | null; // base64 data URL from camera/file
  onResultReady: (result: AnalysisResult) => void;
  onError: (error: string) => void;
}

interface AnalysisResult {
  ocrText: string;           // text extracted by Tesseract.js
  caption: string;           // image description from vit-gpt2
  suggestedQuery: string;    // combined/cleaned search query
  confidence: 'high' | 'medium' | 'low'; // based on OCR text length + quality
}
```
Shows: progress bar for each engine (OCR + captioning), combined results in an editable textarea.
- **Dual pipeline**: Tesseract.js (OCR) + Transformers.js `Xenova/vit-gpt2-image-captioning` (image description) run in parallel.
- **Query building logic**: If OCR extracts meaningful text (>3 words, likely artist/title), use that as primary query. If OCR yields little/no text, use the image caption. Always show both to the user for editing.
- **Model loading**: Lazy-loaded on first scan page visit. Show download progress with estimated size (Tesseract ~15MB, captioning model ~50MB). Models cached in browser IndexedDB for subsequent visits.

### StatCard
```ts
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}
```

### VinylDetail
```ts
interface VinylDetailProps {
  item: CollectionItem;
  tracklist?: { position: string; title: string; duration: string }[];
}
```
Displays: cover art (large), title, artist, year, label, catno, country, genres, styles, format, conditions, notes, purchase info, tracklist

## Page Data Requirements

| Page | Server Data | Client Data |
|------|-------------|-------------|
| `/collection` | `collection_items` (paginated, filtered) | filter state |
| `/collection/[id]` | single `collection_items` row | edit dialog state |
| `/scan` | none | camera stream, OCR + captioning state, Discogs search results |
| `/search` | none | search query, Discogs search results |
| `/wishlist` | `wishlist_items` (paginated) | move dialog state |
| `/stats` | aggregated stats from `collection_items` | chart interactions |
