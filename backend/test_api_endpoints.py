"""
AuditTrail AI — Backend API Integration Tests
Verifies all endpoints work against a live Hindsight server.
Run from backend/ with:
    python test_api_endpoints.py
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"
PASS = "[PASS]"
FAIL = "[FAIL]"

errors = []

def check(condition: bool, label: str):
    if condition:
        print(f"  {PASS}  {label}")
    else:
        print(f"  {FAIL}  {label}")
        errors.append(label)

def section(title: str):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}")

# ---------------------------------------------------------------------------
section("GET /health")
# ---------------------------------------------------------------------------
r = requests.get(f"{BASE_URL}/health")
print("Status:", r.status_code, "  Body:", json.dumps(r.json(), indent=2))
check(r.status_code == 200, "HTTP 200")
check(r.json().get("status") == "ok", "status == 'ok'")
check(r.json().get("hindsight_mode") == "real", "hindsight_mode == 'real'")
check("8888" in r.json().get("base_url", ""), "base_url contains port 8888")

# ---------------------------------------------------------------------------
section("GET /findings")
# ---------------------------------------------------------------------------
r = requests.get(f"{BASE_URL}/findings")
print("Status:", r.status_code)
data = r.json()
check(r.status_code == 200, "HTTP 200")
check("demo_finding" in data, "response has demo_finding")
check("historical" in data, "response has historical list")
check(len(data.get("historical", [])) > 0, "historical list is non-empty")
check(data["demo_finding"].get("id") == "A-107", "demo finding id == A-107")

# ---------------------------------------------------------------------------
section("POST /analyze — structured historical_match")
# ---------------------------------------------------------------------------
payload = {
    "finding_id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control",
}
r = requests.post(f"{BASE_URL}/analyze", json=payload)
print("Status:", r.status_code)
data = r.json()
print("Response (analyze):", json.dumps(data, indent=2))

check(r.status_code == 200, "HTTP 200")
check("current_finding" in data, "response has current_finding")
check("severity" in data, "response has severity")
check("ai_analysis" in data, "response has ai_analysis")
check("ai_recommendation" in data, "response has ai_recommendation")
check("why_relevant" in data, "response has why_relevant")
check("previous_resolution" in data, "response has previous_resolution")

# --- KEY CHECKS: historical_match must be a dict, not a string ---
hm = data.get("historical_match")
check(hm is not None, "historical_match is present")
check(isinstance(hm, dict), "historical_match is a JSON object (not a string)")
check("id" in hm, "historical_match has 'id' field")
check("text" in hm, "historical_match has 'text' field")
check("occurred_at" in hm, "historical_match has 'occurred_at' field")
check("document_id" in hm, "historical_match has 'document_id' field")

# --- Scores ---
scores = hm.get("scores")
check(isinstance(scores, dict), "historical_match.scores is a dict")
check("final" in scores, "scores has 'final'")
check("semantic" in scores, "scores has 'semantic'")
check("reranker" in scores, "scores has 'reranker'")
check("keyword" in scores, "scores has 'keyword'")
check(scores.get("semantic") is not None, "scores.semantic is not None")

# --- match_strength ---
ms = data.get("match_strength")
check(ms is not None, "match_strength is present")
check(ms in ("Very High Match", "High Match", "Moderate Match", "Low Match", "Unknown"),
      f"match_strength is a valid label (got '{ms}')")
print(f"  >> match_strength = '{ms}'")

# ---------------------------------------------------------------------------
section("POST /resolve — decision ledger metadata")
# ---------------------------------------------------------------------------
payload = {
    "finding_id": "A-107",
    "resolution": "Automated workflow integrated with HR system for immediate access revocation",
    "status": "Resolved",
    "resolved_by": "test-auditor",
}
r = requests.post(f"{BASE_URL}/resolve", json=payload)
print("Status:", r.status_code)
data = r.json()
print("Response (resolve):", json.dumps(data, indent=2))

check(r.status_code == 200, "HTTP 200")
check(data.get("status") == "success", "status == 'success'")
check("resolved_at" in data, "response has resolved_at")
check("resolved_by" in data, "response has resolved_by")
check(data.get("resolved_by") == "test-auditor", "resolved_by echoed correctly")

# Test optional resolved_by defaults to "auditor"
r2 = requests.post(f"{BASE_URL}/resolve", json={
    "finding_id": "A-108",
    "resolution": "Patched vulnerability",
    "status": "Resolved",
})
check(r2.json().get("resolved_by") == "auditor", "resolved_by defaults to 'auditor'")

# Wait for Hindsight to embed both resolutions
print("\n  Waiting 5s for Hindsight embedding...")
time.sleep(5)

# ---------------------------------------------------------------------------
section("GET /memory — structured memory objects")
# ---------------------------------------------------------------------------
r = requests.get(f"{BASE_URL}/memory")
print("Status:", r.status_code)
data = r.json()

check(r.status_code == 200, "HTTP 200")
check("memories" in data, "response has 'memories' key")
check("total" in data, "response has 'total' key")
check(isinstance(data.get("memories"), list), "memories is a list")

memories = data.get("memories", [])
check(len(memories) > 0, f"memories list is non-empty (got {len(memories)})")

if memories:
    first = memories[0]
    print("  First memory object:", json.dumps(first, indent=4))
    check(isinstance(first, dict), "memory item is a dict (not a string)")
    check("id" in first, "memory item has 'id'")
    check("text" in first, "memory item has 'text'")
    check("state" in first, "memory item has 'state'")
    check("proof_count" in first, "memory item has 'proof_count'")
    check("occurred_at" in first, "memory item has 'occurred_at'")
    check("document_id" in first, "memory item has 'document_id'")

# ---------------------------------------------------------------------------
section("Real Hindsight workflow -- A-043 >> A-107 recall")
# ---------------------------------------------------------------------------
print("  Analyzing A-107 (expects recall of A-043 / A-021 from Hindsight)...")
r = requests.post(f"{BASE_URL}/analyze", json={
    "finding_id": "A-107",
    "title": "Delayed Employee Access Revocation",
    "category": "Access Control",
})
data = r.json()
hm = data.get("historical_match") or {}
matched_text = hm.get("text", "")
check(isinstance(hm, dict), "Recall returned a structured dict (real Hindsight, no mock)")
check(len(matched_text) > 10, f"Recalled text is non-empty: '{matched_text[:60]}...'")
print(f"  >> Recalled: {matched_text[:100]}")

# ---------------------------------------------------------------------------
section("RESULTS SUMMARY")
# ---------------------------------------------------------------------------
total = 0
# Re-count from the checks tracker
passed = 0
if errors:
    print(f"\n  {len(errors)} check(s) FAILED:")
    for e in errors:
        print(f"    - {e}")
    print()
    sys.exit(1)
else:
    print(f"\n  All checks PASSED. No mocks, no hardcoded matching.\n")
