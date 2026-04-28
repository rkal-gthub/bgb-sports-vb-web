"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Player, Session } from "@/lib/types";
import { POSITIONS, SKILL_LEVELS, HANDS } from "@/lib/types";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      supabase.from("vb_players").select("*").eq("id", playerId).single(),
      supabase
        .from("vb_sessions")
        .select("*")
        .eq("player_id", playerId)
        .order("date", { ascending: false }),
    ]);
    setPlayer(p.data);
    setSessions(s.data ?? []);
    if (p.data) {
      setForm({
        full_name: p.data.full_name ?? "",
        player_position: p.data.player_position ?? "",
        skill_level: p.data.skill_level ?? "",
        team: p.data.team ?? "",
        birth_year: p.data.birth_year?.toString() ?? "",
        shoots: p.data.shoots ?? "",
        city: p.data.city ?? "",
        state: p.data.state ?? "",
        parent_guardian: p.data.parent_guardian ?? "",
        parent_email: p.data.parent_email ?? "",
        parent_phone: p.data.parent_phone ?? "",
        primary_goals: p.data.primary_goals ?? "",
        coach_notes: p.data.coach_notes ?? "",
        status: p.data.status ?? "Active",
      });
    }
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    setError("");

    const record = {
      full_name: form.full_name.trim(),
      player_position: form.player_position || null,
      skill_level: form.skill_level || null,
      team: form.team || null,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      shoots: form.shoots || null,
      city: form.city || null,
      state: form.state || null,
      parent_guardian: form.parent_guardian || null,
      parent_email: form.parent_email || null,
      parent_phone: form.parent_phone || null,
      primary_goals: form.primary_goals || null,
      coach_notes: form.coach_notes || null,
      status: form.status || null,
    };

    const { error: err } = await supabase
      .from("vb_players")
      .update(record)
      .eq("id", playerId);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    await load();
  }

  async function handleDelete() {
    if (!confirm("Delete this player? This cannot be undone.")) return;
    setDeleting(true);

    const { error: err } = await supabase
      .from("vb_players")
      .delete()
      .eq("id", playerId);

    if (err) {
      setError(err.message);
      setDeleting(false);
      return;
    }

    router.push("/players");
  }

  if (loading) return <p className="text-gray-800">Loading...</p>;
  if (!player) return <p className="text-gray-800">Player not found</p>;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <Link href="/players" className="text-blue-600 text-sm">
          &larr; Back to Players
        </Link>

        <h1 className="text-2xl font-bold">Edit Player</h1>

        <div className="bg-white rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Player Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={form.player_position}
                onChange={(e) => update("player_position", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level
              </label>
              <select
                value={form.skill_level}
                onChange={(e) => update("skill_level", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {SKILL_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team
              </label>
              <input
                type="text"
                value={form.team}
                onChange={(e) => update("team", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Year
              </label>
              <input
                type="number"
                value={form.birth_year}
                onChange={(e) => update("birth_year", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dominant Hand
              </label>
              <select
                value={form.shoots}
                onChange={(e) => update("shoots", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {HANDS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Parent / Guardian</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.parent_guardian}
              onChange={(e) => update("parent_guardian", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.parent_email}
                onChange={(e) => update("parent_email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={(e) => update("parent_phone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Notes</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Goals
            </label>
            <textarea
              value={form.primary_goals}
              onChange={(e) => update("primary_goals", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coach Notes
            </label>
            <textarea
              value={form.coach_notes}
              onChange={(e) => update("coach_notes", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              load();
            }}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/players" className="text-blue-600 text-sm">
        &larr; Back to Players
      </Link>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{player.full_name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Player Info</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-800">Position</p>
            <p className="font-medium text-gray-900">{player.player_position || "—"}</p>
          </div>
          <div>
            <p className="text-gray-800">Skill Level</p>
            <p className="font-medium text-gray-900">{player.skill_level || "—"}</p>
          </div>
          <div>
            <p className="text-gray-800">Team</p>
            <p className="font-medium text-gray-900">{player.team || "—"}</p>
          </div>
          <div>
            <p className="text-gray-800">Birth Year</p>
            <p className="font-medium text-gray-900">{player.birth_year || "—"}</p>
          </div>
          <div>
            <p className="text-gray-800">Dominant Hand</p>
            <p className="font-medium text-gray-900">{player.shoots || "—"}</p>
          </div>
          <div>
            <p className="text-gray-800">Status</p>
            <p className="font-medium text-gray-900">{player.status || "—"}</p>
          </div>
          {(player.city || player.state) && (
            <div>
              <p className="text-gray-800">Location</p>
              <p className="font-medium text-gray-900">
                {[player.city, player.state].filter(Boolean).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Parent / Guardian</h2>
        <div className="text-sm space-y-1">
          <p>{player.parent_guardian || "—"}</p>
          {player.parent_email && (
            <p>
              <a href={`mailto:${player.parent_email}`} className="text-blue-600">
                {player.parent_email}
              </a>
            </p>
          )}
          {player.parent_phone && (
            <p>
              <a href={`tel:${player.parent_phone}`} className="text-blue-600">
                {player.parent_phone}
              </a>
            </p>
          )}
        </div>
      </div>

      {player.primary_goals && (
        <div className="bg-white rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-lg">Primary Goals</h2>
          <p className="text-sm text-gray-800">{player.primary_goals}</p>
        </div>
      )}

      {player.coach_notes && (
        <div className="bg-white rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-lg">Coach Notes</h2>
          <p className="text-sm text-gray-800">{player.coach_notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-800">No sessions logged yet</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block border border-gray-100 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{session.focus}</span>
                    {session.session_type && (
                      <span className="ml-2 text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        {session.session_type}
                      </span>
                    )}
                    {session.notes && (
                      <p className="text-sm text-gray-800 mt-1">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-800">
                    {formatDate(session.date)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
