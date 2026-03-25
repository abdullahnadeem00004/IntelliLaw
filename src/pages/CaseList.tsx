import React, { useState, useEffect } from 'react';
import { Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  Briefcase, 
  Calendar, 
  Scale,
  Download,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { CASE_STATUSES, CASE_PRIORITIES, PAKISTAN_COURTS } from '../constants';
import { Case, UserRole } from '../types';
import { subscribeCases } from '../services/caseService';

export default function CaseList() {
  const { user, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const formatDate = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-PK');
    }
    return String(value);
  };

  useEffect(() => {
    subscribeCases((casesData) => {
      setCases(casesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cases:", error);
      setLoading(false);
    });
  }, []);

  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Case Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage and track all legal proceedings across Pakistan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <Link to="/cases/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search by case number, title, or client..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="input-field py-2 text-sm w-full md:w-40">
            <option>All Statuses</option>
            {CASE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input-field py-2 text-sm w-full md:w-40">
            <option>All Courts</option>
            {PAKISTAN_COURTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-secondary p-2">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Case Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Case Info</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Court</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Next Hearing</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-4">Loading cases...</p>
                  </td>
                </tr>
              ) : filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{c.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{c.caseNumber || 'No ID'} • {c.clientName || 'Unknown Client'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-700 font-medium">{c.court || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${CASE_STATUSES.find(s => s.value === c.status)?.color || 'bg-neutral-100 text-neutral-600'}`}>
                        {CASE_STATUSES.find(s => s.value === c.status)?.label || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${CASE_PRIORITIES.find(p => p.value === c.priority)?.color || 'bg-neutral-100 text-neutral-600'}`}>
                        {CASE_PRIORITIES.find(p => p.value === c.priority)?.label || c.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700 font-medium">{formatDate(c.nextHearingDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-500">{formatDate(c.lastActivityDate) || 'Just now'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more actions
                        }}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mx-auto mb-4">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-500">No cases found. Create your first case to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-sm text-neutral-500">Showing <span className="font-bold text-neutral-900">{filteredCases.length}</span> cases</p>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary py-1.5 px-3 text-xs disabled:opacity-50">Previous</button>
            <button className="btn btn-secondary py-1.5 px-3 text-xs bg-primary-600 text-white border-primary-600">1</button>
            <button className="btn btn-secondary py-1.5 px-3 text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* AI Summary Widget */}
      <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-primary-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">AI Case Risk Analysis</h3>
            <p className="text-primary-100 text-sm opacity-90">Our AI is monitoring your cases for potential risks and deadlines.</p>
          </div>
        </div>
        <button className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold px-6 py-2.5 shadow-sm">
          View Risks
        </button>
      </div>
    </div>
  );
}

