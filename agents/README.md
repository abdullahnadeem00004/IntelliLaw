# IntelliLaw Agent Service

AI-powered legal research agents for Pakistani law. Runs as a FastAPI microservice alongside the Express backend.

## Architecture

```
Frontend (React :3000)
    │
    ▼
Express Backend (:5000)  ──JWT auth──►  /api/agents/*
    │
    │  axios proxy
    ▼
FastAPI Agent Service (:8000)  ──►  /agents/*
    ├── Citation Verifier   (POST /agents/verify-citations)
    ├── Case Researcher     (POST /agents/case-research)
    ├── Document Drafter    (POST /agents/draft-document)
    │
    ├── LLM: Gemini (primary) → Ollama (fallback)
    ├── Legal DB: pak_legal_sections.json (40 sections)
    └── MongoDB: reads case data from 'cases' collection
```

## Setup

```bash
cd agents
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY (optional if using Ollama)
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (empty) | Google Gemini API key (primary LLM) |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL (fallback LLM) |
| `OLLAMA_MODEL` | `minimax-m2.7:cloud` | Ollama model name |
| `MONGODB_URI` | `mongodb://localhost:27017/intellilaw` | MongoDB connection string |
| `PORT` | `8000` | Agent service port |

### LLM Strategy

The service uses a dual-LLM strategy:
1. **Gemini** (cloud, fast) is tried first
2. If Gemini fails (rate limit, error), **Ollama** (local, no limits) is used automatically
3. Each call logs which backend was used

## Run

```bash
cd agents
uvicorn main:app --reload --port 8000
```

Seed a demo case for testing:
```bash
cd agents
python seed_demo.py
```

## API Endpoints

### Health Check
```bash
GET /agents/health
curl http://localhost:8000/agents/health
```

### 1. Citation Verification

Verifies legal citations in LLM-generated text. Checks against Pakistani law database, flags repealed sections, and uses LLM to verify claim accuracy.

```bash
POST /agents/verify-citations
Content-Type: application/json

curl -X POST http://localhost:8000/agents/verify-citations \
  -H "Content-Type: application/json" \
  -d '{"answer": "Section 302 PPC prescribes punishment for qatl-i-amd. Section 497 PPC deals with adultery."}'
```

**Response:**
```json
{
  "verified_answer": "...(with warnings injected for repealed sections)...",
  "confidence": 0.5,
  "citations_total": 2,
  "citations_verified": 1,
  "issues": [
    {"type": "REPEALED", "citation": "Section 497 PPC", "detail": "Repealed as of 2018-01-01"}
  ],
  "trace": [...],
  "disclaimer": "This is AI-generated legal information, not professional legal advice."
}
```

### 2. Case Research

Researches legal questions with optional case context from MongoDB.

```bash
POST /agents/case-research
Content-Type: application/json

curl -X POST http://localhost:8000/agents/case-research \
  -H "Content-Type: application/json" \
  -d '{"query": "What are bail provisions for theft?", "case_id": "<mongo_id>"}'
```

**Precedent Suggestions:**
```bash
GET /agents/case-research/<case_id>/suggestions

curl http://localhost:8000/agents/case-research/<case_id>/suggestions
```

### 3. Document Drafter

Generates Pakistani legal documents from templates.

```bash
POST /agents/draft-document
Content-Type: application/json

# Step 1: Classify template (returns missing fields)
curl -X POST http://localhost:8000/agents/draft-document \
  -H "Content-Type: application/json" \
  -d '{"request": "draft a rent agreement", "fields": {}}'

# Step 2: Provide all fields
curl -X POST http://localhost:8000/agents/draft-document \
  -H "Content-Type: application/json" \
  -d '{
    "request": "draft a rent agreement",
    "fields": {
      "landlord_name": "Ali Khan",
      "tenant_name": "Ahmed Raza",
      "property_address": "45-B Model Town, Lahore",
      "monthly_rent": 50000,
      "security_deposit": 100000,
      "lease_start": "2026-04-01",
      "lease_duration": 12
    }
  }'
```

**Available templates:** `nda`, `rent_agreement`, `affidavit`, `power_of_attorney`

## Express Proxy

The Express backend at `:5000` proxies all agent requests (with JWT auth):

```
POST /api/agents/verify-citations    →  POST /agents/verify-citations
POST /api/agents/case-research       →  POST /agents/case-research
POST /api/agents/draft-document      →  POST /agents/draft-document
GET  /api/agents/case-research/:id/suggestions  →  GET /agents/case-research/:id/suggestions
GET  /api/agents/health              →  GET /agents/health
```

## Tests

```bash
cd agents

# Unit tests (extractor, no LLM needed)
python -m pytest tests/test_extractor.py -v

# Full flow tests (requires Ollama or Gemini running)
python -m pytest tests/test_full_flow.py -v
```

## Pakistani Legal Citations Recognized

- **PPC:** Section 302, 324, 337, 354, 375, 376, 380, 392, 406, 420, 489-F, 497
- **Constitution:** Articles 4, 9, 10, 10A, 14, 17, 19, 25, 25A
- **CPC:** Sections 9, 10, 12(2)
- **CrPC:** Section 154, 249-A
- **Contract Act:** Sections 10, 14, 73
- **Transfer of Property Act:** Sections 54, 58, 106
- **Punjab Rented Premises Act 2009:** Sections 3, 5
- **Qanun-e-Shahadat Order 1984:** Article 17
- **Anti-Terrorism Act 1997:** Sections 6, 7
- **NAB Ordinance 1999:** Section 9
- **Family Courts Act 1964:** Section 5
- **Case law journals:** PLD, SCMR, CLC, MLD, PCrLJ, YLR, PLC, PLJ
