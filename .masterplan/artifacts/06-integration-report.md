# Integration Report

## Build Status
- `npm run build` — PASSES (0 errors, 2 img warnings)
- All 13 routes compile successfully
- Middleware compiles (74.2 kB)

## Routes Summary
| Route | Type | Size |
|-------|------|------|
| `/` | Static | 1.14 kB |
| `/login` | Dynamic | 2.74 kB |
| `/signup` | Dynamic | 2.74 kB |
| `/scan` | Dynamic | 4.98 kB |
| `/search` | Dynamic | 1.11 kB |
| `/collection` | Dynamic | 5.09 kB |
| `/collection/[id]` | Dynamic | 6.22 kB |
| `/wishlist` | Dynamic | 5.15 kB |
| `/stats` | Dynamic | 154 B |
| `/api/discogs/search` | Dynamic | 0 B |
| `/api/discogs/release/[id]` | Dynamic | 0 B |
| `/_not-found` | Static | 154 B |

## Issues Fixed in Phase 5
1. **FB-001 (BLOCKING)**: Mobile scan button now navigates via `<Link>`
2. **FB-002 (IMPORTANT)**: Collection detail page calls `discogsFetch` directly instead of self-referential API fetch
3. **FB-003 (IMPORTANT)**: catno/country on wishlist→collection move — accepted as nullable by design

## Remaining MINOR Issues
- Duplicate unique index on wishlist_items (harmless)
- `<img>` usage in vinyl-card and discogs-result-card (ESLint warning, functional)
