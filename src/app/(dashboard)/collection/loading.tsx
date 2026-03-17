import { VinylGridSkeleton } from "@/components/vinyl/vinyl-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>
      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
      <VinylGridSkeleton count={10} />
    </div>
  );
}
