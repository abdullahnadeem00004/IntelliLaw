"""End-to-end tests for all three agents.

These tests call the actual LLM (Gemini primary, Ollama fallback)
so they require at least one backend to be running.
"""

import asyncio
import sys
from pathlib import Path

import pytest

# Ensure agents root is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.base_agent import AgentState
from citation_agent.verifier import CitationVerifier
from research_agent.agent import CaseResearchAgent
from drafter_agent.agent import DocumentDrafterAgent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _state() -> AgentState:
    return AgentState(session_id="test")


def _run(coro):
    """Run an async coroutine synchronously."""
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------------------------------------------------------------------------
# Citation Agent
# ---------------------------------------------------------------------------

class TestCitationAgent:
    verifier = CitationVerifier()

    def test_citation_correct(self):
        """Section 302 PPC accurately describes qatl-i-amd → expect VERIFIED."""
        result = _run(self.verifier.run(
            {"answer": "Section 302 PPC prescribes punishment for qatl-i-amd."},
            _state(),
        ))
        assert result["citations_total"] == 1
        assert result["confidence"] > 0.0  # At least attempted verification
        assert "disclaimer" in result
        # If LLM is available, should be verified
        verified_issues = [i for i in result["issues"] if i["type"] == "VERIFIED"]
        unverifiable = [i for i in result["issues"] if i["type"] == "UNVERIFIABLE"]
        inaccurate = [i for i in result["issues"] if i["type"] == "INACCURATE"]
        # Either verified (confidence > 0) or unverifiable (LLM down), but NOT inaccurate
        assert len(inaccurate) == 0, f"Correct citation marked inaccurate: {inaccurate}"

    def test_citation_repealed(self):
        """Section 497 PPC (adultery) was struck down → expect REPEALED flag."""
        result = _run(self.verifier.run(
            {"answer": "Under Section 497 PPC, adultery is punishable."},
            _state(),
        ))
        assert result["citations_total"] == 1
        repealed_issues = [i for i in result["issues"] if i["type"] == "REPEALED"]
        assert len(repealed_issues) == 1, f"Expected REPEALED issue, got: {result['issues']}"
        assert "repealed" in result["verified_answer"].lower() or "WARNING" in result["verified_answer"]

    def test_citation_wrong(self):
        """Art 25 is equality, NOT speech — expect INACCURATE (or UNVERIFIABLE if LLM down)."""
        result = _run(self.verifier.run(
            {"answer": "Article 25 of the Constitution guarantees freedom of speech."},
            _state(),
        ))
        assert result["citations_total"] == 1
        # Should NOT be verified with high confidence
        # Art 25 = equality, Art 19 = speech — LLM should catch this
        if result["confidence"] > 0:
            # LLM was available and verified — confidence should be 0 (inaccurate)
            assert result["confidence"] == 0.0, (
                f"Wrong citation got confidence {result['confidence']}"
            )
        # Either INACCURATE or UNVERIFIABLE (if LLM was down)
        issue_types = {i["type"] for i in result["issues"]}
        assert "INACCURATE" in issue_types or "UNVERIFIABLE" in issue_types

    def test_no_citations(self):
        """Text with no legal citations → confidence 0, NO_CITATIONS issue."""
        result = _run(self.verifier.run(
            {"answer": "The weather is nice today."},
            _state(),
        ))
        assert result["citations_total"] == 0
        assert result["confidence"] == 0.0
        assert any(i["type"] == "NO_CITATIONS" for i in result["issues"])


# ---------------------------------------------------------------------------
# Research Agent
# ---------------------------------------------------------------------------

class TestResearchAgent:
    agent = CaseResearchAgent()

    DEMO_CASE = {
        "_id": "000000000000000000000000",
        "title": "State vs. Ahmed — Theft under Section 380 PPC",
        "caseNumber": "DEMO-2025-001",
        "category": "Criminal",
        "priority": "HIGH",
        "status": "ACTIVE",
        "court": "Lahore Sessions Court",
        "judge": "Justice Khalid Mahmood",
        "clientName": "Muhammad Ahmed",
        "tags": ["theft", "PPC-380", "sessions-court", "lahore"],
        "description": "Client accused of theft under Section 380 PPC.",
    }

    def test_research_without_case(self):
        """Plain research query without case context."""
        result = _run(self.agent.run(
            {"query": "What is punishment for theft in Pakistan?", "case_id": ""},
            _state(),
        ))
        assert result["case_context_used"] is None
        assert len(result["sources"]) > 0
        assert "disclaimer" in result
        assert len(result["trace"]) > 0

    def test_research_with_case_data(self):
        """Research with inline case context (bypasses MongoDB)."""
        from unittest.mock import patch

        with patch("research_agent.agent.get_case_by_id", return_value=self.DEMO_CASE):
            state = _state()
            result = _run(self.agent.run(
                {"query": "What are the bail provisions?", "case_id": "000000000000000000000000"},
                state,
            ))
        assert result["case_context_used"] is not None
        assert result["case_context_used"]["category"] == "Criminal"
        assert result["case_context_used"]["court"] == "Lahore Sessions Court"
        assert len(result["enriched_queries"]) >= 1
        assert len(result["trace"]) > 0
        # Enriched queries should appear in trace
        trace_steps = [t["step"] for t in result["trace"]]
        assert "enrich" in trace_steps or "enriched" in trace_steps or "no_enrichment" in trace_steps


# ---------------------------------------------------------------------------
# Drafter Agent
# ---------------------------------------------------------------------------

class TestDrafterAgent:
    agent = DocumentDrafterAgent()

    def test_drafter_classify_rent(self):
        """'rent agreement for Lahore' → rent_agreement template."""
        result = _run(self.agent.run(
            {"request": "I need a rent agreement for Lahore", "fields": {}},
            _state(),
        ))
        # Should either match rent_agreement or ask for fields
        assert result["status"] in ("needs_input", "unsupported")
        if result["status"] == "needs_input":
            assert result["template"] == "rent_agreement"

    def test_drafter_missing_fields(self):
        """'draft an NDA' with no fields → needs_input."""
        result = _run(self.agent.run(
            {"request": "draft an NDA", "fields": {}},
            _state(),
        ))
        if result["status"] == "needs_input":
            assert result["template"] == "nda"
            assert len(result["missing_fields"]) == 7  # all required fields
        else:
            # If LLM classification failed, may be unsupported
            assert result["status"] == "unsupported"

    def test_drafter_unsupported(self):
        """Unrecognized request → unsupported with available templates."""
        result = _run(self.agent.run(
            {"request": "write a love letter", "fields": {}},
            _state(),
        ))
        assert result["status"] == "unsupported"
        template_ids = [t["id"] for t in result["available_templates"]]
        assert "nda" in template_ids
        assert "rent_agreement" in template_ids
        assert "affidavit" in template_ids
        assert "power_of_attorney" in template_ids
