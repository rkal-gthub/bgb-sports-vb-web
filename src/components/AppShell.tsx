"use client";

import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const isMobilePage = pathname.startsWith("/mobile");

  useEffect(() => {
    if (!loading && !user && !isLoginPage && !isMobilePage) {
      router.replace("/login");
    }
  }, [user, loading, isLoginPage, isMobilePage, router]);

  if (loading && !isMobilePage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isLoginPage || isMobilePage) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
