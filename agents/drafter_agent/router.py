"""FastAPI router for the Document Drafter Agent."""

import logging
import uuid
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from core.base_agent import AgentState
from drafter_agent.agent import DocumentDrafterAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["drafter"])

_agent = DocumentDrafterAgent()


class DraftDocumentRequest(BaseModel):
    request: str
    fields: dict[str, Any] = {}
    session_id: str | None = None


@router.post("/draft-document")
async def draft_document(req: DraftDocumentRequest) -> dict:
    """Draft a legal document from a natural language request and field values."""
    session_id = req.session_id or str(uuid.uuid4())
    state = AgentState(session_id=session_id)

    try:
        result = await _agent.run(
            {"request": req.request, "fields": req.fields},
            state,
        )
        return result
    except Exception as e:
        logger.exception("Document drafting failed: %s", e)
        return {
            "status": "error",
            "message": str(e),
            "trace": state.trace,
            "disclaimer": "This is AI-generated legal information, not professional legal advice.",
        }
