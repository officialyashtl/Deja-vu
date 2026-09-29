Deja-vu: AuditTrail AI — Learning from Organizational History
Introduction

Organizations repeatedly encounter similar audit findings, compliance issues, and control failures. However, previous resolutions are often buried in historical records, making it difficult for teams to learn from what has already happened.

Deja-vu (AuditTrail AI) addresses this problem by using AI agents and organizational memory to identify similar historical findings and use their previous resolutions to inform the analysis of new findings.

The Problem

When a new audit finding is created, reviewers typically analyze it from scratch. Even when a similar issue has occurred before, the relevant historical context may be difficult to discover.

This can lead to:

Repeated investigation effort
Inconsistent resolutions
Loss of organizational knowledge
Slower audit remediation
Repeated control failures
Our Solution

AuditTrail AI analyzes a new finding and searches organizational memory for relevant historical cases.

The system provides:

Finding analysis — Understands the current issue and its context.
Historical memory retrieval — Searches previous organizational findings using semantic similarity.
Precedent detection — Identifies whether a reliable historical precedent exists.
Historical comparison — Shows what changed between the current and previous findings.
Previous resolution — Surfaces how a similar issue was previously addressed.
AI recommendation — Uses historical evidence to suggest a resolution.
Human decision — Keeps the final decision with the reviewer.
How Hindsight Enables Learning

The core of Deja-vu is its use of Hindsight as organizational memory.

Instead of treating every finding as an isolated event, the system retains relevant information from previous findings and retrieves it when a new finding is analyzed.

This creates a feedback loop:

New Finding → Search Organizational Memory → Retrieve Similar Cases → Learn from Previous Resolution → Recommend Action → Human Decision → Retain New Learning

Over time, the system can build a growing repository of organizational experience.

Example

Consider a finding involving delayed employee access revocation.

AuditTrail AI can identify a previous finding involving a similar access-control problem and surface:

The historical finding
Semantic similarity
Previous resolution
Historical outcome
Relevant organizational memory

The reviewer can then compare the previous case with the current finding before deciding how to proceed.

Technology Stack
Frontend: React, TypeScript, Vite
Backend: FastAPI, Python
AI: OpenAI
Memory: Hindsight
UI: React-based audit analysis interface
Deployment: Cloud-hosted frontend and backend
Human-in-the-Loop

Deja-vu is designed to assist auditors rather than replace them.

The AI provides historical evidence and recommendations, while the human reviewer remains responsible for the final decision.

Conclusion

Deja-vu demonstrates how AI agents can learn from hindsight rather than treating every new problem as completely independent.

By connecting current audit findings with organizational history, the system turns previous decisions into reusable knowledge and helps organizations build a continuous learning loop.
