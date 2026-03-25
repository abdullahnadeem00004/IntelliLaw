import React from 'react';
import { 
  Scale, 
  Briefcase, 
  Calendar, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  User
} from 'lucide-react';

export default function ClientPortal() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8 space-y-8 animate-in fade-in duration-500">
      {/* Client Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Scale className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome, Ahmed Ali</h1>
            <p className="text-neutral-500 mt-1">Your legal case overview and updates.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Lawyer
          </button>
          <button className="btn btn-primary">
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Invoice
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Updates */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Case Card */}
          <div className="card p-8 border-l-8 border-l-primary-600">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Active Case</span>
                <h2 className="text-2xl font-bold text-neutral-900 mt-1">State vs. Ahmed Ali</h2>
                <p className="text-sm text-neutral-500 mt-1">Case Number: LHC-2024-001 • Lahore High Court</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-neutral-400 uppercase">Next Hearing</p>
                <p className="text-lg font-bold text-neutral-900 mt-1">Mar 25, 2024</p>
                <p className="text-xs text-neutral-500">10:30 AM (PST)</p>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="relative pt-8 pb-4">
              <div className="absolute top-[44px] left-0 right-0 h-1 bg-neutral-100 rounded-full"></div>
              <div className="absolute top-[44px] left-0 w-2/3 h-1 bg-primary-600 rounded-full"></div>
              <div className="flex justify-between relative z-10">
                {[
                  { label: 'Filed', date: 'Jan 12', status: 'completed' },
                  { label: 'Initial Hearing', date: 'Feb 05', status: 'completed' },
                  { label: 'Evidence', date: 'Mar 15', status: 'current' },
                  { label: 'Final Verdict', date: 'TBD', status: 'upcoming' },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                      step.status === 'completed' ? "bg-primary-600 border-primary-100 text-white" :
                      step.status === 'current' ? "bg-white border-primary-600 text-primary-600" :
                      "bg-white border-neutral-100 text-neutral-400"
                    }`}>
                      {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                    </div>
                    <p className={`text-[10px] font-bold mt-3 uppercase tracking-wider ${
                      step.status === 'upcoming' ? "text-neutral-400" : "text-neutral-900"
                    }`}>{step.label}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{step.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Case Insight for Client */}
          <div className="p-6 bg-primary-900 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">AI Case Insight</span>
              </div>
              <p className="text-lg font-medium leading-relaxed">
                Your case is progressing well. The recent evidence submission has strengthened 
                your position by approximately 15%. Your lawyer has prepared a strong rebuttal 
                for the upcoming hearing.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
          </div>

          {/* Recent Documents */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-neutral-900">Shared Documents</h3>
              <button className="text-primary-600 text-sm font-bold hover:underline">Download All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Writ_Petition_Final.pdf', size: '2.4 MB', date: 'Mar 15, 2024' },
                { name: 'Court_Order_Adjournment.pdf', size: '1.1 MB', date: 'Mar 05, 2024' },
                { name: 'Witness_Statement_1.docx', size: '850 KB', date: 'Feb 28, 2024' },
                { name: 'Case_Summary_Report.pdf', size: '1.5 MB', date: 'Mar 20, 2024' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary-200 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 border border-neutral-200 group-hover:border-primary-200 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{doc.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{doc.size} • {doc.date}</p>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-primary-600">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          {/* Lawyer Info */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Your Legal Team</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl border-2 border-white shadow-sm">
                A
              </div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900">Adv. Abdullah</h4>
                <p className="text-sm text-neutral-500">Lead Counsel</p>
              </div>
            </div>
            <div className="space-y-4">
              <button className="btn btn-primary w-full py-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </button>
              <button className="btn btn-secondary w-full py-3">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Billing Summary */}
          <div className="card p-8 border-l-4 border-l-warning">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Billing Summary</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase">Outstanding Balance</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">PKR 12,000</p>
              </div>
              <div className="p-4 bg-warning/10 rounded-xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning" />
                <p className="text-xs text-warning font-bold">Due in 3 days (Mar 26)</p>
              </div>
              <button className="btn btn-primary w-full py-3 bg-warning border-warning hover:bg-warning/90">
                Pay Securely Now
              </button>
            </div>
          </div>

          {/* Quick Support */}
          <div className="card p-8 bg-neutral-900 text-white">
            <h3 className="text-lg font-bold mb-4">Need Help?</h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Our support team and AI assistant are available 24/7 to help you with any queries regarding your case.
            </p>
            <button className="w-full py-3 border border-white/20 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Support Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
