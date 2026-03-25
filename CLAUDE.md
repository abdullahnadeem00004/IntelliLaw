# IntelliLaw — Agentic Modules Branch

## What This Branch Does
Building 3 AI agent APIs as a standalone Python/FastAPI microservice.
The Express backend (port 5000) will proxy requests to this service (port 8000).
Frontend (port 3000) calls Express as usual — Express forwards agent calls to FastAPI.

## Existing Stack (DO NOT MODIFY)
- Frontend: React + Vite + TypeScript → localhost:3000
- Backend: Express + TypeScript → localhost:5000, routes at /backend/src/routes/
- Database: MongoDB (Mongoose ODM) → localhost:27017, db name: intellilaw
- Auth: JWT (Bearer token in Authorization header)
- Collections: users (email, password, displayName, role), cases (title, caseNumber, category, priority, status, court, judge, clientName, assignedLawyerUid, nextHearingDate, tags)

## What We're Building (in /agents/ directory)
A Python FastAPI microservice with 3 agent endpoints:
1. POST /agents/verify-citations — takes LLM response text, verifies every legal citation
2. POST /agents/case-research — takes query + case_id, enriches with case context
3. POST /agents/draft-document — takes natural language request, generates legal document

## LLM: Google Gemini (NOT OpenAI)
- Package: google-generativeai
- Model: gemini-2.0-flash for ALL calls (fast, cheap, good enough)
- API Key: GEMINI_API_KEY in .env
- Get free key from: https://aistudio.google.com/apikey
- Usage pattern:
```python
import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")
response = model.generate_content("your prompt here")
text = response.text
```
- For JSON responses: add "Return ONLY valid JSON, no markdown, no backticks" to prompt, then strip ```json fences before parsing
- Temperature: use generation_config=genai.GenerationConfig(temperature=0.1) for legal accuracy

## Tech for Agent Service
- Python 3.11+, FastAPI, uvicorn
- google-generativeai (Gemini API — NOT openai)
- pymongo to read from the same MongoDB
- No auth on agent service (Express middleware handles auth, then proxies)

## Directory Structure to Create
```
/agents/
├── main.py                    # FastAPI app, all 3 route files mounted
├── requirements.txt
├── .env.example
├── core/
│   ├── base_agent.py          # AgentState + BaseAgent class
│   ├── llm_client.py          # Gemini wrapper (call_llm function)
│   └── config.py              # Settings from .env
├── tools/
│   ├── retriever.py           # Simple JSON-based legal search
│   ├── legal_db.py            # fetch section text, check amendments
│   └── mongo_client.py        # pymongo connection to read cases
├── citation_agent/
│   ├── extractor.py           # regex patterns for Pakistani legal citations
│   ├── verifier.py            # verification loop logic
│   └── router.py              # FastAPI route: POST /agents/verify-citations
├── research_agent/
│   ├── enricher.py            # query enrichment with case context
│   ├── agent.py               # main research loop
│   └── router.py              # FastAPI route: POST /agents/case-research
├── drafter_agent/
│   ├── templates.py           # Pakistani legal document templates
│   ├── agent.py               # drafter logic
│   └── router.py              # FastAPI route: POST /agents/draft-document
└── data/
    └── pak_legal_sections.json # seed data: key PPC/CPC/Constitution sections
```

## Pakistani Legal Citation Patterns to Recognize
- Section X PPC / Section X of Pakistan Penal Code
- Section X CPC / CrPC / Contract Act / Evidence Act
- Article X of the Constitution
- PLD 2019 SC 123, 2020 SCMR 456, CLC, MLD, PCrLJ refs
- Punjab Rented Premises Act, Anti-Terrorism Act, NAB Ordinance
- Hudood Ordinance, Family Courts Act, Companies Act

## Conventions
- Python: snake_case, type hints everywhere, async/await
- Every agent function logs to AgentState.trace[] for transparency
- All Gemini calls use temperature=0.1 for legal accuracy
- Every response includes a disclaimer: "This is AI-generated legal information, not professional legal advice"
- Confidence score = verified_citations / total_citations

## Commands
- `cd agents && pip install -r requirements.txt` — install deps
- `cd agents && uvicorn main:app --reload --port 8000` — run agent service
- `cd agents && python -m pytest tests/` — run tests

## IMPORTANT
- This is a 36-hour sprint. Prioritize working code over perfect code.
- Module A (Citation) is priority 1 — must work for demo
- Module C (Research) is priority 2 — must work for demo
- Module B (Drafter) is priority 3 — nice to have
- If something takes >20 min to debug, simplify and move on