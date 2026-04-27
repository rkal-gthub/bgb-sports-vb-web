"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, ScheduleSlot, Session } from "@/lib/types";
import Link from "next/link";

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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const todaySlots = slots.filter((s) => {
    const t = new Date(s.start_time);
    return t >= todayStart && t < todayEnd;
  });

  const upcomingSlots = slots.filter((s) => new Date(s.start_time) > now);
  const nextBooked = upcomingSlots.find((s) => s.player_ids && s.player_ids.length > 0);
  const openSlots = upcomingSlots.filter((s) => (s.player_ids?.length ?? 0) < s.max_players);
  const bookedSlots = upcomingSlots.filter((s) => s.player_ids && s.player_ids.length > 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekStart);
  const recentSessions = sessions.slice(0, 5);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? "Unknown";
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {nextBooked && (
        <Link href="/schedule" className="block mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" /></svg>
                Up Next
              </span>
              {nextBooked.slot_type && (
                <span className="text-xs bg-white/25 px-2 py-1 rounded-full">{nextBooked.slot_type}</span>
              )}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold">{formatTime(nextBooked.start_time)}</p>
                <p className="text-blue-100">{nextBooked.location}</p>
                <p className="text-blue-200 text-sm">{formatDate(nextBooked.start_time)}</p>
              </div>
              <div className="text-right">
                {nextBooked.player_ids?.map((id) => (
                  <p key={id} className="font-medium">{playerName(id)}</p>
                ))}
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/players" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 transition-colors">
          <svg className="w-6 h-6 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="text-3xl font-bold text-slate-900">{players.length}</p>
          <p className="text-sm text-slate-500">Players</p>
        </Link>
        <Link href="/sessions" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-purple-300 transition-colors">
          <svg className="w-6 h-6 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <p className="text-3xl font-bold text-slate-900">{thisWeekSessions.length}</p>
          <p className="text-sm text-slate-500">This Week</p>
        </Link>
        <Link href="/schedule" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-green-300 transition-colors">
          <svg className="w-6 h-6 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-3xl font-bold text-slate-900">{openSlots.length}</p>
          <p className="text-sm text-slate-500">Open Slots</p>
        </Link>
        <Link href="/schedule" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-orange-300 transition-colors">
          <svg className="w-6 h-6 text-orange-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-3xl font-bold text-slate-900">{bookedSlots.length}</p>
          <p className="text-sm text-slate-500">Booked</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Today&apos;s Schedule</h2>
            <Link href="/schedule" className="text-sm text-blue-600 hover:underline">See All</Link>
          </div>
          {todaySlots.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              No sessions scheduled today
            </div>
          ) : (
            <div className="space-y-2">
              {todaySlots.map((slot) => (
                <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{formatTime(slot.start_time)}</span>
                      {slot.slot_type && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{slot.slot_type}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{slot.location}</p>
                  </div>
                  <div className="text-right">
                    {slot.player_ids?.length > 0 ? (
                      <>
                        {slot.player_ids.map((id) => (
                          <p key={id} className="text-sm font-medium text-slate-700">{playerName(id)}</p>
                        ))}
                        {(slot.player_ids?.length ?? 0) < slot.max_players && (
                          <p className="text-xs text-green-600">{slot.max_players - (slot.player_ids?.length ?? 0)} spot{slot.max_players - (slot.player_ids?.length ?? 0) === 1 ? "" : "s"} open</p>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-medium text-green-600">Open</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Recent Sessions</h2>
            <Link href="/sessions" className="text-sm text-blue-600 hover:underline">See All</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              No sessions logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <Link key={session.id} href="/sessions" className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{playerName(session.player_id)}</span>
                        {session.session_type && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{session.session_type}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{session.focus}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(session.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
