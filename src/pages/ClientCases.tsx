import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Briefcase, Calendar, ChevronRight, Clock, Loader2, Search, Scale } from 'lucide-react';
import { Case } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OPEN_STATUSES = ['ACTIVE', 'PENDING', 'ON_HOLD'];

function getStatusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-primary-100 text-primary-700';
  if (status === 'PENDING') return 'bg-warning/10 text-warning';
  if (status === 'ON_HOLD') return 'bg-info/10 text-info';
  return 'bg-neutral-100 text-neutral-600';
}

function formatDate(value?: string | Date) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default function ClientCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load your cases');
        }

        const data = await response.json();
        setCases(data.map((item: any) => ({
          id: item._id,
          title: item.title,
          caseNumber: item.caseNumber,
          category: item.category,
          priority: item.priority,
          description: item.description,
          court: item.court,
          judge: item.judge,
          status: item.status,
          clientName: item.clientName,
          clientId: item.clientId,
          clientUid: item.clientUid,
          clientEmail: item.clientEmail,
          assignedLawyerUid: item.assignedLawyerUid,
          assignedLawyerName: item.assignedLawyerName,
          nextHearingDate: item.nextHearingDate,
          lastActivityDate: item.lastActivityDate,
          tags: item.tags || [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const openCases = useMemo(
    () => cases.filter((caseItem) => OPEN_STATUSES.includes(caseItem.status)),
    [cases]
  );

  const filteredCases = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return openCases.filter((caseItem) => (
      caseItem.title.toLowerCase().includes(query) ||
      caseItem.caseNumber.toLowerCase().includes(query) ||
      caseItem.court.toLowerCase().includes(query) ||
      caseItem.assignedLawyerName.toLowerCase().includes(query)
    ));
  }, [openCases, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading your cases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Cases</h1>
          <p className="text-neutral-500 text-sm mt-1">Open legal matters linked to your client profile.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Open Cases', value: openCases.length, icon: Briefcase, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Upcoming Hearings', value: openCases.filter((caseItem) => caseItem.nextHearingDate).length, icon: Calendar, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Assigned Lawyers', value: new Set(openCases.map((caseItem) => caseItem.assignedLawyerUid).filter(Boolean)).size, icon: Scale, color: 'text-info', bg: 'bg-info/10' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase">{stat.label}</p>
              <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search your cases by title, number, court, or lawyer..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Case</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Court</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Next Hearing</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Lawyer</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCases.length > 0 ? (
                filteredCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-neutral-900">{caseItem.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{caseItem.caseNumber} - {caseItem.category}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-neutral-700">{caseItem.court}</td>
                    <td className="px-6 py-5">
                      <span className={`badge ${getStatusClass(caseItem.status)}`}>{caseItem.status}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        {formatDate(caseItem.nextHearingDate)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-neutral-700">{caseItem.assignedLawyerName || 'Not assigned'}</td>
                    <td className="px-6 py-5 text-right">
                      <Link to={`/my-cases/${caseItem.id}`} className="btn btn-secondary py-1.5 px-3 text-xs">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    {openCases.length === 0 ? 'No open cases are linked to your profile yet.' : 'No open cases match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
