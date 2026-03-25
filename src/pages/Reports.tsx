import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  Users, 
  Scale, 
  ChevronRight,
  Zap,
  Printer,
  Share2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('performance');

  const performanceData = [
    { name: 'Jan', won: 12, lost: 2, pending: 5 },
    { name: 'Feb', won: 15, lost: 1, pending: 8 },
    { name: 'Mar', won: 10, lost: 3, pending: 12 },
    { name: 'Apr', won: 18, lost: 2, pending: 6 },
  ];

  const caseTypeData = [
    { name: 'Civil', value: 45 },
    { name: 'Criminal', value: 25 },
    { name: 'Family', value: 20 },
    { name: 'Corporate', value: 10 },
  ];

  const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Analytics & Reports</h1>
          </div>
          <p className="text-neutral-500">Generate and export detailed reports on firm performance and case metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-xl w-fit">
        {[
          { id: 'performance', label: 'Case Performance', icon: Scale },
          { id: 'financial', label: 'Financial Summary', icon: TrendingUp },
          { id: 'team', label: 'Team Productivity', icon: Users },
          { id: 'clients', label: 'Client Insights', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeReport === tab.id 
                ? "bg-white text-primary-600 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Chart */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Case Outcome Trends</h3>
                <p className="text-sm text-neutral-500 mt-1">Monthly breakdown of won vs lost cases.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                  <span className="text-xs font-bold text-neutral-500">Won</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
                  <span className="text-xs font-bold text-neutral-500">Lost</span>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
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
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="won" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="lost" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="p-8 bg-primary-900 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest">AI Strategic Insights</h3>
              </div>
              <div className="space-y-4">
                <p className="text-lg font-medium leading-relaxed">
                  "Your firm's win rate in Civil cases has increased by 12% this quarter. 
                  However, the average case duration is 15% higher than the industry benchmark. 
                  Consider automating document drafting to improve efficiency."
                </p>
                <button className="text-sm font-bold text-primary-300 hover:text-white flex items-center gap-2 transition-colors">
                  View Full Efficiency Report
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
          </div>
        </div>

        {/* Right Column: Distribution & Summary */}
        <div className="space-y-8">
          {/* Distribution Chart */}
          <div className="card p-8">
            <h3 className="text-lg font-bold text-neutral-900 mb-8">Case Type Distribution</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {caseTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {caseTypeData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="text-sm text-neutral-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="card p-8 space-y-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Key Metrics</h3>
            <div className="space-y-6">
              {[
                { label: 'Average Case Value', value: 'PKR 450k', trend: '+5.2%', positive: true },
                { label: 'Client Retention', value: '92%', trend: '+1.8%', positive: true },
                { label: 'Avg. Resolution Time', value: '142 Days', trend: '-12 Days', positive: true },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">{stat.label}</p>
                    <p className="text-lg font-bold text-neutral-900 mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    stat.positive ? "bg-success/10 text-success" : "bg-error/10 text-error"
                  }`}>
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
