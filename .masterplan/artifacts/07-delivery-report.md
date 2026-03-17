# Vinyl Stacker — Delivery Report

## What Was Built

### Core Feature: Dual Recognition Pipeline
- **Tesseract.js OCR** — extracts text from vinyl cover photos (client-side, ~15MB)
- **Transformers.js Image Captioning** — generates visual descriptions for covers without text using `Xenova/vit-gpt2-image-captioning` (~50MB, client-side)
- Both run in parallel in web workers, zero API cost
- Results combined in editable textarea → Discogs search

### Pages (13 routes)
1. **/** — Landing page with CSS-only spinning vinyl disc animation
2. **/login**, **/signup** — Auth with email/password via Supabase Auth
3. **/scan** — Camera capture + dual AI recognition + Discogs search results + add to collection
4. **/search** — Manual text search against Discogs
5. **/collection** — Server-rendered grid with client-side filtering (genre, condition, year, text search)
6. **/collection/[id]** — Full detail with tracklist from Discogs, edit/delete
7. **/wishlist** — Wishlist grid with move-to-collection and remove
8. **/stats** — Collection statistics (genre, decade, format, condition distributions)
9. **Custom 404**

### Backend
- **Discogs API proxy** — 2 route handlers (search + release), server-side token, 5-min cache, rate limit handling
- **6 Server Actions** — addToCollection, updateCollectionItem, removeFromCollection, addToWishlist, removeFromWishlist, moveWishlistToCollection
- **1 Stats Action** — getCollectionStats with JS-side aggregation
- **Zod validation** on all inputs
- **camelCase ↔ snake_case** mapping for DB ↔ TypeScript

### Database
- **3 tables** — profiles, collection_items, wishlist_items
- **5 migrations** — tables, indexes, RLS policies, triggers
- **Full RLS** — each user sees only their own data
- **Goldberg grading** — M/NM/VG+/VG/G+/G/F/P with CHECK constraints
- **Seed data** — 2 users, 20 collection items, 10 wishlist items (real vinyl albums)

### Design
- Dark theme with warm amber accents
- Mobile-first responsive (bottom nav on mobile, sidebar on desktop)
- Prominent Scan button in mobile navigation
- Loading skeletons on all data pages

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + PostgreSQL + RLS)
- Tesseract.js (client-side OCR)
- @huggingface/transformers (client-side image captioning)
- Zod (validation)
- Zustand (scan flow state)

## How to Run Locally

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   DISCOGS_PERSONAL_TOKEN=your-discogs-personal-token
   ```
3. Create a Supabase project and run the migrations in `supabase/migrations/` (in order) via the SQL editor
4. `npm install`
5. `npm run dev`
6. Open http://localhost:3000

### Getting API Keys
- **Supabase**: Create a free project at https://supabase.com → Settings → API → copy URL and anon key
- **Discogs**: Create an account at https://www.discogs.com → Settings → Developers → Generate personal access token

## Known Limitations
- First scan takes 10-30 seconds to download OCR + captioning models (cached after)
- Image captioning generates generic descriptions — works as search hints, not definitive identification
- catno/country are null when moving from wishlist to collection (wishlist doesn't store these)
- No Discogs OAuth integration (read-only via personal token)
- Stats computed in JS (fine for collections under 5000 items)
