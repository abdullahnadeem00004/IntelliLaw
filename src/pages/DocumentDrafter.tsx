import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Zap
} from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';
import documentDrafterAPI, { 
  DocumentDraftRequest, 
  DraftResponse,
  DOCUMENT_TEMPLATES,
  TemplateData 
} from '../services/documentDrafterService';

interface DraftingState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  response?: DraftResponse;
}

interface FormData {
  templateId: string;
  documentType: string;
  clientName: string;
  clientType: string;
  clientCnic?: string;
  clientPhone?: string;
  caseId: string;
  caseTitle: string;
  caseNumber: string;
  court: string;
  caseStatus: string;
  caseDescription?: string;
  aiInstructions: string;
  customInstructions?: string;
}

const INITIAL_FORM_STATE: FormData = {
  templateId: 'bail-petition',
  documentType: 'Bail Petition',
  clientName: '',
  clientType: 'Individual',
  clientCnic: '',
  clientPhone: '',
  caseId: '',
  caseTitle: '',
  caseNumber: '',
  court: '',
  caseStatus: 'ACTIVE',
  caseDescription: '',
  aiInstructions: '',
  customInstructions: '',
};

export default function DocumentDrafter() {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [draftingState, setDraftingState] = useState<DraftingState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  // Update AI instructions when template changes
  useEffect(() => {
    const template = DOCUMENT_TEMPLATES.find(t => t.templateId === formData.templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData(prev => ({
        ...prev,
        documentType: template.documentType,
        aiInstructions: template.aiInstructions,
      }));
    }
  }, [formData.templateId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      templateId,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.clientName.trim()) {
      setDraftingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'Client name is required',
      });
      return false;
    }

    if (!formData.caseTitle.trim() || !formData.caseNumber.trim() || !formData.court.trim()) {
      setDraftingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'Case title, number, and court are required',
      });
      return false;
    }

    if (!formData.aiInstructions.trim()) {
      setDraftingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'AI instructions are required',
      });
      return false;
    }

    return true;
  };

  const handleDraftDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userProfile) {
      setDraftingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'User profile not found',
      });
      return;
    }

    setDraftingState({
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    try {
      // Generate unique IDs for client and case
      const clientId = `client-${Date.now()}`;
      const caseId = `case-${Date.now()}`;

      const lawyerProfile = {
        fullName: userProfile.displayName || '',
      };

      const draftRequest: DocumentDraftRequest = {
        lawyer: {
          uid: userProfile.uid || '',
          email: userProfile.email || '',
          displayName: userProfile.displayName || '',
          lawyerProfile,
        },
        client: {
          clientId,
          displayName: formData.clientName,
          type: formData.clientType,
          cnic: formData.clientCnic || undefined,
          phoneNumber: formData.clientPhone || undefined,
        },
        case_details: {
          caseId,
          title: formData.caseTitle,
          caseNumber: formData.caseNumber,
          court: formData.court,
          status: formData.caseStatus,
          description: formData.caseDescription || undefined,
        },
        template: {
          templateId: formData.templateId,
          documentType: formData.documentType,
          requiredVariables: selectedTemplate?.requiredVariables || [],
          aiInstructions: formData.aiInstructions,
          isGenericFallback: selectedTemplate?.isGenericFallback || false,
        },
        custom_instructions: formData.customInstructions || undefined,
      };

      console.log('Sending draft request:', draftRequest);
      const response = await documentDrafterAPI.draftDocument(draftRequest);

      setDraftingState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        response,
      });

      // Reset form after success
      setTimeout(() => {
        setFormData(INITIAL_FORM_STATE);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to draft document';
      setDraftingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage,
      });
    }
  };

  const handleDownload = () => {
    if (draftingState.response?.file_url) {
      const fileName = `${formData.documentType.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`;
      documentDrafterAPI.downloadDocument(draftingState.response.file_url, fileName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary-600/20 rounded-lg">
              <FileText className="w-6 h-6 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Document Drafter</h1>
          </div>
          <p className="text-neutral-400 ml-12">
            AI-powered legal document generation with automatic template creation
          </p>
        </div>

        {/* Success Message */}
        {draftingState.isSuccess && draftingState.response && (
          <div className="mb-6 p-4 bg-success-500/20 border border-success-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-success-400">Document Generated Successfully</h3>
                <p className="text-white text-sm mt-1">{draftingState.response.message}</p>
                <p className="text-white text-xs mt-2">
                  Revisions completed: {draftingState.response.ai_revision_count}
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {draftingState.isError && draftingState.errorMessage && (
          <div className="mb-6 p-4 bg-error/20 border border-error/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-error">Error</h3>
                <p className="text-error/80 text-sm mt-1">{draftingState.errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Document Templates</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {DOCUMENT_TEMPLATES.map(template => (
                  <button
                    key={template.templateId}
                    onClick={() => handleTemplateChange(template.templateId)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      formData.templateId === template.templateId
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="text-sm font-medium">{template.documentType}</div>
                    </div>
                    {template.isGenericFallback && (
                      <div className="text-xs opacity-70 mt-1">Custom document</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Form Inputs */}
          <div className="lg:col-span-2">
            <form onSubmit={handleDraftDocument} className="space-y-6">
              {/* Client Information */}
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Client Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="Enter client name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Client Type
                    </label>
                    <select
                      name="clientType"
                      value={formData.clientType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Trust">Trust</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      CNIC/ID
                    </label>
                    <input
                      type="text"
                      name="clientCnic"
                      value={formData.clientCnic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="Client ID/CNIC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="Client phone"
                    />
                  </div>
                </div>
              </div>

              {/* Case Information */}
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Case Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Case Title *
                    </label>
                    <input
                      type="text"
                      name="caseTitle"
                      value={formData.caseTitle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="Enter case title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Case Number *
                    </label>
                    <input
                      type="text"
                      name="caseNumber"
                      value={formData.caseNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="e.g., FIR-2024-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Court/Forum *
                    </label>
                    <input
                      type="text"
                      name="court"
                      value={formData.court}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="e.g., District Court, Karachi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Case Status
                    </label>
                    <select
                      name="caseStatus"
                      value={formData.caseStatus}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="HEARING">In Hearing</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Case Description
                    </label>
                    <textarea
                      name="caseDescription"
                      value={formData.caseDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                      placeholder="Provide detailed case description"
                    />
                  </div>
                </div>
              </div>

              {/* AI Instructions */}
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI Instructions</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Document Instructions *
                  </label>
                  <textarea
                    name="aiInstructions"
                    value={formData.aiInstructions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                    placeholder="Provide specific instructions for document generation..."
                    required
                  />
                  <p className="text-xs text-neutral-400 mt-2">
                    This will guide the AI on how to draft the document.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Additional Custom Instructions
                  </label>
                  <textarea
                    name="customInstructions"
                    value={formData.customInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                    placeholder="Add any additional notes or special requirements..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={draftingState.isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {draftingState.isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Document...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Legal Document
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
