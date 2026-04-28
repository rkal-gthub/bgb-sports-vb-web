"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("vb_players")
        .select("*")
        .order("full_name");
      setPlayers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = players.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.team ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-800">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Players ({players.length})</h1>
        <Link
          href="/players/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Add Player
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-2">
        {filtered.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="block bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  {player.full_name || "Unnamed Player"}
                </p>
                <p className="text-sm text-gray-800">
                  {[player.player_position, player.team, player.birth_year]
                    .filter(Boolean)
                    .join(" · ") || "No details"}
                </p>
              </div>
              <span className="text-gray-700">&rarr;</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-700 py-8">No players found</p>
        )}
      </div>
    </div>
  );
}
