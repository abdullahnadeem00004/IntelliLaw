"""Document Drafter Agent: generates Pakistani legal documents from templates."""

import logging
from typing import Any

from core.base_agent import AgentState, BaseAgent
from core.llm_client import call_llm, call_llm_json
from drafter_agent.templates import TEMPLATES
from tools.retriever import LegalSearcher

logger = logging.getLogger(__name__)

# City → jurisdiction for stamp duty / applicable law
_CITY_JURISDICTION: dict[str, str] = {
    "lahore": "punjab", "faisalabad": "punjab", "multan": "punjab",
    "rawalpindi": "punjab", "gujranwala": "punjab", "sialkot": "punjab",
    "karachi": "sindh", "hyderabad": "sindh", "sukkur": "sindh",
    "peshawar": "kp", "mardan": "kp", "abbottabad": "kp",
    "quetta": "balochistan",
    "islamabad": "ict",
}

# Template → retriever search queries for relevant law
_TEMPLATE_SEARCHES: dict[str, list[str]] = {
    "nda": ["contract agreement lawful consideration consent"],
    "rent_agreement": [
        "Punjab rented premises eviction landlord tenant",
        "lease duration termination Transfer Property Act",
    ],
    "affidavit": ["competence witnesses Qanun-e-Shahadat"],
    "power_of_attorney": ["contract agreement free consent"],
}


def _detect_jurisdiction(fields: dict[str, Any]) -> str:
    """Infer jurisdiction from address/city fields."""
    searchable = " ".join(str(v) for v in fields.values()).lower()
    for city, jur in _CITY_JURISDICTION.items():
        if city in searchable:
            return jur
    return "punjab"  # default


class DocumentDrafterAgent(BaseAgent):
    def __init__(self) -> None:
        self._searcher = LegalSearcher()

    async def run(self, input_data: dict[str, Any], state: AgentState) -> dict[str, Any]:
        request: str = input_data.get("request", "")
        fields: dict[str, Any] = input_data.get("fields", {})

        # Step 1: Classify which template matches the request
        state.log_step("classify", "Classifying document type from request")

        try:
            result = call_llm_json(
                "Which template best matches this document request? "
                "Options: nda, rent_agreement, affidavit, power_of_attorney, none.\n"
                f"Request: '{request}'\n"
                'Return JSON: {{"template": "id_or_null"}}'
            )
            template_id = result.get("template")
        except Exception as e:
            logger.warning("Template classification failed: %s — trying keyword match", e)
            template_id = self._keyword_classify(request)

        if not template_id or template_id == "none" or template_id not in TEMPLATES:
            state.log_step("unsupported", f"No matching template for: {request[:80]}")
            return {
                "status": "unsupported",
                "message": "No matching template found for this request.",
                "available_templates": [
                    {"id": tid, "name": t["name"]} for tid, t in TEMPLATES.items()
                ],
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        template = TEMPLATES[template_id]
        state.log_step(
            "template_matched",
            f"Matched template: {template['name']}",
            result=template_id,
        )

        # Step 2: Check for missing required fields
        required_ids = [f["id"] for f in template["required_fields"]]
        missing = [
            f for f in template["required_fields"]
            if f["id"] not in fields or not fields[f["id"]]
        ]

        if missing:
            state.log_step(
                "missing_fields",
                f"{len(missing)} required fields missing",
                result=str([f["id"] for f in missing]),
            )
            return {
                "status": "needs_input",
                "template": template_id,
                "template_name": template["name"],
                "missing_fields": missing,
                "provided_fields": {k: v for k, v in fields.items() if k in required_ids},
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        # Step 3: Detect jurisdiction
        jurisdiction = _detect_jurisdiction(fields)
        state.log_step("jurisdiction", f"Detected jurisdiction: {jurisdiction}")

        stamp_duty = template.get("stamp_duty", {}).get(jurisdiction, "N/A")
        jur_notes = template.get("jurisdiction_notes", {}).get(jurisdiction, "")

        # Step 4: Fetch relevant law sections
        state.log_step("search_law", "Searching for relevant legal provisions")
        search_queries = _TEMPLATE_SEARCHES.get(template_id, [])
        sections: list[dict[str, Any]] = []
        for sq in search_queries:
            sections.extend(self._searcher.search(sq, top_k=3))

        sections_text = ""
        for i, s in enumerate(sections[:5], 1):
            sections_text += (
                f"\n[{i}] {s['act_name']} Section {s['section_number']} "
                f"— {s['title']}: {s['text'][:150]}"
            )

        state.log_step("sections_found", f"Found {len(sections)} relevant sections")

        # Step 5: Generate document via LLM
        fields_str = "\n".join(f"- {k}: {v}" for k, v in fields.items())
        jur_label = jurisdiction.upper() if jurisdiction == "ict" else jurisdiction.title()

        prompt = (
            f"Generate a legally sound {template['name']} for {jur_label}, Pakistan.\n\n"
            f"FIELDS:\n{fields_str}\n\n"
            f"RELEVANT LAWS:{sections_text}\n\n"
        )
        if jur_notes:
            prompt += f"APPLICABLE LAW: {jur_notes}\n\n"
        prompt += (
            "REQUIREMENTS:\n"
            "- Use formal legal language appropriate for Pakistani courts\n"
            "- Include all standard clauses for this document type\n"
            "- Include signature spaces for all parties\n"
            "- Include spaces for two witnesses with name and CNIC\n"
            "- Include an attestation/verification clause\n"
            f"- Include a stamp duty note: PKR {stamp_duty} for {jur_label}\n"
            "- Reference applicable Pakistani law where relevant\n"
            "- Format with proper headings and numbered clauses\n"
        )

        state.log_step("generate", "Generating document text via LLM")

        try:
            document_text = call_llm(prompt, temperature=0.2)
            state.log_step("complete", f"Document generated ({len(document_text)} chars)")
        except Exception as e:
            logger.error("Document generation failed: %s", e)
            state.log_step("failed", f"LLM generation failed: {e}")
            return {
                "status": "error",
                "message": f"Document generation failed: {e}",
                "template": template_id,
                "trace": state.trace,
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        return {
            "status": "complete",
            "document_text": document_text,
            "template_used": template_id,
            "template_name": template["name"],
            "jurisdiction": jur_label,
            "stamp_duty": f"PKR {stamp_duty}",
            "applicable_law": jur_notes or None,
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }

    @staticmethod
    def _keyword_classify(request: str) -> str | None:
        """Fallback: classify template by keyword matching."""
        req = request.lower()
        if any(w in req for w in ["nda", "non-disclosure", "confidential", "secrecy"]):
            return "nda"
        if any(w in req for w in ["rent", "lease", "tenancy", "landlord", "tenant"]):
            return "rent_agreement"
        if any(w in req for w in ["affidavit", "sworn", "deponent", "oath"]):
            return "affidavit"
        if any(w in req for w in ["power of attorney", "poa", "attorney", "authorize", "authorise"]):
            return "power_of_attorney"
        return None
