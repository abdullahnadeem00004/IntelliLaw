import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  MoreVertical, 
  Shield, 
  Briefcase, 
  Star, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';

export default function Team() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (!user) return;
    // Team members fetching will be implemented when backend service is ready
    setTeamMembers([]);
    setLoading(false);
  }, [user]);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Lawyers') return matchesSearch && member.role === UserRole.LAWYER;
    if (activeTab === 'Staff') return matchesSearch && (member.role === UserRole.ASSOCIATE || member.role === UserRole.CLERK);
    if (activeTab === 'Admins') return matchesSearch && member.role === UserRole.ADMIN;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Firm Team</h1>
          </div>
          <p className="text-neutral-500">Manage your firm's lawyers, paralegals, and administrative staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: teamMembers.length.toString(), icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Active Now', value: teamMembers.length.toString(), icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pending Invites', value: '0', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Avg. Rating', value: '4.7', icon: Star, color: 'text-primary-600', bg: 'bg-primary-50' },
        ].map((stat, i) => (
          <div key={i} className="card p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search team members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:bg-neutral-50 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          {['All', 'Lawyers', 'Staff', 'Admins'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMembers.map((member) => (
          <div key={member.uid} className="card p-8 group hover:border-primary-300 transition-all relative">
            <button className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                {member.photoURL ? (
                  <img 
                    src={member.photoURL} 
                    alt={member.displayName} 
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold border-4 border-white shadow-md">
                    {member.displayName.charAt(0)}
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white bg-success`}></div>
              </div>
              
              <h3 className="text-xl font-bold text-neutral-900">{member.displayName}</h3>
              <p className="text-sm font-bold text-primary-600 mt-1 uppercase">{member.role}</p>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="text-xs font-bold text-neutral-600">4.7 Rating</span>
              </div>

              <div className="w-full h-px bg-neutral-100 my-6"></div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Email</span>
                  <span className="font-bold text-neutral-900 truncate max-w-[150px]">{member.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Joined</span>
                  <span className="font-bold text-neutral-900">{new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-100 my-6"></div>

              <div className="w-full flex items-center justify-center gap-3">
                <a href={`mailto:${member.email}`} className="p-3 bg-neutral-50 text-neutral-500 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                  <Mail className="w-5 h-5" />
                </a>
                <button className="p-3 bg-neutral-50 text-neutral-500 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="flex-1 btn btn-secondary py-3 text-xs">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-neutral-500 font-medium">No team members found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
