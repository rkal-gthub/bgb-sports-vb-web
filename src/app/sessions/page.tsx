"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Player } from "@/lib/types";
import { SLOT_TYPES } from "@/lib/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);

  const blankForm = { date: "", session_type: "", focus: "", notes: "", player_id: "" };
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    const [se, pl] = await Promise.all([
      supabase.from("sessions").select("*").order("date", { ascending: false }),
      supabase.from("players").select("*").order("full_name"),
    ]);
    setSessions(se.data ?? []);
    setPlayers(pl.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  function toLocalInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function openAdd() {
    setForm(blankForm);
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(s: Session) {
    setForm({
      date: toLocalInput(s.date),
      session_type: s.session_type ?? "",
      focus: s.focus,
      notes: s.notes ?? "",
      player_id: s.player_id,
    });
    setEditing(s);
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    const record = {
      date: new Date(form.date).toISOString(),
      session_type: form.session_type || null,
      focus: form.focus,
      notes: form.notes || null,
      player_id: form.player_id,
    };
    if (editing) {
      await supabase.from("sessions").update(record).eq("id", editing.id);
    } else {
      await supabase.from("sessions").insert({ id: crypto.randomUUID(), ...record });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    load();
  }

  async function deleteSession() {
    if (!editing || !confirm("Delete this session?")) return;
    await supabase.from("sessions").delete().eq("id", editing.id);
    setShowModal(false);
    setEditing(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Log Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No sessions logged yet
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Player</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Focus</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{playerName(s.player_id)}</td>
                  <td className="px-4 py-3">
                    {s.session_type ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.session_type}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{s.focus}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowModal(false); setEditing(null); }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editing ? "Edit Session" : "Log Session"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Player</label>
                <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select player...</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select...</option>
                  {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Focus</label>
                <input type="text" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <div>
                {editing && (
                  <button onClick={deleteSession} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={save} disabled={!form.player_id || !form.date || !form.focus || saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
