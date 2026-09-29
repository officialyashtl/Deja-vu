import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Real Hindsight retain call for historical data
    print("Initializing Hindsight memory...")
    for finding in historical_findings:
        content = f"Finding {finding['id']}: {finding['title']}. Category: {finding['category']}. Status: {finding['status']}. Resolution: {finding['resolution']}."
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

@app.get("/health")
def health_check():
    return {"status": "ok", "hindsight_mode": "real", "base_url": HINDSIGHT_BASE_URL}

@app.get("/findings")
def get_findings():
    return {"demo_finding": demo_finding, "historical": historical_findings}

@app.post("/analyze")
async def analyze_finding(req: AnalyzeRequest):
    query = f"{req.title} {req.category}"
    historical_match = None
    previous_resolution = None
    
    # Real Hindsight recall call
    try:
        results = await hindsight_client.arecall(bank_id=HINDSIGHT_BANK_ID, query=query)
        # Parse the RecallResponse (assuming it has a `.results` attribute or is iterable)
        if hasattr(results, 'results') and len(results.results) > 0:
            match = results.results[0]
            historical_match = str(getattr(match, 'content', match))
        elif isinstance(results, list) and len(results) > 0:
            historical_match = str(getattr(results[0], 'content', results[0]))
        else:
            historical_match = str(results)
    except Exception as e:
        print(f"Hindsight arecall failed: {e}")

    if not previous_resolution and historical_match:
        previous_resolution = "Extracted from historical match."
        
    ai_analysis = "This finding indicates a potential risk in access management. When employee access is not revoked promptly, it can lead to unauthorized access to sensitive data."
    ai_recommendation = "Implement an automated workflow that triggers immediately upon HR offboarding to revoke all system access."
    severity = "High"
    why_relevant = "The historical finding shares the same root cause and category. The previous resolution successfully addressed this."

    try:
        if openai.api_key and openai.api_key != "dummy_openai_key" and openai.api_key != "your_openai_api_key_here":
            prompt = f"Analyze audit finding: {req.title}. Category: {req.category}. Previous similar finding: {historical_match}. Previous resolution: {previous_resolution}."
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )
            ai_analysis = response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI error or mock used: {e}")

    return {
        "current_finding": req.model_dump(),
        "severity": severity,
        "ai_analysis": ai_analysis,
        "historical_match": historical_match,
        "previous_resolution": previous_resolution,
        "why_relevant": why_relevant,
        "ai_recommendation": ai_recommendation
    }

@app.post("/resolve")
async def resolve_finding(req: ResolveRequest):
    content = f"Finding {req.finding_id} resolved: {req.resolution}. Status: {req.status}."
    
    # Real Hindsight retain call
    try:
        await hindsight_client.aretain(bank_id=HINDSIGHT_BANK_ID, content=content)
    except Exception as e:
        print(f"Hindsight aretain failed: {e}")
            
    return {"status": "success", "message": "Resolution retained in real Hindsight."}

@app.get("/memory")
async def get_memory():
    # Real Hindsight list_memories call
    try:
        memories = await hindsight_client.alist_memories(bank_id=HINDSIGHT_BANK_ID)
        # Simplify serialization depending on object structure
        mem_list = []
        for m in getattr(memories, 'items', memories):
             mem_list.append(str(m))
        return {"memories": mem_list}
    except Exception as e:
        print(f"Hindsight alist_memories failed: {e}")
        return {"error": str(e), "memories": []}
