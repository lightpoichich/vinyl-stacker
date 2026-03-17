import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Disc3 } from "lucide-react";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/collection");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-foreground transition-colors hover:text-primary"
      >
        <Disc3 className="h-8 w-8 text-primary" />
        <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Vinyl Stacker
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
