# Vinyl Stacker — Consolidated Masterplan

## Execution Order

### Phase 4A: Infra (Conductor)
1. Scaffold Next.js 14 project in current directory
2. Install deps: Supabase, Zod, Zustand, Tesseract.js, @huggingface/transformers
3. Set up shadcn/ui
4. Create Supabase client helpers (browser + server + middleware)
5. Create vitest config, .env.local.example
6. Create directory structure

### Phase 4B: Data Layer (sequential)
1. Migration: profiles table + handle_new_user trigger
2. Migration: collection_items table + indexes
3. Migration: wishlist_items table + indexes
4. Migration: RLS policies for all 3 tables
5. Migration: updated_at triggers
6. Seed data (2 users, 20 collection + 10 wishlist items)

### Phase 4C: Backend Layer (after infra)
1. Case mapper utility (toCamelCase, toSnakeCase)
2. Zod schemas (condition, collection, wishlist, discogs)
3. Auth Server Actions (signUp, signIn, signOut)
4. Discogs client helper + search route handler (parallel with 3)
5. Discogs release route handler (parallel with 3)
6. Collection Server Actions (addToCollection, updateCollectionItem, removeFromCollection)
7. Wishlist Server Actions (addToWishlist, removeFromWishlist, moveWishlistToCollection)
8. Stats Server Action (getCollectionStats)

### Phase 4D: Frontend Layer (after backend)
1. Install shadcn/ui components (19 primitives)
2. Root layout with dark theme + amber accents + fonts
3. Auth pages (login, signup) with AuthForm
4. Dashboard layout (sidebar + mobile bottom bar)
5. Shared components (VinylCard, VinylGrid, ConditionBadge, DiscogsResultCard, FilterBar, StatCard)
6. Scan page (CameraCapture + dual recognition: Tesseract.js OCR + Transformers.js captioning)
7. Search page (manual Discogs search)
8. Collection page + detail page (grid, filters, vinyl detail with tracklist)
9. Wishlist page + MoveToCollectionDialog
10. Stats page (distributions, recent additions)
11. AddToCollectionDialog + MoveToCollectionDialog
12. Loading skeletons + error boundaries
13. Landing page (hero, features, CTA)

## Key Technical Details

### Dual Recognition Pipeline (Scan Page)
- Tesseract.js OCR: extracts text from cover (~15MB, client-side)
- Transformers.js vit-gpt2-image-captioning: generates visual description (~50MB, client-side)
- Both run in parallel via web workers
- If OCR extracts >3 meaningful words → primary query; otherwise use caption
- Results shown in editable textarea before Discogs search
- Models lazy-loaded on first scan visit, cached in browser

### Discogs API Integration
- Proxied through Next.js route handlers (token server-side only)
- Personal access token (60 req/min, free)
- 5-minute response caching to reduce rate pressure
- User-Agent: VinylStacker/1.0

### Database
- 3 tables: profiles, collection_items, wishlist_items
- Full RLS (each user sees only their data)
- Unique constraint on (user_id, discogs_release_id) prevents duplicates
- updated_at triggers on profiles + collection_items
- Denormalized Discogs metadata (no re-fetching on page load)

## Corrections Applied
- `idx_wishlist_user_discogs`: fixed from `CREATE INDEX ... UNIQUE` to `CREATE UNIQUE INDEX`
- Next.js 14 route params: use `{ params: { id: string } }` (not async Promise pattern)
- `wishlist_items` has no `updated_at` column — no trigger needed
