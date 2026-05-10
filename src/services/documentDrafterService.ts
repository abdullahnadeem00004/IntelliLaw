import axios from 'axios';

const DOCUMENT_DRAFTER_BASE_URL = import.meta.env.VITE_DOCUMENT_DRAFTER_URL || 'http://localhost:8000/api/v1';

export interface LawyerProfile {
  fullName: string;
  licenseNumber?: string;
  specialization?: string;
  barCouncil?: string;
}

export interface LawyerData {
  uid: string;
  email: string;
  displayName: string;
  lawyerProfile?: LawyerProfile;
}

export interface ClientData {
  clientId: string;
  displayName: string;
  type: string; // Individual, Corporate, etc.
  cnic?: string;
  phoneNumber?: string;
}

export interface CaseDetailsData {
  caseId: string;
  title: string;
  caseNumber: string;
  court: string;
  status: string;
  description?: string;
}

export interface TemplateData {
  templateId: string;
  documentType: string;
  requiredVariables: string[];
  aiInstructions: string;
  isGenericFallback?: boolean;
}

export interface DocumentDraftRequest {
  lawyer: LawyerData;
  client: ClientData;
  case_details: CaseDetailsData;
  template: TemplateData;
  custom_instructions?: string;
}

export interface DraftResponse {
  status: string;
  message: string;
  file_url: string;
  ai_revision_count: number;
}

// Common document templates
export const DOCUMENT_TEMPLATES: TemplateData[] = [
  {
    templateId: 'bail-petition',
    documentType: 'Bail Petition',
    requiredVariables: ['accused_name', 'fir_details', 'grounds_of_bail'],
    aiInstructions: 'Generate a formal bail petition following criminal procedure code with strong legal arguments',
    isGenericFallback: false,
  },
  {
    templateId: 'arrest-warrant-response',
    documentType: 'Response to Arrest Warrant',
    requiredVariables: ['warrant_details', 'defense_arguments', 'supporting_evidence'],
    aiInstructions: 'Create a comprehensive response to arrest warrant with legal precedents',
    isGenericFallback: false,
  },
  {
    templateId: 'contract-agreement',
    documentType: 'Contract Agreement',
    requiredVariables: ['parties', 'terms', 'conditions', 'payment_terms'],
    aiInstructions: 'Draft a formal contract with standard clauses and legal protections',
    isGenericFallback: false,
  },
  {
    templateId: 'client-letter',
    documentType: 'Client Letter',
    requiredVariables: ['client_name', 'case_summary', 'next_steps'],
    aiInstructions: 'Write a professional legal letter to the client explaining case status',
    isGenericFallback: false,
  },
  {
    templateId: 'memorandum',
    documentType: 'Legal Memorandum',
    requiredVariables: ['issue', 'facts', 'legal_analysis', 'conclusion'],
    aiInstructions: 'Create a detailed legal memorandum with case law citations',
    isGenericFallback: false,
  },
  {
    templateId: 'pleading',
    documentType: 'Court Pleading',
    requiredVariables: ['case_facts', 'legal_grounds', 'relief_sought', 'supporting_evidence'],
    aiInstructions: 'Draft a formal court pleading with proper legal formatting',
    isGenericFallback: false,
  },
  {
    templateId: 'generic-document',
    documentType: 'Custom Legal Document',
    requiredVariables: [],
    aiInstructions: 'Generate any type of legal document based on user specifications',
    isGenericFallback: true,
  },
];

export const documentDrafterAPI = {
  // Draft a legal document
  draftDocument: async (request: DocumentDraftRequest): Promise<DraftResponse> => {
    try {
      const response = await axios.post(
        `${DOCUMENT_DRAFTER_BASE_URL}/draft-document`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message);
      }
      throw error;
    }
  },

  // Get available templates
  getTemplates: (): TemplateData[] => {
    return DOCUMENT_TEMPLATES;
  },

  // Get template by ID
  getTemplateById: (templateId: string): TemplateData | undefined => {
    return DOCUMENT_TEMPLATES.find(t => t.templateId === templateId);
  },

  // Download a generated document
  downloadDocument: (fileUrl: string, fileName: string): void => {
    try {
      // Construct full URL if relative path is provided
      const fullUrl = fileUrl.startsWith('http') || fileUrl.startsWith('blob:')
        ? fileUrl
        : `${DOCUMENT_DRAFTER_BASE_URL}${fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl}`;

      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName || 'document.docx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup the object URL if it was a blob
      if (fullUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fullUrl);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      throw new Error('Failed to download document. Please try again.');
    }
  },
};

export default documentDrafterAPI;
