# AuditTrail AI Backend

This is the FastAPI backend for the AuditTrail AI system, integrating directly with the real Hindsight SDK for long-term agent memory.

## Setup & Requirements

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Hindsight memory server using Docker (with Groq LLM configuration):
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

## Environment Variables

Create a `.env` file in the `backend/` directory or export these variables:
- `OPENAI_API_KEY`: Used for the analysis AI (fallback to "dummy_openai_key" if not set).
- `HINDSIGHT_BASE_URL`: The URL of the Hindsight API (defaults to `http://localhost:8888`).
- `HINDSIGHT_API_KEY`: The API key for Hindsight if authentication is configured (defaults to "dummy_key").
- `HINDSIGHT_BANK_ID`: The Memory Bank ID to use (defaults to "default_bank").

## Startup Command

To start the backend server with hot-reloading for development:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: The frontend base API URL should be configured to point to `http://localhost:8000`.*

## API Endpoints & Request/Response Shapes

### 1. `GET /health`
Returns the health status and the base URL of the connected Hindsight instance.
**Response:**
```json
{
  "status": "ok",
  "hindsight_mode": "real",
  "base_url": "http://localhost:8888"
}
```

### 2. `GET /findings`
Returns the demo open finding and historical findings.
**Response:**
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

### 3. `POST /analyze`
Analyzes a new audit finding, performing a semantic recall via Hindsight to find historical matches.
**Request Shape:**
```json
{
  "finding_id": "A-107",
  "title": "Delayed Employee Access Revocation",
  "category": "Access Control"
}
```
**Response Shape:**
```json
{
  "current_finding": {
    "finding_id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control"
  },
  "severity": "High",
  "ai_analysis": "This finding indicates a potential risk...",
  "historical_match": "id='faa167bc-5dfa-4fb2-a587-8576f3cec8e1' text='Finding A-021 (delayed access revocation) was resolved...'",
  "previous_resolution": "Extracted from historical match.",
  "why_relevant": "The historical finding shares the same root cause...",
  "ai_recommendation": "Implement an automated workflow..."
}
```

### 4. `POST /resolve`
Marks a finding as resolved and retains the resolution in Hindsight memory.
**Request Shape:**
```json
{
  "finding_id": "A-107",
  "resolution": "Automated workflow integrated with HR system",
  "status": "Resolved"
}
```
**Response:**
```json
{
  "status": "success",
  "message": "Resolution retained in real Hindsight."
}
```

### 5. `GET /memory`
Lists all memories currently stored in the active Hindsight memory bank.
**Response Shape:**
```json
{
  "memories": [
    "id='af3d787c-3dae-4d3e-bc5b-8729f7763aaf' text='Finding A-032...'",
    "id='faa167bc-5dfa-4fb2-a587-8576f3cec8e1' text='Finding A-021...'"
  ]
}
```
