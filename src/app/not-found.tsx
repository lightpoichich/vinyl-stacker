import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Disc3, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Disc3 className="h-10 w-10 text-primary" />
      </div>
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold">
        404
      </h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        This record seems to be missing from the stacks.
      </p>
      <Button render={<Link href="/" />} className="gap-2">
        <Home className="h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
}
