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
  "ai_analysis": "This finding indicates a potential risk in access management...",
  "historical_match": {
    "id": "eff097f3-a4f7-4103-862a-f49ac19cd0a1",
    "text": "Finding A-021 (delayed access revocation) was resolved by implementing an automated employee offboarding workflow.",
    "scores": {
      "final": 1.0997,
      "semantic": 0.8320,
      "reranker": 0.9997,
      "keyword": 0.9000
    },
    "occurred_at": "2026-09-29T10:17:57.561557+00:00",
    "document_id": "c1cd67f4-44ce-4beb-8cff-fbe39d4f92a3",
    "entities": null,
    "context": null,
    "chunk_id": "default~5Fbank_c1cd67f4-..._0"
  },
  "match_strength": "High Match",
  "previous_resolution": "Extracted from historical match.",
  "why_relevant": "The historical finding shares the same root cause and category.",
  "ai_recommendation": "Implement an automated workflow that triggers immediately upon HR offboarding..."
}
```

**`match_strength` derivation** (from real Hindsight `semantic` score):
| Score | Label |
|---|---|
| >= 0.90 | "Very High Match" |
| >= 0.75 | "High Match" |
| >= 0.55 | "Moderate Match" |
| < 0.55 | "Low Match" |

> `historical_match` is a fully structured JSON object — **not a string**.
> All fields come directly from the real Hindsight `RecallResult` SDK object.

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
