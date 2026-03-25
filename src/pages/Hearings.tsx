import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Hearing } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  MoreVertical, 
  Plus, 
  Search,
  Filter,
  Scale,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  X,
  Check
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

export default function Hearings() {
  const { user } = useAuth();
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ADJOURNED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);

  const [formData, setFormData] = useState({
    caseId: '',
    caseTitle: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    court: '',
    purpose: '',
    status: 'UPCOMING',
    priority: 'MEDIUM',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchHearings();
  }, [user]);

  // Fetch hearings from backend
  const fetchHearings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hearings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHearings(data);
      }
    } catch (error) {
      console.error('Error fetching hearings:', error);
      setErrorMessage('Failed to load hearings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases for dropdown
  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cases', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  // Handle add hearing
  const handleAddHearing = async () => {
    if (!formData.caseId || !formData.date || !formData.time || !formData.court || !formData.purpose) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hearings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage('Hearing added successfully');
        setShowAddModal(false);
        resetForm();
        await fetchHearings();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to add hearing');
      }
    } catch (error) {
      console.error('Error adding hearing:', error);
      setErrorMessage('Error adding hearing');
    }
  };

  // Handle update hearing
  const handleUpdateHearing = async () => {
    if (!selectedHearing?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hearings/${selectedHearing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage('Hearing updated successfully');
        setShowEditModal(false);
        resetForm();
        await fetchHearings();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update hearing');
      }
    } catch (error) {
      console.error('Error updating hearing:', error);
      setErrorMessage('Error updating hearing');
    }
  };

  // Handle delete hearing
  const handleDeleteHearing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hearing?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hearings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Hearing deleted successfully');
        await fetchHearings();
      } else {
        setErrorMessage('Failed to delete hearing');
      }
    } catch (error) {
      console.error('Error deleting hearing:', error);
      setErrorMessage('Error deleting hearing');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      caseId: '',
      caseTitle: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      court: '',
      purpose: '',
      status: 'UPCOMING',
      priority: 'MEDIUM',
      notes: '',
    });
    setSelectedHearing(null);
    setShowCaseDropdown(false);
    setCaseSearchQuery('');
  };

  // Open edit modal
  const openEditModal = (hearing: Hearing) => {
    setSelectedHearing(hearing);
    setFormData({
      caseId: hearing.caseId,
      caseTitle: hearing.caseTitle,
      date: hearing.date.split('T')[0],
      time: hearing.time,
      court: hearing.court,
      purpose: hearing.purpose,
      status: hearing.status,
      priority: hearing.priority,
      notes: hearing.notes || '',
    });
    setShowEditModal(true);
    fetchCases();
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Apply filters
  const filteredHearings = hearings.filter(h => {
    const matchesSearch = h.caseId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         h.court.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         h.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || h.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading hearing schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Hearing Schedule</h1>
          <p className="text-neutral-500 text-sm mt-1">Track and manage all upcoming court appearances.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-neutral-200 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  view === v ? "bg-primary-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
              fetchCases();
            }}
            className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Hearing
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-neutral-900">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-500" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search hearings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-1.5 text-sm w-64" 
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field py-1.5 text-sm">
            <option value="ALL">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ADJOURNED">Adjourned</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="input-field py-1.5 text-sm">
            <option value="ALL">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Weekly View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, i) => {
          const dayHearings = filteredHearings.filter(h => isSameDay(parseISO(h.date), day));
          const isToday = isSameDay(day, new Date());

          return (
            <div key={i} className="space-y-4">
              <div className={`text-center p-2 rounded-xl border ${
                isToday ? "bg-primary-600 border-primary-600 text-white" : "bg-white border-neutral-200 text-neutral-900"
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-primary-100" : "text-neutral-400"}`}>
                  {format(day, 'EEE')}
                </p>
                <p className="text-lg font-bold">{format(day, 'd')}</p>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {dayHearings.length > 0 ? (
                  dayHearings.map((hearing) => (
                    <div 
                      key={hearing.id} 
                      className={`card p-3 border-l-4 cursor-pointer hover:shadow-md transition-all group ${
                        hearing.status === 'UPCOMING' ? 'border-l-primary-500' : 'border-l-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{hearing.time}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(hearing);
                            }}
                            className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHearing(hearing.id || '');
                            }}
                            className="p-1 text-neutral-400 hover:text-error hover:bg-error/10 rounded transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mb-1">{hearing.caseTitle}</h4>
                      <p className="text-[10px] text-neutral-500 truncate mb-2">{hearing.court}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            hearing.priority === 'HIGH' ? 'bg-error' :
                            hearing.priority === 'MEDIUM' ? 'bg-warning' :
                            'bg-success'
                          }`}></div>
                          <span className={`text-[9px] font-bold uppercase ${
                            hearing.priority === 'HIGH' ? 'text-error' :
                            hearing.priority === 'MEDIUM' ? 'text-warning' :
                            'text-success'
                          }`}>
                            {hearing.priority}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          hearing.status === 'UPCOMING' ? 'bg-primary-100 text-primary-700' :
                          hearing.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                          hearing.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {hearing.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full border-2 border-dashed border-neutral-100 rounded-2xl flex items-center justify-center">
                    <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest rotate-90">No Hearings</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Conflict Warning */}
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-4">
        <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center text-warning">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-neutral-900">AI Scheduling Conflict Detected</h4>
          <p className="text-xs text-neutral-600 mt-0.5">
            You have two hearings scheduled at the same time in Lahore High Court and District Court on March 25. 
            Would you like to request an adjournment for one?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary py-1.5 px-3 text-xs">Dismiss</button>
          <button className="btn btn-primary py-1.5 px-3 text-xs bg-warning border-warning hover:bg-warning/90">Resolve Now</button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 p-4 bg-success/10 border border-success text-success rounded-lg flex items-center gap-3 animate-in slide-in-from-bottom">
          <Check className="w-5 h-5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 p-4 bg-error/10 border border-error text-error rounded-lg flex items-center gap-3 animate-in slide-in-from-bottom">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Add Hearing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-neutral-900">Add Hearing</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-all">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Case Selection */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Case *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCaseDropdown(!showCaseDropdown);
                      if (!showCaseDropdown && cases.length === 0) {
                        fetchCases();
                      }
                    }}
                    className="input-field w-full text-left flex items-center justify-between">
                    <span>{formData.caseTitle || 'Select a case...'}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showCaseDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showCaseDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                      <div className="p-2 border-b border-neutral-200 sticky top-0">
                        <div className="relative flex items-center">
                          <Search className="absolute left-2.5 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            placeholder="Search cases..."
                            value={caseSearchQuery}
                            onChange={(e) => setCaseSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-2 w-full text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-600"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {cases
                          .filter((c) => 
                            c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                            c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                          )
                          .map((caseItem) => (
                            <button
                              key={caseItem._id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, caseId: caseItem._id, caseTitle: caseItem.title});
                                setShowCaseDropdown(false);
                                setCaseSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors flex flex-col gap-0.5 border-b border-neutral-100 last:border-b-0">
                              <p className="text-sm font-medium text-neutral-900">{caseItem._id}</p>
                              <p className="text-xs text-neutral-500">{caseItem.title}</p>
                            </button>
                          ))}
                        {cases.filter((c) => 
                          c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                          c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-6 text-center text-sm text-neutral-500">
                            No cases found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Court */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Court *</label>
                <input
                  type="text"
                  placeholder="e.g., District Court"
                  value={formData.court}
                  onChange={(e) => setFormData({...formData, court: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g., Motion Hearing"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-field">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="input-field">
                  <option value="UPCOMING">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ADJOURNED">Adjourned</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleAddHearing}
                  className="btn btn-primary flex-1">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hearing Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-neutral-900">Edit Hearing</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-all">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Case Selection */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Case *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCaseDropdown(!showCaseDropdown);
                      if (!showCaseDropdown && cases.length === 0) {
                        fetchCases();
                      }
                    }}
                    className="input-field w-full text-left flex items-center justify-between">
                    <span>{formData.caseTitle || 'Select a case...'}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showCaseDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showCaseDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                      <div className="p-2 border-b border-neutral-200 sticky top-0">
                        <div className="relative flex items-center">
                          <Search className="absolute left-2.5 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            placeholder="Search cases..."
                            value={caseSearchQuery}
                            onChange={(e) => setCaseSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-2 w-full text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-600"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {cases
                          .filter((c) => 
                            c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                            c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                          )
                          .map((caseItem) => (
                            <button
                              key={caseItem._id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, caseId: caseItem._id, caseTitle: caseItem.title});
                                setShowCaseDropdown(false);
                                setCaseSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors flex flex-col gap-0.5 border-b border-neutral-100 last:border-b-0">
                              <p className="text-sm font-medium text-neutral-900">{caseItem._id}</p>
                              <p className="text-xs text-neutral-500">{caseItem.title}</p>
                            </button>
                          ))}
                        {cases.filter((c) => 
                          c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                          c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-6 text-center text-sm text-neutral-500">
                            No cases found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Court */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Court *</label>
                <input
                  type="text"
                  placeholder="e.g., District Court"
                  value={formData.court}
                  onChange={(e) => setFormData({...formData, court: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g., Motion Hearing"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-field">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="input-field">
                  <option value="UPCOMING">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ADJOURNED">Adjourned</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleUpdateHearing}
                  className="btn btn-primary flex-1">
                  <Check className="w-4 h-4" />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}