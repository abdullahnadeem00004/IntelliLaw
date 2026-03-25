"""Case-Aware Research Agent: bridges case management data with legal research."""

import logging
from typing import Any

from core.base_agent import AgentState, BaseAgent
from core.llm_client import call_llm
from research_agent.enricher import enrich_query
from tools.mongo_client import get_case_by_id
from tools.retriever import LegalSearcher

logger = logging.getLogger(__name__)

# Category → relevant legal areas for precedent suggestions
_CATEGORY_SEARCH_MAP: dict[str, list[str]] = {
    "criminal": [
        "murder qatl Pakistan Penal Code",
        "theft robbery PPC punishment",
        "criminal breach trust cheating PPC",
        "bail arrest criminal procedure",
        "FIR cognizable offence procedure",
    ],
    "civil": [
        "civil suit jurisdiction Code Civil Procedure",
        "contract breach compensation damages",
        "stay suit pending Code Civil Procedure",
        "review judgment fraud CPC",
        "limitation period civil suit",
    ],
    "family": [
        "dissolution marriage Family Courts Act",
        "maintenance custody children family",
        "dower conjugal rights family court",
        "guardianship minors family law",
    ],
    "property": [
        "sale transfer property immoveable",
        "mortgage Transfer Property Act",
        "lease duration termination property",
        "Punjab rented premises eviction",
        "rent tenant landlord eviction grounds",
    ],
    "constitutional": [
        "fundamental rights Constitution Pakistan",
        "right fair trial Article 10A Constitution",
        "equality citizens Article 25 Constitution",
        "freedom speech expression Article 19",
        "security person liberty Article 9",
    ],
    "corporate": [
        "Companies Act corporate governance",
        "cheating dishonestly inducing delivery property",
        "contract agreement lawful consideration",
        "criminal breach trust company",
    ],
    "tax": [
        "contract agreement lawful consideration",
        "civil suit jurisdiction courts",
    ],
}


def _case_summary(case_data: dict[str, Any]) -> str:
    """Build a compact case summary string for LLM prompts."""
    parts = []
    if case_data.get("title"):
        parts.append(f"Title: {case_data['title']}")
    if case_data.get("caseNumber"):
        parts.append(f"Case #: {case_data['caseNumber']}")
    if case_data.get("category"):
        parts.append(f"Category: {case_data['category']}")
    if case_data.get("court"):
        parts.append(f"Court: {case_data['court']}")
    if case_data.get("judge"):
        parts.append(f"Judge: {case_data['judge']}")
    if case_data.get("clientName"):
        parts.append(f"Client: {case_data['clientName']}")
    if case_data.get("status"):
        parts.append(f"Status: {case_data['status']}")
    if case_data.get("description"):
        parts.append(f"Description: {case_data['description']}")
    if case_data.get("tags"):
        parts.append(f"Tags: {', '.join(case_data['tags'])}")
    return "; ".join(parts)


def _dedup_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate search results by (act_name, section_number)."""
    seen: set[tuple[str, str]] = set()
    unique: list[dict[str, Any]] = []
    for r in results:
        key = (r.get("act_name", ""), r.get("section_number", ""))
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


class CaseResearchAgent(BaseAgent):
    def __init__(self) -> None:
        self._searcher = LegalSearcher()

    async def run(self, input_data: dict[str, Any], state: AgentState) -> dict[str, Any]:
        query: str = input_data.get("query", "")
        case_id: str = input_data.get("case_id", "")

        if not query:
            return {
                "answer": "",
                "sources": [],
                "enriched_queries": [],
                "case_context_used": None,
                "trace": state.trace,
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        # Step 1: Load case from MongoDB
        case_data: dict[str, Any] | None = None
        if case_id:
            state.log_step("load_case", f"Fetching case {case_id} from MongoDB")
            case_data = get_case_by_id(case_id)
            if case_data:
                state.log_step(
                    "case_loaded",
                    f"Case found: {case_data.get('title', 'N/A')}",
                    result=f"Category: {case_data.get('category')}, Court: {case_data.get('court')}",
                )
            else:
                state.log_step(
                    "case_not_found",
                    f"Case {case_id} not found — proceeding without context",
                )

        # Step 2: Enrich query
        if case_data:
            state.log_step("enrich", "Enriching query with case context via LLM")
            enriched_queries = await enrich_query(query, case_data)
            state.log_step(
                "enriched",
                f"Generated {len(enriched_queries)} enriched queries",
                result=str([q.get("query", "") for q in enriched_queries]),
            )
        else:
            enriched_queries = [{"query": query, "search_type": "both", "jurisdiction": "Federal"}]
            state.log_step("no_enrichment", "No case context — using original query")

        # Step 3: Search with each enriched query
        all_results: list[dict[str, Any]] = []
        for i, eq in enumerate(enriched_queries):
            sub_query = eq.get("query", query)
            state.log_step(
                f"search_{i+1}",
                f"Searching: {sub_query[:80]}",
                action="retriever.search",
            )
            hits = self._searcher.search(sub_query, top_k=5)
            all_results.extend(hits)
            state.log_step(
                f"search_{i+1}_done",
                f"Found {len(hits)} results",
            )

        # Step 4: Deduplicate
        unique_results = _dedup_results(all_results)
        state.log_step(
            "dedup",
            f"Deduplicated: {len(all_results)} → {len(unique_results)} unique sections",
        )

        # Step 5: Build context and generate answer via LLM
        sources_text = ""
        for j, src in enumerate(unique_results[:10], 1):
            sources_text += (
                f"\n[{j}] {src['act_name']} Section {src['section_number']} "
                f"— {src['title']}\n{src['text']}\n"
            )

        case_ctx = _case_summary(case_data) if case_data else "No specific case context."

        prompt = (
            "You are a Pakistani legal research assistant. Answer the lawyer's "
            "question using ONLY the legal sources provided below. Cite every "
            "claim with the specific section/article reference.\n\n"
            f"CASE CONTEXT: {case_ctx}\n\n"
            f"LEGAL SOURCES:{sources_text}\n\n"
            f"LAWYER'S QUESTION: {query}\n\n"
            "Provide a clear, structured answer. Cite every legal claim. "
            "End with: 'Disclaimer: This is AI-generated legal information, "
            "not professional legal advice. Consult a qualified lawyer.'"
        )

        state.log_step("generate", "Generating research answer via LLM")

        try:
            answer = call_llm(prompt, temperature=0.1)
            state.log_step("answer_ready", "LLM answer generated successfully")
        except Exception as e:
            logger.error("LLM answer generation failed: %s", e)
            state.log_step("answer_failed", f"LLM generation failed: {e}")
            answer = (
                "Unable to generate a research answer at this time. "
                "The relevant legal sources have been retrieved and are listed below.\n\n"
                "Disclaimer: This is AI-generated legal information, not professional legal advice."
            )

        # Build case_context_used summary
        case_context_used = None
        if case_data:
            case_context_used = {
                "title": case_data.get("title"),
                "category": case_data.get("category"),
                "court": case_data.get("court"),
            }

        # Slim down sources for the response
        sources_out = [
            {
                "act_name": s["act_name"],
                "section_number": s["section_number"],
                "title": s["title"],
                "text": s["text"][:200],
                "status": s.get("status", "active"),
            }
            for s in unique_results[:10]
        ]

        return {
            "answer": answer,
            "case_context_used": case_context_used,
            "sources": sources_out,
            "enriched_queries": enriched_queries,
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }

    async def suggest_precedents(self, case_id: str, state: AgentState) -> list[dict[str, Any]]:
        """Suggest relevant legal precedents based on case category."""
        state.log_step("load_case", f"Fetching case {case_id} for precedent suggestions")
        case_data = get_case_by_id(case_id)

        if not case_data:
            state.log_step("case_not_found", f"Case {case_id} not found")
            return []

        category = (case_data.get("category") or "").lower()
        state.log_step(
            "category",
            f"Case category: {category}",
            result=f"Title: {case_data.get('title')}",
        )

        # Get search queries for this category
        search_queries = _CATEGORY_SEARCH_MAP.get(category, _CATEGORY_SEARCH_MAP["civil"])

        all_results: list[dict[str, Any]] = []
        for sq in search_queries:
            hits = self._searcher.search(sq, top_k=3)
            all_results.extend(hits)

        unique = _dedup_results(all_results)[:5]

        state.log_step(
            "suggestions_ready",
            f"Found {len(unique)} relevant precedents for {category} case",
        )

        # Build relevance explanations
        suggestions: list[dict[str, Any]] = []
        case_summary = _case_summary(case_data)

        for section in unique:
            try:
                prompt = (
                    "In ONE sentence, explain why this law is relevant to the case.\n"
                    f"CASE: {case_summary}\n"
                    f"LAW: {section['act_name']} Section {section['section_number']} "
                    f"— {section['title']}: {section['text'][:150]}"
                )
                relevance = call_llm(prompt, temperature=0.2)
            except Exception:
                relevance = f"Potentially relevant {category} law provision."

            suggestions.append({
                "section": section["section_number"],
                "act_name": section["act_name"],
                "title": section["title"],
                "text_snippet": section["text"][:200],
                "relevance": relevance.strip(),
            })

        return suggestions
