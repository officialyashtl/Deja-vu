// Types for AuditTrail AI

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Status = 'Open' | 'Resolved' | 'In Progress';
export type Category =
  | 'Access Control'
  | 'Data Retention'
  | 'Vendor Management'
  | 'Security'
  | 'Compliance';

// ─── Local form / dashboard types ────────────────────────────────────────────

export interface Finding {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  status: Status;
  regulation?: string;
  evidence?: string;
  date: string;
}

// ─── Backend /analyze response types ─────────────────────────────────────────
// These mirror the exact JSON returned by POST /analyze in backend/main.py.

/** Scores object inside a RecallResult from Hindsight SDK */
export interface HistoricalMatchScores {
  final: number | null;
  semantic: number | null;
  reranker: number | null;
  keyword: number | null;
}

/**
 * A single historical memory match returned by Hindsight recall.
 * Mirrors _serialize_recall_result() in backend/main.py.
 */
export interface HistoricalMatch {
  id: string | null;
  text: string | null;
  scores: HistoricalMatchScores | null;
  occurred_at: string | null;
  document_id: string | null;
  entities: unknown | null;
  context: unknown | null;
  chunk_id: string | null;
}

/**
 * learning_context — Feature 2 from backend.
 * Describes how many Hindsight memories were used.
 */
export interface LearningContext {
  memory_used: boolean;
  historical_memories_retrieved: number;
}

/**
 * what_changed — Feature 4 from backend.
 * Comparison between current finding and historical precedent.
 */
export interface WhatChanged {
  same_category: boolean | null;
  same_root_cause: null; // backend always returns null (not a discrete SDK field)
  current_status: string | null;
  historical_status: string | null;
  previous_resolution: string | null;
  summary: string;
}

/**
 * The full response object returned by POST /analyze.
 * Every field is present in the backend return statement.
 */
export interface AnalysisResult {
  // Current finding echoed back from the backend
  current_finding: {
    finding_id: string;
    title: string;
    category: string;
  };
  // Risk severity assessed by backend (static "High" in current impl)
  severity: string;
  // Textual AI analysis (OpenAI or static fallback)
  ai_analysis: string;
  // Primary / strongest Hindsight memory match (null if no matches)
  historical_match: HistoricalMatch | null;
  // All Hindsight memory matches, ranked by score
  historical_matches: HistoricalMatch[];
  // Human-readable label: "Very High Match" | "High Match" | "Moderate Match" | "Low Match" | "Unknown"
  match_strength: string;
  // Learning context — how many memories were consulted
  learning_context: LearningContext;
  // Precedent status string: "Reliable precedent found" | "No reliable precedent found"
  precedent_status: string;
  // Comparison breakdown between current and historical finding
  what_changed: WhatChanged;
  // Extracted resolution text from the matched memory (null if no match)
  previous_resolution: string | null;
  // Explanation of why the historical match is relevant
  why_relevant: string;
  // Final AI recommendation string
  ai_recommendation: string;
}

// ─── POST /resolve ──────────────────────────────────────────────────────────────

/**
 * Request body for POST /resolve.
 * Mirrors ResolveRequest Pydantic model in backend/main.py.
 */
export interface ResolveRequest {
  finding_id: string;
  resolution: string;
  status?: string;       // default: "Resolved"
  resolved_by?: string;  // default: "auditor"
}

/**
 * Response from POST /resolve.
 */
export interface ResolveResponse {
  status: 'success';
  message: string;
  resolved_at: string;   // ISO timestamp
  resolved_by: string;
}

// ─── GET /memory ─────────────────────────────────────────────────────────────

/**
 * A single memory unit from GET /memory.
 * Mirrors _serialize_memory_unit() in backend/main.py.
 */
export interface MemoryUnit {
  id: string | null;
  text: string | null;
  occurred_at: string | null;
  document_id: string | null;
  entities: unknown | null;
  state: string | null;
  proof_count: number | null;
  fact_type: string | null;
  tags: string[];
  chunk_id: string | null;
}

export interface MemoryResponse {
  memories: MemoryUnit[];
  total: number;
  error?: string;
}

// ─── App state ────────────────────────────────────────────────────────────────

export interface AppState {
  currentFinding: Finding | null;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisStep: string;
  resolutionState: 'idle' | 'resolving' | 'resolved' | 'open';
  analysisError: string | null;
}
