"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ScheduleSlot, Player } from "@/lib/types";
import { getPlayerIds, getMaxPlayers } from "@/lib/helpers";

export default function SchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sl, p] = await Promise.all([
        supabase.from("vb_schedule_slots").select("*").order("start_time"),
        supabase.from("vb_players").select("*"),
      ]);
      setSlots(sl.data ?? []);
      setPlayers(p.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const bookings = useMemo(() => {
    return slots.filter(
      (s) => getPlayerIds(s).length > 0 || s.player_id !== null
    );
  }, [slots]);

  const byDate = useMemo(() => {
    const map: Record<string, ScheduleSlot[]> = {};
    for (const slot of bookings) {
      const dateKey = slot.start_time.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  if (loading) return <p className="text-gray-800">Loading...</p>;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Link
          href="/sessions/book"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Book Session
        </Link>
      </div>

      {byDate.length === 0 ? (
        <p className="text-center text-gray-800 py-8">
          No bookings yet. Tap Book Session to get started.
        </p>
      ) : (
        byDate.map(([dateKey, daySlots]) => (
          <div key={dateKey} className="space-y-3">
            <h2 className="font-semibold text-gray-800">
              {formatDateHeader(dateKey)}
            </h2>
            {daySlots.map((slot) => {
              const pids = getPlayerIds(slot);
              const maxP = getMaxPlayers(slot);
              return (
                <Link
                  key={slot.id}
                  href={`/schedule/${slot.id}`}
                  className="block bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">
                        {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {slot.location}
                      </p>
                      {slot.slot_type && (
                        <p>
                          <span className="text-sm bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                            {slot.slot_type}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {pids.length}/{maxP}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pids.map((pid) => (
                      <span
                        key={pid}
                        className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"
                      >
                        {playerName(pid)}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
