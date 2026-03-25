"""Legal database tools — wraps LegalSearcher for convenient access."""

from tools.retriever import LegalSearcher

_searcher: LegalSearcher | None = None


def _get_searcher() -> LegalSearcher:
    global _searcher
    if _searcher is None:
        _searcher = LegalSearcher()
    return _searcher


def fetch_section_text(act_name: str, section_number: str) -> str | None:
    """Return the text of a specific section, or None if not found."""
    section = _get_searcher().get_section(act_name, section_number)
    return section["text"] if section else None


def check_amendment(act_name: str, section_number: str) -> dict:
    """Check whether a section has been repealed or amended."""
    return _get_searcher().check_amendment(act_name, section_number)
