"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session, Player } from "@/lib/types";
import { SLOT_TYPES } from "@/lib/types";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({ focus: "", session_type: "", notes: "", date: "" });

  const load = useCallback(async () => {
    const { data: s } = await supabase
      .from("vb_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    setSession(s);
    if (s?.player_id) {
      const { data: p } = await supabase
        .from("vb_players")
        .select("*")
        .eq("id", s.player_id)
        .single();
      setPlayer(p);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  function startEditing() {
    if (!session) return;
    setEditForm({
      focus: session.focus ?? "",
      session_type: session.session_type ?? SLOT_TYPES[0],
      notes: session.notes ?? "",
      date: session.date?.slice(0, 10) ?? "",
    });
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!editForm.focus.trim()) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase
      .from("vb_sessions")
      .update({
        focus: editForm.focus.trim(),
        session_type: editForm.session_type || null,
        notes: editForm.notes.trim() || null,
        date: editForm.date,
      })
      .eq("id", sessionId);

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
    if (!confirm("Delete this session? This cannot be undone.")) return;
    setDeleting(true);

    const { error: err } = await supabase
      .from("vb_sessions")
      .delete()
      .eq("id", sessionId);

    if (err) {
      setError(err.message);
      setDeleting(false);
      return;
    }

    router.push("/sessions");
  }

  if (loading) return <p className="text-gray-800">Loading...</p>;
  if (!session) return <p className="text-gray-800">Session not found</p>;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <Link href="/sessions" className="text-blue-600 text-sm">
        &larr; Back to Sessions
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{player?.full_name ?? "Unknown"}</h1>
          <p className="text-gray-800 mt-1">{formatDate(session.date)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startEditing}
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

      {editing ? (
        <div className="bg-white rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Edit Session</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={editForm.session_type}
                onChange={(e) => setEditForm((f) => ({ ...f, session_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SLOT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus *</label>
            <input
              type="text"
              value={editForm.focus}
              onChange={(e) => setEditForm((f) => ({ ...f, focus: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editForm.focus.trim()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Session Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-800">Focus</p>
              <p className="font-medium text-gray-900">{session.focus}</p>
            </div>
            <div>
              <p className="text-gray-800">Type</p>
              <p className="font-medium text-gray-900">
                {session.session_type || "General"}
              </p>
            </div>
          </div>
          {session.notes && (
            <div>
              <p className="text-gray-800 text-sm">Notes</p>
              <p className="text-sm text-gray-900 mt-1">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
