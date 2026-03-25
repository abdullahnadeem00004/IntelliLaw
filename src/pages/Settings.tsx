import React, { useState } from 'react';
import { 
  User, 
  Building, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  CreditCard, 
  Mail, 
  Phone, 
  Camera,
  ChevronRight,
  Save,
  Lock,
  Smartphone
} from 'lucide-react';

const sections = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'firm', label: 'Firm Profile', icon: Building },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Subscription', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your account, firm, and application preferences.</p>
        </div>
        <button className="btn btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeSection === section.id 
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" 
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <section.icon className="w-5 h-5" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="card p-8">
            {activeSection === 'profile' && (
              <div className="space-y-8">
                {/* Profile Photo */}
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl border-4 border-white shadow-md overflow-hidden">
                      A
                    </div>
                    <button className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Profile Photo</h3>
                    <p className="text-sm text-neutral-500 mt-1">Update your photo to be recognized by your team.</p>
                    <div className="flex items-center gap-3 mt-4">
                      <button className="btn btn-secondary py-1.5 px-3 text-xs">Upload New</button>
                      <button className="text-xs font-bold text-error hover:underline">Remove</button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Full Name</label>
                    <input type="text" defaultValue="Adv. Abdullah" className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="email" defaultValue="abdullah@intellilaw.pk" className="input-field pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="tel" defaultValue="+92 300 1234567" className="input-field pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Bar Association ID</label>
                    <input type="text" defaultValue="LHC-88291-PB" className="input-field" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Bio / Professional Summary</label>
                  <textarea rows={4} className="input-field resize-none" defaultValue="Senior Advocate at Lahore High Court with 12+ years of experience in civil and corporate litigation."></textarea>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 border border-neutral-200">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Two-Factor Authentication</h4>
                      <p className="text-xs text-neutral-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-base font-bold text-neutral-900">Password Management</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Current Password</label>
                      <input type="password" placeholder="••••••••" className="input-field" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">New Password</label>
                        <input type="password" placeholder="••••••••" className="input-field" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="input-field" />
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary text-sm">Update Password</button>
                </div>

                <div className="pt-8 border-t border-neutral-100">
                  <h3 className="text-base font-bold text-neutral-900 mb-4">Active Sessions</h3>
                  <div className="space-y-4">
                    {[
                      { device: 'MacBook Pro', location: 'Lahore, Pakistan', status: 'Active Now', icon: Globe },
                      { device: 'iPhone 15 Pro', location: 'Lahore, Pakistan', status: '2 hours ago', icon: Smartphone },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <session.icon className="w-5 h-5 text-neutral-400" />
                          <div>
                            <p className="text-sm font-bold text-neutral-900">{session.device}</p>
                            <p className="text-xs text-neutral-500">{session.location} • {session.status}</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-error hover:underline">Revoke</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
