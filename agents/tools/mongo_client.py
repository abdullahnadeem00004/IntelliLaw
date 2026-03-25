import logging
from typing import Any

from bson import ObjectId
from pymongo import MongoClient
from pymongo.collection import Collection

from core.config import settings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)
        logger.info("MongoDB connection initialized: %s", settings.MONGODB_URI)
    return _client


def _get_db():
    client = _get_client()
    # Extract db name from URI or default to "intellilaw"
    db_name = settings.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0] or "intellilaw"
    return client[db_name]


def _cases_collection() -> Collection:
    return _get_db()["cases"]


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert ObjectId fields to strings."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_case_by_id(case_id: str) -> dict[str, Any] | None:
    try:
        doc = _cases_collection().find_one({"_id": ObjectId(case_id)})
        return _serialize(doc) if doc else None
    except Exception as e:
        logger.error("Error fetching case %s: %s", case_id, e)
        return None


def get_cases_by_lawyer(lawyer_uid: str) -> list[dict[str, Any]]:
    try:
        docs = _cases_collection().find({"assignedLawyerUid": lawyer_uid})
        return [_serialize(doc) for doc in docs]
    except Exception as e:
        logger.error("Error fetching cases for lawyer %s: %s", lawyer_uid, e)
        return []


def ping() -> bool:
    """Check if MongoDB is reachable."""
    try:
        _get_client().admin.command("ping")
        return True
    except Exception:
        return False
