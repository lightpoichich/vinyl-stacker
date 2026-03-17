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

CREATE INDEX idx_collection_user_id ON collection_items(user_id);
CREATE INDEX idx_collection_user_created ON collection_items(user_id, created_at DESC);
CREATE INDEX idx_collection_user_artist ON collection_items(user_id, artist);
