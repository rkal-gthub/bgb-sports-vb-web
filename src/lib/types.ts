export interface Player {
  id: string;
  full_name: string;
  player_position: string | null;
  skill_level: string | null;
  team: string | null;
  age: number | null;
  birth_year: number | null;
  shoots: string | null;
  parent_guardian: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  city: string | null;
  state: string | null;
  date_created: string | null;
  scheduled: string | null;
  status: string | null;
  availability: string | null;
  primary_goals: string | null;
  coach_notes: string | null;
}

export interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  slot_type: string | null;
  max_players: number | null;
  player_id: string | null;
  player_ids: string[] | string | null;
  availability_block_id: string;
  booking_group_id: string | null;
}

export interface Session {
  id: string;
  date: string;
  session_type: string | null;
  focus: string;
  notes: string | null;
  player_id: string;
}

export const POSITIONS = [
  "Outside Hitter",
  "Middle Blocker",
  "Setter",
  "Libero",
  "Opposite Hitter",
  "Defensive Specialist",
];

export const SKILL_LEVELS = ["Rec", "Travel", "High School", "Club", "D3", "D1"];

export const SLOT_TYPES = ["Court", "Serving", "Hitting", "Video Coach"];

export const HANDS = ["L", "R"];
