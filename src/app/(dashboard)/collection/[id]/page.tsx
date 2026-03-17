import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { toCamelCase } from "@/lib/utils/case-mapper";
import { discogsFetch } from "@/lib/discogs/client";
import type { CollectionItem, DiscogsRelease } from "@/lib/schemas";
import { CollectionDetailClient } from "./collection-detail-client";

interface PageProps {
  params: { id: string };
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row, error } = await supabase
    .from("collection_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !row) {
    notFound();
  }

  const item = toCamelCase<CollectionItem>(row);

  // Fetch Discogs release data for tracklist (direct server-side call)
  let tracklist: { position: string; title: string; duration: string }[] = [];
  try {
    const result = await discogsFetch<DiscogsRelease>({
      path: `/releases/${item.discogsReleaseId}`,
    });
    if (result.data?.tracklist) {
      tracklist = result.data.tracklist;
    }
  } catch {
    // Silently fail - tracklist is optional
  }

  return <CollectionDetailClient item={item} tracklist={tracklist} />;
}
