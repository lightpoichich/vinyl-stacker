"use client";

import Link from "next/link";
import { NavItem } from "./nav-item";
import { Library, Camera, Search, Heart, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-end justify-around px-1 py-1">
        {navItems.map((item) => {
          const isScan = item.href === "/scan";
          if (isScan) {
            return (
              <Link key={item.href} href="/scan" className="-mt-3 flex flex-col items-center">
                <div className="rounded-full bg-primary p-3 shadow-lg shadow-primary/25">
                  <Camera className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="mt-0.5 text-[10px] font-medium text-primary">
                  Scan
                </span>
              </Link>
            );
          }
          return <NavItem key={item.href} {...item} isMobile />;
        })}
      </div>
    </nav>
  );
}
