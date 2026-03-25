import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "pak_legal_sections.json"


class LegalSearcher:
    def __init__(self, data_path: str | Path | None = None) -> None:
        path = Path(data_path) if data_path else _DATA_PATH
        with open(path, "r", encoding="utf-8") as f:
            self._sections: list[dict[str, Any]] = json.load(f)
        logger.info("Loaded %d legal sections from %s", len(self._sections), path)

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Keyword-based search: score each section by query-word overlap."""
        query_words = set(query.lower().split())
        scored: list[tuple[float, dict]] = []

        for section in self._sections:
            corpus = " ".join([
                section.get("act_name", ""),
                section.get("section_number", ""),
                section.get("title", ""),
                section.get("text", ""),
            ]).lower()
            score = sum(1 for w in query_words if w in corpus)
            if score > 0:
                scored.append((score, section))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scored[:top_k]]

    def get_section(self, act_name: str, section_number: str) -> dict[str, Any] | None:
        """Exact lookup by act name and section number."""
        act_lower = act_name.lower()
        sec_lower = section_number.lower()
        for section in self._sections:
            if (section["act_name"].lower() == act_lower
                    and section["section_number"].lower() == sec_lower):
                return section
        return None

    def check_amendment(self, act_name: str, section_number: str) -> dict[str, Any]:
        """Check if a section has been repealed or amended."""
        section = self.get_section(act_name, section_number)
        if section is None:
            return {
                "found": False,
                "is_repealed": False,
                "repealed_date": None,
                "replaced_by": None,
            }
        return {
            "found": True,
            "is_repealed": section.get("status") == "repealed",
            "repealed_date": section.get("repealed_date"),
            "replaced_by": section.get("replaced_by"),
        }
