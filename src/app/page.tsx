import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Disc3, Library, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />

      {/* Floating vinyl record */}
      <div className="pointer-events-none absolute right-[-10%] top-[10%] hidden opacity-10 lg:block">
        <div className="animate-spin-vinyl-slow h-[500px] w-[500px]">
          <div className="relative h-full w-full rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-2xl">
            {/* Grooves */}
            <div className="absolute inset-[15%] rounded-full border border-white/5" />
            <div className="absolute inset-[25%] rounded-full border border-white/5" />
            <div className="absolute inset-[35%] rounded-full border border-white/5" />
            {/* Label */}
            <div className="absolute inset-[38%] rounded-full bg-primary/30" />
            {/* Center hole */}
            <div className="absolute inset-[47%] rounded-full bg-background" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        {/* Logo / Title */}
        <div className="mb-2 flex items-center gap-3">
          <Disc3 className="h-10 w-10 text-primary" />
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Vinyl Stacker
          </h1>
        </div>

        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Scan, identify, and manage your vinyl record collection with
          AI-powered recognition.
        </p>

        {/* CTA Buttons */}
        <div className="mb-16 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2 px-6 text-base" render={<Link href="/scan" />}>
            <Camera className="h-5 w-5" />
            Scan Your Vinyl
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 px-6 text-base"
            render={<Link href="/collection" />}
          >
            <Library className="h-5 w-5" />
            View Collection
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid w-full max-w-lg grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold">
              Scan & Identify
            </h3>
            <p className="text-xs text-muted-foreground">
              Point your camera at a record and let AI identify it instantly
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Library className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold">
              Manage Collection
            </h3>
            <p className="text-xs text-muted-foreground">
              Track condition, price, and details for every record you own
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold">
              Track Wishlist
            </h3>
            <p className="text-xs text-muted-foreground">
              Keep a list of records you want and move them when you find them
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
