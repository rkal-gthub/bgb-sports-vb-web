"use client";

import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Nav from "./Nav";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isLoginPage || isMobilePage) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <>
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </>
  );
}
