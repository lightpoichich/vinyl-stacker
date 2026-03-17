# API Contracts

> Immutable. Only the Conductor may modify this document.

## Conventions

### Response Wrapping
```ts
// Success
{ data: T }
{ data: T[], count: number }  // for lists

// Error
{ error: { message: string, code: string } }
```

### Errors
| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation error (Zod) |
| 401 | Not authenticated |
| 403 | Authorized but not permitted (RLS) |
| 404 | Resource not found |
| 409 | Duplicate (e.g., vinyl already in collection) |
| 429 | Discogs rate limit exceeded |
| 500 | Unexpected server error |

### Auth
All protected endpoints require a valid Supabase session cookie.

### Pagination
List endpoints accept:
- `page` (number, default 1)
- `limit` (number, default 20, max 100)

Response: `{ data: T[], count: number }`

---

## Zod Schemas

```ts
// === Condition grading ===
const ConditionSchema = z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']);

// === Collection Item ===
const CollectionItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discogsReleaseId: z.number().int(),
  title: z.string(),
  artist: z.string(),
  coverImageUrl: z.string().url().nullable(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  format: z.string().nullable(),
  label: z.string().nullable(),
  catno: z.string().nullable(),
  country: z.string().nullable(),
  conditionMedia: ConditionSchema.nullable(),
  conditionSleeve: ConditionSchema.nullable(),
  notes: z.string().nullable(),
  purchasePrice: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type CollectionItem = z.infer<typeof CollectionItemSchema>;

const AddToCollectionInput = z.object({
  discogsReleaseId: z.number().int(),
  title: z.string().min(1),
  artist: z.string().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  year: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional().default([]),
  styles: z.array(z.string()).optional().default([]),
  format: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  catno: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

const UpdateCollectionItemInput = z.object({
  id: z.string().uuid(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

// === Wishlist Item ===
const WishlistItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discogsReleaseId: z.number().int(),
  title: z.string(),
  artist: z.string(),
  coverImageUrl: z.string().url().nullable(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  format: z.string().nullable(),
  label: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

type WishlistItem = z.infer<typeof WishlistItemSchema>;

const AddToWishlistInput = z.object({
  discogsReleaseId: z.number().int(),
  title: z.string().min(1),
  artist: z.string().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  year: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional().default([]),
  styles: z.array(z.string()).optional().default([]),
  format: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// === Discogs API Types ===
const DiscogsSearchResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumb: z.string(),
  cover_image: z.string(),
  year: z.string().optional(),
  country: z.string().optional(),
  genre: z.array(z.string()).optional(),
  style: z.array(z.string()).optional(),
  format: z.array(z.string()).optional(),
  catno: z.string().optional(),
  label: z.array(z.string()).optional(),
  type: z.string(),
  resource_url: z.string(),
});

const DiscogsSearchResponseSchema = z.object({
  results: z.array(DiscogsSearchResultSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
    per_page: z.number(),
  }),
});

const DiscogsReleaseSchema = z.object({
  id: z.number(),
  title: z.string(),
  artists: z.array(z.object({
    name: z.string(),
    id: z.number(),
  })),
  year: z.number().optional(),
  genres: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  country: z.string().optional(),
  labels: z.array(z.object({
    name: z.string(),
    catno: z.string(),
  })).optional(),
  formats: z.array(z.object({
    name: z.string(),
    qty: z.string(),
    descriptions: z.array(z.string()).optional(),
  })).optional(),
  images: z.array(z.object({
    type: z.string(),
    uri: z.string(),
    uri150: z.string(),
    width: z.number(),
    height: z.number(),
  })).optional(),
  tracklist: z.array(z.object({
    position: z.string(),
    title: z.string(),
    duration: z.string(),
  })).optional(),
  notes: z.string().optional(),
});
```

---

## Route Handlers (Discogs Proxy)

### GET /api/discogs/search — Search Discogs
- **Auth required:** yes
- **Query params:**
  - `q` (string, required) — search text
  - `type` (string, optional, default "release") — release | master
  - `page` (number, optional, default 1)
  - `per_page` (number, optional, default 15, max 50)
- **Response:**
```ts
{ data: DiscogsSearchResponse }
```
- **Error cases:**
  - Missing q → 400
  - Unauthenticated → 401
  - Discogs rate limit → 429
  - Discogs error → 502

### GET /api/discogs/release/[id] — Get Release Details
- **Auth required:** yes
- **Path params:** `id` (integer, Discogs release ID)
- **Response:**
```ts
{ data: DiscogsRelease }
```
- **Error cases:**
  - Invalid ID → 400
  - Unauthenticated → 401
  - Not found on Discogs → 404
  - Discogs rate limit → 429

---

## Server Actions

### addToCollection(input: AddToCollectionInput)
- **Auth required:** yes
- **Behavior:** Validates input with Zod, inserts into collection_items with user_id from session.
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`
- **Error cases:** Zod 400, unauthenticated 401, duplicate 409

### updateCollectionItem(input: UpdateCollectionItemInput)
- **Auth required:** yes
- **Behavior:** Updates specified fields on item owned by user (RLS enforced).
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`
- **Error cases:** Zod 400, unauthenticated 401, not found/RLS 404

### removeFromCollection(input: { id: string })
- **Auth required:** yes
- **Returns:** `{ data: { id: string } }` or `{ error: { message, code } }`
- **Error cases:** Unauthenticated 401, not found/RLS 404

### addToWishlist(input: AddToWishlistInput)
- **Auth required:** yes
- **Returns:** `{ data: WishlistItem }` or `{ error: { message, code } }`
- **Error cases:** Zod 400, unauthenticated 401, duplicate 409

### removeFromWishlist(input: { id: string })
- **Auth required:** yes
- **Returns:** `{ data: { id: string } }` or `{ error: { message, code } }`

### moveWishlistToCollection(input: MoveToCollectionInput)
- **Auth required:** yes
- **Input:** `{ wishlistItemId: string, conditionMedia?, conditionSleeve?, purchasePrice?, purchaseDate? }`
- **Behavior:** In a single transaction: read wishlist item, insert into collection_items, delete from wishlist_items.
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`
- **Error cases:** Unauthenticated 401, wishlist item not found 404, already in collection 409

### getCollectionStats()
- **Auth required:** yes
- **Returns:**
```ts
{
  data: {
    totalRecords: number,
    genreDistribution: { genre: string, count: number }[],
    decadeDistribution: { decade: string, count: number }[],
    formatDistribution: { format: string, count: number }[],
    conditionDistribution: { condition: string, count: number }[],
    recentAdditions: CollectionItem[],
  }
}
```
