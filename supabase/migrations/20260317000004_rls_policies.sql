-- Migration: Row Level Security policies for all tables

-- profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- collection_items
CREATE POLICY "Users can read own collection" ON collection_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collection" ON collection_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collection" ON collection_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collection" ON collection_items
  FOR DELETE USING (auth.uid() = user_id);

-- wishlist_items
CREATE POLICY "Users can read own wishlist" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON wishlist_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);
