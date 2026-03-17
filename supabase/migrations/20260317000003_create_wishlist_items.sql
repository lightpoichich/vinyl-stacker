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

CREATE INDEX idx_wishlist_user_id ON wishlist_items(user_id);
CREATE UNIQUE INDEX idx_wishlist_user_discogs ON wishlist_items(user_id, discogs_release_id);
