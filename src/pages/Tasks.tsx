import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Task } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical, 
  Calendar, 
  User, 
  Briefcase,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Implement tasks API integration
  useEffect(() => {
    // Tasks fetching will be implemented when backend service is ready
    setTasks([]);
  }, [user]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.caseId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = activeFilter === 'All' || 
                         (activeFilter === 'To Do' && task.status === 'TODO') ||
                         (activeFilter === 'In Progress' && task.status === 'IN_PROGRESS') ||
                         (activeFilter === 'Completed' && task.status === 'COMPLETED');
    
    return matchesSearch && matchesStatus;
  });

  const activeTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tasks & Workflow</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage case-linked tasks and team operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            View Completed
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-primary-600 text-white border-none shadow-lg shadow-primary-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Active Tasks</span>
          </div>
          <h3 className="text-3xl font-bold">{activeTasksCount}</h3>
          <p className="text-primary-100 text-sm mt-1">Requires attention</p>
        </div>
        <div className="card p-6 border-l-4 border-l-warning">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center text-warning">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">High Priority</span>
          </div>
          <h3 className="text-3xl font-bold text-neutral-900">{highPriorityCount}</h3>
          <p className="text-neutral-500 text-sm mt-1">Requires immediate attention</p>
        </div>
        <div className="card p-6 border-l-4 border-l-success">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Completed</span>
          </div>
          <h3 className="text-3xl font-bold text-neutral-900">{completedCount}</h3>
          <p className="text-neutral-500 text-sm mt-1">Total tasks completed</p>
        </div>
      </div>

      {/* Filters & List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Status</h3>
            <div className="space-y-1">
              {['All', 'To Do', 'In Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === status 
                      ? "bg-primary-600 text-white" 
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {status}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeFilter === status ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {status === 'All' ? tasks.length : 
                     status === 'To Do' ? tasks.filter(t => t.status === 'TODO').length :
                     status === 'In Progress' ? tasks.filter(t => t.status === 'IN_PROGRESS').length :
                     tasks.filter(t => t.status === 'COMPLETED').length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Assignee</h3>
            <div className="space-y-3">
              {[
                { name: 'Adv. Abdullah', count: tasks.filter(t => t.assignedTo === 'Adv. Abdullah').length },
                { name: 'Sarah Khan', count: tasks.filter(t => t.assignedTo === 'Sarah Khan').length },
                { name: 'Zaid Malik', count: tasks.filter(t => t.assignedTo === 'Zaid Malik').length },
              ].map((person, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                      {person.name[0]}
                    </div>
                    <span className="text-xs font-medium text-neutral-700">{person.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">{person.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10" 
              />
            </div>
            <button className="btn btn-secondary p-2">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="card p-4 hover:border-primary-300 transition-all group cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <button className={`mt-1 w-5 h-5 rounded border-2 transition-colors ${
                      task.status === 'COMPLETED' ? 'bg-success border-success' : 'border-neutral-300 hover:border-primary-500'
                    }`}>
                      {task.status === 'COMPLETED' && <CheckCircle2 className="w-full h-full text-white" />}
                    </button>
                    <div>
                      <h4 className={`text-base font-bold text-neutral-900 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Briefcase className="w-3.5 h-3.5" />
                          {task.caseId}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <User className="w-3.5 h-3.5" />
                          {task.assignedTo}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`badge ${
                      task.priority === 'HIGH' ? 'bg-error/10 text-error' : 
                      task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' : 
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {task.priority}
                    </span>
                    <button className="p-1 text-neutral-300 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-10 text-neutral-500">
                No tasks found.
              </div>
            )}
          </div>
          
          <button className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-bold text-sm hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Task
          </button>
        </div>
      </div>
    </div>
  );
}
