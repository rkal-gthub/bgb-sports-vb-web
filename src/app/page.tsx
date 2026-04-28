"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Player, ScheduleSlot, Session } from "@/lib/types";
import { getPlayerIds, getMaxPlayers } from "@/lib/helpers";

export default function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, sl, se] = await Promise.all([
        supabase.from("vb_players").select("*").order("full_name"),
        supabase.from("vb_schedule_slots").select("*").order("start_time"),
        supabase.from("vb_sessions").select("*").order("date", { ascending: false }),
      ]);
      setPlayers(p.data ?? []);
      setSlots(sl.data ?? []);
      setSessions(se.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-800">Loading...</p>;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todaySlots = slots.filter((s) => s.start_time.startsWith(todayStr));
  const bookedToday = todaySlots.filter((s) => getPlayerIds(s).length > 0);

  const upNext = slots.find(
    (s) => new Date(s.start_time) >= now && getPlayerIds(s).length > 0
  );

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekAgo);

  const upcomingBooked = slots.filter(
    (s) => new Date(s.start_time) >= now && getPlayerIds(s).length > 0
  );

  const recentSessions = sessions.slice(0, 5);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/schedule" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            Book Session
          </Link>
          <Link href="/sessions" className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">
            Log Session
          </Link>
        </div>
      </div>

      {upNext && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-5">
          <p className="text-sm font-medium opacity-80">Up Next</p>
          <p className="text-lg font-bold mt-1">
            {formatTime(upNext.start_time)} - {formatTime(upNext.end_time)}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {upNext.location}
            {upNext.slot_type && ` · ${upNext.slot_type}`}
          </p>
          <p className="text-sm mt-2">
            {getPlayerIds(upNext).map(playerName).join(", ")}
          </p>
        </div>
      )}

      {todaySlots.length > 0 && (
        <div className="bg-white rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Today&apos;s Schedule ({todaySlots.length})</h2>
          <div className="space-y-2">
            {todaySlots.map((slot) => {
              const pids = getPlayerIds(slot);
              const booked = pids.length > 0;
              return (
                <div key={slot.id} className="flex justify-between items-center border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      {slot.slot_type && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{slot.slot_type}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-800 mt-0.5">{slot.location}</p>
                  </div>
                  <div className="text-right text-sm">
                    {booked ? (
                      <span className="text-green-600 font-medium">{pids.length}/{getMaxPlayers(slot)}</span>
                    ) : (
                      <span className="text-gray-800">Open</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/players" className="bg-white rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <p className="text-2xl font-bold text-blue-600">{players.length}</p>
          <p className="text-sm text-gray-800">Players</p>
        </Link>
        <Link href="/sessions" className="bg-white rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <p className="text-2xl font-bold text-blue-600">{thisWeekSessions.length}</p>
          <p className="text-sm text-gray-800">This Week</p>
        </Link>
        <Link href="/schedule" className="bg-white rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <p className="text-2xl font-bold text-blue-600">{upcomingBooked.length}</p>
          <p className="text-sm text-gray-800">Upcoming</p>
        </Link>
        <Link href="/schedule" className="bg-white rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <p className="text-2xl font-bold text-blue-600">{bookedToday.length}</p>
          <p className="text-sm text-gray-800">Booked Today</p>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-white rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Recent Sessions</h2>
            <Link href="/sessions" className="text-blue-600 text-sm">View All</Link>
          </div>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div key={session.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{playerName(session.player_id)}</p>
                    <p className="text-xs text-gray-800 mt-0.5">
                      {session.focus}
                      {session.session_type && (
                        <span className="ml-2 bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{session.session_type}</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-800">{formatDate(session.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
