"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ScheduleSlot, Player } from "@/lib/types";
import { SLOT_TYPES } from "@/lib/types";

export default function SchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [assigning, setAssigning] = useState<ScheduleSlot | null>(null);
  const [saving, setSaving] = useState(false);

  const blankForm = {
    start_time: "", end_time: "", location: "", status: "Open",
    slot_type: "", max_players: 4,
  };
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    const [sl, pl] = await Promise.all([
      supabase.from("vb_schedule_slots").select("*").order("start_time"),
      supabase.from("vb_players").select("*").order("full_name"),
    ]);
    setSlots(sl.data ?? []);
    setPlayers(pl.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  function toLocalInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function openAdd() {
    setForm(blankForm);
    setShowAdd(true);
    setEditing(null);
  }

  function openEdit(slot: ScheduleSlot) {
    setForm({
      start_time: toLocalInput(slot.start_time),
      end_time: toLocalInput(slot.end_time),
      location: slot.location,
      status: slot.status,
      slot_type: slot.slot_type ?? "",
      max_players: slot.max_players,
    });
    setEditing(slot);
    setShowAdd(true);
  }

  async function saveSlot() {
    setSaving(true);
    const record = {
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      location: form.location,
      status: form.status,
      slot_type: form.slot_type || null,
      max_players: form.max_players,
    };
    if (editing) {
      const { error } = await supabase.from("vb_schedule_slots").update(record).eq("id", editing.id);
      if (error) { console.error("update error:", error); alert(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("vb_schedule_slots").insert({
        id: crypto.randomUUID(),
        ...record,
        player_id: null,
        player_ids: [],
      });
      if (error) { console.error("insert error:", error); alert(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowAdd(false);
    setEditing(null);
    load();
  }

  async function deleteSlot() {
    if (!editing || !confirm("Delete this slot?")) return;
    await supabase.from("vb_schedule_slots").delete().eq("id", editing.id);
    setShowAdd(false);
    setEditing(null);
    load();
  }

  async function assignPlayer(slotId: string, playerId: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const ids = [...(slot.player_ids ?? []), playerId];
    await supabase.from("vb_schedule_slots").update({
      player_ids: ids,
      player_id: ids[0],
      status: ids.length >= slot.max_players ? "Booked" : "Open",
    }).eq("id", slotId);
    setAssigning(null);
    load();
  }

  async function removePlayer(slotId: string, playerId: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const ids = (slot.player_ids ?? []).filter((id) => id !== playerId);
    await supabase.from("vb_schedule_slots").update({
      player_ids: ids,
      player_id: ids[0] ?? null,
      status: "Open",
    }).eq("id", slotId);
    load();
  }

  const now = new Date();
  const upcoming = slots.filter((s) => new Date(s.start_time) >= now);
  const past = slots.filter((s) => new Date(s.start_time) < now).reverse();

  const grouped = upcoming.reduce<Record<string, ScheduleSlot[]>>((acc, slot) => {
    const key = formatDate(slot.start_time);
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});

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
        <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Slot
        </button>
      </div>

      {Object.entries(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No upcoming slots
        </div>
      ) : (
        Object.entries(grouped).map(([date, dateSlots]) => (
          <div key={date} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-2">{date}</h2>
            <div className="space-y-2">
              {dateSlots.map((slot) => (
                <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                          </span>
                          {slot.slot_type && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{slot.slot_type}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{slot.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        (slot.player_ids?.length ?? 0) >= slot.max_players
                          ? "bg-orange-50 text-orange-700"
                          : "bg-green-50 text-green-700"
                      }`}>
                        {slot.player_ids?.length ?? 0}/{slot.max_players}
                      </span>
                      <button onClick={() => openEdit(slot)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    </div>
                  </div>

                  {(slot.player_ids?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slot.player_ids.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                          {playerName(id)}
                          <button onClick={() => removePlayer(slot.id, id)} className="text-slate-400 hover:text-red-500 ml-0.5">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {(slot.player_ids?.length ?? 0) < slot.max_players && (
                    <button onClick={() => setAssigning(slot)} className="mt-2 text-xs text-blue-600 hover:underline">
                      + Assign Player
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="text-sm font-semibold text-slate-500 cursor-pointer mb-2">Past Slots ({past.length})</summary>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 20).map((slot) => (
              <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-3 text-sm">
                <span className="font-medium">{formatDate(slot.start_time)}</span>{" "}
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)} at {slot.location}
                {(slot.player_ids?.length ?? 0) > 0 && (
                  <span className="text-slate-500"> — {slot.player_ids.map(playerName).join(", ")}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editing ? "Edit Slot" : "Add Slot"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Time</label>
                <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={form.slot_type} onChange={(e) => setForm({ ...form, slot_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select...</option>
                    {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Max Players</label>
                  <input type="number" min={1} value={form.max_players} onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <div>
                {editing && (
                  <button onClick={deleteSlot} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setEditing(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={saveSlot} disabled={!form.start_time || !form.end_time || !form.location || saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAssigning(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Assign Player</h2>
            <div className="space-y-1">
              {players
                .filter((p) => p.status === "Active" && !(assigning.player_ids ?? []).includes(p.id))
                .map((p) => (
                  <button key={p.id} onClick={() => assignPlayer(assigning.id, p.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-sm transition-colors">
                    <span className="font-medium text-slate-900">{p.full_name}</span>
                    {p.team && <span className="text-slate-400 ml-2">{p.team}</span>}
                  </button>
                ))}
            </div>
            <button onClick={() => setAssigning(null)} className="mt-4 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
