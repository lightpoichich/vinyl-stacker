# Project Brain

## Identity
- **App:** Vinyl Stacker
- **One-liner:** Scan a vinyl cover with your phone, instantly identify it via OCR + image recognition + Discogs, and manage your collection.
- **Target user:** Vinyl collectors who want a fast way to catalog their records by snapping photos of covers.

## Architecture Decisions

- ADR-001: Use Tesseract.js for client-side OCR — because it runs entirely in the browser (no API costs, no tokens), extracts text from cover photos that can be used as Discogs search queries.
- ADR-002: Proxy Discogs API through Next.js Route Handlers — because the Discogs personal access token must stay server-side, and GET-based search/lookup maps naturally to route handlers rather than Server Actions.
- ADR-003: Discogs authentication via personal access token (not OAuth) — because we only need read access to the Discogs database (search + release details), not user-specific Discogs data. 60 req/min is sufficient.
- ADR-004: Denormalize Discogs metadata into collection/wishlist rows — because we don't want to re-fetch Discogs on every page load. Store title, artist, cover_image, year, genres at insertion time.
- ADR-005: No image storage — because OCR runs client-side and cover images are served from Discogs CDN. Avoids Supabase Storage costs.
- ADR-006: Dark theme with warm amber accents — because vinyl collectors appreciate aesthetics and dark UI showcases album art better.
- ADR-007: Mobile-first design — because the primary use case (scanning covers) happens on phones.
- ADR-008: Goldberg condition grading scale (M, NM, VG+, VG, G+, G, F, P) — because it's the industry standard used by Discogs and collectors worldwide.
- ADR-009: Use Next.js 14 App Router with Supabase Auth — because the masterplan stack provides auth, RLS, and Postgres out of the box.
- ADR-010: Tesseract.js worker pre-loading — because OCR engine initialization takes 2-3 seconds; pre-load when user navigates to scan page for instant recognition.
- ADR-011: Use Transformers.js with image captioning model for covers without text — because many vinyl covers have no visible text. The `Xenova/vit-gpt2-image-captioning` model (~50MB, runs in browser via ONNX/WASM) generates text descriptions of the cover art. Combined with OCR, this dual approach handles both text-heavy and purely visual covers. Zero API cost.
- ADR-012: Dual recognition pipeline (OCR + image captioning) runs in parallel — because running both analyses simultaneously gives the fastest result. OCR handles text-heavy covers, captioning handles visual-only covers. Results are combined and presented as editable text for the user to refine before Discogs search.
- ADR-013: Models are lazy-loaded and cached in browser — because Tesseract.js (~15MB) + vit-gpt2 (~50MB) would be too heavy to load on page load. Load on first scan page visit, then browser caches them for subsequent visits. Show download progress on first use.

## Discovered Constraints

## Cross-Layer Dependencies
- Frontend (scan page) needs: Tesseract.js + Transformers.js loaded + /api/discogs/search route — STATUS: pending
- Frontend (collection/wishlist) needs: Server Actions for CRUD — STATUS: pending
- Backend (Discogs proxy) needs: DISCOGS_PERSONAL_TOKEN env var — STATUS: pending
- Backend (Server Actions) needs: Database tables + RLS — STATUS: pending

## Resolved Issues
- FB-001 (BLOCKING): Mobile scan button didn't navigate — fixed by wrapping in `<Link>`
- FB-002 (IMPORTANT): Collection detail self-referential API fetch — fixed by calling `discogsFetch` directly
- FB-003 (IMPORTANT): catno/country data loss on wishlist→collection — accepted as design choice (nullable fields)

## Open Issues
- MINOR: Duplicate unique index on wishlist_items (redundant but harmless)

## Current Phase
Phase 6 — Integrate
