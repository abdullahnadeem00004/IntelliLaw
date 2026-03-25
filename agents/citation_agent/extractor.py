"""Extract Pakistani legal citations from text using regex patterns."""

import re
from typing import Any

# --- Act name normalization map ---
_ACT_ALIASES: dict[str, str] = {
    "ppc": "Pakistan Penal Code, 1860",
    "pakistan penal code": "Pakistan Penal Code, 1860",
    "cpc": "Code of Civil Procedure, 1908",
    "code of civil procedure": "Code of Civil Procedure, 1908",
    "crpc": "Code of Criminal Procedure, 1898",
    "cr.p.c": "Code of Criminal Procedure, 1898",
    "cr.p.c.": "Code of Criminal Procedure, 1898",
    "code of criminal procedure": "Code of Criminal Procedure, 1898",
    "contract act": "Contract Act, 1872",
    "evidence act": "Qanun-e-Shahadat Order, 1984",
    "qanun-e-shahadat": "Qanun-e-Shahadat Order, 1984",
    "qanun-e-shahadat order": "Qanun-e-Shahadat Order, 1984",
    "transfer of property act": "Transfer of Property Act, 1882",
    "tpa": "Transfer of Property Act, 1882",
    "specific relief act": "Specific Relief Act, 1877",
    "limitation act": "Limitation Act, 1908",
    "companies act": "Companies Act, 2017",
    "constitution": "Constitution of Pakistan, 1973",
    "constitution of pakistan": "Constitution of Pakistan, 1973",
    "punjab rented premises act": "Punjab Rented Premises Act, 2009",
    "anti-terrorism act": "Anti-Terrorism Act, 1997",
    "anti terrorism act": "Anti-Terrorism Act, 1997",
    "ata": "Anti-Terrorism Act, 1997",
    "nab ordinance": "National Accountability Ordinance, 1999",
    "national accountability ordinance": "National Accountability Ordinance, 1999",
    "hudood ordinance": "Hudood Ordinance, 1979",
    "family courts act": "Family Courts Act, 1964",
}


def normalize_act_name(raw: str) -> str:
    """Normalize a raw act name/abbreviation to its full canonical form."""
    key = raw.strip().lower().rstrip(".,;:")
    # Remove leading "the " or "of the "
    key = re.sub(r"^the\s+", "", key)
    if key in _ACT_ALIASES:
        return _ACT_ALIASES[key]
    # Try partial match
    for alias, full in _ACT_ALIASES.items():
        if alias in key or key in alias:
            return full
    return raw.strip()


def _surrounding_claim(text: str, start: int, end: int, window: int = 150) -> str:
    """Extract surrounding context around a citation."""
    claim_start = max(0, start - window)
    claim_end = min(len(text), end + window)
    return text[claim_start:claim_end].strip()


# --- Regex patterns ---

# Statute: Section X of Act / Section X, Act / Section X Act / S. X Act
_SECTION_ACTS = (
    r"PPC|Pakistan\s+Penal\s+Code"
    r"|CPC|Code\s+of\s+Civil\s+Procedure"
    r"|CrPC|Cr\.?P\.?C\.?"
    r"|Code\s+of\s+Criminal\s+Procedure"
    r"|Contract\s+Act"
    r"|Evidence\s+Act"
    r"|Qanun-e-Shahadat(?:\s+Order)?"
    r"|Transfer\s+of\s+Property\s+Act|TPA"
    r"|Specific\s+Relief\s+Act"
    r"|Limitation\s+Act"
    r"|Companies\s+Act"
    r"|Punjab\s+Rented\s+Premises\s+Act"
    r"|Anti-?\s*Terrorism\s+Act|ATA"
    r"|NAB\s+Ordinance|National\s+Accountability\s+Ordinance"
    r"|Hudood\s+Ordinance"
    r"|Family\s+Courts?\s+Act"
)

_SECTION_PATTERN = re.compile(
    r"(?:Section|S\.)\s+"                          # "Section" or "S."
    r"(\d+[A-Za-z]?(?:\(\d+\))?)"                 # section number: 302, 489-F, 12(2)
    r"(?:\s+of\s+(?:the\s+)?|\s*,?\s*)"           # " of the " or ", " or " "
    r"(" + _SECTION_ACTS + r")",
    re.IGNORECASE,
)

# Also match "489-F" style with hyphen
_SECTION_PATTERN_HYPHEN = re.compile(
    r"(?:Section|S\.)\s+"
    r"(\d+-[A-Za-z])"                              # e.g., 489-F
    r"(?:\s+of\s+(?:the\s+)?|\s*,?\s*)"
    r"(" + _SECTION_ACTS + r")",
    re.IGNORECASE,
)

# Constitutional articles: Article X of the Constitution / Art. X Constitution
_ARTICLE_PATTERN = re.compile(
    r"(?:Article|Art\.)\s+"
    r"(\d+[A-Za-z]?)"                              # article number: 25, 10A, 25A
    r"(?:\s+of\s+(?:the\s+)?)?"
    r"(?:Constitution(?:\s+of\s+Pakistan)?)?",
    re.IGNORECASE,
)

# Case law: PLD 2019 SC 123, 2020 SCMR 456, etc.
_CASE_LAW_JOURNALS = r"PLD|SCMR|CLC|MLD|PCrLJ|YLR|PLC|PLJ"

_CASE_LAW_PATTERN = re.compile(
    r"(?:"
    # Format 1: PLD 2019 SC 123
    r"(" + _CASE_LAW_JOURNALS + r")\s+(\d{4})\s+([A-Za-z]+)\s+(\d+)"
    r"|"
    # Format 2: 2020 SCMR 456
    r"(\d{4})\s+(" + _CASE_LAW_JOURNALS + r")\s+(\d+)"
    r")",
    re.IGNORECASE,
)


def extract_citations(text: str) -> list[dict[str, Any]]:
    """Extract all Pakistani legal citations from text.

    Returns a list of citation dicts with keys:
        raw_text, type, section_number, act_name, start_pos, end_pos, surrounding_claim
    """
    citations: list[dict[str, Any]] = []
    seen_spans: set[tuple[int, int]] = set()

    def _add(match: re.Match, ctype: str, section: str, act_raw: str) -> None:
        span = (match.start(), match.end())
        if span in seen_spans:
            return
        seen_spans.add(span)
        citations.append({
            "raw_text": match.group(0).strip(),
            "type": ctype,
            "section_number": section.strip(),
            "act_name": normalize_act_name(act_raw),
            "start_pos": match.start(),
            "end_pos": match.end(),
            "surrounding_claim": _surrounding_claim(text, match.start(), match.end()),
        })

    # --- Statute citations (Section X Act) ---
    for pattern in [_SECTION_PATTERN, _SECTION_PATTERN_HYPHEN]:
        for m in pattern.finditer(text):
            _add(m, "statute", m.group(1), m.group(2))

    # --- Constitutional articles ---
    for m in _ARTICLE_PATTERN.finditer(text):
        # Only count if "Constitution" is nearby or "Art." prefix used
        raw = m.group(0)
        # Require either "Constitution" in the match or context
        nearby = text[max(0, m.start() - 30):min(len(text), m.end() + 30)].lower()
        if "constitution" in nearby or "constitution" in raw.lower():
            _add(m, "constitutional", m.group(1), "Constitution")
        elif "art." in raw.lower() or "article" in raw.lower():
            # Standalone "Article 25" — assume constitution if no other act nearby
            if not any(act.lower() in nearby for act in ["ppc", "cpc", "crpc", "contract", "evidence"]):
                _add(m, "constitutional", m.group(1), "Constitution")

    # --- Case law citations ---
    for m in _CASE_LAW_PATTERN.finditer(text):
        if m.group(1):
            # Format: PLD 2019 SC 123
            journal = m.group(1)
            year = m.group(2)
            court = m.group(3)
            page = m.group(4)
            section_str = f"{journal} {year} {court} {page}"
            act_raw = journal
        else:
            # Format: 2020 SCMR 456
            year = m.group(5)
            journal = m.group(6)
            page = m.group(7)
            section_str = f"{year} {journal} {page}"
            act_raw = journal

        span = (m.start(), m.end())
        if span not in seen_spans:
            seen_spans.add(span)
            citations.append({
                "raw_text": m.group(0).strip(),
                "type": "case_law",
                "section_number": section_str,
                "act_name": act_raw.upper(),
                "start_pos": m.start(),
                "end_pos": m.end(),
                "surrounding_claim": _surrounding_claim(text, m.start(), m.end()),
            })

    # Sort by position in text
    citations.sort(key=lambda c: c["start_pos"])
    return citations
