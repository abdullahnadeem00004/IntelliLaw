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
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

export default function Hearings() {
  const { user } = useAuth();
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    // Hearings fetching will be implemented when backend service is ready
    setHearings([]);
    setLoading(false);
  }, [user]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const filteredHearings = hearings.filter(h => 
    h.caseId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.court.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button className="btn btn-primary">
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
          <button className="btn btn-secondary p-2">
            <Filter className="w-4 h-4" />
          </button>
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
                        <button className="p-1 text-neutral-300 hover:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mb-1">{hearing.caseId}</h4>
                      <p className="text-[10px] text-neutral-500 truncate mb-2">{hearing.court}</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${hearing.status === 'UPCOMING' ? 'bg-success' : 'bg-neutral-400'}`}></div>
                        <span className={`text-[9px] font-bold uppercase ${hearing.status === 'UPCOMING' ? 'text-success' : 'text-neutral-400'}`}>
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
    </div>
  );
}
