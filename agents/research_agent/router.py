"""FastAPI router for the Case-Aware Research Agent."""

import logging
import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from core.base_agent import AgentState
from research_agent.agent import CaseResearchAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["research"])

_agent = CaseResearchAgent()


class CaseResearchRequest(BaseModel):
    query: str
    case_id: str = ""
    session_id: str | None = None


@router.post("/case-research")
async def case_research(req: CaseResearchRequest) -> dict:
    """Research legal questions with optional case context."""
    session_id = req.session_id or str(uuid.uuid4())
    state = AgentState(session_id=session_id)

    try:
        result = await _agent.run(
            {"query": req.query, "case_id": req.case_id},
            state,
        )
        return result
    except Exception as e:
        logger.exception("Case research failed: %s", e)
        return {
            "answer": "An error occurred during research. Please try again.",
            "case_context_used": None,
            "sources": [],
            "enriched_queries": [],
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            "error": str(e),
        }


@router.get("/case-research/{case_id}/suggestions")
async def precedent_suggestions(case_id: str) -> dict:
    """Get precedent suggestions based on case category."""
    state = AgentState(session_id=str(uuid.uuid4()))

    try:
        suggestions = await _agent.suggest_precedents(case_id, state)
        return {
            "case_id": case_id,
            "suggestions": suggestions,
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }
    except Exception as e:
        logger.exception("Precedent suggestions failed: %s", e)
        return {
            "case_id": case_id,
            "suggestions": [],
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
            "error": str(e),
        }
