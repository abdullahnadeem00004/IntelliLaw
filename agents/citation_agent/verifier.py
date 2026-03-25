"""Citation Verification Agent — verifies legal citations in LLM output."""

import logging
import uuid
from typing import Any

from core.base_agent import AgentState, BaseAgent
from core.llm_client import call_llm_json
from citation_agent.extractor import extract_citations
from tools.retriever import LegalSearcher

logger = logging.getLogger(__name__)

# Map normalized act names back to what the retriever expects (act_name in JSON data)
_RETRIEVER_ACT_MAP: dict[str, str] = {
    "Pakistan Penal Code, 1860": "Pakistan Penal Code",
    "Code of Civil Procedure, 1908": "Code of Civil Procedure",
    "Code of Criminal Procedure, 1898": "Code of Criminal Procedure",
    "Contract Act, 1872": "Contract Act",
    "Qanun-e-Shahadat Order, 1984": "Qanun-e-Shahadat Order 1984",
    "Transfer of Property Act, 1882": "Transfer of Property Act",
    "Constitution of Pakistan, 1973": "Constitution of Pakistan",
    "Punjab Rented Premises Act, 2009": "Punjab Rented Premises Act 2009",
    "Anti-Terrorism Act, 1997": "Anti-Terrorism Act 1997",
    "National Accountability Ordinance, 1999": "National Accountability Ordinance 1999",
    "Family Courts Act, 1964": "Family Courts Act 1964",
}


def _retriever_act_name(normalized: str) -> str:
    """Convert normalized act name to the key used in pak_legal_sections.json."""
    return _RETRIEVER_ACT_MAP.get(normalized, normalized)


class CitationVerifier(BaseAgent):
    def __init__(self) -> None:
        self._searcher = LegalSearcher()

    async def run(self, input_data: dict[str, Any], state: AgentState) -> dict[str, Any]:
        answer: str = input_data.get("answer", "")
        if not answer:
            return {
                "verified_answer": "",
                "confidence": 0.0,
                "citations_total": 0,
                "citations_verified": 0,
                "issues": [{"type": "EMPTY_INPUT", "detail": "No answer text provided"}],
                "trace": state.trace,
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        # Step 1: Extract citations
        state.log_step("extract", "Extracting legal citations from answer text")
        citations = extract_citations(answer)

        if not citations:
            state.log_step("no_citations", "No legal citations found in the text")
            return {
                "verified_answer": answer,
                "confidence": 0.0,
                "citations_total": 0,
                "citations_verified": 0,
                "issues": [{"type": "NO_CITATIONS", "detail": "No legal citations found in the text"}],
                "trace": state.trace,
                "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            }

        state.log_step(
            "citations_found",
            f"Found {len(citations)} citation(s)",
            result=f"Types: {[c['type'] for c in citations]}",
        )

        # Step 2: Verify each citation
        verified_answer = answer
        issues: list[dict[str, Any]] = []
        verified_count = 0
        # Track offset shifts from insertions
        offset = 0

        for i, citation in enumerate(citations):
            cit_label = f"[{i+1}/{len(citations)}] {citation['raw_text']}"

            if citation["type"] == "case_law":
                # Case law — we can't verify against our section database
                state.log_step(
                    f"verify_{i+1}",
                    f"Case law citation: {citation['raw_text']}",
                    action="mark_unverifiable",
                    result="Case law citations require external database",
                )
                issues.append({
                    "type": "UNVERIFIABLE",
                    "citation": citation["raw_text"],
                    "detail": "Case law verification requires access to court judgment databases",
                })
                continue

            # Statute or constitutional citation
            act_key = _retriever_act_name(citation["act_name"])
            sec_num = citation["section_number"]

            # For constitutional articles, prepend "Article "
            if citation["type"] == "constitutional":
                lookup_sec = f"Article {sec_num}"
            else:
                lookup_sec = sec_num

            state.log_step(
                f"lookup_{i+1}",
                f"Looking up {cit_label}",
                action=f"retriever.get_section({act_key!r}, {lookup_sec!r})",
            )

            section = self._searcher.get_section(act_key, lookup_sec)

            if section is None:
                state.log_step(
                    f"verify_{i+1}",
                    f"Section not found in legal database",
                    result="UNVERIFIABLE",
                )
                issues.append({
                    "type": "UNVERIFIABLE",
                    "citation": citation["raw_text"],
                    "detail": f"Section {lookup_sec} of {act_key} not found in database",
                })
                continue

            # Check if repealed
            if section.get("status") == "repealed":
                repealed_date = section.get("repealed_date", "unknown date")
                replaced_by = section.get("replaced_by", "N/A")
                warning = (
                    f" [⚠️ WARNING: Section {lookup_sec} {act_key} has been "
                    f"repealed/struck down as of {repealed_date}. {replaced_by}]"
                )
                insert_pos = citation["end_pos"] + offset
                verified_answer = verified_answer[:insert_pos] + warning + verified_answer[insert_pos:]
                offset += len(warning)

                state.log_step(
                    f"verify_{i+1}",
                    f"Section is REPEALED as of {repealed_date}",
                    action="insert_warning",
                    result=f"Replaced by: {replaced_by}",
                )
                issues.append({
                    "type": "REPEALED",
                    "citation": citation["raw_text"],
                    "detail": f"Repealed as of {repealed_date}. {replaced_by}",
                })
                continue

            # Active section — verify claim against actual text using Gemini
            claim_context = citation["surrounding_claim"]
            section_text = section.get("text", "")

            state.log_step(
                f"verify_{i+1}",
                f"Verifying claim against actual section text via LLM",
                action="call_llm_json",
            )

            try:
                prompt = (
                    "You are a Pakistani legal expert. Does the following legal claim "
                    "accurately represent what the cited law actually says?\n\n"
                    f"CLAIM CONTEXT: \"{claim_context}\"\n\n"
                    f"ACTUAL LAW ({section['act_name']} Section {section['section_number']} — "
                    f"{section['title']}): \"{section_text}\"\n\n"
                    "Return JSON with:\n"
                    "- \"status\": \"VERIFIED\" if the claim is substantially accurate, "
                    "or \"INACCURATE\" if it misrepresents the law\n"
                    "- \"detail\": brief explanation (1-2 sentences) if inaccurate, "
                    "or \"Claim is consistent with the cited provision\" if verified"
                )
                result = call_llm_json(prompt)
                status = result.get("status", "UNVERIFIABLE")
                detail = result.get("detail", "")

                if status == "VERIFIED":
                    verified_count += 1
                    state.log_step(
                        f"verify_{i+1}",
                        f"Citation VERIFIED",
                        result=detail,
                    )
                else:
                    state.log_step(
                        f"verify_{i+1}",
                        f"Citation INACCURATE",
                        result=detail,
                    )
                    issues.append({
                        "type": "INACCURATE",
                        "citation": citation["raw_text"],
                        "detail": detail,
                    })

            except Exception as e:
                logger.warning("LLM verification failed for %s: %s", cit_label, e)
                state.log_step(
                    f"verify_{i+1}",
                    f"LLM verification failed: {e}",
                    result="UNVERIFIABLE",
                )
                issues.append({
                    "type": "UNVERIFIABLE",
                    "citation": citation["raw_text"],
                    "detail": f"LLM verification failed: {e}",
                })

        # Step 3: Calculate confidence
        total = len(citations)
        confidence = verified_count / total if total > 0 else 0.0

        state.log_step(
            "summary",
            f"Verification complete: {verified_count}/{total} verified, confidence={confidence:.2f}",
        )

        # Prepend low-confidence warning
        if confidence < 0.7:
            low_conf_warning = (
                "⚠️ LOW CONFIDENCE: Some citations could not be verified. "
                "Consult a qualified lawyer.\n\n"
            )
            verified_answer = low_conf_warning + verified_answer

        return {
            "verified_answer": verified_answer,
            "confidence": round(confidence, 2),
            "citations_total": total,
            "citations_verified": verified_count,
            "issues": issues,
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }
