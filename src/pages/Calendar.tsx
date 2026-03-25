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
  Loader2
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

  useEffect(() => {
    // Hearings fetching will be implemented when backend service is ready
    setHearings([]);
    setLoading(false);
  }, [user]);

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
          <button className="btn btn-primary">
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
          const dayHearings = hearings.filter(h => isSameDay(parseISO(h.date), day));
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
              {hearings.filter(h => isSameDay(parseISO(h.date), selectedDate)).length > 0 ? (
                hearings.filter(h => isSameDay(parseISO(h.date), selectedDate)).map((event, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-700`}>
                        HEARING
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold">
                        {format(parseISO(event.date), 'hh:mm a')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900">{event.caseTitle}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <MapPin className="w-3 h-3" />
                      {event.court}
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
    </div>
  );
}
