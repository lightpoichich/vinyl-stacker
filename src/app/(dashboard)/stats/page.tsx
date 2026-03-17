import { getCollectionStats } from "@/lib/actions/stats";
import { StatCard } from "@/components/vinyl/stat-card";
import { Library, Disc3, Music, BarChart3, Calendar } from "lucide-react";

export const metadata = {
  title: "Stats - Vinyl Stacker",
};

export default async function StatsPage() {
  const result = await getCollectionStats();

  if (result.error) {
    return (
      <div className="px-4 py-6">
        <p className="text-destructive">
          Failed to load stats: {result.error.message}
        </p>
      </div>
    );
  }

  const stats = result.data!;
  const maxGenreCount = stats.genreDistribution[0]?.count || 1;
  const maxDecadeCount = Math.max(
    ...stats.decadeDistribution.map((d) => d.count),
    1
  );
  const maxFormatCount = stats.formatDistribution[0]?.count || 1;
  const maxConditionCount = stats.conditionDistribution[0]?.count || 1;

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Collection Stats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An overview of your vinyl collection
        </p>
      </div>

      {stats.totalRecords === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">No stats yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add some records to your collection to see stats
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={Library}
              title="Total Records"
              value={stats.totalRecords}
            />
            <StatCard
              icon={Music}
              title="Genres"
              value={stats.genreDistribution.length}
            />
            <StatCard
              icon={Calendar}
              title="Decades"
              value={stats.decadeDistribution.length}
            />
            <StatCard
              icon={Disc3}
              title="Formats"
              value={stats.formatDistribution.length}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Genre Distribution */}
            {stats.genreDistribution.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="mb-3 font-[family-name:var(--font-space-grotesk)] font-semibold">
                  Genres
                </h3>
                <div className="flex flex-col gap-2.5">
                  {stats.genreDistribution.slice(0, 8).map((g) => (
                    <div key={g.genre} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{g.genre}</span>
                        <span className="text-muted-foreground">
                          {g.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${(g.count / maxGenreCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decade Distribution */}
            {stats.decadeDistribution.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="mb-3 font-[family-name:var(--font-space-grotesk)] font-semibold">
                  Decades
                </h3>
                <div className="flex flex-col gap-2.5">
                  {stats.decadeDistribution.map((d) => (
                    <div key={d.decade} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{d.decade}</span>
                        <span className="text-muted-foreground">
                          {d.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-2 transition-all"
                          style={{
                            width: `${(d.count / maxDecadeCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format Distribution */}
            {stats.formatDistribution.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="mb-3 font-[family-name:var(--font-space-grotesk)] font-semibold">
                  Formats
                </h3>
                <div className="flex flex-col gap-2.5">
                  {stats.formatDistribution.slice(0, 8).map((f) => (
                    <div key={f.format} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{f.format}</span>
                        <span className="text-muted-foreground">
                          {f.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3 transition-all"
                          style={{
                            width: `${(f.count / maxFormatCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Condition Distribution */}
            {stats.conditionDistribution.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="mb-3 font-[family-name:var(--font-space-grotesk)] font-semibold">
                  Conditions
                </h3>
                <div className="flex flex-col gap-2.5">
                  {stats.conditionDistribution.map((c) => (
                    <div key={c.condition} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{c.condition}</span>
                        <span className="text-muted-foreground">
                          {c.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-4 transition-all"
                          style={{
                            width: `${(c.count / maxConditionCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
