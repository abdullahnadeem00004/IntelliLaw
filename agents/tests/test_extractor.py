"""Tests for citation extractor."""

import sys
from pathlib import Path

# Ensure the agents directory is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from citation_agent.extractor import extract_citations, normalize_act_name


class TestNormalizeActName:
    def test_ppc(self):
        assert normalize_act_name("PPC") == "Pakistan Penal Code, 1860"

    def test_cpc(self):
        assert normalize_act_name("CPC") == "Code of Civil Procedure, 1908"

    def test_crpc(self):
        assert normalize_act_name("CrPC") == "Code of Criminal Procedure, 1898"

    def test_constitution(self):
        assert normalize_act_name("Constitution") == "Constitution of Pakistan, 1973"

    def test_constitution_of_pakistan(self):
        assert normalize_act_name("Constitution of Pakistan") == "Constitution of Pakistan, 1973"

    def test_contract_act(self):
        assert normalize_act_name("Contract Act") == "Contract Act, 1872"

    def test_evidence_act(self):
        assert normalize_act_name("Evidence Act") == "Qanun-e-Shahadat Order, 1984"

    def test_transfer_of_property_act(self):
        assert normalize_act_name("Transfer of Property Act") == "Transfer of Property Act, 1882"


class TestExtractStatuteCitations:
    def test_section_302_ppc(self):
        text = "The accused was charged under Section 302 PPC for murder."
        citations = extract_citations(text)
        assert len(citations) >= 1
        cit = citations[0]
        assert cit["type"] == "statute"
        assert cit["section_number"] == "302"
        assert cit["act_name"] == "Pakistan Penal Code, 1860"

    def test_section_of_the_act(self):
        text = "As per Section 10 of the Contract Act, all agreements are contracts."
        citations = extract_citations(text)
        assert len(citations) >= 1
        assert citations[0]["section_number"] == "10"
        assert citations[0]["act_name"] == "Contract Act, 1872"

    def test_section_with_comma(self):
        text = "Under Section 420, PPC the offence of cheating is defined."
        citations = extract_citations(text)
        assert len(citations) >= 1
        assert citations[0]["section_number"] == "420"

    def test_section_489f(self):
        text = "The complainant filed a case under Section 489-F PPC for dishonoured cheque."
        citations = extract_citations(text)
        assert len(citations) >= 1
        found = [c for c in citations if "489" in c["section_number"]]
        assert len(found) >= 1

    def test_section_12_2_cpc(self):
        text = "An application under Section 12(2) CPC was filed."
        citations = extract_citations(text)
        assert len(citations) >= 1
        assert citations[0]["section_number"] == "12(2)"


class TestExtractConstitutionalCitations:
    def test_article_25_constitution(self):
        text = "Article 25 of the Constitution guarantees equality of citizens."
        citations = extract_citations(text)
        assert len(citations) >= 1
        cit = citations[0]
        assert cit["type"] == "constitutional"
        assert cit["section_number"] == "25"
        assert cit["act_name"] == "Constitution of Pakistan, 1973"

    def test_article_10a(self):
        text = "The right to fair trial under Article 10A of the Constitution is fundamental."
        citations = extract_citations(text)
        assert len(citations) >= 1
        found = [c for c in citations if c["section_number"] == "10A"]
        assert len(found) >= 1


class TestExtractCaseLawCitations:
    def test_pld_format(self):
        text = "This was held in PLD 2019 SC 456."
        citations = extract_citations(text)
        assert len(citations) >= 1
        cit = citations[0]
        assert cit["type"] == "case_law"
        assert "PLD" in cit["raw_text"]
        assert "2019" in cit["section_number"]

    def test_scmr_format(self):
        text = "The court relied on 2020 SCMR 789 in reaching its decision."
        citations = extract_citations(text)
        assert len(citations) >= 1
        assert citations[0]["type"] == "case_law"
        assert "SCMR" in citations[0]["raw_text"] or "SCMR" in citations[0]["act_name"]


class TestMultipleCitations:
    def test_mixed_paragraph(self):
        text = (
            "The accused was charged under Section 302 PPC for qatl-i-amd. "
            "The defence argued that Article 10A of the Constitution guarantees "
            "a fair trial. The court also considered PLD 2019 SC 456 and "
            "Section 420 PPC in its judgment."
        )
        citations = extract_citations(text)
        # Should find at least 4 citations
        assert len(citations) >= 3
        types = {c["type"] for c in citations}
        assert "statute" in types
        assert "constitutional" in types
        assert "case_law" in types

    def test_surrounding_claim_captured(self):
        text = "X" * 200 + "Section 302 PPC" + "Y" * 200
        citations = extract_citations(text)
        assert len(citations) >= 1
        claim = citations[0]["surrounding_claim"]
        # Should have context around the citation
        assert len(claim) > len("Section 302 PPC")
        assert "Section 302 PPC" in claim
