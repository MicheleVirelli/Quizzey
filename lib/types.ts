/**
 * Hand-written types mirroring the Supabase schema (see supabase/migrations).
 * Once the schema stabilises these can be replaced by generated types
 * (`supabase gen types typescript`).
 */

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null; // ISO 3166-1 alpha-2, e.g. "IT"
  total_score: number;
  wins: number;
  losses: number;
  ties: number;
  games_played: number;
  created_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  color: string | null;
  icon: string | null;
  is_official: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  topic_id: string;
  text: string;
  answers: string[]; // exactly 4
  correct_index: number; // 0..3
  difficulty: number;
  created_by: string | null;
  created_at: string;
}

/** A question as sent to the client during play — without the correct answer. */
export type PlayableQuestion = Omit<Question, "correct_index">;

export type MatchStatus = "pending" | "active" | "finished";

export interface Match {
  id: string;
  topic_id: string;
  player_a: string;
  player_b: string | null;
  question_ids: string[];
  status: MatchStatus;
  score_a: number;
  score_b: number;
  winner: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface MatchAnswer {
  id: string;
  match_id: string;
  user_id: string;
  question_id: string;
  selected_index: number | null;
  is_correct: boolean;
  time_ms: number | null;
  answered_at: string;
}
