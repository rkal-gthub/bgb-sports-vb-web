"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const tabs = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/players", label: "Players", icon: "👥" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/sessions", label: "Sessions", icon: "📋" },
];

export default function Nav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="BGB Sports VB" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-lg text-blue-600">BGB Sports VB</span>
          </Link>
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="ml-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
