import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { Hearing, UserRole } from '../types';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const revenueData = [
  { name: 'Jan', value: 45000 },
  { name: 'Feb', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Apr', value: 61000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 67000 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);

  // Shared state for different dashboards
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [upcomingHearingsCount, setUpcomingHearingsCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCasesCount(data.activeCases || 0);
        setUpcomingHearingsCount(data.upcomingHearings || 0);
        setClientsCount(data.totalClients || 0);
        setPendingTasksCount(data.pendingTasks || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch upcoming hearings
  const fetchUpcomingHearings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/upcoming-hearings?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUpcomingHearings(data);
      }
    } catch (error) {
      console.error('Error fetching upcoming hearings:', error);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/recent-activities?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // Fetch my tasks
  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/my-tasks?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMyTasks(data);
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  // Fetch my cases
  const fetchMyCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/my-cases?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMyCases(data);
      }
    } catch (error) {
      console.error('Error fetching my cases:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchUpcomingHearings(),
          fetchRecentActivities(),
          fetchMyTasks(),
          fetchMyCases(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case UserRole.ADMIN:
        return <AdminDashboard stats={{ activeCasesCount, upcomingHearingsCount, clientsCount, pendingTasksCount }} upcomingHearings={upcomingHearings} activities={activities} />;
      case UserRole.LAWYER:
        return <LawyerDashboard stats={{ activeCasesCount, upcomingHearingsCount, pendingTasksCount }} upcomingHearings={upcomingHearings} activities={activities} myTasks={myTasks} />;
      case UserRole.STAFF:
        return <StaffDashboard role={userProfile.role} stats={{ pendingTasksCount }} upcomingHearings={upcomingHearings} myTasks={myTasks} activities={activities} />;
      case UserRole.CLIENT:
        return <ClientDashboard />;
      default:
        return <LawyerDashboard stats={{ activeCasesCount, upcomingHearingsCount, pendingTasksCount }} upcomingHearings={upcomingHearings} activities={activities} myTasks={myTasks} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {userProfile?.role === UserRole.CLIENT ? 'Welcome back,' : 'Assalam-o-Alaikum,'} {userProfile?.displayName || 'User'}
          </h1>
          <p className="text-neutral-500 mt-1">
            {userProfile?.role === UserRole.CLIENT 
              ? "Here's the latest update on your legal matters." 
              : "Here's what's happening with your cases today."}
          </p>
        </div>
        {userProfile?.role !== UserRole.CLIENT && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/calendar')}
              className="btn btn-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </button>
          </div>
        )}
      </div>

      {renderDashboard()}
    </div>
  );
}

// Sub-components for different roles
function AdminDashboard({ stats, upcomingHearings }: any) {
  const navigate = useNavigate();

  const dashboardStats = [
    { label: 'Total Active Cases', value: stats.activeCasesCount.toString(), change: '+12%', trend: 'up', icon: Briefcase, color: 'text-primary-600', bg: 'bg-primary-50', action: () => navigate('/cases') },
    { label: 'Upcoming Hearings', value: stats.upcomingHearingsCount.toString(), change: '+4', trend: 'up', icon: Calendar, color: 'text-warning', bg: 'bg-warning/10', action: () => navigate('/hearings') },
    { label: 'Total Clients', value: stats.clientsCount.toString(), change: '+2', trend: 'up', icon: Users, color: 'text-success', bg: 'bg-success/10', action: () => navigate('/clients') },
    { label: 'Pending Tasks', value: stats.pendingTasksCount.toString(), change: '-5%', trend: 'down', icon: Clock, color: 'text-info', bg: 'bg-info/10', action: () => navigate('/tasks') },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">System-wide Analytics</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <UpcomingHearingsWidget hearings={upcomingHearings} count={stats.upcomingHearingsCount} />
      </div>
    </div>
  );
}

function LawyerDashboard({ stats, upcomingHearings, activities = [] }: any) {
  const navigate = useNavigate();

  const dashboardStats = [
    { label: 'My Active Cases', value: stats.activeCasesCount.toString(), change: '+2', trend: 'up', icon: Briefcase, color: 'text-primary-600', bg: 'bg-primary-50', action: () => navigate('/cases') },
    { label: 'My Hearings', value: stats.upcomingHearingsCount.toString(), change: 'Next: Tomorrow', trend: 'up', icon: Calendar, color: 'text-warning', bg: 'bg-warning/10', action: () => navigate('/hearings') },
    { label: 'My Tasks', value: stats.pendingTasksCount.toString(), change: '3 Due Today', trend: 'down', icon: Clock, color: 'text-info', bg: 'bg-info/10', action: () => navigate('/tasks') },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardStats.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UpcomingHearingsWidget hearings={upcomingHearings} count={stats.upcomingHearingsCount} />
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Recent Case Updates</h3>
          <RecentActivityList activities={activities} />
        </div>
      </div>
    </div>
  );
}

function StaffDashboard({ role, stats, upcomingHearings, myTasks = [], activities = [] }: any) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => navigate('/tasks')}
          className="card p-6 flex items-start justify-between cursor-pointer hover:shadow-lg hover:scale-105 transition-all">
          <div>
            <p className="text-sm font-medium text-neutral-500">Assigned Tasks</p>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stats.pendingTasksCount}</h3>
            <p className="text-xs text-neutral-400 mt-2">Focus on high priority tasks first</p>
          </div>
          <div className="p-3 rounded-xl bg-info/10 text-info">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div 
          onClick={() => navigate('/hearings')}
          className="card p-6 flex items-start justify-between cursor-pointer hover:shadow-lg hover:scale-105 transition-all">
          <div>
            <p className="text-sm font-medium text-neutral-500">Upcoming Hearings</p>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{upcomingHearings.length}</h3>
            <p className="text-xs text-neutral-400 mt-2">Prepare briefs for upcoming sessions</p>
          </div>
          <div className="p-3 rounded-xl bg-warning/10 text-warning">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">My Task List</h3>
          <PriorityTasksList tasks={myTasks} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Case History & Updates</h3>
          <RecentActivityList activities={activities} />
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-primary-900 text-white">
          <h3 className="text-lg font-bold mb-2">Case Progress</h3>
          <p className="text-primary-200 text-sm mb-6">Your main case is currently in the "Evidence Collection" phase.</p>
          <div className="w-full bg-primary-800 rounded-full h-2 mb-2">
            <div className="bg-primary-400 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-xs font-bold text-right">65% Complete</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Recent Invoices</h3>
          <p className="text-neutral-500 text-sm mb-6">You have 1 pending invoice for this month.</p>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-primary-600 border border-neutral-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">INV-2024-001</p>
                <p className="text-xs text-neutral-500">Due: 30 Mar 2024</p>
              </div>
            </div>
            <p className="text-sm font-bold text-neutral-900">PKR 15,000</p>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Upcoming Milestones</h3>
        <div className="space-y-4">
          {[
            { title: 'Next Court Hearing', date: '25 Mar 2024', status: 'Scheduled' },
            { title: 'Document Submission', date: '28 Mar 2024', status: 'Pending' },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">{m.title}</p>
                  <p className="text-xs text-neutral-500">{m.date}</p>
                </div>
              </div>
              <span className="badge bg-primary-100 text-primary-700">{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper UI Components
function StatCard({ stat }: any) {
  return (
    <div 
      onClick={stat.action}
      className="card p-6 flex items-start justify-between cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
    >
      <div>
        <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
        <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</h3>
        <div className="flex items-center gap-1 mt-2">
          {stat.trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 text-success" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-error" />
          )}
          <span className={stat.trend === 'up' ? 'text-success' : 'text-error'}>
            {stat.change}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
        <stat.icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function UpcomingHearingsWidget({ hearings, count }: any) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-neutral-900">Upcoming Hearings</h3>
        <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {hearings.length > 0 ? (
          hearings.map((hearing: any) => (
            <div key={hearing.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group cursor-pointer border border-transparent hover:border-neutral-200">
              <div className="flex flex-col items-center justify-center min-w-[50px] py-2 bg-neutral-100 rounded-lg group-hover:bg-white transition-colors">
                <span className="text-xs font-bold text-neutral-500 uppercase">
                  {new Date(hearing.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {new Date(hearing.date).getHours()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neutral-900 truncate">{hearing.caseTitle}</h4>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{hearing.court}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-500 italic text-center py-8">No upcoming hearings found.</p>
        )}
      </div>
    </div>
  );
}

function RecentActivityList({ activities = [] }: any) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return FileText;
      case 'CheckCircle2':
        return CheckCircle2;
      case 'AlertCircle':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100">
      {activities.length > 0 ? (
        activities.map((activity: any, i: number) => {
          const IconComponent = getIcon(activity.icon);
          return (
            <div key={i} className="flex gap-4 relative">
              <div className={`w-8 h-8 rounded-full ${activity.bg} ${activity.color} flex items-center justify-center z-10 border-4 border-white`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-neutral-700 font-medium">{activity.text}</p>
                <p className="text-xs text-neutral-400 mt-1">{getTimeAgo(activity.time)}</p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-neutral-500 italic text-center py-8">No recent activities.</p>
      )}
    </div>
  );
}

function PriorityTasksList({ tasks = [] }: any) {
  const getDueDate = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return `${diffDays}d`;
    return taskDate.toLocaleDateString('en-PK', { day: 'short', month: 'short' });
  };

  return (
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task: any, i: number) => (
          <div key={task._id || i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 border-neutral-300"></div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">{task.title}</h4>
                <p className="text-xs text-neutral-500">{task.caseId}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                task.priority === 'HIGH' ? 'bg-error/10 text-error' : task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'
              }`}>
                {task.priority}
              </span>
              <p className="text-[10px] text-neutral-400 mt-1 font-medium">Due {getDueDate(task.dueDate)}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-neutral-500 italic text-center py-8">No tasks assigned.</p>
      )}
    </div>
  );
}
