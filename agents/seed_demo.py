"""Seed a demo case into MongoDB for testing the agent service."""

from datetime import datetime

from pymongo import MongoClient

from core.config import settings


def main() -> None:
    client = MongoClient(settings.MONGODB_URI)
    db_name = settings.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0] or "intellilaw"
    db = client[db_name]
    cases = db["cases"]

    demo_case = {
        "title": "State vs. Ahmed — Theft under Section 380 PPC",
        "caseNumber": "DEMO-2025-001",
        "category": "Criminal",
        "priority": "HIGH",
        "status": "ACTIVE",
        "court": "Lahore Sessions Court",
        "judge": "Justice Khalid Mahmood",
        "clientName": "Muhammad Ahmed",
        "assignedLawyerUid": "demo_lawyer",
        "assignedLawyerName": "Adv. Abdullah Nadeem",
        "nextHearingDate": datetime(2025, 12, 15),
        "tags": ["theft", "PPC-380", "sessions-court", "lahore"],
        "description": (
            "Client accused of theft under Section 380 PPC. "
            "Incident at DHA Phase 5, Lahore. "
            "Client claims innocence and requests bail."
        ),
        "createdAt": datetime.now(tz=None),
        "updatedAt": datetime.now(tz=None),
    }

    # Upsert by caseNumber so re-running is safe
    result = cases.update_one(
        {"caseNumber": "DEMO-2025-001"},
        {"$set": demo_case},
        upsert=True,
    )

    if result.upserted_id:
        print(f"Inserted demo case with _id: {result.upserted_id}")
    else:
        doc = cases.find_one({"caseNumber": "DEMO-2025-001"})
        print(f"Demo case already exists with _id: {doc['_id']}")

    print("Done. Use this _id for testing /agents/case-research endpoints.")


if __name__ == "__main__":
    main()
