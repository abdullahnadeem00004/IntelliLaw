import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Case } from '../types';
import { subscribeCaseById } from '../services/caseService';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Scale, 
  User, 
  MapPin, 
  FileText, 
  CheckSquare, 
  CreditCard, 
  History,
  MoreVertical,
  Download,
  Share2,
  Plus,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  LayoutDashboard,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { CASE_STATUSES, CASE_PRIORITIES } from '../constants';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'history', label: 'Case History', icon: History },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (value?.toDate && typeof value.toDate === 'function') return value.toDate();
    return null;
  };

  const generateAISummary = async () => {
    setIsGeneratingSummary(true);
    // Mocking the AI generation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const summary = `Based on the case details for "${caseData?.title}", this ${(caseData?.category || 'legal').toLowerCase()} matter involves ${caseData?.clientName}. 
    The case is currently ${caseData?.status.toLowerCase()} and has a ${caseData?.priority.toLowerCase()} priority. 
    Key focus areas should include the upcoming hearing at ${caseData?.court}. 
    [LLM INTEGRATION POINT: Here, the system would call the Gemini API with pleadings, court orders, and hearing notes to produce a more nuanced legal summary.]`;
    
    setAiSummary(summary);
    setIsGeneratingSummary(false);
  };

  useEffect(() => {
    if (!id) return;

    subscribeCaseById(id, (fetchedCase) => {
      setCaseData(fetchedCase);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching case:", error);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading case details...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Case Not Found</h2>
        <p className="text-neutral-500">The case you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/cases')} className="btn btn-primary">
          Back to Cases
        </button>
      </div>
    );
  }

  const createdAtDate = toDate(caseData.createdAt);
  const nextHearingDate = toDate(caseData.nextHearingDate);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/cases')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{caseData.title}</h1>
              <span className={`badge ${
                caseData.status === 'ACTIVE' ? 'bg-primary-100 text-primary-700' :
                caseData.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {caseData.status}
              </span>
              <span className={`badge ${
                caseData.priority === 'CRITICAL' ? 'bg-error/10 text-error' :
                caseData.priority === 'HIGH' ? 'bg-warning/10 text-warning' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {caseData.priority}
              </span>
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              Case Number: {caseData.caseNumber} • Filed on {createdAtDate ? createdAtDate.toLocaleDateString('en-PK') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Update Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id 
                ? "text-primary-600" 
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* AI Case Summary */}
              <div className="p-6 bg-primary-900 rounded-2xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider opacity-80">AI Case Summary</span>
                  </div>
                  
                  {isGeneratingSummary ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary-300" />
                      <p className="text-sm font-medium text-primary-100 italic">AI is analyzing case details and generating summary...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <p className="text-lg font-medium leading-relaxed">
                        {aiSummary}
                      </p>
                      <button 
                        onClick={generateAISummary}
                        className="text-xs font-bold text-primary-300 hover:text-white transition-colors flex items-center gap-1"
                      >
                        Regenerate Summary <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg font-medium leading-relaxed opacity-60 italic">
                        No summary generated yet. Click the button below to analyze case pleadings, orders, and notes.
                      </p>
                      <button 
                        onClick={generateAISummary}
                        className="btn bg-white text-primary-900 hover:bg-primary-50 font-bold px-6 py-2.5 text-sm shadow-xl"
                      >
                        Generate AI Summary
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
              </div>

              {/* Case Details Card */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6">Case Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Court</p>
                        <p className="text-sm font-bold text-neutral-900">{caseData.court}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Judge</p>
                        <p className="text-sm font-bold text-neutral-900">{caseData.judge || 'Not Assigned'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Category</p>
                        <p className="text-sm font-bold text-neutral-900">{caseData.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Next Hearing</p>
                        <p className="text-sm font-bold text-neutral-900">
                          {nextHearingDate ? nextHearingDate.toLocaleString('en-PK') : 'Not Scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-neutral-100">
                  <h4 className="text-sm font-bold text-neutral-900 mb-3">Description</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {caseData.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Recent Documents */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">Recent Documents</h3>
                  <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Writ_Petition_Final.pdf', type: 'PDF', size: '2.4 MB', date: 'Mar 15, 2024' },
                    { name: 'Evidence_Photos.zip', type: 'ZIP', size: '45 MB', date: 'Mar 12, 2024' },
                    { name: 'Court_Order_Adjournment.pdf', type: 'PDF', size: '1.1 MB', date: 'Mar 05, 2024' },
                    { name: 'Witness_Statement_1.docx', type: 'DOCX', size: '850 KB', date: 'Feb 28, 2024' },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 border border-neutral-200 group-hover:border-primary-200 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{doc.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{doc.size} • {doc.date}</p>
                      </div>
                      <button className="p-2 text-neutral-400 hover:text-neutral-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-8">
          {/* Client Info */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Client Details</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                {(caseData.clientName || 'C').charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900">{caseData.clientName || 'Unknown Client'}</h4>
                <p className="text-sm text-neutral-500">Individual Client</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-700">Client ID: {caseData.clientId || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-700">Assigned: {caseData.assignedLawyerName || 'Unassigned'}</span>
              </div>
            </div>
            <button className="btn btn-secondary w-full mt-6">
              View Full Profile
            </button>
          </div>

          {/* Upcoming Hearing Widget */}
          <div className="card p-6 border-l-4 border-l-warning">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Next Hearing</h3>
              {nextHearingDate && (
                <span className="badge bg-warning/10 text-warning">
                  {Math.ceil((nextHearingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left
                </span>
              )}
            </div>
            <div className="space-y-4">
              {nextHearingDate ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase">Date & Time</p>
                    <p className="text-sm font-bold text-neutral-900 mt-1">
                      {nextHearingDate.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {nextHearingDate.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase">Courtroom</p>
                    <p className="text-sm font-bold text-neutral-900 mt-1">{caseData.court}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500 italic">No hearing scheduled yet.</p>
              )}
              <button className="btn btn-primary w-full">
                Prepare Hearing Brief
              </button>
            </div>
          </div>

          {/* Assigned Team */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Assigned Team</h3>
            <div className="space-y-4">
              {[
                { name: caseData.assignedLawyerName || 'Unassigned', role: 'Lead Counsel', initial: (caseData.assignedLawyerName || 'U').charAt(0) },
                { name: 'Sarah Khan', role: 'Associate', initial: 'S' },
                { name: 'Zaid Malik', role: 'Clerk', initial: 'Z' },
              ].map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                    {member.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{member.name}</p>
                    <p className="text-xs text-neutral-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost w-full mt-6 text-xs">
              Manage Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
