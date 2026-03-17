"use client";

import Link from "next/link";
import { NavItem } from "./nav-item";
import { Disc3, Library, Camera, Search, Heart, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

interface SidebarProps {
  userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card/30 md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Disc3 className="h-6 w-6 text-primary" />
          <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
            Vinyl Stacker
          </span>
        </Link>
      </div>

      <Separator />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border/50 px-3 py-3">
        {userEmail && (
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
