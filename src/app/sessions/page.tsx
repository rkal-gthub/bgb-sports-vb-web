"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session, Player } from "@/lib/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [se, p] = await Promise.all([
        supabase
          .from("vb_sessions")
          .select("*")
          .order("date", { ascending: false }),
        supabase.from("vb_players").select("*"),
      ]);
      setSessions(se.data ?? []);
      setPlayers(p.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-800">Loading...</p>;

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sessions ({sessions.length})</h1>
        <div className="flex gap-2">
          <Link
            href="/sessions/book"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Book Session
          </Link>
          <Link
            href="/sessions/new"
            className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
          >
            Log Session
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-gray-800 py-8">
          No sessions logged yet
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">
                    {playerName(session.player_id)}
                  </p>
                  <p className="text-sm mt-0.5">
                    <span className="font-medium">{session.focus}</span>
                    {session.session_type && (
                      <span className="ml-2 text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        {session.session_type}
                      </span>
                    )}
                  </p>
                  {session.notes && (
                    <p className="text-sm text-gray-800 mt-1">
                      {session.notes}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-800 whitespace-nowrap ml-4">
                  {formatDate(session.date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
