import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
}

export function StatCard({ icon: Icon, title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
