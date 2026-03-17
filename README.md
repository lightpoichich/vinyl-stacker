# Vinyl Stacker

Scan a vinyl cover with your phone, instantly identify it via OCR + image recognition + Discogs, and manage your collection.

## Features

- **Photo Recognition** — Take a photo of a vinyl cover. Tesseract.js (OCR) extracts text, Transformers.js generates a visual description. Both run in your browser — zero API cost.
- **Discogs Integration** — Search the Discogs database, view full release details with tracklist, cover art, and metadata.
- **Collection Management** — Track your vinyl with Goldberg condition grading (M/NM/VG+/VG/G+/G/F/P), purchase price, notes.
- **Wishlist** — Keep a list of records you want. Move them to your collection when you find them.
- **Statistics** — Genre distribution, decade breakdown, format and condition charts.
- **Mobile-First** — Designed for scanning on your phone with a prominent Scan button.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, RLS)
- **Recognition**: Tesseract.js (OCR), @huggingface/transformers (image captioning)
- **API**: Discogs REST API (free, 60 req/min)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Discogs](https://www.discogs.com/developers) personal access token (free)

### Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DISCOGS_PERSONAL_TOKEN=your-discogs-token
```

### Database Setup

Run the SQL migrations in your Supabase project's SQL Editor, in order:

1. `supabase/migrations/20260317000001_create_profiles.sql`
2. `supabase/migrations/20260317000002_create_collection_items.sql`
3. `supabase/migrations/20260317000003_create_wishlist_items.sql`
4. `supabase/migrations/20260317000004_rls_policies.sql`
5. `supabase/migrations/20260317000005_updated_at_triggers.sql`

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── (dashboard)/     # Collection, scan, search, wishlist, stats
│   └── api/discogs/     # Discogs API proxy routes
├── components/
│   ├── auth/            # Auth form
│   ├── nav/             # Sidebar, mobile nav
│   ├── scan/            # Camera capture, image analyzer
│   ├── vinyl/           # Vinyl card, grid, dialogs
│   └── ui/              # shadcn/ui primitives
└── lib/
    ├── actions/         # Server Actions (CRUD)
    ├── discogs/         # Discogs API client
    ├── schemas/         # Zod schemas
    ├── supabase/        # Supabase client helpers
    └── utils/           # Case mapper utility
```
