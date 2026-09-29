import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from dotenv import load_dotenv
import openai
from hindsight_client import Hindsight

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY", "dummy_openai_key")

HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "http://localhost:8888")
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY", "dummy_key")
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "default_bank")

# Real Hindsight client instance
hindsight_client = Hindsight(base_url=HINDSIGHT_BASE_URL, api_key=HINDSIGHT_API_KEY)

historical_findings = [
    {
        "id": "A-021",
        "title": "Delayed access revocation",
        "category": "Access Control",
        "status": "Resolved",
        "resolution": "Automated employee offboarding workflow"
    },
    {
        "id": "A-032",
        "title": "Missing backup evidence",
        "category": "Data Protection",
        "status": "Resolved",
        "resolution": "Added backup logging and monitoring"
    },
    {
        "id": "A-043",
        "title": "Delayed access revocation",
        "category": "Access Control",
        "status": "Resolved",
        "resolution": "Automated employee offboarding workflow"
    },
    {
        "id": "A-051",
        "title": "Vendor access not reviewed",
        "category": "Vendor Risk",
        "status": "Resolved",
        "resolution": "Introduced quarterly vendor access reviews"
    },
    {
        "id": "A-067",
        "title": "Missing encryption evidence",
        "category": "Data Protection",
        "status": "Resolved",
        "resolution": "Updated encryption policy and evidence collection"
    }
]

demo_finding = {
    "id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control",
    "status": "Open"
}


def _match_strength(semantic_score: Optional[float]) -> str:
    """Derive a human-readable label from a Hindsight semantic similarity score."""
    if semantic_score is None:
        return "Unknown"
    if semantic_score >= 0.90:
        return "Very High Match"
    if semantic_score >= 0.75:
        return "High Match"
    if semantic_score >= 0.55:
        return "Moderate Match"
    return "Low Match"


def _serialize_recall_result(match) -> dict:
    """
    Extract real fields from a RecallResult SDK object into a structured dict.
    Only reads documented fields from hindsight_client_api.models.RecallResult.
    Safely handles None/missing fields.
    """
    scores = None
    if getattr(match, "scores", None) is not None:
        s = match.scores
        scores = {
            "final": getattr(s, "final", None),
            "semantic": getattr(s, "semantic", None),
            "reranker": getattr(s, "reranker", None),
            "keyword": getattr(s, "keyword", None),
        }

    occurred_at = None
    raw_start = getattr(match, "occurred_start", None)
    if raw_start:
        occurred_at = str(raw_start)

    return {
        "id": getattr(match, "id", None),
        "text": getattr(match, "text", None),
        "scores": scores,
        "occurred_at": occurred_at,
        "document_id": getattr(match, "document_id", None),
        "entities": getattr(match, "entities", None),
        "context": getattr(match, "context", None) or None,
        "chunk_id": getattr(match, "chunk_id", None),
    }


def _serialize_memory_unit(m) -> dict:
    """
    Extract real fields from a MemoryUnitListItem SDK object into a structured dict.
    Only reads documented fields from hindsight_client_api.models.MemoryUnitListItem.
    Safely handles None/missing fields.
    """
    # occurred_start is the canonical event timestamp; fall back to mentioned_at
    occurred_at = getattr(m, "occurred_start", None) or getattr(m, "mentioned_at", None)
    if occurred_at:
        occurred_at = str(occurred_at)

    return {
        "id": getattr(m, "id", None),
        "text": getattr(m, "text", None),
        "occurred_at": occurred_at,
        "document_id": getattr(m, "document_id", None),
        "entities": getattr(m, "entities", None) or None,
        "state": getattr(m, "state", None),
        "proof_count": getattr(m, "proof_count", None),
        "fact_type": getattr(m, "fact_type", None),
        "tags": getattr(m, "tags", None) or [],
        "chunk_id": getattr(m, "chunk_id", None),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Real Hindsight retain call for historical data
    print("Initializing Hindsight memory...")
    for finding in historical_findings:
        content = (
            f"Finding {finding['id']}: {finding['title']}. "
            f"Category: {finding['category']}. Status: {finding['status']}. "
            f"Resolution: {finding['resolution']}."
        )
        try:
            await hindsight_client.aretain(bank_id=HINDSIGHT_BANK_ID, content=content)
            print(f"Retained {finding['id']} in Hindsight.")
        except Exception as e:
            print(f"Failed to retain {finding['id']} in Hindsight: {e}")
    yield


app = FastAPI(title="AuditTrail AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    finding_id: str
    title: str
    category: str


class ResolveRequest(BaseModel):
    finding_id: str
    resolution: str
    status: str = "Resolved"
    resolved_by: Optional[str] = "auditor"


@app.get("/health")
def health_check():
    return {"status": "ok", "hindsight_mode": "real", "base_url": HINDSIGHT_BASE_URL}


@app.get("/findings")
def get_findings():
    return {"demo_finding": demo_finding, "historical": historical_findings}


@app.post("/analyze")
async def analyze_finding(req: AnalyzeRequest):
    query = f"{req.title} {req.category}"

    # ------------------------------------------------------------------
    # Feature 1 — Cumulative Learning: fetch multiple results from Hindsight
    # budget='high' asks Hindsight for a larger result set.
    # ------------------------------------------------------------------
    raw_results = []
    try:
        recall_response = await hindsight_client.arecall(
            bank_id=HINDSIGHT_BANK_ID, query=query, budget="high"
        )
        if hasattr(recall_response, "results"):
            raw_results = recall_response.results or []
        elif isinstance(recall_response, list):
            raw_results = recall_response
    except Exception as e:
        print(f"Hindsight arecall failed: {e}")

    # Serialize all results into structured dicts
    historical_matches = [_serialize_recall_result(r) for r in raw_results]

    # Primary match = strongest result (Hindsight returns results ranked by final score)
    historical_match = historical_matches[0] if historical_matches else None

    # ------------------------------------------------------------------
    # Feature 2 — Learning Context: counts come from real Hindsight results
    # ------------------------------------------------------------------
    decisions_used = len(historical_matches)
    learning_context = {
        "memory_used": decisions_used > 0,
        "historical_memories_retrieved": decisions_used,
    }

    # ------------------------------------------------------------------
    # Feature 3 — Precedent Status: threshold from real semantic score
    # "reliable" = High Match or better (semantic >= 0.75)
    # ------------------------------------------------------------------
    primary_semantic = None
    if historical_match:
        primary_semantic = (historical_match.get("scores") or {}).get("semantic")

    match_strength = _match_strength(primary_semantic)
    reliable = match_strength in ("Very High Match", "High Match")
    precedent_status = (
        "Reliable precedent found" if reliable else "No reliable precedent found"
    )

    # ------------------------------------------------------------------
    # Feature 4 — What Changed?: compare current finding vs. primary match
    # Only use fields that genuinely exist on the data structures.
    # ------------------------------------------------------------------
    if reliable and historical_match:
        matched_text = historical_match.get("text") or ""

        # same_category: compare req.category against the matched text
        # (RecallResult has no dedicated category field; we check the text)
        same_category = req.category.lower() in matched_text.lower() if matched_text else None

        # historical_status: Hindsight stores "Status: Resolved" in the retained text
        historical_status = None
        if "resolved" in matched_text.lower():
            historical_status = "Resolved"
        elif "open" in matched_text.lower():
            historical_status = "Open"

        # previous_resolution: extract "Resolution: ..." from the matched text when present
        previous_resolution_text = None
        if "resolution:" in matched_text.lower():
            for part in matched_text.split("."):
                if "resolution" in part.lower():
                    previous_resolution_text = part.strip()
                    break
        if not previous_resolution_text:
            previous_resolution_text = "Extracted from historical match."

        what_changed = {
            "same_category": same_category,
            "same_root_cause": None,  # root cause is not a discrete SDK field
            "current_status": "Open",
            "historical_status": historical_status,
            "previous_resolution": previous_resolution_text,
            "summary": (
                f"Current finding '{req.title}' ({req.category}) compared against "
                f"historical precedent. "
                + (
                    f"Category match: {'yes' if same_category else 'no'}. "
                    if same_category is not None else ""
                )
                + (
                    f"Historical outcome: {historical_status}. " if historical_status else ""
                )
                + "Root cause comparison not available from stored memory text."
            ),
        }
        previous_resolution = previous_resolution_text
    else:
        what_changed = {
            "same_category": None,
            "same_root_cause": None,
            "current_status": "Open",
            "historical_status": None,
            "previous_resolution": None,
            "summary": "No reliable historical precedent was found for comparison.",
        }
        previous_resolution = None

    # ------------------------------------------------------------------
    # Static analysis fields (preserved from original)
    # ------------------------------------------------------------------
    ai_analysis = (
        "This finding indicates a potential risk in access management. "
        "When employee access is not revoked promptly, it can lead to "
        "unauthorized access to sensitive data."
    )
    ai_recommendation = (
        "Implement an automated workflow that triggers immediately upon "
        "HR offboarding to revoke all system access."
    )
    severity = "High"
    why_relevant = (
        "The historical finding shares the same root cause and category. "
        "The previous resolution successfully addressed this."
        if reliable
        else "No reliable precedent was found. Manual review recommended."
    )

    try:
        if (
            openai.api_key
            and openai.api_key != "dummy_openai_key"
            and openai.api_key != "your_openai_api_key_here"
        ):
            match_text = historical_match.get("text") if historical_match else None
            prompt = (
                f"Analyze audit finding: {req.title}. Category: {req.category}. "
                f"Previous similar finding: {match_text}. "
                f"Previous resolution: {previous_resolution}."
            )
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
            )
            ai_analysis = response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI error or mock used: {e}")

    return {
        "current_finding": req.model_dump(),
        "severity": severity,
        "ai_analysis": ai_analysis,
        # --- backward-compatible primary match ---
        "historical_match": historical_match,
        "match_strength": match_strength,
        "previous_resolution": previous_resolution,
        "why_relevant": why_relevant,
        "ai_recommendation": ai_recommendation,
        # --- Feature 1: cumulative list ---
        "historical_matches": historical_matches,
        # --- Feature 2: learning context ---
        "learning_context": learning_context,
        # --- Feature 3: precedent status ---
        "precedent_status": precedent_status,
        # --- Feature 4: what changed ---
        "what_changed": what_changed,
    }


@app.post("/resolve")
async def resolve_finding(req: ResolveRequest):
    resolved_at = datetime.now(timezone.utc).isoformat()
    resolved_by = req.resolved_by or "auditor"

    # Retain a rich content blob in Hindsight that includes resolver metadata
    content = (
        f"Finding {req.finding_id} resolved by {resolved_by} at {resolved_at}. "
        f"Resolution: {req.resolution}. Status: {req.status}."
    )

    # Real Hindsight retain call
    try:
        await hindsight_client.aretain(bank_id=HINDSIGHT_BANK_ID, content=content)
    except Exception as e:
        print(f"Hindsight aretain failed: {e}")

    return {
        "status": "success",
        "message": "Resolution retained in real Hindsight.",
        "resolved_at": resolved_at,
        "resolved_by": resolved_by,
    }


@app.get("/memory")
async def get_memory():
    # Real Hindsight list_memories call — return structured objects, not strings
    try:
        memories = await hindsight_client.alist_memories(bank_id=HINDSIGHT_BANK_ID)
        items = getattr(memories, "items", memories)
        mem_list = [_serialize_memory_unit(m) for m in items]
        return {"memories": mem_list, "total": len(mem_list)}
    except Exception as e:
        print(f"Hindsight alist_memories failed: {e}")
        return {"error": str(e), "memories": [], "total": 0}
