from pydantic import BaseModel, Field
from typing import List, Optional

# --- STEP 1: The Lawyer Schema ---
class LawyerProfile(BaseModel):
    fullName: str
    licenseNumber: Optional[str] = None
    specialization: Optional[str] = None
    barCouncil: Optional[str] = None

class Lawyer(BaseModel):
    uid: str
    email: str
    displayName: str
    lawyerProfile: Optional[LawyerProfile] = None

# --- STEP 2: The Client Schema ---
class Client(BaseModel):
    clientId: str
    displayName: str
    type: str = "Individual" # Individual, Corporate, etc.
    cnic: Optional[str] = None
    phoneNumber: Optional[str] = None

# --- STEP 3: The Case Schema ---
class CaseDetails(BaseModel):
    caseId: str
    title: str
    caseNumber: str
    court: str
    status: str = "ACTIVE"
    description: Optional[str] = ""

# --- STEP 4: The Template Schema ---
class Template(BaseModel):
    templateId: str
    documentType: str # e.g., "Post-Arrest Bail Petition"
    requiredVariables: List[str] # e.g., ["court_name", "accused_name", "fir_details"]
    aiInstructions: str # Specific prompting rules for this document
    isGenericFallback: bool = False

# --- STEP 5: The Master API Request Schema ---
# This is the exact payload their Node.js server will send to your Python API
class DocumentDraftRequest(BaseModel):
    lawyer: Lawyer
    client: Client
    case_details: CaseDetails
    template: Template
    custom_instructions: Optional[str] = None # If the lawyer wants to add specific notes