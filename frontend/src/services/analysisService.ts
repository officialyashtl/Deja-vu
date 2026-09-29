import type { AnalysisResult, Finding, MemoryResponse, ResolveRequest, ResolveResponse } from '../types/finding';

const API_BASE = 'http://localhost:8000';

export const analysisService = {
  /**
   * POST /analyze — send a finding to the backend and get the full Hindsight analysis.
   */
  analyzeFinding: async (finding: Finding): Promise<AnalysisResult> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding_id: finding.id,
          title: finding.title,
          category: finding.category,
        }),
      });
    } catch {
      throw new Error(
        'Unable to analyze finding. Make sure the AuditTrail backend is running on http://localhost:8000.'
      );
    }

    if (!response.ok) {
      let detail = `Backend returned ${response.status} ${response.statusText}.`;
      try {
        const body = await response.json();
        if (body?.detail) detail = body.detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    return response.json() as Promise<AnalysisResult>;
  },

  /**
   * POST /resolve — persist the human resolution decision to Hindsight via backend.
   * Backend flow: frontend → FastAPI → Hindsight aretain → persisted memory.
   */
  resolveFinding: async (req: ResolveRequest): Promise<ResolveResponse> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
    } catch {
      throw new Error(
        'Unable to save resolution. Make sure the AuditTrail backend is running on http://localhost:8000.'
      );
    }

    if (!response.ok) {
      let detail = `Backend returned ${response.status} ${response.statusText}.`;
      try {
        const body = await response.json();
        if (body?.detail) detail = body.detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    return response.json() as Promise<ResolveResponse>;
  },

  /**
   * GET /memory — fetch all Hindsight memory units for the Decision Ledger.
   */
  getMemory: async (): Promise<MemoryResponse> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/memory`);
    } catch {
      throw new Error(
        'Unable to load decision history. Make sure the AuditTrail backend is running on http://localhost:8000.'
      );
    }

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status} ${response.statusText}.`);
    }

    return response.json() as Promise<MemoryResponse>;
  },

  /**
   * GET /findings — fetch findings from the backend
   */
  getFindings: async (): Promise<{ demo_finding: Finding; historical: Finding[] }> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/findings`);
    } catch {
      throw new Error(
        'Unable to load findings. Make sure the AuditTrail backend is running on http://localhost:8000.'
      );
    }

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status} ${response.statusText}.`);
    }

    return response.json() as Promise<{ demo_finding: Finding; historical: Finding[] }>;
  },
};
