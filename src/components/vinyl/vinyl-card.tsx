import Link from "next/link";
import { ConditionBadge } from "./condition-badge";
import { Disc3 } from "lucide-react";
import type { Condition } from "@/lib/schemas";

interface VinylCardProps {
  id: string;
  title: string;
  artist: string;
  coverImageUrl: string | null;
  year: number | null;
  format: string | null;
  conditionMedia?: string | null;
  href: string;
}

export function VinylCard({
  title,
  artist,
  coverImageUrl,
  year,
  format,
  conditionMedia,
  href,
}: VinylCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Cover art */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${title} by ${artist}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Disc3 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {conditionMedia && (
          <div className="absolute right-2 top-2">
            <ConditionBadge condition={conditionMedia as Condition} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-1 text-sm font-medium leading-tight">
          {title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{artist}</p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          {year && (
            <span className="text-xs text-muted-foreground">{year}</span>
          )}
          {format && (
            <span className="text-xs text-muted-foreground/60">{format}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
