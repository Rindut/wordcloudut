/**
 * TypeScript types for Word Cloud application
 */

export interface WordCloudSession {
  id: string;
  question: string;
  description: string | null;
  background_image_url: string | null;
  theme: string;
  max_entries_per_user: number;
  cooldown_hours: number;
  time_limit_sec: number | null;
  grouping_enabled: boolean;
  status: "draft" | "live" | "closed";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordCloudEntry {
  id: string;
  session_id: string;
  user_hash: string;
  word_raw: string;
  word_norm: string;
  cluster_key: string;
  is_blocked: boolean;
  created_at: string;
}

export interface WordCloudSummary {
  session_id: string;
  cluster_key: string;
  display_word: string;
  count: number;
  color: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  question: string;
  description?: string;
  background_image_url?: string;
  max_entries_per_user?: number;
  cooldown_hours?: number;
  time_limit_sec?: number;
  grouping_enabled?: boolean;
  theme?: string;
}

export interface CreateSessionResponse {
  session_id: string;
}

export interface SubmitWordRequest {
  user_hash: string;
  word: string;
}

export interface SubmitWordResponse {
  success: boolean;
  blocked: boolean;
  message?: string;
  attempts_left?: number;
  cooldown_remaining_seconds?: number;
}

export interface SummaryResponse {
  items: WordCloudSummary[];
}

export interface DeleteWordRequest {
  cluster_key: string;
}

export interface DeleteWordResponse {
  deleted: boolean;
}

export interface UpdateSessionRequest {
  question?: string;
  description?: string;
  background_image_url?: string;
}

export interface SessionWithCounts extends WordCloudSession {
  participant_count: number;
  word_count: number;
  total_entries: number;
}


