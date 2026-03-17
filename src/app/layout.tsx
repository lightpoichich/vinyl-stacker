import type { Metadata } from "next";
import "./globals.css";
import { inter, spaceGrotesk } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Vinyl Stacker - Scan, Identify & Manage Your Record Collection",
  description:
    "Use AI-powered scanning to identify vinyl records, manage your collection, and track your wishlist. Powered by Discogs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", inter.variable, spaceGrotesk.variable)}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
