// Match types
export type AIAnalysisStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped';

export interface Match {
  id: number;
  opponent_name: string;
  team: string;
  match_date: string | null;
  source_sheet: string;
  import_batch_id: string;
  location: string | null;
  result: string | null;
  our_score: number | null;
  opponent_score: number | null;
  ai_analysis: string | null;
  ai_analysis_generated_at: string | null;
  ai_analysis_error: string | null;
  ai_analysis_status: AIAnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchCreate {
  opponent_name: string;
  match_date?: string;
  source_sheet?: string;
}

// Player types
export interface Player {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithStats extends Player {
  matches_played: number;
  avg_score: number;
  total_score: number;
  primary_position: number | null;
}

export interface PlayerCreate {
  name: string;
}

export interface PlayerSummary {
  player_name: string;
  matches_played: number;
  total_minutes: number | null;
  avg_puntuacion_final: number | null;
  matches: MatchStat[];
}

export interface MatchStat {
  match_id: number;
  opponent: string;
  team: string;
  match_date: string | null;
  puesto: number;
  tiempo_juego: number;
  score: number;
  // All 16 statistics
  tackles_positivos: number;
  tackles: number;
  tackles_errados: number;
  portador: number;
  ruck_ofensivos: number;
  pases: number;
  pases_malos: number;
  perdidas: number;
  recuperaciones: number;
  gana_contacto: number;
  quiebres: number;
  penales: number;
  juego_pie: number;
  recepcion_aire_buena: number;
  recepcion_aire_mala: number;
  try_: number;
}

// Stats types - matches backend PlayerMatchStats schema
export interface PlayerMatchStatsResponse {
  id: number;
  match_id: number;
  player_id: number;
  puesto: number;
  tiempo_juego: number;
  // 16 statistics
  tackles_positivos: number;
  tackles: number;
  tackles_errados: number;
  portador: number;
  ruck_ofensivos: number;
  pases: number;
  pases_malos: number;
  perdidas: number;
  recuperaciones: number;
  gana_contacto: number;
  quiebres: number;
  penales: number;
  juego_pie: number;
  recepcion_aire_buena: number;
  recepcion_aire_mala: number;
  try_: number;
  // Scores
  score_absoluto: number | null;
  puntuacion_final: number | null;
  scoring_config_id: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  player?: Player;
  match?: Match;
}

// Legacy stats type (kept for compatibility)
export interface PlayerStats {
  id: number;
  match_id: number;
  player_id: number;
  tries: number;
  try_assists: number;
  conversions: number;
  penalties: number;
  drop_goals: number;
  meters_run: number;
  defenders_beaten: number;
  offloads: number;
  tackles: number;
  missed_tackles: number;
  turnovers_won: number;
  turnovers_conceded: number;
  lineouts_won: number;
  lineouts_lost: number;
  scrums_won: number;
  created_at: string;
  player?: Player;
  match?: Match;
}

export interface PlayerStatsCreate {
  match_id: number;
  player_id: number;
  tries?: number;
  try_assists?: number;
  conversions?: number;
  penalties?: number;
  drop_goals?: number;
  meters_run?: number;
  defenders_beaten?: number;
  offloads?: number;
  tackles?: number;
  missed_tackles?: number;
  turnovers_won?: number;
  turnovers_conceded?: number;
  lineouts_won?: number;
  lineouts_lost?: number;
  scrums_won?: number;
}

// Scoring types
export interface ScoringConfig {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  weights?: ScoringWeight[];
}

export interface ScoringWeight {
  id: number;
  config_id: number;
  action_name: string;
  forwards_weight: number;
  backs_weight: number;
}

export interface ScoringConfigCreate {
  name: string;
  description?: string;
}

export interface WeightUpdate {
  forwards_weight: number;
  backs_weight: number;
}

// Rankings types
export interface PlayerRanking {
  rank: number;
  player_name: string;
  opponent: string | null;  // null when showing aggregated view (all matches)
  puesto: number | null;  // null when showing aggregated view
  tiempo_juego: number | null;  // null when showing aggregated view
  score_absoluto: number | null;  // null when showing aggregated view
  puntuacion_final: number;
  matches_played: number | null;  // Only present in aggregated view
}

// Upload types
export interface UploadResult {
  players_created: number;
  matches_created: number;
  stats_created: number;
  sheets_processed: string[];
  ai_analysis_generated: number;
  ai_analysis_errors: number;
  ai_analysis_queued: number;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
