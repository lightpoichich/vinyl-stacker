import { VinylGridSkeleton } from "@/components/vinyl/vinyl-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistLoading() {
  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <VinylGridSkeleton count={8} />
    </div>
  );
}
