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
  Loader2,
  Trash2,
  Edit2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { CASE_STATUSES, CASE_PRIORITIES, PAKISTAN_COURTS } from '../constants';
import { Case, UserRole } from '../types';

export default function CaseList() {
  const { user, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [courtFilter, setCourtFilter] = useState('All Courts');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const formatDate = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'string') {
      const date = new Date(value);
      return date.toLocaleDateString('en-PK');
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('en-PK');
    }
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-PK');
    }
    return String(value);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cases', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }

      const data = await response.json();
      const formattedCases = data.map((caseItem: any) => ({
        id: caseItem._id,
        title: caseItem.title,
        caseNumber: caseItem.caseNumber,
        category: caseItem.category,
        priority: caseItem.priority,
        description: caseItem.description,
        court: caseItem.court,
        judge: caseItem.judge,
        status: caseItem.status,
        clientName: caseItem.clientName,
        clientId: caseItem.clientId,
        assignedLawyerUid: caseItem.assignedLawyerUid,
        assignedLawyerName: caseItem.assignedLawyerName,
        nextHearingDate: caseItem.nextHearingDate,
        lastActivityDate: caseItem.lastActivityDate,
        tags: caseItem.tags || [],
        createdAt: caseItem.createdAt,
        updatedAt: caseItem.updatedAt,
      }));
      setCases(formattedCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this case?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete case');
      }

      setSuccessMessage('Case deleted successfully!');
      await fetchCases();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const handleStatusChange = async (caseId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cases/${caseId}`, {
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

      setSuccessMessage('Case status updated!');
      await fetchCases();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating case:', error);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesCourt = courtFilter === 'All Courts' || c.court === courtFilter;

    return matchesSearch && matchesStatus && matchesCourt;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3 animate-in">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

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
      <div className="card p-6 flex flex-col md:flex-row items-center gap-4">
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
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-sm w-full md:w-40"
          >
            <option>All Statuses</option>
            {CASE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select 
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="input-field py-2 text-sm w-full md:w-40"
          >
            <option>All Courts</option>
            {PAKISTAN_COURTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-secondary p-2">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Case Table */}
      <div className="card overflow-hidden min-h-[900px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Case Info</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Court</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Next Hearing</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-6 text-xs font-bold text-neutral-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
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
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                          <Scale className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{c.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{c.caseNumber || 'No ID'} • {c.clientName || 'Unknown Client'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-neutral-700 font-medium">{c.court || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`badge ${CASE_STATUSES.find(s => s.value === c.status)?.color || 'bg-neutral-100 text-neutral-600'}`}>
                        {CASE_STATUSES.find(s => s.value === c.status)?.label || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`badge ${CASE_PRIORITIES.find(p => p.value === c.priority)?.color || 'bg-neutral-100 text-neutral-600'}`}>
                        {CASE_PRIORITIES.find(p => p.value === c.priority)?.label || c.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700 font-medium">{formatDate(c.nextHearingDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-neutral-500">{formatDate(c.lastActivityDate) || 'Just now'}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="group relative">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded-lg transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button 
                            onClick={(e) => navigate(`/cases/${c.id}`)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                          >
                            <Edit2 className="w-4 h-4" />
                            View Details
                          </button>
                          <div className="border-t border-neutral-100">
                            <button 
                              onClick={(e) => handleStatusChange(c.id, c.status === 'ACTIVE' ? 'ON_HOLD' : 'ACTIVE', e)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                            >
                              {c.status === 'ACTIVE' ? 'Put On Hold' : 'Reactivate'}
                            </button>
                            <button 
                              onClick={(e) => handleStatusChange(c.id, 'CLOSED', e)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                            >
                              Close Case
                            </button>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteCase(c.id, e)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-error/10 text-error rounded-b-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
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
        <div className="px-6 py-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
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

