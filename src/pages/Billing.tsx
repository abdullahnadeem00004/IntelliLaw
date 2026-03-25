import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Invoice } from '../types';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 120000, expenses: 45000 },
  { name: 'Feb', revenue: 145000, expenses: 52000 },
  { name: 'Mar', revenue: 132000, expenses: 48000 },
  { name: 'Apr', revenue: 168000, expenses: 61000 },
  { name: 'May', revenue: 155000, expenses: 55000 },
  { name: 'Jun', revenue: 185000, expenses: 67000 },
];

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Implement billing/invoices API integration

  useEffect(() => {
    // Invoices fetching will be implemented when backend service is ready
    setInvoices([]);
    setLoading(false);
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.caseId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalRevenue = invoices.reduce((sum, inv) => inv.status === 'PAID' ? sum + inv.amount : sum, 0);
  const outstanding = invoices.reduce((sum, inv) => inv.status !== 'PAID' ? sum + inv.amount : sum, 0);
  const overdue = invoices.reduce((sum, inv) => inv.status === 'OVERDUE' ? sum + inv.amount : sum, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Billing & Revenue</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage invoices, track payments, and analyze firm revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Financial Report
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}`, change: '+12.5%', trend: 'up', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Outstanding', value: `PKR ${outstanding.toLocaleString()}`, change: '+PKR 12k', trend: 'up', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Collected', value: `PKR ${totalRevenue.toLocaleString()}`, change: '85%', trend: 'up', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Overdue', value: `PKR ${overdue.toLocaleString()}`, change: '-2%', trend: 'down', icon: AlertCircle, color: 'text-error', bg: 'bg-error/10' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-lg font-bold text-neutral-900 mt-1">{stat.value}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[10px] font-bold ${stat.trend === 'up' ? 'text-success' : 'text-error'}`}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-neutral-400">vs last month</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900">Revenue vs Expenses</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                <span className="text-xs text-neutral-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                <span className="text-xs text-neutral-500">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Payment Status</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: invoices.filter(i => i.status === 'PAID').length },
                    { name: 'Unpaid', value: invoices.filter(i => i.status === 'UNPAID').length },
                    { name: 'Partial', value: invoices.filter(i => i.status === 'PARTIAL').length },
                    { name: 'Overdue', value: invoices.filter(i => i.status === 'OVERDUE').length },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-neutral-900">
                {invoices.length > 0 ? Math.round((invoices.filter(i => i.status === 'PAID').length / invoices.length) * 100) : 0}%
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Collection</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Paid', value: invoices.filter(i => i.status === 'PAID').length, color: 'bg-primary-500' },
              { label: 'Unpaid', value: invoices.filter(i => i.status === 'UNPAID').length, color: 'bg-success' },
              { label: 'Partial', value: invoices.filter(i => i.status === 'PARTIAL').length, color: 'bg-warning' },
              { label: 'Overdue', value: invoices.filter(i => i.status === 'OVERDUE').length, color: 'bg-error' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-xs text-neutral-600">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-50/50">
          <h3 className="text-lg font-bold text-neutral-900">Recent Invoices</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search invoices..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-1.5 text-sm" 
              />
            </div>
            <button className="btn btn-secondary p-2">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Case ID</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-900">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{inv.caseId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">PKR {inv.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      inv.status === 'PAID' ? 'bg-success/10 text-success' : 
                      inv.status === 'OVERDUE' ? 'bg-error/10 text-error' : 
                      'bg-warning/10 text-warning'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-500">{new Date(inv.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    No invoices found.
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
