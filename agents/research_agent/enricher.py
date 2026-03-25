"""Query enrichment: combines the lawyer's question with case context via LLM."""

import logging
from typing import Any

from core.llm_client import call_llm_json

logger = logging.getLogger(__name__)

# City → jurisdiction mapping for Pakistani courts
CITY_TO_JURISDICTION: dict[str, str] = {
    "lahore": "Punjab",
    "faisalabad": "Punjab",
    "multan": "Punjab",
    "rawalpindi": "Punjab",
    "gujranwala": "Punjab",
    "sialkot": "Punjab",
    "bahawalpur": "Punjab",
    "karachi": "Sindh",
    "hyderabad": "Sindh",
    "sukkur": "Sindh",
    "peshawar": "KP",
    "mardan": "KP",
    "abbottabad": "KP",
    "swat": "KP",
    "quetta": "Balochistan",
    "islamabad": "ICT",
}


def _infer_jurisdiction(court: str) -> str:
    """Try to infer jurisdiction from the court name."""
    court_lower = court.lower()
    for city, jurisdiction in CITY_TO_JURISDICTION.items():
        if city in court_lower:
            return jurisdiction
    if "supreme" in court_lower or "federal" in court_lower:
        return "Federal"
    return "Federal"


async def enrich_query(query: str, case_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Use LLM to generate 2-3 enriched search queries from question + case context.

    Returns a list of dicts: [{query, search_type, jurisdiction}]
    """
    title = case_data.get("title", "N/A")
    category = case_data.get("category", "N/A")
    court = case_data.get("court", "N/A")
    status = case_data.get("status", "N/A")
    client_name = case_data.get("clientName", "N/A")
    tags = ", ".join(case_data.get("tags", [])) if case_data.get("tags") else "N/A"
    description = case_data.get("description", "N/A")

    jurisdiction = _infer_jurisdiction(court)

    prompt = (
        "You are a Pakistani legal research assistant. A lawyer is working on "
        "this case and asking a question.\n\n"
        f"CASE: Title: {title}, Category: {category}, Court: {court}, "
        f"Status: {status}, Client: {client_name}, Tags: {tags}, "
        f"Description: {description}\n\n"
        f"LAWYER'S QUESTION: {query}\n\n"
        "Generate 2-3 specific legal search queries that combine the question "
        "with case context. Consider jurisdiction, relevant laws, and case type.\n\n"
        'Return ONLY valid JSON array: ['
        '{"query": "specific search query", '
        '"search_type": "statutes" or "judgments" or "both", '
        f'"jurisdiction": "{jurisdiction}"'
        '}]'
    )

    try:
        result = call_llm_json(prompt)
        # Ensure we got a list
        if isinstance(result, list):
            return result
        # Sometimes the LLM wraps it in a key
        if isinstance(result, dict) and "queries" in result:
            return result["queries"]
        logger.warning("Unexpected enrichment result format: %s", type(result))
        return [{"query": query, "search_type": "both", "jurisdiction": jurisdiction}]
    except Exception as e:
        logger.error("Query enrichment failed: %s — using original query", e)
        return [{"query": query, "search_type": "both", "jurisdiction": jurisdiction}]
