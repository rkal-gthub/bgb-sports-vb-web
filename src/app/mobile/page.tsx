"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, ScheduleSlot, Session } from "@/lib/types";
import { SLOT_TYPES, POSITIONS, SKILL_LEVELS, HANDS } from "@/lib/types";
import { getPlayerIds, getMaxPlayers } from "@/lib/helpers";

type Tab = "dashboard" | "schedule" | "players" | "sessions";

export default function MobileApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [players, setPlayers] = useState<Player[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDashboardBook, setShowDashboardBook] = useState(false);

  const load = useCallback(async () => {
    const [p, sl, se] = await Promise.all([
      supabase.from("vb_players").select("*").order("full_name"),
      supabase.from("vb_schedule_slots").select("*").order("start_time"),
      supabase.from("vb_sessions").select("*").order("date", { ascending: false }),
    ]);
    setPlayers(p.data ?? []);
    setSlots(sl.data ?? []);
    setSessions(se.data ?? []);
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

  function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function dedup(slotsArr: ScheduleSlot[]): ScheduleSlot[] {
    const seen = new Set<string>();
    return slotsArr.filter((s) => {
      if (seen.has(s.availability_block_id)) return false;
      seen.add(s.availability_block_id);
      return true;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        {tab === "dashboard" && <>
          <DashboardTab players={players} slots={slots} sessions={sessions} playerName={playerName} formatTime={formatTime} formatDate={formatDate} formatShortDate={formatShortDate} setTab={setTab} dedup={dedup} onBook={() => setShowDashboardBook(true)} />
          {showDashboardBook && <BookSessionSheet players={players} onClose={() => setShowDashboardBook(false)} reload={load} />}
        </>}
        {tab === "schedule" && <ScheduleTab slots={slots} players={players} playerName={playerName} formatTime={formatTime} formatDate={formatDate} reload={load} dedup={dedup} />}
        {tab === "players" && <PlayersTab players={players} reload={load} />}
        {tab === "sessions" && <SessionsTab sessions={sessions} slots={slots} players={players} playerName={playerName} formatShortDate={formatShortDate} reload={load} dedup={dedup} setTab={setTab} />}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex safe-bottom z-50">
        {([
          { id: "dashboard" as Tab, label: "Home", icon: HomeIcon },
          { id: "schedule" as Tab, label: "Schedule", icon: CalendarIcon },
          { id: "players" as Tab, label: "Players", icon: PeopleIcon },
          { id: "sessions" as Tab, label: "Sessions", icon: ClipboardIcon },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs transition-colors ${tab === id ? "text-blue-600" : "text-slate-400"}`}>
            <Icon filled={tab === id} />
            <span className="mt-1">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function HomeIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l9 8h-3v10h-5v-6h-2v6H6V11H3l9-8z" /></svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
  );
}

function CalendarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h1a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm-2 8v10h16V10H4z" /></svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
  );
}

function PeopleIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
  );
}

function ClipboardIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 2a1 1 0 00-1 1H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2a1 1 0 00-1-1H9zm0 2h6v1H9V4z" /></svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  );
}

// ─── Time Options ───────────────────────────────────────────────────────────

function timeOptions() {
  const opts: { label: string; value: string }[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opts.push({ label, value });
    }
  }
  return opts;
}

const TIME_OPTIONS = timeOptions();

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab({ players, slots, sessions, playerName, formatTime, formatDate, formatShortDate, setTab, dedup, onBook }: {
  players: Player[]; slots: ScheduleSlot[]; sessions: Session[];
  playerName: (id: string) => string; formatTime: (s: string) => string;
  formatDate: (s: string) => string; formatShortDate: (s: string) => string;
  setTab: (t: Tab) => void; dedup: (s: ScheduleSlot[]) => ScheduleSlot[];
  onBook: () => void;
}) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const dedupSlots = dedup(slots);
  const upcoming = dedupSlots.filter((s) => new Date(s.start_time) > now);
  const nextBooked = upcoming.find((s) => getPlayerIds(s).length > 0);
  const todaySlots = dedupSlots.filter((s) => { const t = new Date(s.start_time); return t >= todayStart && t < todayEnd; });
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekStart);
  const openSpots = upcoming.filter((s) => getPlayerIds(s).length < getMaxPlayers(s))
    .reduce((sum, s) => sum + (getMaxPlayers(s) - getPlayerIds(s).length), 0);
  const bookedCount = upcoming.filter((s) => getPlayerIds(s).length > 0).length;
  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-xl font-bold text-slate-900">BGB Sports VB</h1>
        </div>
        <button onClick={onBook} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium active:bg-blue-700">
          + Book
        </button>
      </div>

      {nextBooked && (
        <button onClick={() => setTab("schedule")} className="w-full text-left mb-5">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" /></svg>
                Up Next
              </span>
              {nextBooked.slot_type && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{nextBooked.slot_type}</span>
              )}
            </div>
            <p className="text-2xl font-bold">{formatTime(nextBooked.start_time)}</p>
            <p className="text-blue-100 text-sm">{nextBooked.location} &middot; {formatDate(nextBooked.start_time)}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {getPlayerIds(nextBooked).map((id) => (
                <span key={id} className="text-sm bg-white/15 px-2 py-0.5 rounded-full">{playerName(id)}</span>
              ))}
            </div>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => setTab("players")} className="bg-white rounded-xl p-4 border border-slate-200 text-left active:bg-slate-50">
          <PeopleIcon filled={false} />
          <p className="text-2xl font-bold text-slate-900 mt-2">{players.length}</p>
          <p className="text-xs text-slate-500">Players</p>
        </button>
        <button onClick={() => setTab("sessions")} className="bg-white rounded-xl p-4 border border-slate-200 text-left active:bg-slate-50">
          <ClipboardIcon filled={false} />
          <p className="text-2xl font-bold text-slate-900 mt-2">{thisWeekSessions.length}</p>
          <p className="text-xs text-slate-500">This Week</p>
        </button>
        <button onClick={() => setTab("schedule")} className="bg-white rounded-xl p-4 border border-slate-200 text-left active:bg-slate-50">
          <CalendarIcon filled={false} />
          <p className="text-2xl font-bold text-slate-900 mt-2">{openSpots}</p>
          <p className="text-xs text-slate-500">Open Spots</p>
        </button>
        <button onClick={() => setTab("schedule")} className="bg-white rounded-xl p-4 border border-slate-200 text-left active:bg-slate-50">
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-2xl font-bold text-slate-900 mt-2">{bookedCount}</p>
          <p className="text-xs text-slate-500">Booked</p>
        </button>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Today&apos;s Schedule</h2>
          <button onClick={() => setTab("schedule")} className="text-sm text-blue-600">See All</button>
        </div>
        {todaySlots.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">No sessions today</div>
        ) : (
          <div className="space-y-2">
            {todaySlots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{formatTime(slot.start_time)}</span>
                      {slot.slot_type && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{slot.slot_type}</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{slot.location}</p>
                  </div>
                  <div className="text-right">
                    {getPlayerIds(slot).length > 0 ? getPlayerIds(slot).map((id) => (
                      <p key={id} className="text-xs font-medium text-slate-700">{playerName(id)}</p>
                    )) : <span className="text-xs text-green-600 font-medium">Open</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Recent Sessions</h2>
          <button onClick={() => setTab("sessions")} className="text-sm text-blue-600">See All</button>
        </div>
        {recentSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">No sessions logged</div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{playerName(s.player_id)}</span>
                      {s.session_type && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{s.session_type}</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{s.focus}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatShortDate(s.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule Tab ───────────────────────────────────────────────────────────

function ScheduleTab({ slots, players, playerName, formatTime, formatDate, reload, dedup }: {
  slots: ScheduleSlot[]; players: Player[]; playerName: (id: string) => string;
  formatTime: (s: string) => string; formatDate: (s: string) => string;
  reload: () => Promise<void>; dedup: (s: ScheduleSlot[]) => ScheduleSlot[];
}) {
  const [showBook, setShowBook] = useState(false);
  const [editSlot, setEditSlot] = useState<ScheduleSlot | null>(null);

  const dedupSlots = dedup(slots);
  const now = new Date();
  const upcoming = dedupSlots.filter((s) => new Date(s.start_time) >= now);
  const grouped = upcoming.reduce<Record<string, ScheduleSlot[]>>((acc, slot) => {
    const key = formatDate(slot.start_time);
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Schedule</h1>
        <button onClick={() => setShowBook(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium active:bg-blue-700">
          + Book
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No upcoming bookings</div>
      ) : (
        Object.entries(grouped).map(([date, dateSlots]) => (
          <div key={date} className="mb-5">
            <h2 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{date}</h2>
            <div className="space-y-2">
              {dateSlots.map((slot) => (
                <button key={slot.id} onClick={() => setEditSlot(slot)} className="w-full text-left bg-white rounded-xl border border-slate-200 p-3 active:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
                        {slot.slot_type && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{slot.slot_type}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{slot.location}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      getPlayerIds(slot).length >= getMaxPlayers(slot) ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                    }`}>{getPlayerIds(slot).length}/{getMaxPlayers(slot)}</span>
                  </div>
                  {getPlayerIds(slot).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {getPlayerIds(slot).map((id) => (
                        <span key={id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{playerName(id)}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {showBook && <BookSessionSheet players={players} onClose={() => setShowBook(false)} reload={reload} />}
      {editSlot && <EditBookingSheet slot={editSlot} players={players} playerName={playerName} formatTime={formatTime} onClose={() => { setEditSlot(null); reload(); }} reload={reload} />}
    </div>
  );
}

// ─── Book Session Sheet (two-step wizard) ───────────────────────────────────

function BookSessionSheet({ players, onClose, reload }: {
  players: Player[]; onClose: () => void; reload: () => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [form, setForm] = useState({ date: dateStr, time: "09:00", location: "", slot_type: SLOT_TYPES[0], max_players: 4 });

  const activePlayers = players.filter((p) => (p.status ?? "Active") === "Active");

  async function book() {
    if (!selectedPlayer) return;
    setSaving(true);
    const startDate = new Date(`${form.date}T${form.time}:00`);
    const endDate = new Date(startDate.getTime() + 3600000);
    const blockId = crypto.randomUUID();

    const { error } = await supabase.from("vb_schedule_slots").insert({
      id: crypto.randomUUID(),
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: form.location,
      status: "Booked",
      slot_type: form.slot_type || null,
      max_players: form.max_players,
      player_id: selectedPlayer.id,
      player_ids: [selectedPlayer.id],
      availability_block_id: blockId,
      booking_group_id: null,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    await reload();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />

        {step === 1 ? (
          <>
            <div className="flex-1 overflow-y-scroll px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Select Player</h2>
              {activePlayers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No active players. Add one first.</p>
              ) : (
                <div className="space-y-2">
                  {activePlayers.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedPlayer(p); setStep(2); }}
                      className="w-full text-left bg-slate-50 rounded-xl p-3 active:bg-slate-100">
                      <p className="font-medium text-slate-900 text-sm">{p.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {[p.player_position, p.skill_level, p.team].filter(Boolean).join(" · ") || "No details"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100">
              <button onClick={onClose} className="w-full px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl font-medium">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-scroll px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Book Session</h2>
                <button onClick={() => setStep(1)} className="text-sm text-blue-600">Change Player</button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <p className="font-medium text-blue-900 text-sm">{selectedPlayer?.full_name}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                  <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Duration</label>
                    <div className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">1 hour</div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Max Players</label>
                    <input type="number" min={1} max={30} value={form.max_players} onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Gym"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={form.slot_type} onChange={(e) => setForm({ ...form, slot_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100">
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button onClick={book} disabled={!form.location || saving}
                  className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50">
                  {saving ? "Booking..." : "Book Session"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Edit Booking Sheet ─────────────────────────────────────────────────────

function EditBookingSheet({ slot, players, playerName, formatTime, onClose, reload }: {
  slot: ScheduleSlot; players: Player[]; playerName: (id: string) => string;
  formatTime: (s: string) => string; onClose: () => void; reload: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [addPlayerId, setAddPlayerId] = useState("");

  const pids = getPlayerIds(slot);
  const maxP = getMaxPlayers(slot);
  const availablePlayers = players.filter((p) => (p.status ?? "Active") === "Active" && !pids.includes(p.id));

  async function addPlayer() {
    if (!addPlayerId) return;
    setSaving(true);
    const newIds = [...pids, addPlayerId];
    const { error } = await supabase.from("vb_schedule_slots").update({
      player_ids: newIds,
      player_id: newIds[0],
      status: "Booked",
    }).eq("availability_block_id", slot.availability_block_id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setAddPlayerId("");
    await reload();
    onClose();
  }

  async function removePlayer(pid: string) {
    setSaving(true);
    const newIds = pids.filter((id) => id !== pid);
    const { error } = await supabase.from("vb_schedule_slots").update({
      player_ids: newIds,
      player_id: newIds[0] ?? null,
      status: newIds.length > 0 ? "Booked" : "Open",
    }).eq("availability_block_id", slot.availability_block_id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    await reload();
    onClose();
  }

  async function deleteBooking() {
    setDeleting(true);
    const { error } = await supabase.from("vb_schedule_slots").delete().eq("availability_block_id", slot.availability_block_id);
    setDeleting(false);
    if (error) { alert(error.message); return; }
    await reload();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />
        <div className="flex-1 overflow-y-scroll px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Booking Details</h2>

          <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Time</span>
              <span className="text-sm font-medium text-slate-900">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Location</span>
              <span className="text-sm font-medium text-slate-900">{slot.location}</span>
            </div>
            {slot.slot_type && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Type</span>
                <span className="text-sm font-medium text-slate-900">{slot.slot_type}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Capacity</span>
              <span className="text-sm font-medium text-slate-900">{pids.length}/{maxP}</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Players ({pids.length})</h3>
          {pids.length === 0 ? (
            <p className="text-xs text-slate-400 mb-3">No players assigned</p>
          ) : (
            <div className="space-y-2 mb-3">
              {pids.map((pid) => (
                <div key={pid} className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-green-900">{playerName(pid)}</span>
                  <button onClick={() => removePlayer(pid)} disabled={saving} className="text-xs text-red-600 font-medium">Remove</button>
                </div>
              ))}
            </div>
          )}

          {pids.length < maxP && availablePlayers.length > 0 && (
            <div className="flex gap-2 mb-4">
              <select value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="">Add player...</option>
                {availablePlayers.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <button onClick={addPlayer} disabled={!addPlayerId || saving}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Add</button>
            </div>
          )}

          {showConfirm && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 mb-3">Delete this booking? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)} className="flex-1 px-3 py-2 text-sm bg-white rounded-lg border border-slate-200">Cancel</button>
                <button onClick={deleteBooking} disabled={deleting} className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg font-medium">Confirm Delete</button>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100">
          <div className="flex gap-2">
            <button onClick={() => setShowConfirm(true)} disabled={deleting}
              className="flex-1 px-4 py-2.5 text-sm text-red-600 bg-red-50 rounded-xl font-medium">
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl font-medium">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Players Tab ────────────────────────────────────────────────────────────

function PlayersTab({ players, reload }: { players: Player[]; reload: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", team: "", player_position: "", skill_level: "", shoots: "" });

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.team ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter((p) => (p.status ?? "Active") !== "Inactive");
  const inactive = filtered.filter((p) => p.status === "Inactive");

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("vb_players").insert({
      id: crypto.randomUUID(),
      full_name: form.full_name,
      team: form.team || null,
      player_position: form.player_position || null,
      skill_level: form.skill_level || null,
      shoots: form.shoots || null,
      status: "Active",
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowAdd(false);
    setForm({ full_name: "", team: "", player_position: "", skill_level: "", shoots: "" });
    reload();
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Players</h1>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium active:bg-blue-700">+ Add</button>
      </div>

      <input type="text" placeholder="Search players..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm mb-4 bg-white" />

      {active.length === 0 && inactive.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No players</div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {active.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{p.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.player_position && <span className="text-xs text-slate-500">{p.player_position}</span>}
                      {p.team && <span className="text-xs text-slate-400">{p.team}</span>}
                      {p.shoots && <span className="text-xs text-slate-400">{p.shoots}</span>}
                    </div>
                  </div>
                  {p.skill_level && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.skill_level}</span>}
                </div>
              </div>
            ))}
          </div>
          {inactive.length > 0 && (
            <details className="mb-8">
              <summary className="text-xs font-semibold text-slate-400 cursor-pointer mb-2">Inactive ({inactive.length})</summary>
              <div className="space-y-2 opacity-60">
                {inactive.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="font-medium text-slate-900 text-sm">{p.full_name}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />
            <div className="flex-1 overflow-y-scroll px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add Player</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Full Name</label>
                  <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Position</label>
                  <select value={form.player_position} onChange={(e) => setForm({ ...form, player_position: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    <option value="">Select...</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Skill Level</label>
                    <select value={form.skill_level} onChange={(e) => setForm({ ...form, skill_level: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                      <option value="">Select...</option>
                      {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Hand</label>
                    <select value={form.shoots} onChange={(e) => setForm({ ...form, shoots: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                      <option value="">Select...</option>
                      {HANDS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Team</label>
                  <input type="text" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100">
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button onClick={save} disabled={!form.full_name || saving}
                  className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50">
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

// ─── Sessions Tab ───────────────────────────────────────────────────────────

function SessionsTab({ sessions, slots, players, playerName, formatShortDate, reload, dedup, setTab }: {
  sessions: Session[]; slots: ScheduleSlot[]; players: Player[]; playerName: (id: string) => string;
  formatShortDate: (s: string) => string; reload: () => Promise<void>;
  dedup: (s: ScheduleSlot[]) => ScheduleSlot[]; setTab: (t: Tab) => void;
}) {
  const [showLog, setShowLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const blankForm = { player_id: "", date: "", session_type: "", focus: "", notes: "" };
  const [form, setForm] = useState(blankForm);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("vb_sessions").insert({
      id: crypto.randomUUID(),
      date: new Date(form.date).toISOString(),
      session_type: form.session_type || null,
      focus: form.focus,
      notes: form.notes || null,
      player_id: form.player_id,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowLog(false);
    setForm(blankForm);
    reload();
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Sessions</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("schedule")} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium active:bg-blue-700">+ Book</button>
          <button onClick={() => setShowLog(true)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium active:bg-slate-200">+ Log</button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No sessions logged</div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{playerName(s.player_id)}</span>
                    {s.session_type && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{s.session_type}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.focus}</p>
                  {s.notes && <p className="text-xs text-slate-400 mt-0.5">{s.notes}</p>}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-3">{formatShortDate(s.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowLog(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />
            <div className="flex-1 overflow-y-scroll px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Log Session</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Player</label>
                  <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    <option value="">Select player...</option>
                    {players.filter((p) => (p.status ?? "Active") !== "Inactive").map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    <option value="">Select...</option>
                    {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Focus</label>
                  <input type="text" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" placeholder="e.g. Passing, Serving" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm resize-none" />
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100">
              <div className="flex gap-2">
                <button onClick={() => setShowLog(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl font-medium">Cancel</button>
                <button onClick={save} disabled={!form.player_id || !form.date || !form.focus || saving}
                  className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50">
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
