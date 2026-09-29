# AuditTrail AI Backend

FastAPI backend for AuditTrail AI, integrating with the real Hindsight SDK for long-term agent memory.

## Setup & Requirements

```bash
pip install -r requirements.txt
```

## Hindsight Docker Startup (Groq)

```bash
docker run -d --pull always --name hindsight \
  -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_PROVIDER=groq \
  -e HINDSIGHT_API_LLM_MODEL=openai/gpt-oss-120b \
  -e HINDSIGHT_API_LLM_GROQ_SERVICE_TIER=on_demand \
  -e HINDSIGHT_API_LLM_API_KEY=gsk_your_groq_api_key \
  -v $HOME/.hindsight-docker:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```

## Backend Startup

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend base API URL: `http://localhost:8000`**

## Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `HINDSIGHT_BASE_URL` | `http://localhost:8888` | Hindsight API |
| `HINDSIGHT_API_KEY` | `dummy_key` | Leave as-is for local no-auth setup |
| `HINDSIGHT_BANK_ID` | `default_bank` | Memory bank namespace |
| `OPENAI_API_KEY` | `dummy_openai_key` | Optional; only used if real key is set |

---

## API Endpoints

### `GET /health`
```json
{
  "status": "ok",
  "hindsight_mode": "real",
  "base_url": "http://localhost:8888"
}
```

---

### `GET /findings`
```json
{
  "demo_finding": {
    "id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control",
    "status": "Open"
  },
  "historical": [
    {
      "id": "A-021",
      "title": "Delayed access revocation",
      "category": "Access Control",
      "status": "Resolved",
      "resolution": "Automated employee offboarding workflow"
    }
  ]
}
```

---

### `POST /analyze`

**Request:**
```json
{
  "finding_id": "A-107",
  "title": "Delayed Employee Access Revocation",
  "category": "Access Control"
}
```

**Response:**
```json
{
  "current_finding": {
    "finding_id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control"
  },
  "severity": "High",
  "ai_analysis": "This finding indicates a potential risk...",
  "ai_recommendation": "Implement an automated workflow...",
  "why_relevant": "The historical finding shares the same root cause...",

  "historical_match": {
    "id": "eff097f3-...",
    "text": "Finding A-021 (delayed access revocation) was resolved...",
    "scores": { "final": 1.0997, "semantic": 0.8320, "reranker": 0.9997, "keyword": 0.9000 },
    "occurred_at": "2026-09-29T10:17:57.561557+00:00",
    "document_id": "c1cd67f4-...",
    "entities": null,
    "context": null,
    "chunk_id": "default~5Fbank_c1cd67f4-..._0"
  },
  "match_strength": "High Match",
  "previous_resolution": "Extracted from historical match.",

  "historical_matches": [
    {
      "id": "eff097f3-...",
      "text": "Finding A-021 ...",
      "scores": { "final": 1.0997, "semantic": 0.8320, "reranker": 0.9997, "keyword": 0.9000 },
      "occurred_at": "2026-09-29T10:17:57.561557+00:00",
      "document_id": "c1cd67f4-...",
      "entities": null,
      "context": null,
      "chunk_id": "..."
    }
  ],

  "learning_context": {
    "memory_used": true,
    "historical_memories_retrieved": 14
  },

  "precedent_status": "Reliable precedent found",

  "what_changed": {
    "same_category": true,
    "same_root_cause": null,
    "current_status": "Open",
    "historical_status": "Resolved",
    "previous_resolution": "Extracted from historical match.",
    "summary": "Current finding '...' (Access Control) compared against historical precedent..."
  }
}
```

#### Field Reference

| Field | Description |
|---|---|
| `historical_match` | Primary/strongest Hindsight recall result. Always a structured JSON object. Backward-compatible. |
| `match_strength` | Human label derived from `historical_match.scores.semantic`: `"Very High Match" / "High Match" / "Moderate Match" / "Low Match"` |
| `historical_matches` | All relevant results returned by Hindsight recall (`budget=high`), ranked by final score. Each item has the same shape as `historical_match`. |
| `learning_context.memory_used` | `true` if Hindsight returned at least one result. |
| `learning_context.historical_memories_retrieved` | Exact count of `RecallResult` items returned from real Hindsight recall (`budget=high`). Represents memories retrieved, not AI decisions made. Never fabricated. |
| `precedent_status` | `"Reliable precedent found"` when best semantic score >= 0.75; else `"No reliable precedent found"`. |
| `what_changed.same_category` | `true/false` inferred from whether the current `category` string appears in the top Hindsight match text. `RecallResult` has no dedicated category field — this is a text-based inference. `null` when no reliable precedent. |
| `what_changed.same_root_cause` | Always `null`. Root cause is not a discrete field in the Hindsight SDK. |
| `what_changed.current_status` | Always `"Open"` (the submitted finding is by definition unresolved). |
| `what_changed.historical_status` | `"Resolved"` or `"Open"` extracted from the Hindsight memory text. `null` when no reliable precedent. |
| `what_changed.previous_resolution` | Extracted from Hindsight memory text. `null` when no reliable precedent. |
| `what_changed.summary` | Factual narrative comparing current vs. historical. Uses only available data. |

---

### `POST /resolve`

**Request:**
```json
{
  "finding_id": "A-107",
  "resolution": "Automated workflow integrated with HR system",
  "status": "Resolved",
  "resolved_by": "auditor"
}
```
`resolved_by` is optional — defaults to `"auditor"`.

**Response:**
```json
{
  "status": "success",
  "message": "Resolution retained in real Hindsight.",
  "resolved_at": "2026-09-29T10:20:06.571824+00:00",
  "resolved_by": "auditor"
}
```

> The stored Hindsight content includes finding ID, resolution text, resolver identity, and ISO timestamp.

---

### `GET /memory`
```json
{
  "memories": [
    {
      "id": "ea3db910-8436-4a48-9e87-77ee4847cf10",
      "text": "Finding A-108 was resolved by the auditor...",
      "occurred_at": "2026-09-29T10:19:21.780622+00:00",
      "document_id": "62da1fc1-7899-4f74-ac51-e0f3f7376fa6",
      "entities": "Finding A-107, vulnerability, auditor",
      "state": "valid",
      "proof_count": 1,
      "fact_type": "world",
      "tags": [],
      "chunk_id": "default~5Fbank_62da1fc1-..._0"
    }
  ],
  "total": 8
}
```

> Memory items are fully structured JSON objects — **not strings**.
> All fields come directly from the real Hindsight `MemoryUnitListItem` SDK object.
