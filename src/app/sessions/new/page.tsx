"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";
import { SLOT_TYPES } from "@/lib/types";

export default function NewSessionPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const [playerId, setPlayerId] = useState("");
  const [date, setDate] = useState(today);
  const [sessionType, setSessionType] = useState(SLOT_TYPES[0]);
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !focus.trim()) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase.from("vb_sessions").insert({
      player_id: playerId,
      date,
      session_type: sessionType,
      focus: focus.trim(),
      notes: notes.trim() || null,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    router.push("/sessions");
  }

  if (loading) return <p className="text-gray-800">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link href="/sessions" className="text-blue-600 text-sm">
        &larr; Back to Sessions
      </Link>

      <h1 className="text-2xl font-bold">Log Session</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Session Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player *
            </label>
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SLOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus *
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              required
              placeholder="e.g. Passing, Serving, Hitting"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !playerId || !focus.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Session"}
          </button>
          <Link
            href="/sessions"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
