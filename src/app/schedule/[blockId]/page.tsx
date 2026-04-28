"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ScheduleSlot, Player } from "@/lib/types";
import { SLOT_TYPES } from "@/lib/types";
import { getPlayerIds, getMaxPlayers } from "@/lib/helpers";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slotId = params.blockId as string;
  const [slot, setSlot] = useState<ScheduleSlot | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editForm, setEditForm] = useState({
    date: "",
    startHour: "09",
    startMinute: "00",
    location: "",
    slot_type: "",
    max_players: 4,
  });

  const load = useCallback(async () => {
    const [sl, p] = await Promise.all([
      supabase
        .from("vb_schedule_slots")
        .select("*")
        .eq("id", slotId)
        .single(),
      supabase.from("vb_players").select("*").order("full_name"),
    ]);
    setSlot(sl.data);
    setPlayers(p.data ?? []);
    setLoading(false);
  }, [slotId]);

  useEffect(() => {
    load();
  }, [load]);

  function startEditing() {
    if (!slot) return;
    const start = new Date(slot.start_time);
    setEditForm({
      date: slot.start_time.slice(0, 10),
      startHour: start.getHours().toString().padStart(2, "0"),
      startMinute: start.getMinutes().toString().padStart(2, "0"),
      location: slot.location,
      slot_type: slot.slot_type || SLOT_TYPES[0],
      max_players: getMaxPlayers(slot),
    });
    setEditing(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    setError("");

    const startTime = new Date(
      `${editForm.date}T${editForm.startHour}:${editForm.startMinute}:00`
    );
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const { error: err } = await supabase
      .from("vb_schedule_slots")
      .update({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: editForm.location,
        slot_type: editForm.slot_type,
        max_players: editForm.max_players,
      })
      .eq("id", slotId);

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
    if (!confirm("Delete this booking?")) return;
    setDeleting(true);

    const { error: err } = await supabase
      .from("vb_schedule_slots")
      .delete()
      .eq("id", slotId);

    if (err) {
      setError(err.message);
      setDeleting(false);
      return;
    }

    router.push("/schedule");
  }

  async function handleAddPlayer(playerId: string) {
    if (!slot) return;
    const currentIds = getPlayerIds(slot);
    if (currentIds.includes(playerId)) return;
    const updatedIds = [...currentIds, playerId];

    const { error: err } = await supabase
      .from("vb_schedule_slots")
      .update({
        player_ids: updatedIds,
        player_id: updatedIds[0],
        status: "Booked",
      })
      .eq("id", slotId);

    if (err) {
      setError(err.message);
      return;
    }
    await load();
  }

  async function handleRemovePlayer(playerId: string) {
    if (!slot) return;
    const updatedIds = getPlayerIds(slot).filter((id) => id !== playerId);

    const { error: err } = await supabase
      .from("vb_schedule_slots")
      .update({
        player_ids: updatedIds,
        player_id: updatedIds[0] ?? null,
        status: updatedIds.length > 0 ? "Booked" : "Open",
      })
      .eq("id", slotId);

    if (err) {
      setError(err.message);
      return;
    }
    await load();
  }

  if (loading) return <p className="text-gray-800">Loading...</p>;
  if (!slot) return <p className="text-gray-800">Booking not found</p>;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  const pids = getPlayerIds(slot);
  const maxP = getMaxPlayers(slot);
  const spotsLeft = maxP - pids.length;
  const availablePlayers = players.filter(
    (p) => !pids.includes(p.id) && (p.status ?? "Active") === "Active"
  );

  const timeOptions = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of ["00", "30"]) {
      timeOptions.push({
        hour: h.toString().padStart(2, "0"),
        minute: m,
        label: `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${h >= 12 ? "PM" : "AM"}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/schedule" className="text-blue-600 text-sm">
        &larr; Back to Schedule
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </h1>
          <p className="text-gray-800 mt-1">{formatDate(slot.start_time)}</p>
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
          <h2 className="font-semibold text-lg">Edit Booking</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, date: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <select
              value={`${editForm.startHour}:${editForm.startMinute}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":");
                setEditForm((f) => ({
                  ...f,
                  startHour: h,
                  startMinute: m,
                }));
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeOptions.map((t) => (
                <option
                  key={`${t.hour}:${t.minute}`}
                  value={`${t.hour}:${t.minute}`}
                >
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Duration: 1 hour (end time set automatically)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Enter location"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={editForm.slot_type}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, slot_type: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SLOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max players: {editForm.max_players}
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={editForm.max_players}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  max_players: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
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
          <h2 className="font-semibold text-lg">Booking Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-800">Location</p>
              <p className="font-medium text-gray-900">{slot.location}</p>
            </div>
            <div>
              <p className="text-gray-800">Type</p>
              <p className="font-medium text-gray-900">
                {slot.slot_type || "General"}
              </p>
            </div>
            <div>
              <p className="text-gray-800">Duration</p>
              <p className="font-medium text-gray-900">1 hour</p>
            </div>
            <div>
              <p className="text-gray-800">Capacity</p>
              <p className="font-medium text-gray-900">
                {pids.length}/{maxP}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Players</h2>

        {pids.length > 0 ? (
          <div className="space-y-2">
            {pids.map((pid) => (
              <div
                key={pid}
                className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2"
              >
                <Link
                  href={`/players/${pid}`}
                  className="text-sm text-green-700 font-medium hover:underline"
                >
                  {playerName(pid)}
                </Link>
                <button
                  onClick={() => handleRemovePlayer(pid)}
                  className="text-xs text-red-600 font-medium hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No players assigned</p>
        )}

        {spotsLeft > 0 && availablePlayers.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleAddPlayer(e.target.value);
                e.target.value = "";
              }
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Add player...</option>
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
