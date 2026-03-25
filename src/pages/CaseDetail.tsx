import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { Case } from '../types';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [caseHistory, setCaseHistory] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRelatedTasks = async (caseId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks?caseId=${caseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRelatedTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData || !user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update case status');
      }

      const updatedCase = await response.json();
      setCaseData({
        ...caseData,
        status: updatedCase.status,
      });
      setSuccessMessage(`Case status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating case:', err);
    }
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

    const fetchCaseData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/cases/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Case not found');
        }

        const data = await response.json();
        setCaseData({
          id: data._id,
          title: data.title,
          caseNumber: data.caseNumber,
          category: data.category,
          priority: data.priority,
          description: data.description,
          court: data.court,
          judge: data.judge,
          status: data.status,
          clientName: data.clientName,
          clientId: data.clientId,
          assignedLawyerUid: data.assignedLawyerUid,
          assignedLawyerName: data.assignedLawyerName,
          nextHearingDate: data.nextHearingDate,
          lastActivityDate: data.lastActivityDate,
          tags: data.tags || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });

        // Fetch related tasks
        await fetchRelatedTasks(id);

        // Generate mock case history
        setCaseHistory([
          { date: new Date().toISOString(), action: 'Case Created', user: data.assignedLawyerName },
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching case:', err);
        setLoading(false);
      }
    };

    fetchCaseData();
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900">{caseData.title}</h1>
              <span className={`badge ${
                caseData.status === 'ACTIVE' ? 'bg-primary-100 text-primary-700' :
                caseData.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                caseData.status === 'CLOSED' ? 'bg-neutral-100 text-neutral-600' :
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
              Case Number: {caseData.caseNumber} • Filed on {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-PK') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
          <div className="group relative">
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Update Status
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button 
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
              >
                Mark as Active
              </button>
              <button 
                onClick={() => handleStatusChange('PENDING')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
              >
                Mark as Pending
              </button>
              <button 
                onClick={() => handleStatusChange('ON_HOLD')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
              >
                Put On Hold
              </button>
              <button 
                onClick={() => handleStatusChange('CLOSED')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700 rounded-b-lg"
              >
                Close Case
              </button>
            </div>
          </div>
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
                          {caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleString('en-PK') : 'Not Scheduled'}
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

          {activeTab === 'history' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Case Timeline</h3>
              <div className="space-y-6">
                {caseHistory.length > 0 ? (
                  caseHistory.map((entry, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                        {i < caseHistory.length - 1 && <div className="w-0.5 h-12 bg-neutral-200"></div>}
                      </div>
                      <div className="pb-6">
                        <p className="font-bold text-neutral-900">{entry.action}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(entry.date).toLocaleDateString('en-PK')} • {entry.user}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-center py-8">No case history available yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Case Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Writ_Petition_Final.pdf', type: 'PDF', size: '2.4 MB', date: 'Mar 15, 2024' },
                  { name: 'Evidence_Photos.zip', type: 'ZIP', size: '45 MB', date: 'Mar 12, 2024' },
                  { name: 'Court_Order_Adjournment.pdf', type: 'PDF', size: '1.1 MB', date: 'Mar 05, 2024' },
                  { name: 'Witness_Statement_1.docx', type: 'DOCX', size: '850 KB', date: 'Feb 28, 2024' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-all group cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 border border-neutral-200">
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
          )}

          {activeTab === 'tasks' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900">Related Tasks</h3>
                <button className="text-primary-600 text-sm font-medium hover:underline">Add Task</button>
              </div>
              {relatedTasks.length > 0 ? (
                <div className="space-y-3">
                  {relatedTasks.map((task: any) => (
                    <div key={task._id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-neutral-900">{task.title}</p>
                          <p className="text-xs text-neutral-500 mt-1">{task.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                              task.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-600' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {task.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === 'HIGH' ? 'bg-error/10 text-error' :
                              task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No tasks linked to this case yet.</p>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Billing Summary</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-xs font-bold text-neutral-500 uppercase">Total Hours</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-2">24.5</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-xs font-bold text-neutral-500 uppercase">Total Costs</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-2">PKR 147,000</p>
                  </div>
                </div>
                <div className="border-t border-neutral-200 pt-6">
                  <h4 className="font-bold text-neutral-900 mb-4">Recent Entries</h4>
                  <div className="space-y-3">
                    {[
                      { date: 'Mar 15, 2024', description: 'Court hearing preparation', hours: 3.5, rate: 5000 },
                      { date: 'Mar 12, 2024', description: 'Document review', hours: 2.0, rate: 5000 },
                      { date: 'Mar 10, 2024', description: 'Client consultation', hours: 1.5, rate: 5000 },
                    ].map((entry, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-neutral-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{entry.description}</p>
                          <p className="text-xs text-neutral-500">{entry.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-neutral-900">{entry.hours}h</p>
                          <p className="text-xs text-neutral-500">PKR {entry.hours * entry.rate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
              {caseData.nextHearingDate && (
                <span className="badge bg-warning/10 text-warning">
                  {Math.ceil((new Date(caseData.nextHearingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left
                </span>
              )}
            </div>
            <div className="space-y-4">
              {caseData.nextHearingDate ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase">Date & Time</p>
                    <p className="text-sm font-bold text-neutral-900 mt-1">
                      {new Date(caseData.nextHearingDate).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {new Date(caseData.nextHearingDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
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
