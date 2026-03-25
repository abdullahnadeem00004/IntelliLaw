"""FastAPI router for the Citation Verification Agent."""

import logging
import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from core.base_agent import AgentState
from citation_agent.verifier import CitationVerifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["citation"])

_verifier = CitationVerifier()


class VerifyCitationsRequest(BaseModel):
    answer: str
    session_id: str | None = None


@router.post("/verify-citations")
async def verify_citations(req: VerifyCitationsRequest) -> dict:
    """Verify legal citations in an LLM-generated answer."""
    session_id = req.session_id or str(uuid.uuid4())
    state = AgentState(session_id=session_id)

    try:
        result = await _verifier.run({"answer": req.answer}, state)
        return result
    except Exception as e:
        logger.exception("Citation verification failed: %s", e)
        return {
            "verified_answer": req.answer,
            "confidence": 0.0,
            "citations_total": 0,
            "citations_verified": 0,
            "issues": [{"type": "ERROR", "detail": str(e)}],
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }
