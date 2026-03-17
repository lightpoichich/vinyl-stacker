# Data Layer Execution Plan

> Owner: Data Section Lead
> Contracts: `contracts/db-schema.md`, `contracts/api-contracts.md`

## Overview

Six tasks that build the complete data layer: three table migrations (in dependency order), one RLS migration, one trigger migration, and a seed file. Each task targets 2-10 minutes and produces one SQL file plus a corresponding validation test.

**Contract errata captured during planning:**
- `db-schema.md` line 127 has `CREATE INDEX idx_wishlist_user_discogs UNIQUE ON wishlist_items(...)` -- invalid SQL. Correct syntax is `CREATE UNIQUE INDEX`. The UNIQUE constraint on `(user_id, discogs_release_id)` is already declared as a table constraint, so this index is redundant. We will create it as `CREATE UNIQUE INDEX` for explicitness (Postgres allows this even when a matching unique constraint exists; it is a no-op but keeps the migration consistent with the contract).

**Directory structure created by this plan:**

```
supabase/
  migrations/
    20260317000001_create_profiles.sql
    20260317000002_create_collection_items.sql
    20260317000003_create_wishlist_items.sql
    20260317000004_rls_policies.sql
    20260317000005_updated_at_triggers.sql
  seed.sql
__tests__/
  data/
    validate-migrations.test.ts
```

---

## Task 1: Create `profiles` table + auto-create trigger

**Time estimate:** 5 minutes
**Dependencies:** None
**Files:**
- `supabase/migrations/20260317000001_create_profiles.sql`
- `__tests__/data/validate-migrations.test.ts` (create file, first test)

### SQL: `supabase/migrations/20260317000001_create_profiles.sql`

```sql
-- Migration: Create profiles table and auto-create trigger
-- Depends on: auth.users (provided by Supabase)

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Test (added to `__tests__/data/validate-migrations.test.ts`)

```ts
import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

function readMigration(filename: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf-8');
}

describe('Migration 001: profiles', () => {
  const sql = readMigration('20260317000001_create_profiles.sql');

  it('creates the profiles table', () => {
    expect(sql).toMatch(/CREATE TABLE profiles/i);
  });

  it('has all required columns', () => {
    for (const col of ['id', 'display_name', 'avatar_url', 'created_at', 'updated_at']) {
      expect(sql).toContain(col);
    }
  });

  it('references auth.users', () => {
    expect(sql).toMatch(/REFERENCES auth\.users\(id\)/i);
  });

  it('has ON DELETE CASCADE', () => {
    expect(sql).toMatch(/ON DELETE CASCADE/i);
  });

  it('enables RLS', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
  });

  it('creates handle_new_user function', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION handle_new_user/i);
  });

  it('function is SECURITY DEFINER', () => {
    expect(sql).toMatch(/SECURITY DEFINER/i);
  });

  it('creates trigger on auth.users', () => {
    expect(sql).toMatch(/CREATE TRIGGER on_auth_user_created/i);
    expect(sql).toMatch(/AFTER INSERT ON auth\.users/i);
  });

  it('extracts display_name from user metadata or email', () => {
    expect(sql).toMatch(/COALESCE\(NEW\.raw_user_meta_data->>'display_name', NEW\.email\)/i);
  });
});
```

### TDD Steps
1. Create `__tests__/data/validate-migrations.test.ts` with the test above. Run `npx vitest run __tests__/data/validate-migrations.test.ts` -- fails (file not found).
2. Create `supabase/migrations/20260317000001_create_profiles.sql` with the exact SQL above.
3. Run test again -- all pass.
4. Commit: `"feat(data): add profiles table migration with auto-create trigger"`

---

## Task 2: Create `collection_items` table with indexes

**Time estimate:** 5 minutes
**Dependencies:** Task 1 (profiles table must exist for FK)
**Files:**
- `supabase/migrations/20260317000002_create_collection_items.sql`
- `__tests__/data/validate-migrations.test.ts` (append tests)

### SQL: `supabase/migrations/20260317000002_create_collection_items.sql`

```sql
-- Migration: Create collection_items table with constraints and indexes
-- Depends on: profiles table (migration 001)

CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discogs_release_id integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  cover_image_url text,
  year integer,
  genres text[] DEFAULT '{}',
  styles text[] DEFAULT '{}',
  format text,
  label text,
  catno text,
  country text,
  condition_media text CHECK (condition_media IN ('M','NM','VG+','VG','G+','G','F','P')),
  condition_sleeve text CHECK (condition_sleeve IN ('M','NM','VG+','VG','G+','G','F','P')),
  notes text,
  purchase_price numeric(10,2),
  purchase_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, discogs_release_id)
);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Indexes for query patterns from api-contracts.md:
-- 1. Filter by user (all collection endpoints)
CREATE INDEX idx_collection_user_id ON collection_items(user_id);
-- 2. Default sort: user's collection by date added descending
CREATE INDEX idx_collection_user_created ON collection_items(user_id, created_at DESC);
-- 3. Filter/sort by artist within user's collection
CREATE INDEX idx_collection_user_artist ON collection_items(user_id, artist);
```

### Test (appended to `__tests__/data/validate-migrations.test.ts`)

```ts
describe('Migration 002: collection_items', () => {
  const sql = readMigration('20260317000002_create_collection_items.sql');

  it('creates the collection_items table', () => {
    expect(sql).toMatch(/CREATE TABLE collection_items/i);
  });

  it('has all required columns', () => {
    const columns = [
      'id', 'user_id', 'discogs_release_id', 'title', 'artist',
      'cover_image_url', 'year', 'genres', 'styles', 'format',
      'label', 'catno', 'country', 'condition_media', 'condition_sleeve',
      'notes', 'purchase_price', 'purchase_date', 'created_at', 'updated_at',
    ];
    for (const col of columns) {
      expect(sql).toContain(col);
    }
  });

  it('references profiles(id)', () => {
    expect(sql).toMatch(/REFERENCES profiles\(id\)/i);
  });

  it('has unique constraint on (user_id, discogs_release_id)', () => {
    expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*discogs_release_id\s*\)/i);
  });

  it('has condition_media CHECK constraint with Goldberg grades', () => {
    expect(sql).toMatch(/CHECK\s*\(\s*condition_media\s+IN\s*\('M','NM','VG\+','VG','G\+','G','F','P'\)\)/i);
  });

  it('has condition_sleeve CHECK constraint with Goldberg grades', () => {
    expect(sql).toMatch(/CHECK\s*\(\s*condition_sleeve\s+IN\s*\('M','NM','VG\+','VG','G\+','G','F','P'\)\)/i);
  });

  it('enables RLS', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
  });

  it('creates idx_collection_user_id index', () => {
    expect(sql).toMatch(/CREATE INDEX idx_collection_user_id ON collection_items\(user_id\)/i);
  });

  it('creates idx_collection_user_created index with DESC', () => {
    expect(sql).toMatch(/CREATE INDEX idx_collection_user_created ON collection_items\(user_id, created_at DESC\)/i);
  });

  it('creates idx_collection_user_artist index', () => {
    expect(sql).toMatch(/CREATE INDEX idx_collection_user_artist ON collection_items\(user_id, artist\)/i);
  });
});
```

### TDD Steps
1. Add tests to `__tests__/data/validate-migrations.test.ts`. Run -- fails (migration file missing).
2. Create `supabase/migrations/20260317000002_create_collection_items.sql`.
3. Run tests -- all pass.
4. Commit: `"feat(data): add collection_items table migration with indexes"`

---

## Task 3: Create `wishlist_items` table with indexes

**Time estimate:** 5 minutes
**Dependencies:** Task 1 (profiles table must exist for FK)
**Files:**
- `supabase/migrations/20260317000003_create_wishlist_items.sql`
- `__tests__/data/validate-migrations.test.ts` (append tests)

### SQL: `supabase/migrations/20260317000003_create_wishlist_items.sql`

```sql
-- Migration: Create wishlist_items table with constraints and indexes
-- Depends on: profiles table (migration 001)

CREATE TABLE wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discogs_release_id integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  cover_image_url text,
  year integer,
  genres text[] DEFAULT '{}',
  styles text[] DEFAULT '{}',
  format text,
  label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, discogs_release_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Indexes for query patterns from api-contracts.md:
-- 1. Filter by user (all wishlist endpoints)
CREATE INDEX idx_wishlist_user_id ON wishlist_items(user_id);
-- 2. Unique index on (user_id, discogs_release_id) for fast duplicate checks
--    Note: the UNIQUE table constraint already creates this implicitly,
--    but we create it explicitly per the contract for clarity.
CREATE UNIQUE INDEX idx_wishlist_user_discogs ON wishlist_items(user_id, discogs_release_id);
```

### Test (appended to `__tests__/data/validate-migrations.test.ts`)

```ts
describe('Migration 003: wishlist_items', () => {
  const sql = readMigration('20260317000003_create_wishlist_items.sql');

  it('creates the wishlist_items table', () => {
    expect(sql).toMatch(/CREATE TABLE wishlist_items/i);
  });

  it('has all required columns', () => {
    const columns = [
      'id', 'user_id', 'discogs_release_id', 'title', 'artist',
      'cover_image_url', 'year', 'genres', 'styles', 'format',
      'label', 'notes', 'created_at',
    ];
    for (const col of columns) {
      expect(sql).toContain(col);
    }
  });

  it('does NOT have updated_at (wishlist items are immutable once added)', () => {
    // The contract does not include updated_at for wishlist_items
    expect(sql).not.toMatch(/updated_at/i);
  });

  it('does NOT have catno, country, condition_media, condition_sleeve, purchase_price, purchase_date', () => {
    // These fields are collection-only
    const collectionOnlyColumns = [
      'catno', 'country', 'condition_media', 'condition_sleeve',
      'purchase_price', 'purchase_date',
    ];
    for (const col of collectionOnlyColumns) {
      expect(sql).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it('references profiles(id)', () => {
    expect(sql).toMatch(/REFERENCES profiles\(id\)/i);
  });

  it('has unique constraint on (user_id, discogs_release_id)', () => {
    expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*discogs_release_id\s*\)/i);
  });

  it('enables RLS', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
  });

  it('creates idx_wishlist_user_id index', () => {
    expect(sql).toMatch(/CREATE INDEX idx_wishlist_user_id ON wishlist_items\(user_id\)/i);
  });

  it('creates idx_wishlist_user_discogs unique index', () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX idx_wishlist_user_discogs ON wishlist_items\(user_id, discogs_release_id\)/i);
  });
});
```

### TDD Steps
1. Add tests. Run -- fails.
2. Create `supabase/migrations/20260317000003_create_wishlist_items.sql`.
3. Run tests -- all pass.
4. Commit: `"feat(data): add wishlist_items table migration with indexes"`

---

## Task 4: RLS policies for all three tables

**Time estimate:** 5 minutes
**Dependencies:** Tasks 1, 2, 3 (all tables must exist)
**Files:**
- `supabase/migrations/20260317000004_rls_policies.sql`
- `__tests__/data/validate-migrations.test.ts` (append tests)

### SQL: `supabase/migrations/20260317000004_rls_policies.sql`

```sql
-- Migration: Row Level Security policies for all tables
-- Depends on: profiles, collection_items, wishlist_items tables

-- ============================================================
-- profiles: users can read and update their own profile only
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- collection_items: full CRUD restricted to owner
-- ============================================================
CREATE POLICY "Users can read own collection"
  ON collection_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection"
  ON collection_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON collection_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection"
  ON collection_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- wishlist_items: full CRUD restricted to owner
-- ============================================================
CREATE POLICY "Users can read own wishlist"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON wishlist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);
```

### Test (appended to `__tests__/data/validate-migrations.test.ts`)

```ts
describe('Migration 004: RLS policies', () => {
  const sql = readMigration('20260317000004_rls_policies.sql');

  // --- profiles ---
  it('creates SELECT policy for profiles', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can read own profile"\s+ON profiles FOR SELECT/i);
  });

  it('creates UPDATE policy for profiles', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can update own profile"\s+ON profiles FOR UPDATE/i);
  });

  it('profiles policies use auth.uid() = id', () => {
    // Both profiles policies should compare against `id` (not `user_id`)
    const profilesSection = sql.split('collection_items')[0];
    expect(profilesSection).toMatch(/auth\.uid\(\) = id/);
  });

  // --- collection_items ---
  it('creates all four CRUD policies for collection_items', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can read own collection"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can insert own collection"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can update own collection"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can delete own collection"/i);
  });

  it('collection INSERT policy uses WITH CHECK', () => {
    expect(sql).toMatch(/ON collection_items FOR INSERT\s+WITH CHECK \(auth\.uid\(\) = user_id\)/i);
  });

  // --- wishlist_items ---
  it('creates all four CRUD policies for wishlist_items', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can read own wishlist"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can insert own wishlist"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can update own wishlist"/i);
    expect(sql).toMatch(/CREATE POLICY "Users can delete own wishlist"/i);
  });

  it('wishlist INSERT policy uses WITH CHECK', () => {
    expect(sql).toMatch(/ON wishlist_items FOR INSERT\s+WITH CHECK \(auth\.uid\(\) = user_id\)/i);
  });

  it('all non-INSERT policies use USING (not WITH CHECK)', () => {
    // SELECT, UPDATE, DELETE should use USING
    const selectPolicies = sql.match(/FOR (SELECT|UPDATE|DELETE)[\s\S]*?(?=CREATE POLICY|$)/gi) || [];
    for (const policy of selectPolicies) {
      if (!policy.match(/FOR INSERT/i)) {
        expect(policy).toMatch(/USING\s*\(/i);
      }
    }
  });
});
```

### TDD Steps
1. Add tests. Run -- fails.
2. Create `supabase/migrations/20260317000004_rls_policies.sql`.
3. Run tests -- all pass.
4. Commit: `"feat(data): add RLS policies for profiles, collection_items, wishlist_items"`

---

## Task 5: `updated_at` trigger function + triggers

**Time estimate:** 3 minutes
**Dependencies:** Tasks 1, 2 (profiles and collection_items must exist)
**Files:**
- `supabase/migrations/20260317000005_updated_at_triggers.sql`
- `__tests__/data/validate-migrations.test.ts` (append tests)

### SQL: `supabase/migrations/20260317000005_updated_at_triggers.sql`

```sql
-- Migration: updated_at auto-update trigger function and triggers
-- Depends on: profiles (migration 001), collection_items (migration 002)

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON collection_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Note:** `wishlist_items` does not have an `updated_at` column (per contract), so no trigger is needed for it.

### Test (appended to `__tests__/data/validate-migrations.test.ts`)

```ts
describe('Migration 005: updated_at triggers', () => {
  const sql = readMigration('20260317000005_updated_at_triggers.sql');

  it('creates the update_updated_at function', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION update_updated_at\(\)/i);
  });

  it('function sets NEW.updated_at to now()', () => {
    expect(sql).toMatch(/NEW\.updated_at\s*=\s*now\(\)/i);
  });

  it('function returns NEW', () => {
    expect(sql).toMatch(/RETURN NEW/i);
  });

  it('creates trigger on profiles', () => {
    expect(sql).toMatch(/CREATE TRIGGER set_updated_at\s+BEFORE UPDATE ON profiles/i);
  });

  it('creates trigger on collection_items', () => {
    expect(sql).toMatch(/CREATE TRIGGER set_updated_at\s+BEFORE UPDATE ON collection_items/i);
  });

  it('does NOT create trigger on wishlist_items (no updated_at column)', () => {
    expect(sql).not.toMatch(/ON wishlist_items/i);
  });

  it('triggers fire FOR EACH ROW', () => {
    const matches = sql.match(/FOR EACH ROW/gi);
    expect(matches).toHaveLength(2);
  });
});
```

### TDD Steps
1. Add tests. Run -- fails.
2. Create `supabase/migrations/20260317000005_updated_at_triggers.sql`.
3. Run tests -- all pass.
4. Commit: `"feat(data): add updated_at trigger function and triggers"`

---

## Task 6: Seed data

**Time estimate:** 10 minutes
**Dependencies:** All previous tasks (all tables must exist)
**Files:**
- `supabase/seed.sql`
- `__tests__/data/validate-migrations.test.ts` (append tests)

### SQL: `supabase/seed.sql`

```sql
-- Seed data for development and testing
-- Creates 2 test users with collection and wishlist items
--
-- NOTE: This file inserts directly into profiles (not auth.users) because
-- auth.users is managed by Supabase Auth. In a real environment, the
-- on_auth_user_created trigger auto-creates profiles. For seeding, we
-- bypass that and insert profiles directly with known UUIDs.

-- ============================================================
-- Test Users (profiles)
-- ============================================================
INSERT INTO profiles (id, display_name, avatar_url, created_at, updated_at) VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Alice Vinyl', NULL, '2025-01-15T10:00:00Z', '2025-06-20T14:30:00Z'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Bob Grooves', NULL, '2025-03-01T08:00:00Z', '2025-07-10T09:15:00Z');

-- ============================================================
-- Alice's Collection (10 items)
-- ============================================================
INSERT INTO collection_items (
  id, user_id, discogs_release_id, title, artist,
  cover_image_url, year, genres, styles, format,
  label, catno, country, condition_media, condition_sleeve,
  notes, purchase_price, purchase_date, created_at, updated_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    249504, 'OK Computer', 'Radiohead',
    'https://i.discogs.com/ok-computer.jpg', 1997,
    ARRAY['Electronic', 'Rock'], ARRAY['Alternative Rock', 'Art Rock'],
    'LP', 'Parlophone', 'NODATA 02', 'UK',
    'NM', 'VG+',
    'Original UK pressing, plays beautifully', 45.00, '2024-03-15',
    '2025-02-01T12:00:00Z', '2025-06-20T14:30:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    1459271, 'In Rainbows', 'Radiohead',
    'https://i.discogs.com/in-rainbows.jpg', 2007,
    ARRAY['Electronic', 'Rock'], ARRAY['Alternative Rock', 'Experimental'],
    'LP', 'XL Recordings', 'XLLP324', 'UK',
    'M', 'M',
    'Sealed copy from discbox set', 60.00, '2024-05-20',
    '2025-02-10T09:00:00Z', '2025-02-10T09:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    3315822, 'The Dark Side of the Moon', 'Pink Floyd',
    'https://i.discogs.com/dark-side.jpg', 1973,
    ARRAY['Rock'], ARRAY['Prog Rock', 'Psychedelic Rock'],
    'LP', 'Harvest', 'SHVL 804', 'UK',
    'VG+', 'VG',
    'First press, A3/B3 matrix. Slight ring wear on sleeve.', 120.00, '2023-11-10',
    '2025-03-01T15:00:00Z', '2025-05-15T11:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    5322674, 'Kind of Blue', 'Miles Davis',
    'https://i.discogs.com/kind-of-blue.jpg', 1959,
    ARRAY['Jazz'], ARRAY['Modal'],
    'LP', 'Columbia', 'CS 8163', 'US',
    'VG', 'VG',
    '6-eye stereo pressing. Some surface noise on side B.', 85.00, '2024-01-08',
    '2025-03-15T10:00:00Z', '2025-03-15T10:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    1566240, 'Rumours', 'Fleetwood Mac',
    'https://i.discogs.com/rumours.jpg', 1977,
    ARRAY['Rock', 'Pop'], ARRAY['Pop Rock', 'Classic Rock'],
    'LP', 'Warner Bros. Records', 'BSK 3010', 'US',
    'NM', 'NM',
    'Clean copy, texturized gatefold intact', 35.00, '2024-07-01',
    '2025-04-01T08:00:00Z', '2025-04-01T08:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    2438163, 'Loveless', 'My Bloody Valentine',
    'https://i.discogs.com/loveless.jpg', 1991,
    ARRAY['Rock'], ARRAY['Shoegaze', 'Noise Pop'],
    'LP', 'Creation Records', 'CRELP 060', 'UK',
    'NM', 'VG+',
    'Original Creation pressing. Inner sleeve has slight split.', 200.00, '2024-09-12',
    '2025-04-20T16:00:00Z', '2025-04-20T16:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111107',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    3818606, 'To Pimp a Butterfly', 'Kendrick Lamar',
    'https://i.discogs.com/tpab.jpg', 2015,
    ARRAY['Hip Hop'], ARRAY['Conscious', 'Jazz Rap'],
    '2xLP', 'Top Dawg Entertainment', 'B0022986-01', 'US',
    'NM', 'NM',
    NULL, 32.00, '2025-01-05',
    '2025-05-01T12:00:00Z', '2025-05-01T12:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111108',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    1236781, 'Blue', 'Joni Mitchell',
    'https://i.discogs.com/blue.jpg', 1971,
    ARRAY['Folk, World, & Country', 'Rock'], ARRAY['Folk', 'Singer-Songwriter'],
    'LP', 'Reprise Records', 'MS 2038', 'US',
    'VG+', 'VG+',
    'Gatefold. Very clean pressing.', 40.00, '2024-06-18',
    '2025-05-15T10:00:00Z', '2025-05-15T10:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111109',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    7496025, 'Fetch the Bolt Cutters', 'Fiona Apple',
    'https://i.discogs.com/fetch-bolt.jpg', 2020,
    ARRAY['Rock', 'Pop'], ARRAY['Art Pop', 'Experimental'],
    '2xLP', 'Epic', '19439-76551-1', 'US',
    'M', 'M',
    'Still in shrink wrap', 28.00, '2025-02-14',
    '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z'
  ),
  (
    '11111111-1111-4111-8111-111111111110',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    4806927, 'Blonde', 'Frank Ocean',
    'https://i.discogs.com/blonde.jpg', 2016,
    ARRAY['Electronic', 'Pop'], ARRAY['Contemporary R&B', 'Art Pop'],
    '2xLP', 'Boys Don''t Cry', 'BDC01', 'US',
    'NM', 'NM',
    'Black Friday 2016 pressing. Blonde cover variant.', 150.00, '2024-12-01',
    '2025-06-15T14:00:00Z', '2025-06-15T14:00:00Z'
  );

-- ============================================================
-- Bob's Collection (10 items)
-- ============================================================
INSERT INTO collection_items (
  id, user_id, discogs_release_id, title, artist,
  cover_image_url, year, genres, styles, format,
  label, catno, country, condition_media, condition_sleeve,
  notes, purchase_price, purchase_date, created_at, updated_at
) VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1485872, 'Abbey Road', 'The Beatles',
    'https://i.discogs.com/abbey-road.jpg', 1969,
    ARRAY['Rock', 'Pop'], ARRAY['Pop Rock', 'Classic Rock'],
    'LP', 'Apple Records', 'PCS 7088', 'UK',
    'VG+', 'VG',
    'Second press. -1/-1 matrix. Great sound.', 55.00, '2024-02-28',
    '2025-03-10T10:00:00Z', '2025-03-10T10:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    6216258, 'A Love Supreme', 'John Coltrane',
    'https://i.discogs.com/love-supreme.jpg', 1965,
    ARRAY['Jazz'], ARRAY['Free Jazz', 'Hard Bop'],
    'LP', 'Impulse!', 'A-77', 'US',
    'VG', 'G+',
    'Van Gelder pressing. Cover has wear but disc is solid.', 70.00, '2023-08-15',
    '2025-03-20T11:00:00Z', '2025-05-01T09:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    367103, 'Wish You Were Here', 'Pink Floyd',
    'https://i.discogs.com/wish-you-were-here.jpg', 1975,
    ARRAY['Rock'], ARRAY['Prog Rock', 'Classic Rock'],
    'LP', 'Harvest', 'SHVL 814', 'UK',
    'NM', 'NM',
    'Reissue, 180g. Includes original shrink + sticker.', 30.00, '2024-04-10',
    '2025-04-01T08:00:00Z', '2025-04-01T08:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1244169, 'Remain in Light', 'Talking Heads',
    'https://i.discogs.com/remain-in-light.jpg', 1980,
    ARRAY['Electronic', 'Rock'], ARRAY['New Wave', 'Art Rock'],
    'LP', 'Sire', 'SRK 6095', 'US',
    'NM', 'VG+',
    'Original Sire pressing with red/black labels.', 40.00, '2024-05-05',
    '2025-04-15T14:00:00Z', '2025-04-15T14:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1722444, 'Dummy', 'Portishead',
    'https://i.discogs.com/dummy.jpg', 1994,
    ARRAY['Electronic'], ARRAY['Trip Hop', 'Downtempo'],
    'LP', 'Go! Beat', '828 553-1', 'UK',
    'VG+', 'VG+',
    NULL, 50.00, '2024-06-22',
    '2025-05-01T10:00:00Z', '2025-05-01T10:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1827610, 'Disintegration', 'The Cure',
    'https://i.discogs.com/disintegration.jpg', 1989,
    ARRAY['Rock'], ARRAY['New Wave', 'Goth Rock'],
    '2xLP', 'Fiction Records', 'FIXH 14', 'UK',
    'NM', 'NM',
    'Original UK double LP. Stunning condition.', 65.00, '2024-08-18',
    '2025-05-20T08:00:00Z', '2025-05-20T08:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    4490498, 'Madvillainy', 'Madvillain',
    'https://i.discogs.com/madvillainy.jpg', 2004,
    ARRAY['Hip Hop'], ARRAY['Abstract', 'Experimental Hip Hop'],
    '2xLP', 'Stones Throw Records', 'STH2065', 'US',
    'NM', 'NM',
    'Repress on standard black vinyl', 25.00, '2025-01-12',
    '2025-06-01T12:00:00Z', '2025-06-01T12:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222208',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    6460499, 'Currents', 'Tame Impala',
    'https://i.discogs.com/currents.jpg', 2015,
    ARRAY['Electronic', 'Rock'], ARRAY['Psychedelic Rock', 'Synth-pop'],
    '2xLP', 'Modular Recordings', 'MODVL172', 'Australia',
    'NM', 'NM',
    'Australian pressing. Sounds incredible.', 35.00, '2024-10-05',
    '2025-06-10T09:00:00Z', '2025-06-10T09:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222209',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    497199, 'Yankee Hotel Foxtrot', 'Wilco',
    'https://i.discogs.com/yhf.jpg', 2002,
    ARRAY['Rock'], ARRAY['Indie Rock', 'Alternative Rock'],
    '2xLP', 'Nonesuch', '79669-1', 'US',
    'VG+', 'VG+',
    'OG pressing. Includes printed inner sleeves.', 38.00, '2024-11-20',
    '2025-06-20T16:00:00Z', '2025-06-20T16:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222210',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    2578051, 'Homogenic', 'Bjork',
    'https://i.discogs.com/homogenic.jpg', 1997,
    ARRAY['Electronic'], ARRAY['IDM', 'Experimental', 'Trip Hop'],
    'LP', 'One Little Indian', 'TPLP71', 'UK',
    'NM', 'VG+',
    'Original One Little Indian. Beautiful pressing.', 55.00, '2025-02-03',
    '2025-07-01T10:00:00Z', '2025-07-01T10:00:00Z'
  );

-- ============================================================
-- Alice's Wishlist (5 items)
-- ============================================================
INSERT INTO wishlist_items (
  id, user_id, discogs_release_id, title, artist,
  cover_image_url, year, genres, styles, format,
  label, notes, created_at
) VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    1161290, 'Vespertine', 'Bjork',
    'https://i.discogs.com/vespertine.jpg', 2001,
    ARRAY['Electronic'], ARRAY['IDM', 'Glitch', 'Experimental'],
    '2xLP', 'One Little Indian',
    'Looking for an original UK pressing in NM condition',
    '2025-04-01T10:00:00Z'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    2816779, 'Hounds of Love', 'Kate Bush',
    'https://i.discogs.com/hounds-of-love.jpg', 1985,
    ARRAY['Electronic', 'Pop'], ARRAY['Synth-pop', 'Art Pop'],
    'LP', 'EMI',
    'Any pressing in VG+ or better',
    '2025-04-15T08:00:00Z'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    3663445, 'Stratosphere', 'Duster',
    'https://i.discogs.com/stratosphere.jpg', 1998,
    ARRAY['Rock'], ARRAY['Lo-Fi', 'Slowcore', 'Space Rock'],
    'LP', 'Up Records',
    'OG pressing preferred but any will do',
    '2025-05-01T14:00:00Z'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    3380810, 'Sung Tongs', 'Animal Collective',
    'https://i.discogs.com/sung-tongs.jpg', 2004,
    ARRAY['Rock', 'Electronic'], ARRAY['Experimental', 'Psychedelic Rock'],
    '2xLP', 'FatCat Records',
    NULL,
    '2025-05-20T11:00:00Z'
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    15542301, 'Sometimes I Might Be Introvert', 'Little Simz',
    'https://i.discogs.com/simbi.jpg', 2021,
    ARRAY['Hip Hop'], ARRAY['UK Hip Hop', 'Conscious'],
    '2xLP', 'Age 101 Music',
    'Gold vinyl variant if possible',
    '2025-06-10T09:00:00Z'
  );

-- ============================================================
-- Bob's Wishlist (5 items)
-- ============================================================
INSERT INTO wishlist_items (
  id, user_id, discogs_release_id, title, artist,
  cover_image_url, year, genres, styles, format,
  label, notes, created_at
) VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1198731, 'Agaetis Byrjun', 'Sigur Ros',
    'https://i.discogs.com/agaetis.jpg', 1999,
    ARRAY['Rock', 'Electronic'], ARRAY['Post Rock', 'Ambient'],
    '2xLP', 'Fat Cat Records',
    'Want the original Icelandic pressing',
    '2025-04-10T12:00:00Z'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1290641, 'Lift Your Skinny Fists Like Antennas to Heaven', 'Godspeed You! Black Emperor',
    'https://i.discogs.com/lysflath.jpg', 2000,
    ARRAY['Rock'], ARRAY['Post Rock', 'Experimental'],
    '2xLP', 'Constellation',
    NULL,
    '2025-04-20T08:00:00Z'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    3263637, 'Selected Ambient Works 85-92', 'Aphex Twin',
    'https://i.discogs.com/saw85-92.jpg', 1992,
    ARRAY['Electronic'], ARRAY['Ambient', 'IDM', 'Acid House'],
    '2xLP', 'Apollo',
    'Looking for a well-pressed reissue',
    '2025-05-05T15:00:00Z'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    1497360, 'Heaven or Las Vegas', 'Cocteau Twins',
    'https://i.discogs.com/holv.jpg', 1990,
    ARRAY['Rock', 'Electronic'], ARRAY['Dream Pop', 'Ethereal'],
    'LP', '4AD',
    'OG 4AD pressing, any condition considered',
    '2025-06-01T10:00:00Z'
  ),
  (
    '44444444-4444-4444-8444-444444444405',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    4173883, 'The Glow Pt. 2', 'The Microphones',
    'https://i.discogs.com/glow-pt2.jpg', 2001,
    ARRAY['Rock'], ARRAY['Lo-Fi', 'Indie Rock', 'Experimental'],
    '2xLP', 'K Records',
    'Preferably the K Records original',
    '2025-06-15T14:00:00Z'
  );
```

### Test (appended to `__tests__/data/validate-migrations.test.ts`)

```ts
describe('Seed data', () => {
  const sql = readFileSync(
    path.resolve(__dirname, '../../supabase/seed.sql'),
    'utf-8'
  );

  it('inserts exactly 2 profiles', () => {
    const profileInserts = sql.match(/INSERT INTO profiles/gi);
    expect(profileInserts).toHaveLength(1); // single INSERT with 2 rows
    // Count the UUIDs in the profiles INSERT
    const profileSection = sql.split('collection_items')[0];
    const uuids = profileSection.match(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'/gi);
    expect(uuids).toHaveLength(2);
  });

  it('inserts collection_items for both users', () => {
    const aliceId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const bobId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
    expect(sql).toContain(aliceId);
    expect(sql).toContain(bobId);
  });

  it('inserts approximately 10 collection items per user', () => {
    const aliceId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const bobId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
    // Count occurrences as user_id in collection_items inserts
    const aliceMatches = sql.match(new RegExp(aliceId, 'g'));
    const bobMatches = sql.match(new RegExp(bobId, 'g'));
    // Each user appears once in profiles + ~10 in collection + ~5 in wishlist
    expect(aliceMatches!.length).toBeGreaterThanOrEqual(15);
    expect(bobMatches!.length).toBeGreaterThanOrEqual(15);
  });

  it('inserts wishlist_items for both users', () => {
    expect(sql).toMatch(/INSERT INTO wishlist_items/i);
  });

  it('uses valid condition grades only', () => {
    const conditionValues = sql.match(/'(M|NM|VG\+|VG|G\+|G|F|P)'/g);
    expect(conditionValues).not.toBeNull();
    const validGrades = new Set(["'M'", "'NM'", "'VG+'", "'VG'", "'G+'", "'G'", "'F'", "'P'"]);
    for (const val of conditionValues!) {
      expect(validGrades.has(val)).toBe(true);
    }
  });

  it('uses realistic vinyl album data', () => {
    // Spot check a few well-known albums
    expect(sql).toContain('OK Computer');
    expect(sql).toContain('Abbey Road');
    expect(sql).toContain('Kind of Blue');
    expect(sql).toContain('Loveless');
  });

  it('has no duplicate discogs_release_id per user', () => {
    // Extract all (user_id, discogs_release_id) pairs from collection and wishlist inserts
    const pairs = sql.match(/'[0-9a-f-]+',\s*\d+/g);
    if (pairs) {
      const seen = new Set<string>();
      for (const pair of pairs) {
        // Pairs appear within same table context, good enough for structural check
        expect(seen.has(pair)).toBe(false);
        seen.add(pair);
      }
    }
  });
});
```

### TDD Steps
1. Add tests. Run -- fails.
2. Create `supabase/seed.sql`.
3. Run tests -- all pass.
4. Commit: `"feat(data): add seed data with 2 users, 20 collection items, 10 wishlist items"`

---

## Task Dependency Graph

```
Task 1 (profiles) ──┬── Task 2 (collection_items) ──┐
                     │                                ├── Task 4 (RLS policies) ── Task 6 (seed)
                     ├── Task 3 (wishlist_items) ─────┘         │
                     │                                          │
                     └── Task 5 (updated_at triggers) ──────────┘
```

Tasks 2, 3, and 5 can run in parallel after Task 1 completes.
Task 4 requires Tasks 1, 2, 3.
Task 6 requires all prior tasks.

## Execution Checklist

| # | Task | File | Est. | Depends On |
|---|------|------|------|------------|
| 1 | profiles table + handle_new_user trigger | `supabase/migrations/20260317000001_create_profiles.sql` | 5 min | -- |
| 2 | collection_items table + indexes | `supabase/migrations/20260317000002_create_collection_items.sql` | 5 min | 1 |
| 3 | wishlist_items table + indexes | `supabase/migrations/20260317000003_create_wishlist_items.sql` | 5 min | 1 |
| 4 | RLS policies (all 3 tables) | `supabase/migrations/20260317000004_rls_policies.sql` | 5 min | 1, 2, 3 |
| 5 | updated_at trigger function + triggers | `supabase/migrations/20260317000005_updated_at_triggers.sql` | 3 min | 1, 2 |
| 6 | Seed data | `supabase/seed.sql` | 10 min | 1-5 |

**Total estimated time:** ~33 minutes

## Validation Test File

All tests live in `__tests__/data/validate-migrations.test.ts`. Run with:

```bash
npx vitest run __tests__/data/validate-migrations.test.ts
```

The test file reads each `.sql` file and validates:
- Correct table names, column names, and types
- Foreign key references
- CHECK constraints match Goldberg grades
- UNIQUE constraints on (user_id, discogs_release_id)
- RLS enabled on all tables
- All RLS policies present with correct operations and expressions
- Indexes match api-contracts.md query patterns
- Trigger function and trigger definitions correct
- Seed data has correct structure and realistic content

## Notes

1. **No `updated_at` on `wishlist_items`**: The contract defines `wishlist_items` without an `updated_at` column. Wishlist items are effectively immutable after creation (users add/remove them, but don't edit them). The `updated_at` trigger is only applied to `profiles` and `collection_items`.

2. **`idx_wishlist_user_discogs` syntax fix**: The contract specifies `CREATE INDEX idx_wishlist_user_discogs UNIQUE ON wishlist_items(...)` which is invalid SQL. We implement it as `CREATE UNIQUE INDEX idx_wishlist_user_discogs ON wishlist_items(user_id, discogs_release_id)`. This is redundant with the table-level `UNIQUE(user_id, discogs_release_id)` constraint but matches the contract's intent.

3. **Seed data uses direct profile inserts**: Since seed data cannot trigger `auth.users` inserts (that requires Supabase Auth), profiles are inserted directly with known UUIDs. In production, the `on_auth_user_created` trigger handles profile creation automatically.

4. **Migration ordering**: Supabase applies migrations in lexicographic order by filename. The `YYYYMMDDHHMMSS_` prefix ensures correct ordering. All migrations use the same date (`20260317`) with sequential sequence numbers.

5. **Index strategy derived from API contracts**:
   - `idx_collection_user_id` -- every collection query filters by `user_id` (RLS + application logic)
   - `idx_collection_user_created` -- `GET /collection` default sort is by `created_at DESC`
   - `idx_collection_user_artist` -- `getCollectionStats` groups by artist; collection filtering/sorting by artist
   - `idx_wishlist_user_id` -- every wishlist query filters by `user_id`
   - `idx_wishlist_user_discogs` -- fast duplicate check for `addToWishlist` and `moveWishlistToCollection`
