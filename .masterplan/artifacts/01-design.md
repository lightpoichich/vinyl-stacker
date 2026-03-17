# Vinyl Stacker — Design Document

## Overview
- **App name:** Vinyl Stacker
- **One-liner:** Scan a vinyl cover with your phone, instantly identify it via OCR + Discogs, and manage your collection.
- **Target user:** Vinyl collectors (casual to serious) who want an effortless way to catalog records.
- **Core problem solved:** Manually typing vinyl info is tedious. Photo-based recognition makes cataloging as easy as point-and-shoot.

## Features (MoSCoW)

### Must Have
1. **Photo Cover Recognition** — Take/upload a photo of a vinyl cover → Tesseract.js OCR extracts text → search Discogs with extracted text → user picks the correct match → added to collection.
2. **Manual Discogs Search** — Type artist/album name to search Discogs directly.
3. **Collection Management** — View, edit, delete vinyl records in collection. Store condition (media + sleeve), notes, purchase price, purchase date.
4. **Vinyl Detail View** — Full metadata from Discogs: tracklist, label, catalog number, format, country, genres/styles, cover art.
5. **User Authentication** — Email/password sign-up and login via Supabase Auth.
6. **Responsive Design** — Mobile-first, works great on desktop too.

### Should Have
7. **Wishlist** — Separate list for records the user wants.
8. **Collection Statistics** — Total records, genre distribution, decade distribution, format breakdown.
9. **Collection Filtering & Sorting** — Filter by genre, year range, condition. Sort by artist, title, date added, year.
10. **Editable OCR Results** — User can edit extracted text before searching Discogs for better accuracy.

### Could Have
11. **Barcode Detection** — If a barcode is visible in the photo, detect it and search Discogs by barcode for precise matching.
12. **Collection Export** — Export collection as CSV.
13. **Dark/Light Theme Toggle** — Default dark, optional light.

### Won't Have (v1)
- Marketplace / buy-sell functionality
- Social features (following, sharing collections)
- Discogs OAuth (syncing with user's Discogs collection)
- Mobile native app
- Collection value estimation (requires Discogs marketplace API which has stricter limits)

## Technical Architecture

### Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth, Database) + Next.js Route Handlers (Discogs proxy)
- Database: PostgreSQL with RLS via Supabase
- OCR: Tesseract.js (client-side, WebAssembly)
- Validation: Zod
- State: Zustand (for scan flow state)
- Testing: Vitest + Playwright

### Component Diagram
```
[Browser]
  ├── Tesseract.js Worker (OCR, runs client-side)
  ├── Camera/File Upload → OCR → extracted text
  └── Next.js App
        ├── (auth) pages → Supabase Auth
        ├── (dashboard) pages → Server Components
        │     ├── Collection grid (server-rendered)
        │     ├── Wishlist grid (server-rendered)
        │     ├── Vinyl detail (server-rendered)
        │     └── Stats (server-rendered)
        ├── Scan page (client component)
        │     └── Calls /api/discogs/search with OCR text
        ├── /api/discogs/* Route Handlers
        │     └── Proxies to Discogs API (server-side token)
        └── Server Actions (collection/wishlist CRUD)
              └── Supabase client → PostgreSQL
```

### Data Flow
1. **Scan Flow:** Camera → Image → Tesseract.js OCR → extracted text → (user edits) → GET /api/discogs/search?q=text → results displayed → user selects → GET /api/discogs/release/{id} → full details shown → Server Action addToCollection() → row in DB
2. **Manual Search Flow:** User types query → GET /api/discogs/search?q=query → results → select → same as above
3. **Collection View Flow:** Server Component → Supabase query (with RLS) → render grid of covers
4. **Detail View Flow:** Server Component → Supabase query by ID → render full detail page

## Data Schema

### Tables

#### `profiles`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, references auth.users(id) | User ID from Supabase Auth |
| display_name | text | not null | Display name |
| avatar_url | text | nullable | Avatar URL |
| created_at | timestamptz | not null, default now() | Account creation |
| updated_at | timestamptz | not null, default now() | Last update |

#### `collection_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Item ID |
| user_id | uuid | FK → profiles(id), not null | Owner |
| discogs_release_id | integer | not null | Discogs release ID |
| title | text | not null | Release title |
| artist | text | not null | Artist name |
| cover_image_url | text | nullable | Discogs cover image URL |
| year | integer | nullable | Release year |
| genres | text[] | default '{}' | Genre tags |
| styles | text[] | default '{}' | Style tags |
| format | text | nullable | Format (LP, 7", 12", etc.) |
| label | text | nullable | Record label |
| catno | text | nullable | Catalog number |
| country | text | nullable | Release country |
| condition_media | text | nullable | Media condition (M/NM/VG+/VG/G+/G/F/P) |
| condition_sleeve | text | nullable | Sleeve condition |
| notes | text | nullable | User notes |
| purchase_price | numeric(10,2) | nullable | Purchase price |
| purchase_date | date | nullable | When purchased |
| created_at | timestamptz | not null, default now() | Date added |
| updated_at | timestamptz | not null, default now() | Last update |

#### `wishlist_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Item ID |
| user_id | uuid | FK → profiles(id), not null | Owner |
| discogs_release_id | integer | not null | Discogs release ID |
| title | text | not null | Release title |
| artist | text | not null | Artist name |
| cover_image_url | text | nullable | Cover image URL |
| year | integer | nullable | Release year |
| genres | text[] | default '{}' | Genre tags |
| styles | text[] | default '{}' | Style tags |
| format | text | nullable | Format |
| label | text | nullable | Record label |
| notes | text | nullable | User notes |
| created_at | timestamptz | not null, default now() | Date added |

### Relationships
- `profiles.id` → `auth.users.id` (1:1)
- `collection_items.user_id` → `profiles.id` (N:1)
- `wishlist_items.user_id` → `profiles.id` (N:1)
- Unique constraint: `(user_id, discogs_release_id)` on both `collection_items` and `wishlist_items` (prevent duplicates)

### Indexes
- `collection_items(user_id)` — filter by user
- `collection_items(user_id, created_at DESC)` — default sort
- `collection_items(user_id, artist)` — sort/filter by artist
- `collection_items(user_id, discogs_release_id)` UNIQUE — prevent duplicates
- `wishlist_items(user_id)` — filter by user
- `wishlist_items(user_id, discogs_release_id)` UNIQUE — prevent duplicates

## API Design

### Route Handlers (Discogs Proxy)

#### GET /api/discogs/search
- **Auth required:** yes
- **Query params:** `q` (search text), `type` (release|master, default release), `page` (default 1), `per_page` (default 20)
- **Response:**
```ts
{
  data: {
    results: DiscogsSearchResult[],
    pagination: { page: number, pages: number, items: number }
  }
}
```
- **Discogs proxy:** `GET https://api.discogs.com/database/search?q={q}&type={type}&token={DISCOGS_TOKEN}`

#### GET /api/discogs/release/[id]
- **Auth required:** yes
- **Path params:** `id` (Discogs release ID, integer)
- **Response:**
```ts
{ data: DiscogsRelease }
```
- **Discogs proxy:** `GET https://api.discogs.com/releases/{id}?token={DISCOGS_TOKEN}`

### Server Actions (Collection CRUD)

#### addToCollection(input: AddToCollectionInput)
- **Auth required:** yes
- **Input:** discogsReleaseId, title, artist, coverImageUrl, year, genres, styles, format, label, catno, country, conditionMedia?, conditionSleeve?, notes?, purchasePrice?, purchaseDate?
- **Behavior:** Inserts row with user_id from session. Fails if duplicate (user_id, discogs_release_id).
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`

#### updateCollectionItem(input: UpdateCollectionItemInput)
- **Auth required:** yes
- **Input:** id, conditionMedia?, conditionSleeve?, notes?, purchasePrice?, purchaseDate?
- **Behavior:** Updates specified fields. RLS ensures user owns the item.
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`

#### removeFromCollection(input: { id: string })
- **Auth required:** yes
- **Behavior:** Deletes item. RLS ensures user owns it.
- **Returns:** `{ data: { id: string } }` or `{ error: { message, code } }`

#### addToWishlist(input: AddToWishlistInput)
- **Auth required:** yes
- **Input:** discogsReleaseId, title, artist, coverImageUrl, year, genres, styles, format, label, notes?
- **Returns:** `{ data: WishlistItem }` or `{ error: { message, code } }`

#### removeFromWishlist(input: { id: string })
- **Auth required:** yes
- **Returns:** `{ data: { id: string } }` or `{ error: { message, code } }`

#### moveWishlistToCollection(input: { wishlistItemId: string, conditionMedia?, conditionSleeve?, purchasePrice?, purchaseDate? })
- **Auth required:** yes
- **Behavior:** Removes from wishlist, adds to collection in a single transaction.
- **Returns:** `{ data: CollectionItem }` or `{ error: { message, code } }`

## UI/UX Plan

### Pages

| Route | Purpose | Key Components | Data |
|-------|---------|---------------|------|
| `/` | Landing page | Hero, feature highlights, CTA | Static |
| `/login` | Log in | Auth form | Supabase Auth |
| `/signup` | Sign up | Auth form | Supabase Auth |
| `/collection` | Main collection grid | VinylGrid, FilterBar, SortSelect, SearchInput | Server: collection_items |
| `/collection/[id]` | Vinyl detail | VinylDetail, ConditionBadge, EditDialog | Server: collection_items by id |
| `/scan` | Camera OCR scan | CameraCapture, OcrProcessor, DiscogsResults, AddToCollectionDialog | Client: Tesseract.js + /api/discogs |
| `/search` | Manual Discogs search | SearchInput, DiscogsResults, AddToCollectionDialog | Client: /api/discogs |
| `/wishlist` | Wishlist grid | VinylGrid, MoveToCollectionDialog | Server: wishlist_items |
| `/stats` | Collection statistics | StatCard, GenreChart, DecadeChart, FormatChart | Server: aggregated collection_items |

### Navigation
- **Desktop:** Sidebar with: Collection, Scan, Search, Wishlist, Stats, Profile
- **Mobile:** Bottom tab bar with: Collection, Scan (center, prominent), Search, Wishlist. Stats + Profile accessible from header menu.

### Key Shared Components
- `VinylCard` — Cover art thumbnail, title, artist, year. Used in grids.
- `VinylGrid` — Responsive grid of VinylCards. Supports loading states.
- `DiscogsResultCard` — Search result card with "Add" button.
- `ConditionBadge` — Color-coded badge for M/NM/VG+/etc.
- `FilterBar` — Genre, year range, condition filters.
- `AddToCollectionDialog` — Dialog to set condition, notes, price before adding.
- `CameraCapture` — Camera preview with capture button, or file upload fallback.
- `OcrProcessor` — Runs Tesseract.js, shows progress, displays extracted text (editable).
