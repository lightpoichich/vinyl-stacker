# Database Schema Contract

> Immutable. Only the Conductor may modify this document.

## Tables

### profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on user signup
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

**RLS Policies:**
```sql
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### collection_items
```sql
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
```

**RLS Policies:**
```sql
CREATE POLICY "Users can read own collection" ON collection_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collection" ON collection_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collection" ON collection_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collection" ON collection_items
  FOR DELETE USING (auth.uid() = user_id);
```

**Indexes:**
```sql
CREATE INDEX idx_collection_user_id ON collection_items(user_id);
CREATE INDEX idx_collection_user_created ON collection_items(user_id, created_at DESC);
CREATE INDEX idx_collection_user_artist ON collection_items(user_id, artist);
```

### wishlist_items
```sql
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
```

**RLS Policies:**
```sql
CREATE POLICY "Users can read own wishlist" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON wishlist_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);
```

**Indexes:**
```sql
CREATE INDEX idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_user_discogs UNIQUE ON wishlist_items(user_id, discogs_release_id);
```

## Updated_at Trigger
```sql
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
