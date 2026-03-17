# Vinyl Stacker — Subsystem Decomposition

## Data Layer

### Scope
Database schema, migrations, RLS policies, seed data, updated_at triggers.

### Tasks
1. Create initial migration: profiles table + auto-create trigger on auth.users
2. Create migration: collection_items table with all columns, constraints, indexes
3. Create migration: wishlist_items table with all columns, constraints, indexes
4. Create migration: RLS policies for all 3 tables
5. Create migration: updated_at trigger function + triggers on profiles and collection_items
6. Create seed.sql with realistic test data (2 users, ~10 collection items each, ~5 wishlist items each)

### Dependencies
None — Data Layer starts first.

### Success Criteria
- All migrations apply cleanly on a fresh Supabase instance
- RLS policies correctly restrict access (user A cannot see user B's data)
- Unique constraints prevent duplicate (user_id, discogs_release_id) entries
- Seed data inserts without errors

---

## Backend Layer

### Scope
Zod schemas (source of truth), Supabase client helpers, auth Server Actions (signup/login/logout), Discogs API proxy route handlers, collection CRUD Server Actions, wishlist CRUD Server Actions, stats Server Action.

### Tasks
1. Create Zod schemas in `src/lib/schemas/` matching api-contracts.md exactly
2. Create auth Server Actions: signUp, signIn, signOut (using Supabase Auth)
3. Create Discogs proxy route handler: GET /api/discogs/search
4. Create Discogs proxy route handler: GET /api/discogs/release/[id]
5. Create collection Server Actions: addToCollection, updateCollectionItem, removeFromCollection
6. Create wishlist Server Actions: addToWishlist, removeFromWishlist, moveWishlistToCollection
7. Create stats Server Action: getCollectionStats (aggregation queries)
8. Create utility: Supabase camelCase ↔ snake_case row mapper

### Dependencies
- Zod schemas (task 1) must be done before all other tasks
- Auth actions (task 2) can parallel with Discogs routes (tasks 3-4)
- Collection/wishlist actions (tasks 5-6) can run in parallel after schemas
- Stats (task 7) after collection actions

### Success Criteria
- All Zod schemas match api-contracts.md
- Auth flow works (signup → login → authenticated session → logout)
- Discogs proxy returns properly shaped data, handles rate limits (429)
- All Server Actions validate input with Zod, return contract-shaped responses
- TypeScript compiles with no errors (`tsc --noEmit`)

---

## Frontend Layer

### Scope
Root layout, navigation (sidebar + mobile bottom bar), auth pages, dashboard layout, scan page (camera + dual recognition pipeline), search page, collection page + detail page, wishlist page, stats page, all shared components.

### Tasks
1. Install shadcn/ui components: button, card, input, dialog, select, badge, avatar, separator, tabs, dropdown-menu, toast, progress, textarea, label, skeleton
2. Create root layout (`src/app/layout.tsx`) with dark theme, fonts, metadata
3. Create auth pages: `/login` and `/signup` with email/password forms
4. Create dashboard layout (`src/app/(dashboard)/layout.tsx`) with sidebar nav + mobile bottom bar
5. Create shared components: VinylCard, VinylGrid, ConditionBadge, DiscogsResultCard
6. Create scan page (`/scan`): CameraCapture + ImageAnalyzer (Tesseract.js + Transformers.js) + DiscogsResults + AddToCollectionDialog
7. Create search page (`/search`): manual search input + DiscogsResults + AddToCollectionDialog
8. Create collection page (`/collection`): VinylGrid with FilterBar + pagination
9. Create collection detail page (`/collection/[id]`): VinylDetail with edit/delete
10. Create wishlist page (`/wishlist`): VinylGrid + MoveToCollectionDialog
11. Create stats page (`/stats`): StatCards + distribution charts
12. Create AddToCollectionDialog and MoveToCollectionDialog shared components
13. Add loading states (skeletons) and error boundaries
14. Create landing page (`/`) with hero, feature highlights, CTA

### Dependencies
- shadcn/ui install (task 1) + root layout (task 2) must be first
- Auth pages (task 3) and dashboard layout (task 4) can parallel after layout
- Shared components (task 5) before feature pages (tasks 6-11)
- Feature pages (tasks 6-11) can run in parallel after shared components + dashboard layout
- AddToCollectionDialog (task 12) needed by scan + search pages
- Loading states (task 13) and landing page (task 14) can be last

### Success Criteria
- `npm run build` succeeds with no errors
- All pages render correctly on mobile (375px) and desktop (1280px)
- Scan flow works: camera → image → dual recognition → editable query → Discogs search → add to collection
- Collection CRUD works through the UI
- Navigation works on both mobile and desktop
- Dark theme applied consistently

---

## Infra (Conductor-handled)

### Tasks
1. Scaffold Next.js 14 project with TypeScript, Tailwind, ESLint
2. Install Supabase client libraries
3. Install Tesseract.js and @huggingface/transformers
4. Install Zod, Zustand, testing deps
5. Set up shadcn/ui
6. Create Supabase client helpers (browser + server + middleware)
7. Create vitest config
8. Create .env.local.example with required env vars
9. Create project directory structure
