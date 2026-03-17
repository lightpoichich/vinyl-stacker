import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/schemas";

const conditionColors: Record<Condition, string> = {
  M: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  NM: "bg-green-500/15 text-green-400 border-green-500/20",
  "VG+": "bg-lime-500/15 text-lime-400 border-lime-500/20",
  VG: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "G+": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  G: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  F: "bg-red-500/15 text-red-400 border-red-500/20",
  P: "bg-red-800/15 text-red-600 border-red-800/20",
};

const conditionLabels: Record<Condition, string> = {
  M: "Mint",
  NM: "Near Mint",
  "VG+": "Very Good+",
  VG: "Very Good",
  "G+": "Good+",
  G: "Good",
  F: "Fair",
  P: "Poor",
};

interface ConditionBadgeProps {
  condition: Condition;
  showLabel?: boolean;
  className?: string;
}

export function ConditionBadge({
  condition,
  showLabel = false,
  className,
}: ConditionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        conditionColors[condition],
        className
      )}
    >
      {condition}
      {showLabel && (
        <span className="ml-1 opacity-75">
          {conditionLabels[condition]}
        </span>
      )}
    </span>
  );
}
