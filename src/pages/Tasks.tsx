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
  Calendar, 
  User, 
  Briefcase,
  Loader2,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    caseId: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'TODO',
  });

  // Fetch tasks on mount
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      const formattedTasks = data.map((task: any) => ({
        id: task._id,
        title: task.title,
        description: task.description,
        caseId: task.caseId,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
      }));
      setTasks(formattedTasks);
      setSubmitError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:5000/api/tasks/${editingId}`
        : 'http://localhost:5000/api/tasks';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || undefined,
          caseId: newTask.caseId.trim() || undefined,
          dueDate: newTask.dueDate,
          priority: newTask.priority,
          status: newTask.status,
          assignedTo: user?.uid,
          assignedToName: user?.displayName,
        }),
      });

      if (!response.ok) {
        throw new Error(editingId ? 'Failed to update task' : 'Failed to add task');
      }

      setSuccessMessage(editingId ? 'Task updated successfully!' : 'Task created successfully!');
      setShowModal(false);
      setEditingId(null);
      setNewTask({
        title: '',
        description: '',
        caseId: '',
        dueDate: '',
        priority: 'MEDIUM',
        status: 'TODO',
      });

      await fetchTasks();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save task.';
      setSubmitError(message);
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      setSuccessMessage(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}`);
      await fetchTasks();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setSuccessMessage('Task deleted successfully!');
      await fetchTasks();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingId(task.id);
    setNewTask({
      title: task.title,
      description: task.description || '',
      caseId: task.caseId || '',
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    });
    setShowModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (task.caseId && task.caseId.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
          <button 
            onClick={() => {
              setEditingId(null);
              setNewTask({
                title: '',
                description: '',
                caseId: '',
                dueDate: '',
                priority: 'MEDIUM',
                status: 'TODO',
              });
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3 animate-in">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{submitError}</p>
          </div>
        </div>
      )}

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
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                {tasks.length === 0 ? 'No tasks yet. Create one to get started!' : 'No tasks found matching your search.'}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="card p-4 hover:border-primary-300 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => handleUpdateStatus(
                          task.id, 
                          task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                        )}
                        className={`mt-1 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          task.status === 'COMPLETED' ? 'bg-success border-success' : 'border-neutral-300 hover:border-primary-500'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <h4 className={`text-base font-bold text-neutral-900 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-neutral-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2">
                          {task.caseId && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                              <Briefcase className="w-3.5 h-3.5" />
                              {task.caseId}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
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
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {tasks.length === 0 && (
            <button 
              onClick={() => {
                setEditingId(null);
                setNewTask({
                  title: '',
                  description: '',
                  caseId: '',
                  dueDate: '',
                  priority: 'MEDIUM',
                  status: 'TODO',
                });
                setShowModal(true);
              }}
              className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-bold text-sm hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Task
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} 
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Task Title *</label>
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="input-field" 
                  placeholder="e.g., Draft motion for hearing"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Description</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="input-field resize-none" 
                  placeholder="Add task details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Case ID (Optional)</label>
                  <input 
                    type="text" 
                    value={newTask.caseId}
                    onChange={(e) => setNewTask({...newTask, caseId: e.target.value})}
                    className="input-field" 
                    placeholder="e.g., LHC-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Due Date *</label>
                  <input 
                    type="date" 
                    required
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="input-field"
                  >
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Status</label>
                  <select 
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                    className="input-field"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="btn btn-secondary px-6"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary px-8"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
