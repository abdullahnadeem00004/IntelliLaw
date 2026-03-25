import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Hearing } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  MapPin, 
  Briefcase,
  AlertCircle,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';

export default function Calendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
        setShowCaseDropdown(false);
        setCaseSearchQuery('');
        await fetchHearings();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to add hearing');
      }
    } catch (error) {
      console.error('Error adding hearing:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error adding hearing');
    }
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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{format(currentMonth, 'MMMM yyyy')}</h1>
            <p className="text-sm text-neutral-500">Manage your legal schedule and hearings.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-1 rounded-xl mr-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-sm font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => {
              setShowAddModal(true);
              fetchCases();
            }}
            className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {calendarDays.map((day, i) => {
          const dayHearings = hearings.filter(h => {
            const hearingDate = new Date(h.date);
            return isSameDay(hearingDate, day);
          });
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] bg-white p-3 transition-all cursor-pointer hover:bg-neutral-50 ${
                !isSameMonth(day, monthStart) ? "text-neutral-300" : "text-neutral-900"
              } ${isSameDay(day, new Date()) ? "bg-primary-50/30" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                  isSameDay(day, new Date()) ? "bg-primary-600 text-white" : ""
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayHearings.map((hearing, j) => (
                  <div 
                    key={j} 
                    className={`text-[10px] font-bold p-1.5 rounded-md truncate bg-primary-100 text-primary-700 border-l-2 border-l-primary-600`}
                  >
                    {hearing.caseTitle}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {renderHeader()}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Main */}
        <div className="lg:col-span-3">
          {renderDays()}
          {renderCells()}
        </div>

        {/* Sidebar: Selected Date Details */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">
              Schedule for {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <div className="space-y-4">
              {hearings.filter(h => isSameDay(new Date(h.date), selectedDate)).length > 0 ? (
                hearings.filter(h => isSameDay(new Date(h.date), selectedDate)).map((event, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-700`}>
                        {event.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold">
                        {event.time}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900">{event.caseTitle}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <MapPin className="w-3 h-3" />
                        {event.court}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        event.priority === 'HIGH' ? 'bg-error/10 text-error' :
                        event.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {event.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      {event.purpose}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mx-auto mb-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-neutral-500">No events scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Conflict Detection */}
          <div className="p-6 bg-error/5 rounded-2xl border border-error/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-error" />
              <h3 className="text-sm font-bold text-error uppercase tracking-widest">AI Conflict Alert</h3>
            </div>
            <p className="text-xs text-error/80 leading-relaxed">
              AI is monitoring your schedule for potential hearing conflicts across different courts.
            </p>
            <button className="mt-4 text-xs font-bold text-error hover:underline">Run Analysis</button>
          </div>

          {/* Legend */}
          <div className="card p-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                <span className="text-xs text-neutral-600">Court Hearing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-xs text-neutral-600">Client Meeting</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-xs text-neutral-600">Task Deadline</span>
              </div>
            </div>
          </div>
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
                  setShowCaseDropdown(false);
                  setCaseSearchQuery('');
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
                    setShowCaseDropdown(false);
                    setCaseSearchQuery('');
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
    </div>
  );
}
