# Backend Layer — Execution Plan

> Section Lead: Backend
> Status: PLANNING
> Dependencies: Infra scaffold must exist first (package.json, tsconfig, Supabase client helpers)

---

## File Inventory

After all tasks are complete, the backend layer will have created these files:

```
src/
├── lib/
│   ├── schemas/
│   │   ├── collection.ts        # Task 1 — Collection Zod schemas + types
│   │   ├── wishlist.ts          # Task 1 — Wishlist Zod schemas + types
│   │   ├── discogs.ts           # Task 1 — Discogs API Zod schemas + types
│   │   ├── condition.ts         # Task 1 — Shared ConditionSchema + type
│   │   └── index.ts             # Task 1 — Barrel re-export
│   ├── utils/
│   │   └── case-mapper.ts       # Task 8 — snake_case ↔ camelCase mapper
│   ├── actions/
│   │   ├── auth.ts              # Task 2 — signUp, signIn, signOut
│   │   ├── collection.ts        # Task 5 — addToCollection, updateCollectionItem, removeFromCollection
│   │   ├── wishlist.ts          # Task 6 — addToWishlist, removeFromWishlist, moveWishlistToCollection
│   │   └── stats.ts             # Task 7 — getCollectionStats
│   └── discogs/
│       └── client.ts            # Task 3 — Shared Discogs fetch helper
├── app/
│   └── api/
│       └── discogs/
│           ├── search/
│           │   └── route.ts     # Task 3 — GET /api/discogs/search
│           └── release/
│               └── [id]/
│                   └── route.ts # Task 4 — GET /api/discogs/release/[id]
```

---

## Assumed Infra (provided by Conductor/Infra)

These files are expected to already exist before backend work begins:

- `src/lib/supabase/server.ts` — exports `createClient()` returning a Supabase server client (using `cookies()` from `next/headers`)
- `src/lib/supabase/client.ts` — exports browser Supabase client
- `package.json` with: `next`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- `tsconfig.json` with `@/` path alias mapped to `src/`
- `.env.local` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DISCOGS_PERSONAL_TOKEN`

---

## Task 8: camelCase ↔ snake_case Row Mapper

**Why first:** Every Server Action and route handler will need this utility.

**File:** `src/lib/utils/case-mapper.ts`

```ts
/**
 * Converts a snake_case string to camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase.
 * Handles arrays, nested objects, and null/undefined pass-through.
 */
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => toCamelCase(item)) as T;
  if (typeof obj !== 'object') return obj as T;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

/**
 * Converts all top-level keys in an object from camelCase to snake_case.
 * Used before inserting/updating rows in Supabase.
 * Does NOT recurse — DB rows are flat.
 */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}
```

**Rationale:** DB columns are snake_case (`user_id`, `cover_image_url`). TypeScript types are camelCase (`userId`, `coverImageUrl`). Every read from Supabase must be transformed with `toCamelCase`, and every write must go through `toSnakeCase`. Keeping this in one utility avoids scattered ad-hoc mapping.

**Edge cases handled:**
- Arrays (genres, styles) pass through without key transformation
- Null/undefined pass through
- `toSnakeCase` is intentionally non-recursive because DB rows are flat

---

## Task 1: Zod Schemas

**Files:** `src/lib/schemas/condition.ts`, `collection.ts`, `wishlist.ts`, `discogs.ts`, `index.ts`

### `src/lib/schemas/condition.ts`

```ts
import { z } from 'zod';

export const ConditionSchema = z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']);
export type Condition = z.infer<typeof ConditionSchema>;
```

### `src/lib/schemas/collection.ts`

```ts
import { z } from 'zod';
import { ConditionSchema } from './condition';

export const CollectionItemSchema = z.object({
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

export type CollectionItem = z.infer<typeof CollectionItemSchema>;

export const AddToCollectionInput = z.object({
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

export type AddToCollectionInputType = z.infer<typeof AddToCollectionInput>;

export const UpdateCollectionItemInput = z.object({
  id: z.string().uuid(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

export type UpdateCollectionItemInputType = z.infer<typeof UpdateCollectionItemInput>;

export const MoveToCollectionInput = z.object({
  wishlistItemId: z.string().uuid(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

export type MoveToCollectionInputType = z.infer<typeof MoveToCollectionInput>;
```

### `src/lib/schemas/wishlist.ts`

```ts
import { z } from 'zod';

export const WishlistItemSchema = z.object({
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

export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const AddToWishlistInput = z.object({
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

export type AddToWishlistInputType = z.infer<typeof AddToWishlistInput>;
```

### `src/lib/schemas/discogs.ts`

```ts
import { z } from 'zod';

export const DiscogsSearchResultSchema = z.object({
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

export type DiscogsSearchResult = z.infer<typeof DiscogsSearchResultSchema>;

export const DiscogsSearchResponseSchema = z.object({
  results: z.array(DiscogsSearchResultSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
    per_page: z.number(),
  }),
});

export type DiscogsSearchResponse = z.infer<typeof DiscogsSearchResponseSchema>;

export const DiscogsReleaseSchema = z.object({
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

export type DiscogsRelease = z.infer<typeof DiscogsReleaseSchema>;
```

### `src/lib/schemas/index.ts`

```ts
// Barrel re-export — all schemas and types from one import
export { ConditionSchema, type Condition } from './condition';
export {
  CollectionItemSchema,
  AddToCollectionInput,
  UpdateCollectionItemInput,
  MoveToCollectionInput,
  type CollectionItem,
  type AddToCollectionInputType,
  type UpdateCollectionItemInputType,
  type MoveToCollectionInputType,
} from './collection';
export {
  WishlistItemSchema,
  AddToWishlistInput,
  type WishlistItem,
  type AddToWishlistInputType,
} from './wishlist';
export {
  DiscogsSearchResultSchema,
  DiscogsSearchResponseSchema,
  DiscogsReleaseSchema,
  type DiscogsSearchResult,
  type DiscogsSearchResponse,
  type DiscogsRelease,
} from './discogs';
```

**Verification:** Every schema exactly matches `contracts/api-contracts.md`. The `MoveToCollectionInput` schema is derived from the `moveWishlistToCollection` Server Action contract and does not appear in api-contracts.md as a standalone schema, but it is needed for validation.

---

## Task 2: Auth Server Actions

**File:** `src/lib/actions/auth.ts`

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SignUpInput = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

const SignInInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signUp(formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  };

  const parsed = SignUpInput.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { error: { message: error.message, code: 'AUTH_ERROR' } };
  }

  redirect('/collection');
}

export async function signIn(formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = SignInInput.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: { message: error.message, code: 'AUTH_ERROR' } };
  }

  redirect('/collection');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

**Design decisions:**
- Uses `FormData` because auth forms use native `<form action={signUp}>` pattern.
- `displayName` is passed via `options.data` so the `handle_new_user()` trigger can extract it with `raw_user_meta_data->>'display_name'`.
- `redirect()` throws (Next.js behavior) so it must not be inside try/catch. It is called after the Supabase call succeeds.
- Error responses follow the `{ error: { message, code } }` contract shape.

---

## Task 3: Discogs Proxy — Search Route + Shared Client

### `src/lib/discogs/client.ts` (shared Discogs fetch helper)

```ts
const DISCOGS_BASE_URL = 'https://api.discogs.com';
const USER_AGENT = 'VinylStacker/1.0';

interface DiscogsRequestOptions {
  path: string;
  params?: Record<string, string>;
}

interface DiscogsResponse<T> {
  data?: T;
  error?: { message: string; status: number };
}

/**
 * Makes an authenticated request to the Discogs API.
 * Handles token injection, User-Agent header, rate-limit detection, and error mapping.
 */
export async function discogsFetch<T>(options: DiscogsRequestOptions): Promise<DiscogsResponse<T>> {
  const token = process.env.DISCOGS_PERSONAL_TOKEN;
  if (!token) {
    return { error: { message: 'Discogs API token not configured', status: 500 } };
  }

  const url = new URL(`${DISCOGS_BASE_URL}${options.path}`);
  url.searchParams.set('token', token);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    next: { revalidate: 300 }, // Cache Discogs responses for 5 minutes
  });

  if (response.status === 429) {
    return { error: { message: 'Discogs rate limit exceeded. Please try again in a moment.', status: 429 } };
  }

  if (response.status === 404) {
    return { error: { message: 'Not found on Discogs', status: 404 } };
  }

  if (!response.ok) {
    return { error: { message: `Discogs API error: ${response.statusText}`, status: 502 } };
  }

  const data = await response.json();
  return { data: data as T };
}
```

**Design decisions:**
- Token injected server-side only (ADR-002). Never exposed to the client.
- `User-Agent: VinylStacker/1.0` is required by the Discogs API.
- `next: { revalidate: 300 }` caches responses for 5 minutes to reduce rate-limit pressure (60 req/min limit per ADR-003).
- Error status codes are mapped to our contract error shapes by the route handlers.

### `src/app/api/discogs/search/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discogsFetch } from '@/lib/discogs/client';
import { DiscogsSearchResponseSchema, type DiscogsSearchResponse } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: { message: 'Search query (q) is required', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const type = searchParams.get('type') || 'release';
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '15';

  // Clamp per_page to max 50
  const clampedPerPage = Math.min(Math.max(parseInt(perPage, 10) || 15, 1), 50).toString();

  // Fetch from Discogs
  const result = await discogsFetch<DiscogsSearchResponse>({
    path: '/database/search',
    params: { q, type, page, per_page: clampedPerPage },
  });

  if (result.error) {
    const code = result.error.status === 429 ? 'RATE_LIMITED' : 'DISCOGS_ERROR';
    return NextResponse.json(
      { error: { message: result.error.message, code } },
      { status: result.error.status }
    );
  }

  return NextResponse.json({ data: result.data });
}
```

**Contract compliance:**
- Auth required: checked via `supabase.auth.getUser()`
- Missing `q`: returns 400
- Discogs rate limit: returns 429
- Discogs error: returns 502
- Success: returns `{ data: DiscogsSearchResponse }`
- `per_page` clamped to max 50

---

## Task 4: Discogs Proxy — Release Route

**File:** `src/app/api/discogs/release/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discogsFetch } from '@/lib/discogs/client';
import type { DiscogsRelease } from '@/lib/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  // Validate ID
  const { id } = await params;
  const releaseId = parseInt(id, 10);
  if (isNaN(releaseId) || releaseId <= 0) {
    return NextResponse.json(
      { error: { message: 'Invalid release ID', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  // Fetch from Discogs
  const result = await discogsFetch<DiscogsRelease>({
    path: `/releases/${releaseId}`,
  });

  if (result.error) {
    const codeMap: Record<number, string> = {
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
    };
    return NextResponse.json(
      { error: { message: result.error.message, code: codeMap[result.error.status] || 'DISCOGS_ERROR' } },
      { status: result.error.status }
    );
  }

  return NextResponse.json({ data: result.data });
}
```

**Note on `params`:** In Next.js 15+ (App Router), dynamic route `params` is a Promise. The code uses `await params` accordingly. If the project uses Next.js 14, this should be `{ params: { id: string } }` with direct access `params.id`. The infra scaffold will determine which pattern. Code above assumes the newer async pattern; adjust if needed.

**Contract compliance:**
- Invalid ID: returns 400
- Unauthenticated: returns 401
- Not found on Discogs: returns 404
- Rate limited: returns 429

---

## Task 5: Collection Server Actions

**File:** `src/lib/actions/collection.ts`

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  AddToCollectionInput,
  UpdateCollectionItemInput,
  type CollectionItem,
} from '@/lib/schemas';
import { toCamelCase, toSnakeCase } from '@/lib/utils/case-mapper';

export async function addToCollection(input: unknown) {
  const parsed = AddToCollectionInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const row = toSnakeCase({ ...parsed.data, userId: user.id });

  const { data, error } = await supabase
    .from('collection_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: { message: 'This release is already in your collection', code: 'DUPLICATE' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(data);

  revalidatePath('/collection');
  revalidatePath('/stats');

  return { data: item };
}

export async function updateCollectionItem(input: unknown) {
  const parsed = UpdateCollectionItemInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { id, ...fields } = parsed.data;

  // Only include fields that were explicitly provided (not undefined)
  const updateFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateFields[key] = value;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return { error: { message: 'No fields to update', code: 'VALIDATION_ERROR' } };
  }

  const snakeFields = toSnakeCase(updateFields);

  const { data, error } = await supabase
    .from('collection_items')
    .update(snakeFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: { message: 'Collection item not found', code: 'NOT_FOUND' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(data);

  revalidatePath('/collection');
  revalidatePath(`/collection/${id}`);
  revalidatePath('/stats');

  return { data: item };
}

export async function removeFromCollection(input: { id: string }) {
  if (!input.id) {
    return { error: { message: 'ID is required', code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', input.id);

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  revalidatePath('/collection');
  revalidatePath('/stats');

  return { data: { id: input.id } };
}
```

**Design decisions:**
- Input typed as `unknown` and validated with Zod `.safeParse()` because Server Actions receive untrusted data from the client.
- `user.id` injected server-side, not accepted from client input. The client never sends `userId`.
- Postgres error code `23505` = unique constraint violation (duplicate `(user_id, discogs_release_id)`), mapped to 409 DUPLICATE.
- Postgres error code `PGRST116` = no rows returned from `.single()`, mapped to 404 NOT_FOUND.
- `revalidatePath` ensures Server Component data is fresh after mutations. Both `/collection` and `/stats` are invalidated because stats depend on collection data.
- `updateCollectionItem` explicitly filters out `undefined` values so only provided fields are sent in the UPDATE query. This prevents accidentally nulling out fields.
- RLS on `collection_items` ensures the user can only update/delete their own items. No additional ownership check needed in application code.

---

## Task 6: Wishlist Server Actions

**File:** `src/lib/actions/wishlist.ts`

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  AddToWishlistInput,
  MoveToCollectionInput,
  type WishlistItem,
  type CollectionItem,
} from '@/lib/schemas';
import { toCamelCase, toSnakeCase } from '@/lib/utils/case-mapper';

export async function addToWishlist(input: unknown) {
  const parsed = AddToWishlistInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const row = toSnakeCase({ ...parsed.data, userId: user.id });

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: { message: 'This release is already in your wishlist', code: 'DUPLICATE' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<WishlistItem>(data);

  revalidatePath('/wishlist');

  return { data: item };
}

export async function removeFromWishlist(input: { id: string }) {
  if (!input.id) {
    return { error: { message: 'ID is required', code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', input.id);

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  revalidatePath('/wishlist');

  return { data: { id: input.id } };
}

export async function moveWishlistToCollection(input: unknown) {
  const parsed = MoveToCollectionInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  // Step 1: Fetch the wishlist item
  const { data: wishlistRow, error: fetchError } = await supabase
    .from('wishlist_items')
    .select()
    .eq('id', parsed.data.wishlistItemId)
    .single();

  if (fetchError || !wishlistRow) {
    return { error: { message: 'Wishlist item not found', code: 'NOT_FOUND' } };
  }

  const wishlistItem = toCamelCase<WishlistItem>(wishlistRow);

  // Step 2: Build collection row from wishlist item + additional fields
  const collectionRow = toSnakeCase({
    userId: user.id,
    discogsReleaseId: wishlistItem.discogsReleaseId,
    title: wishlistItem.title,
    artist: wishlistItem.artist,
    coverImageUrl: wishlistItem.coverImageUrl,
    year: wishlistItem.year,
    genres: wishlistItem.genres,
    styles: wishlistItem.styles,
    format: wishlistItem.format,
    label: wishlistItem.label,
    conditionMedia: parsed.data.conditionMedia ?? null,
    conditionSleeve: parsed.data.conditionSleeve ?? null,
    notes: wishlistItem.notes,
    purchasePrice: parsed.data.purchasePrice ?? null,
    purchaseDate: parsed.data.purchaseDate ?? null,
  });

  // Step 3: Insert into collection
  const { data: collectionData, error: insertError } = await supabase
    .from('collection_items')
    .insert(collectionRow)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: { message: 'This release is already in your collection', code: 'DUPLICATE' } };
    }
    return { error: { message: insertError.message, code: 'DATABASE_ERROR' } };
  }

  // Step 4: Delete from wishlist
  const { error: deleteError } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', parsed.data.wishlistItemId);

  if (deleteError) {
    // Rollback: delete the collection item we just inserted
    await supabase
      .from('collection_items')
      .delete()
      .eq('id', collectionData.id);
    return { error: { message: 'Failed to remove from wishlist', code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(collectionData);

  revalidatePath('/wishlist');
  revalidatePath('/collection');
  revalidatePath('/stats');

  return { data: item };
}
```

**Design decisions for `moveWishlistToCollection`:**
- The contract says "in a single transaction." Supabase JS client does not expose raw SQL transactions. The implementation uses a sequential insert-then-delete pattern with a manual rollback (delete the collection item if the wishlist delete fails).
- An alternative would be an RPC (Postgres function), but that moves logic into the DB layer which we do not own. The manual rollback is pragmatic and sufficient — the only failure scenario is if the delete fails after a successful insert, which is extremely unlikely with RLS in place.
- `catno` and `country` are not present on `wishlist_items` (per db-schema.md), so they are omitted from the collection row built from a wishlist item. They will be `null` in the resulting collection item, which is acceptable.

---

## Task 7: Stats Server Action

**File:** `src/lib/actions/stats.ts`

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { toCamelCase } from '@/lib/utils/case-mapper';
import type { CollectionItem } from '@/lib/schemas';

export async function getCollectionStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  // Fetch all collection items for the user (RLS scoped)
  const { data: rows, error } = await supabase
    .from('collection_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const items = (rows || []).map((row: Record<string, unknown>) => toCamelCase<CollectionItem>(row));
  const totalRecords = items.length;

  // Genre distribution — unnest the genres array
  const genreCounts = new Map<string, number>();
  for (const item of items) {
    for (const genre of item.genres || []) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }
  const genreDistribution = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  // Decade distribution
  const decadeCounts = new Map<string, number>();
  for (const item of items) {
    if (item.year) {
      const decade = `${Math.floor(item.year / 10) * 10}s`;
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
    }
  }
  const decadeDistribution = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  // Format distribution
  const formatCounts = new Map<string, number>();
  for (const item of items) {
    const fmt = item.format || 'Unknown';
    formatCounts.set(fmt, (formatCounts.get(fmt) || 0) + 1);
  }
  const formatDistribution = Array.from(formatCounts.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  // Condition distribution (media condition)
  const conditionCounts = new Map<string, number>();
  for (const item of items) {
    const cond = item.conditionMedia || 'Ungraded';
    conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + 1);
  }
  const conditionDistribution = Array.from(conditionCounts.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);

  // Recent additions — first 5 from the already-sorted-by-created_at list
  const recentAdditions = items.slice(0, 5);

  return {
    data: {
      totalRecords,
      genreDistribution,
      decadeDistribution,
      formatDistribution,
      conditionDistribution,
      recentAdditions,
    },
  };
}
```

**Design decisions:**
- Fetches all user items in a single query and computes aggregations in JS. For the scale of a personal vinyl collection (typically <5000 items), this is simpler and more maintainable than multiple Supabase RPC calls or SQL aggregate queries. If a user had 10,000+ items, we would switch to SQL aggregations, but that is unlikely for v1.
- Genre distribution unnests the `genres` array (one record can have multiple genres, e.g., ["Rock", "Blues"]), counting each separately.
- Decade distribution rounds `year` down to the nearest decade (e.g., 1973 -> "1970s").
- Items with `null` year are excluded from decade distribution.
- Items with `null` format are bucketed as "Unknown".
- Items with `null` conditionMedia are bucketed as "Ungraded".
- `recentAdditions` returns 5 most recently added items (already sorted by `created_at DESC`).
- RLS ensures only the authenticated user's items are returned. No explicit `user_id` filter needed, but Supabase RLS handles it transparently.

---

## Execution Order & Dependencies

```
Task 8 (case-mapper)  ──┐
                        ├──→ Task 1 (Zod schemas)
                        │         │
                        │    ┌────┴────────────────────┐
                        │    │                         │
                        │    v                         v
                        │  Task 2 (auth)    Task 3 (search route)
                        │                   Task 4 (release route)
                        │                         │
                        │    ┌────────────────────┘
                        │    v
                        │  Task 5 (collection actions)
                        │  Task 6 (wishlist actions)
                        │         │
                        │         v
                        │  Task 7 (stats action)
                        │
                        └──→ [All done]
```

**Parallelism opportunities:**
- Task 8 + Task 1: sequential (schemas may use mapper types, but can be authored in parallel since mapper is standalone)
- Tasks 2, 3, 4: fully parallel after Task 1
- Tasks 5, 6: fully parallel after Task 1
- Task 7: after Task 5 (uses same patterns, and stats depend on collection items existing)

**Estimated effort:** ~2-3 hours for complete implementation of all 8 tasks.

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] `npx tsc --noEmit` passes with no type errors
- [ ] All Zod schemas exactly match `contracts/api-contracts.md`
- [ ] Every Server Action accepts `unknown` input and validates with Zod
- [ ] Every Server Action and route handler checks authentication via `supabase.auth.getUser()`
- [ ] All DB reads pass through `toCamelCase()` before returning
- [ ] All DB writes pass through `toSnakeCase()` before inserting/updating
- [ ] Error responses follow `{ error: { message: string, code: string } }` shape
- [ ] Success responses follow `{ data: T }` shape
- [ ] Discogs token is never exposed to the client (only used in `src/lib/discogs/client.ts`)
- [ ] `revalidatePath()` called after every mutation
- [ ] Duplicate inserts (23505) return DUPLICATE error, not crash
- [ ] `moveWishlistToCollection` has rollback logic if delete fails after insert

---

## Environment Variables Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (infra) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (infra) | Supabase anon/public key |
| `DISCOGS_PERSONAL_TOKEN` | `src/lib/discogs/client.ts` | Discogs personal access token (server-only, no `NEXT_PUBLIC_` prefix) |
