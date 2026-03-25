# ============================================================
# INTELLILAW AGENT BUILD — CLAUDE CODE PROMPT SEQUENCE
# ============================================================
# 
# HOW TO USE:
# 1. Clone your repo, switch to your branch
# 2. Copy CLAUDE.md into the repo root
# 3. Open terminal, cd into the repo, run: claude
# 4. Paste PROMPT 1 below, wait for it to finish
# 5. Paste PROMPT 2, and so on
# 6. Each prompt builds on the previous one
#
# Total: 6 prompts, ~36 hours of work
# ============================================================


# ============================================================
# PROMPT 1 — SCAFFOLD + FOUNDATION (Hours 1-4)
# ============================================================

Create the complete agent microservice scaffold in an /agents/ directory at the project root. This is a Python FastAPI service that will run on port 8000 alongside our existing Express backend on port 5000.

Create these files:

1. `/agents/requirements.txt` with: fastapi, uvicorn, openai, pymongo, python-dotenv, faiss-cpu, sentence-transformers, rank-bm25, pydantic, httpx, pytest

2. `/agents/.env.example` with: OPENAI_API_KEY, MONGODB_URI=mongodb://localhost:27017/intellilaw, PORT=8000

3. `/agents/core/config.py` — Pydantic Settings class that reads from .env

4. `/agents/core/llm_client.py` — async wrapper around OpenAI chat completions. Two functions:
   - `call_llm(prompt, model="gpt-4o-mini", json_mode=False, temperature=0.1)` → returns string
   - `call_llm_json(prompt, model="gpt-4o-mini")` → returns parsed dict
   Both should have retry logic (3 attempts with exponential backoff) and timeout handling.

5. `/agents/core/base_agent.py` — Two classes:
   - `AgentState`: tracks session_id, user_role, trace (list of dicts with step/thought/action/result/timestamp), iteration_count, max_iterations=5. Has a `log_step(step, thought, action=None, result=None)` method.
   - `BaseAgent(ABC)`: abstract base with `__init__(self, llm_client, db)`, abstract async `run(input_data, state)`, and a `call_tool(tool_name, params, state)` method that logs to trace.

6. `/agents/tools/mongo_client.py` — pymongo connection to MongoDB. Functions:
   - `get_case_by_id(case_id: str) -> dict` — reads from 'cases' collection
   - `get_cases_by_lawyer(lawyer_uid: str) -> list` — reads from 'cases' collection
   - Connection should be lazy-initialized singleton.

7. `/agents/main.py` — FastAPI app with CORS enabled for localhost:3000 and localhost:5000. Health check at GET /agents/health. Mount the three agent routers (we'll create them next). Include startup event that tests MongoDB connection.

8. `/agents/tools/retriever.py` — Stub hybrid search class:
   - `HybridRetriever` with `__init__` that loads FAISS index + BM25 index from /agents/data/
   - `async search(query, index_name="statutes", top_k=5) -> list[dict]` — returns list of {text, source, section, score}
   - For now, implement it as a simple keyword search against a JSON file at /agents/data/pak_legal_sections.json (we'll upgrade to real FAISS later if time permits)

9. `/agents/data/pak_legal_sections.json` — Seed with 30-40 important Pakistani legal sections:
   - PPC sections: 302 (murder), 324 (attempted murder), 354 (assault on woman), 375/376 (rape), 380 (theft), 392 (robbery), 406 (criminal breach of trust), 420 (cheating), 489-F (dishonoured cheque), 497 (adultery - MARK AS REPEALED by SC 2018)
   - Constitution articles: 4 (right of individuals), 9 (security of person), 10 (safeguards to arrest), 10A (right to fair trial), 14 (inviolability of dignity), 17 (freedom of association), 19 (freedom of speech), 25 (equality of citizens), 25A (right to education)
   - CPC sections: 9 (courts to try suits), 10 (stay of suit), 12 (limitation)
   - Transfer of Property Act: 54 (sale), 58 (mortgage), 106 (duration of leases)
   - Contract Act: 10 (valid contract), 14 (free consent), 73 (compensation)
   Each entry should have: act_name, section_number, title, text (2-3 sentences of actual content), status ("active" or "repealed"), repealed_date (if applicable), replaced_by (if applicable)

Make all files have proper __init__.py files. Add type hints everywhere. Run the service and verify health check works.


# ============================================================
# PROMPT 2 — CITATION VERIFICATION AGENT (Hours 5-10)
# ============================================================

Now build the Citation Verification Agent. This is the highest priority module.

1. `/agents/citation_agent/extractor.py`:
   Create a `extract_citations(text: str) -> list[dict]` function that uses regex to find Pakistani legal citations. Patterns to match:
   - "Section X PPC" or "Section X of the Pakistan Penal Code" (and variations)
   - "Section X CPC/CrPC/Contract Act/Evidence Act/Transfer of Property Act" etc.
   - "Article X of the Constitution" or "Article X Constitution"
   - Case law: "PLD 2019 SC 123", "2020 SCMR 456", "CLC", "MLD", "PCrLJ", "YLR"
   - "Punjab Rented Premises Act", "Anti-Terrorism Act", "NAB Ordinance" sections
   
   Each extracted citation should return: {raw_text, type ("statute"/"case_law"/"constitutional"), section_number, act_name (normalized), start_pos, end_pos, surrounding_claim (100 chars before and after)}
   
   Include a `normalize_act_name(raw)` function that maps abbreviations: PPC → "Pakistan Penal Code, 1860", CPC → "Code of Civil Procedure, 1908", CrPC → "Code of Criminal Procedure, 1898", etc.
   
   Write 5+ test cases in `/agents/tests/test_extractor.py` covering each pattern type.

2. `/agents/citation_agent/verifier.py`:
   Create `CitationVerifier` class inheriting from BaseAgent. The `run()` method:
   - Takes {"answer": "string of LLM response text"}
   - Extracts citations using the extractor
   - For each citation:
     a. Search pak_legal_sections.json for the cited section
     b. If found and status=="repealed", mark as REPEALED with date
     c. If found, use LLM to compare the claim (surrounding_claim) against actual section text. Prompt should ask: "Does this claim accurately represent what the source says? Return JSON with status VERIFIED/INACCURATE and detail."
     d. If not found in our data, mark as UNVERIFIABLE
   - Calculate confidence = verified_count / total_citations
   - If any citation is REPEALED or INACCURATE, insert [WARNING: ...] or [CORRECTION: ...] inline in the answer text
   - If confidence < 0.7, prepend a low-confidence warning
   - Return: {verified_answer, confidence, citations_total, citations_verified, issues[], trace[]}

3. `/agents/citation_agent/router.py`:
   FastAPI router with POST /agents/verify-citations endpoint.
   Request body: {answer: str, session_id: str (optional)}
   Response: the full verification result dict.


# ============================================================
# PROMPT 3 — CASE-AWARE RESEARCH AGENT (Hours 11-18)
# ============================================================

Build the Case-Aware Research Agent. This bridges the case management data with legal research.

1. `/agents/research_agent/enricher.py`:
   Create `enrich_query(query: str, case_data: dict) -> list[dict]` function.
   It uses LLM to generate 2-3 enriched search queries that combine the user's question with case context.
   
   The case_data comes from MongoDB and has: title, caseNumber, category, priority, status, court, judge, clientName, nextHearingDate, tags, description.
   
   The LLM prompt should instruct: "You are a Pakistani legal research planner. Given this case context and the lawyer's question, generate 2-3 specific search queries. Consider the case type, court jurisdiction, and relevant areas of law. Return JSON array of {query, search_type: statutes|judgments|both, jurisdiction}."
   
   Include a CITY_TO_JURISDICTION mapping: Lahore/Faisalabad/Multan → Punjab, Karachi/Hyderabad → Sindh, Peshawar → KP, Quetta → Balochistan, Islamabad/Rawalpindi → ICT/Federal.

2. `/agents/research_agent/agent.py`:
   Create `CaseResearchAgent` inheriting from BaseAgent. The `run()` method:
   - Takes {query: str, case_id: str}
   - Pulls case from MongoDB using mongo_client.get_case_by_id()
   - If case not found, fall back to standard search without context
   - Enriches query using enricher
   - Runs enriched queries through the retriever
   - Generates context-aware answer using LLM with the case context + retrieved passages
   - Returns: {answer, case_context_used: {title, category, court}, sources[], trace[]}
   
   Also create `suggest_precedents(case_data: dict) -> list[dict]`:
   - Based on case category (Criminal/Civil/Family/Property/Commercial), search for relevant precedents
   - Return top 5 relevant results with {case_ref, summary, relevance_score}

3. `/agents/research_agent/router.py`:
   FastAPI router with:
   - POST /agents/case-research — main research endpoint
   - GET /agents/case-research/{case_id}/suggestions — proactive precedent suggestions


# ============================================================
# PROMPT 4 — DOCUMENT DRAFTER AGENT (Hours 19-24)
# ============================================================

Build a minimal Document Drafter Agent. Keep it simple — this is priority 3.

1. `/agents/drafter_agent/templates.py`:
   Define 4 templates as a Python dict:
   
   - "nda": Non-Disclosure Agreement — required fields: party_1_name, party_1_cnic, party_2_name, party_2_cnic, effective_date, duration_months, confidential_info_description. Optional: non_compete clause, non_solicitation clause.
   
   - "rent_agreement": Rental Agreement — required: landlord_name, tenant_name, property_address, monthly_rent, security_deposit, lease_start, lease_duration. Jurisdiction-specific: Punjab Rented Premises Act 2009, Sindh Rented Premises Ordinance 1979, ICT Rent Restriction Ordinance 2001.
   
   - "affidavit": General Affidavit — required: deponent_name, father_name, cnic, address, statement_content.
   
   - "power_of_attorney": General PoA — required: principal_name, attorney_name, powers_granted (list).
   
   Each template has: name, required_fields (list of {id, label, type}), optional_clauses, stamp_duty by province, jurisdiction_notes.

2. `/agents/drafter_agent/agent.py`:
   Create `DocumentDrafterAgent` inheriting from BaseAgent. The `run()` method:
   - Takes {request: str, fields: dict (optional)}
   - Step 1: Use LLM to classify which template matches the request
   - Step 2: Check which required fields are missing
   - Step 3: If missing fields, return {status: "needs_input", missing_fields: [...]}
   - Step 4: Detect jurisdiction from address/city fields using CITY_TO_JURISDICTION mapping
   - Step 5: Fetch relevant law sections from our legal data for that template type
   - Step 6: Generate complete document using LLM with template structure + fields + legal context
   - Return: {status: "complete", document_text, template_used, jurisdiction, stamp_duty, disclaimer, trace[]}

3. `/agents/drafter_agent/router.py`:
   POST /agents/draft-document endpoint.
   Request: {request: str, fields: dict}
   Response: either needs_input or complete result.


# ============================================================
# PROMPT 5 — EXPRESS PROXY + INTEGRATION (Hours 25-30)
# ============================================================

Now wire the Python agent service into the existing Express backend so the React frontend can access it through the same API.

1. Create `/backend/src/routes/agents.ts`:
   Express router that proxies requests to the FastAPI service at localhost:8000.
   
   Three routes:
   - POST /api/agents/verify-citations → forwards to http://localhost:8000/agents/verify-citations
   - POST /api/agents/case-research → forwards to http://localhost:8000/agents/case-research
   - POST /api/agents/draft-document → forwards to http://localhost:8000/agents/draft-document
   - GET /api/agents/case-research/:caseId/suggestions → forwards to http://localhost:8000/agents/case-research/:caseId/suggestions
   
   All routes should use the existing JWT auth middleware first, then proxy with axios/node-fetch.
   Add error handling: if agent service is down, return 503 with message "Agent service unavailable".
   
   Register this router in the main Express app (backend/src/server.ts or wherever routes are mounted).

2. Also create a convenience integration in the existing chat flow:
   In whatever file handles the chatbot/legal-assistant endpoint, add an OPTIONAL post-processing step that calls the citation verification agent on the response before returning it. If the agent service is down, just return the unverified response (graceful degradation).


# ============================================================
# PROMPT 6 — SMOKE TEST + DEMO SEED DATA (Hours 31-36)
# ============================================================

Final stretch. Test everything and seed demo data.

1. Create `/agents/tests/test_full_flow.py`:
   - Test 1: Send a legal response text with correct citations (Section 302 PPC about murder). Verify the agent returns confidence > 0.8.
   - Test 2: Send text citing Section 497 PPC (adultery - repealed). Verify agent flags it as REPEALED.
   - Test 3: Send text that misattributes Article 25 (equality) as "right to free speech" (that's Article 19). Verify agent catches the INACCURACY.
   - Test 4: Case research with a seeded case. Verify query enrichment includes case context.
   - Test 5: Document drafter with "I need a rent agreement for DHA Lahore". Verify it detects Punjab jurisdiction.

2. Create `/agents/seed_demo.py`:
   Script that inserts a demo case into MongoDB for the defense presentation:
   ```
   {
     title: "State vs. Ahmed — Theft under Section 380 PPC",
     caseNumber: "DEMO-2025-001", 
     category: "Criminal",
     priority: "HIGH",
     status: "ACTIVE",
     court: "Lahore Sessions Court",
     judge: "Justice Khalid Mahmood",
     clientName: "Muhammad Ahmed",
     assignedLawyerUid: "demo_lawyer",
     assignedLawyerName: "Demo Lawyer",
     nextHearingDate: "2025-12-15",
     tags: ["theft", "PPC-380", "sessions-court"],
     description: "Client accused of theft under Section 380 PPC. Incident at DHA Phase 5, Lahore."
   }
   ```

3. Create `/agents/README.md` explaining:
   - How to install and run the agent service
   - How the 3 agents work
   - Example curl commands for each endpoint
   - How it integrates with the Express backend

4. Verify everything runs:
   - Start MongoDB
   - Start Express backend: cd backend && npm run dev
   - Start agent service: cd agents && uvicorn main:app --reload --port 8000
   - Run: python seed_demo.py
   - Test each endpoint with curl
   - Confirm the Express proxy routes work from frontend port
