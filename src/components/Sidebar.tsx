"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/players", label: "Players", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/schedule", label: "Schedule", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/sessions", label: "Sessions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-200 ease-in-out ${
        expanded ? "w-64" : "w-16"
      }`}
    >
      <div className={`p-3 border-b border-slate-700 flex items-center gap-3 ${expanded ? "px-4" : "justify-center"}`}>
        <Image src="/logo.png" alt="BGB Sports VB" width={36} height={36} className="rounded-lg shrink-0" />
        {expanded && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-lg leading-tight">BGB Sports VB</h1>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"
              } ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-slate-700">
        {expanded && (
          <div className="px-3 py-2 text-xs text-slate-400 truncate">{user?.email}</div>
        )}
        <button
          onClick={signOut}
          title="Sign Out"
          className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
            expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {expanded && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
