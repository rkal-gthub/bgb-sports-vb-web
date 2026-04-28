"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";
import { POSITIONS, SKILL_LEVELS, SLOT_TYPES, HANDS } from "@/lib/types";

export default function BookSessionPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<"player" | "details">("player");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [booking, setBooking] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [slotType, setSlotType] = useState(SLOT_TYPES[0]);
  const [location, setLocation] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);

  const [newPlayer, setNewPlayer] = useState({
    full_name: "",
    player_position: "",
    skill_level: "",
    team: "",
    birth_year: "",
    shoots: "",
    status: "Active",
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("vb_players")
        .select("*")
        .order("full_name");
      setPlayers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const activePlayers = players.filter(
    (p) => (p.status ?? "Active") === "Active"
  );

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

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

  function formatEndTime() {
    const start = new Date(`${date}T${startHour}:${startMinute}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatStartTime() {
    const start = new Date(`${date}T${startHour}:${startMinute}:00`);
    return start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  async function handleCreatePlayer() {
    if (!newPlayer.full_name.trim()) return;
    setSavingPlayer(true);
    setError("");

    const record = {
      full_name: newPlayer.full_name.trim(),
      player_position: newPlayer.player_position || null,
      skill_level: newPlayer.skill_level || null,
      team: newPlayer.team || null,
      birth_year: newPlayer.birth_year ? Number(newPlayer.birth_year) : null,
      shoots: newPlayer.shoots || null,
      status: newPlayer.status || "Active",
    };

    const { data, error: err } = await supabase
      .from("vb_players")
      .insert(record)
      .select()
      .single();

    if (err) {
      setError(err.message);
      setSavingPlayer(false);
      return;
    }

    setPlayers((prev) => [...prev, data]);
    setSelectedPlayerId(data.id);
    setShowNewPlayer(false);
    setSavingPlayer(false);
    setStep("details");
  }

  function handleSelectPlayer(playerId: string) {
    setSelectedPlayerId(playerId);
    setStep("details");
  }

  async function handleBook() {
    if (!selectedPlayerId) return;
    setBooking(true);
    setError("");

    const startTime = new Date(`${date}T${startHour}:${startMinute}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const slot = {
      id: crypto.randomUUID(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location,
      status: "Booked",
      slot_type: slotType,
      max_players: maxPlayers,
      player_id: selectedPlayerId,
      player_ids: [selectedPlayerId],
      availability_block_id: crypto.randomUUID(),
      booking_group_id: null,
    };

    const { error: err } = await supabase
      .from("vb_schedule_slots")
      .insert(slot);

    if (err) {
      setError(err.message);
      setBooking(false);
      return;
    }

    router.push("/schedule");
  }

  if (loading) return <p className="text-gray-800">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-blue-600 text-sm">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold">Book Session</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {step === "player" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Select Player</h2>
            <button
              onClick={() => setShowNewPlayer(!showNewPlayer)}
              className="text-blue-600 text-sm font-semibold hover:text-blue-800"
            >
              {showNewPlayer ? "Cancel" : "+ New Player"}
            </button>
          </div>

          {showNewPlayer && (
            <div className="bg-white rounded-xl p-5 space-y-4">
              <h3 className="font-medium">New Player</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newPlayer.full_name}
                  onChange={(e) =>
                    setNewPlayer((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={newPlayer.player_position}
                    onChange={(e) => setNewPlayer((f) => ({ ...f, player_position: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {POSITIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
                  <select
                    value={newPlayer.skill_level}
                    onChange={(e) => setNewPlayer((f) => ({ ...f, skill_level: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {SKILL_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <input
                    type="text"
                    value={newPlayer.team}
                    onChange={(e) => setNewPlayer((f) => ({ ...f, team: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
                  <input
                    type="number"
                    value={newPlayer.birth_year}
                    onChange={(e) => setNewPlayer((f) => ({ ...f, birth_year: e.target.value }))}
                    placeholder="2015"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Hand</label>
                <select
                  value={newPlayer.shoots}
                  onChange={(e) => setNewPlayer((f) => ({ ...f, shoots: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {HANDS.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>
              <button
                onClick={handleCreatePlayer}
                disabled={savingPlayer || !newPlayer.full_name.trim()}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPlayer ? "Saving..." : "Save & Book"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {activePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player.id)}
                className="w-full text-left bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <p className="font-semibold">
                  {player.full_name || "Unnamed Player"}
                </p>
                <p className="text-sm text-gray-600">
                  {[player.player_position, player.team, player.birth_year]
                    .filter(Boolean)
                    .join(" · ") || "No details"}
                </p>
              </button>
            ))}
            {activePlayers.length === 0 && !showNewPlayer && (
              <p className="text-center text-gray-600 py-8">
                No active players. Create one to book a session.
              </p>
            )}
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("player")}
              className="text-blue-600 text-sm font-semibold"
            >
              &larr; Change Player
            </button>
            <span className="text-sm text-gray-600">
              Booking for{" "}
              <span className="font-semibold text-gray-900">
                {selectedPlayer?.full_name}
              </span>
            </span>
          </div>

          <div className="bg-white rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-lg">Date & Time</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                value={`${startHour}:${startMinute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":");
                  setStartHour(h);
                  setStartMinute(m);
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
              <p className="text-xs text-gray-500 mt-1">Duration: 1 hour</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-lg">Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={slotType}
                onChange={(e) => setSlotType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SLOT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max players: {maxPlayers}
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <p className="font-medium text-gray-900">
              {formatStartTime()} – {formatEndTime()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {location ? `${location} · ` : ""}{slotType}
            </p>
          </div>

          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {booking ? "Booking..." : "Book Session"}
          </button>
        </div>
      )}
    </div>
  );
}
