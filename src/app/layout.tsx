import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "BGB Sports VB - Admin",
  description: "Elite Volleyball Development Admin Dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
