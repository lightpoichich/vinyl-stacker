import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toCamelCase } from "@/lib/utils/case-mapper";
import type { CollectionItem } from "@/lib/schemas";
import { CollectionPageClient } from "./collection-page-client";

export const metadata = {
  title: "Collection - Vinyl Stacker",
};

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("collection_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="px-4 py-6">
        <p className="text-destructive">
          Failed to load collection: {error.message}
        </p>
      </div>
    );
  }

  const items = (rows || []).map((row: Record<string, unknown>) =>
    toCamelCase<CollectionItem>(row)
  );

  // Extract unique genres for filter
  const genreSet = new Set<string>();
  for (const item of items) {
    for (const genre of item.genres || []) {
      genreSet.add(genre);
    }
  }
  const genres = Array.from(genreSet).sort();

  return <CollectionPageClient items={items} genres={genres} />;
}
