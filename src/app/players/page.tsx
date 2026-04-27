"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";
import { POSITIONS, SKILL_LEVELS, HANDS } from "@/lib/types";

type ModalMode = "closed" | "add" | "edit" | "detail";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>("closed");
  const [selected, setSelected] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  const selectMode = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  async function bulkMakeInactive() {
    if (!confirm(`Set ${selectedIds.size} player${selectedIds.size === 1 ? "" : "s"} to Inactive?`)) return;
    setBulkActing(true);
    const ids = Array.from(selectedIds);
    await supabase.from("players").update({ status: "Inactive" }).in("id", ids);
    setSelectedIds(new Set());
    setBulkActing(false);
    load();
  }

  async function bulkDelete() {
    if (!confirm(`Permanently delete ${selectedIds.size} player${selectedIds.size === 1 ? "" : "s"}?`)) return;
    setBulkActing(true);
    const ids = Array.from(selectedIds);
    await supabase.from("players").delete().in("id", ids);
    setSelectedIds(new Set());
    setBulkActing(false);
    load();
  }

  const blank: Omit<Player, "id"> = {
    full_name: "", player_position: "", skill_level: "", team: "", age: null,
    birth_year: null, shoots: "", parent_guardian: "", parent_email: "",
    parent_phone: "", city: "", state: "", date_created: null, scheduled: null,
    status: "Active", availability: null, primary_goals: "", coach_notes: "",
  };
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => {
    const { data } = await supabase.from("players").select("*").order("full_name");
    setPlayers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(blank);
    setSelected(null);
    setModal("add");
  }

  function openEdit(p: Player) {
    setSelected(p);
    setForm({ ...p });
    setModal("edit");
  }

  function openDetail(p: Player) {
    setSelected(p);
    setModal("detail");
  }

  async function save() {
    setSaving(true);
    if (modal === "add") {
      const id = crypto.randomUUID();
      const record = { id, ...form, date_created: new Date().toISOString() };
      await supabase.from("players").insert(record);
    } else if (modal === "edit" && selected) {
      const { ...updates } = form;
      await supabase.from("players").update(updates).eq("id", selected.id);
    }
    setSaving(false);
    setModal("closed");
    load();
  }

  async function deletePlayer() {
    if (!selected || !confirm(`Delete ${selected.full_name}?`)) return;
    await supabase.from("players").delete().eq("id", selected.id);
    setModal("closed");
    load();
  }

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.team ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.player_position ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Players</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Player
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="text" placeholder="Search players..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {selectMode && (
        <div className="mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
          <button onClick={bulkMakeInactive} disabled={bulkActing}
            className="px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">
            Make Inactive
          </button>
          <button onClick={bulkDelete} disabled={bulkActing}
            className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-blue-600 hover:underline">
            Clear Selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Position</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Level</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Team</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Birth Year</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50 cursor-pointer ${selectedIds.has(p.id) ? "bg-blue-50" : ""}`} onClick={() => openDetail(p)}>
                <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{p.player_position || "—"}</td>
                <td className="px-4 py-3">
                  {p.skill_level ? (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.skill_level}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.team || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.birth_year || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.status || "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No players found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModal("closed")}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 m-4" onClick={(e) => e.stopPropagation()}>
            {modal === "detail" && selected ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-4">{selected.full_name}</h2>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <Detail label="Position" value={selected.player_position} />
                  <Detail label="Skill Level" value={selected.skill_level} />
                  <Detail label="Team" value={selected.team} />
                  <Detail label="Hand" value={selected.shoots} />
                  <Detail label="Age" value={selected.age?.toString()} />
                  <Detail label="Birth Year" value={selected.birth_year?.toString()} />
                  <Detail label="City" value={selected.city} />
                  <Detail label="State" value={selected.state} />
                  <Detail label="Status" value={selected.status} />
                </div>
                {(selected.parent_guardian || selected.parent_email || selected.parent_phone) && (
                  <div className="border-t border-slate-200 pt-3 mb-4">
                    <h3 className="font-medium text-slate-700 mb-2">Parent / Guardian</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Detail label="Name" value={selected.parent_guardian} />
                      <Detail label="Email" value={selected.parent_email} />
                      <Detail label="Phone" value={selected.parent_phone} />
                    </div>
                  </div>
                )}
                {(selected.primary_goals || selected.coach_notes) && (
                  <div className="border-t border-slate-200 pt-3 mb-4">
                    {selected.primary_goals && <div className="mb-2"><span className="text-xs text-slate-500">Primary Goals</span><p className="text-sm text-slate-700">{selected.primary_goals}</p></div>}
                    {selected.coach_notes && <div><span className="text-xs text-slate-500">Coach Notes</span><p className="text-sm text-slate-700">{selected.coach_notes}</p></div>}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setModal("closed")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                  <button onClick={() => openEdit(selected)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-4">{modal === "add" ? "Add Player" : "Edit Player"}</h2>
                <div className="space-y-3">
                  <FormField label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect label="Position" value={form.player_position ?? ""} options={POSITIONS} onChange={(v) => setForm({ ...form, player_position: v || null })} />
                    <FormSelect label="Skill Level" value={form.skill_level ?? ""} options={SKILL_LEVELS} onChange={(v) => setForm({ ...form, skill_level: v || null })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect label="Dominant Hand" value={form.shoots ?? ""} options={HANDS} onChange={(v) => setForm({ ...form, shoots: v || null })} />
                    <FormField label="Team" value={form.team ?? ""} onChange={(v) => setForm({ ...form, team: v || null })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Age" value={form.age?.toString() ?? ""} onChange={(v) => setForm({ ...form, age: v ? parseInt(v) : null })} type="number" />
                    <FormField label="Birth Year" value={form.birth_year?.toString() ?? ""} onChange={(v) => setForm({ ...form, birth_year: v ? parseInt(v) : null })} type="number" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="City" value={form.city ?? ""} onChange={(v) => setForm({ ...form, city: v || null })} />
                    <FormField label="State" value={form.state ?? ""} onChange={(v) => setForm({ ...form, state: v || null })} />
                  </div>
                  <FormSelect label="Status" value={form.status ?? "Active"} options={["Active", "Inactive"]} onChange={(v) => setForm({ ...form, status: v })} />

                  <h3 className="font-medium text-slate-700 pt-2">Parent / Guardian</h3>
                  <FormField label="Parent Name" value={form.parent_guardian ?? ""} onChange={(v) => setForm({ ...form, parent_guardian: v || null })} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Parent Email" value={form.parent_email ?? ""} onChange={(v) => setForm({ ...form, parent_email: v || null })} type="email" />
                    <FormField label="Parent Phone" value={form.parent_phone ?? ""} onChange={(v) => setForm({ ...form, parent_phone: v || null })} type="tel" />
                  </div>

                  <h3 className="font-medium text-slate-700 pt-2">Planning</h3>
                  <FormTextarea label="Primary Goals" value={form.primary_goals ?? ""} onChange={(v) => setForm({ ...form, primary_goals: v || null })} />
                  <FormTextarea label="Coach Notes" value={form.coach_notes ?? ""} onChange={(v) => setForm({ ...form, coach_notes: v || null })} />
                </div>
                <div className="flex gap-2 justify-between mt-6">
                  <div>
                    {modal === "edit" && (
                      <button onClick={deletePlayer} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModal("closed")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={save} disabled={!form.full_name || saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-slate-700">{value || "—"}</p>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FormTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
    </div>
  );
}
