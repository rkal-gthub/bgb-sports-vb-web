import type { ScheduleSlot } from "./types";

export function getPlayerIds(slot: ScheduleSlot): string[] {
  const ids = slot.player_ids;
  if (!ids) return [];
  if (Array.isArray(ids)) return ids.filter(Boolean);
  if (typeof ids === "string" && ids.length > 0)
    return ids.split(",").filter(Boolean);
  return [];
}

export function getMaxPlayers(slot: ScheduleSlot): number {
  return slot.max_players ?? 4;
}
