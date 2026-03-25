"""Pakistani legal document templates with required fields and stamp duty info."""

from typing import Any

TEMPLATES: dict[str, dict[str, Any]] = {
    "nda": {
        "name": "Non-Disclosure Agreement",
        "required_fields": [
            {"id": "party_1_name", "label": "First Party Name", "type": "text"},
            {"id": "party_1_cnic", "label": "First Party CNIC", "type": "text"},
            {"id": "party_2_name", "label": "Second Party Name", "type": "text"},
            {"id": "party_2_cnic", "label": "Second Party CNIC", "type": "text"},
            {"id": "effective_date", "label": "Effective Date", "type": "date"},
            {"id": "duration_months", "label": "Duration (months)", "type": "number"},
            {"id": "confidential_info_description", "label": "Description of Confidential Information", "type": "text"},
        ],
        "optional_clauses": ["non_compete", "non_solicitation"],
        "stamp_duty": {
            "punjab": 100,
            "sindh": 200,
            "kp": 50,
            "balochistan": 50,
            "ict": 100,
        },
    },
    "rent_agreement": {
        "name": "Rent Agreement",
        "required_fields": [
            {"id": "landlord_name", "label": "Landlord Name", "type": "text"},
            {"id": "tenant_name", "label": "Tenant Name", "type": "text"},
            {"id": "property_address", "label": "Property Address", "type": "text"},
            {"id": "monthly_rent", "label": "Monthly Rent (PKR)", "type": "number"},
            {"id": "security_deposit", "label": "Security Deposit (PKR)", "type": "number"},
            {"id": "lease_start", "label": "Lease Start Date", "type": "date"},
            {"id": "lease_duration", "label": "Lease Duration (months)", "type": "number"},
        ],
        "optional_clauses": ["utility_responsibility", "maintenance_clause", "subletting_restriction"],
        "stamp_duty": {
            "punjab": 500,
            "sindh": 1000,
            "kp": 300,
            "balochistan": 300,
            "ict": 500,
        },
        "jurisdiction_notes": {
            "punjab": "Punjab Rented Premises Act 2009",
            "sindh": "Sindh Rented Premises Ordinance 1979",
            "ict": "ICT Rent Restriction Ordinance 2001",
        },
    },
    "affidavit": {
        "name": "Affidavit",
        "required_fields": [
            {"id": "deponent_name", "label": "Deponent Name", "type": "text"},
            {"id": "father_name", "label": "Father's Name", "type": "text"},
            {"id": "cnic", "label": "CNIC Number", "type": "text"},
            {"id": "address", "label": "Address", "type": "text"},
            {"id": "statement_content", "label": "Statement Content", "type": "text"},
        ],
        "optional_clauses": [],
        "stamp_duty": {
            "punjab": 50,
            "sindh": 50,
            "kp": 20,
            "balochistan": 20,
            "ict": 50,
        },
    },
    "power_of_attorney": {
        "name": "Power of Attorney",
        "required_fields": [
            {"id": "principal_name", "label": "Principal Name", "type": "text"},
            {"id": "principal_cnic", "label": "Principal CNIC", "type": "text"},
            {"id": "attorney_name", "label": "Attorney Name", "type": "text"},
            {"id": "attorney_cnic", "label": "Attorney CNIC", "type": "text"},
            {"id": "powers_granted", "label": "Powers Granted", "type": "list"},
        ],
        "optional_clauses": ["revocation_clause", "duration_limit"],
        "stamp_duty": {
            "punjab": 200,
            "sindh": 500,
            "kp": 100,
            "balochistan": 100,
            "ict": 200,
        },
    },
}
