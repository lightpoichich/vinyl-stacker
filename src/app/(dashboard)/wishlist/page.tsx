import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toCamelCase } from "@/lib/utils/case-mapper";
import type { WishlistItem } from "@/lib/schemas";
import { WishlistPageClient } from "./wishlist-page-client";

export const metadata = {
  title: "Wishlist - Vinyl Stacker",
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="px-4 py-6">
        <p className="text-destructive">
          Failed to load wishlist: {error.message}
        </p>
      </div>
    );
  }

  const items = (rows || []).map((row: Record<string, unknown>) =>
    toCamelCase<WishlistItem>(row)
  );

  return <WishlistPageClient items={items} />;
}
