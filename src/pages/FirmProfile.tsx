import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Award, 
  Users, 
  Scale, 
  Camera, 
  Edit3, 
  CheckCircle2,
  ExternalLink,
  Twitter,
  Linkedin,
  Facebook,
  ChevronRight
} from 'lucide-react';

export default function FirmProfile() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Cover & Profile Header */}
      <div className="relative">
        <div className="h-64 bg-primary-900 rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=2000" 
            alt="Firm Cover" 
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <button className="absolute bottom-6 right-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl">
                <div className="w-full h-full rounded-2xl bg-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                  IL
                </div>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">IntelliLaw Associates</h1>
                  <CheckCircle2 className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-neutral-500 mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Full-Service Law Firm • Established 2015
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-secondary"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Profile' : 'Edit Profile'}
              </button>
              <button className="btn btn-primary">
                <ExternalLink className="w-4 h-4 mr-2" />
                Public View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Contact */}
        <div className="space-y-8">
          {/* About Section */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">About the Firm</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              IntelliLaw Associates is a premier law firm in Pakistan, specializing in Constitutional, Corporate, and Criminal litigation. We leverage cutting-edge AI technology to provide our clients with unparalleled legal insights and efficient case management.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <MapPin className="w-4 h-4 text-primary-600" />
                123 Legal Plaza, Mall Road, Lahore
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Globe className="w-4 h-4 text-primary-600" />
                www.intellilaw.pk
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Mail className="w-4 h-4 text-primary-600" />
                contact@intellilaw.pk
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Phone className="w-4 h-4 text-primary-600" />
                +92 42 35712345
              </div>
            </div>
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-neutral-100">
              <button className="p-2 text-neutral-400 hover:text-primary-600 transition-all"><Twitter className="w-5 h-5" /></button>
              <button className="p-2 text-neutral-400 hover:text-primary-600 transition-all"><Linkedin className="w-5 h-5" /></button>
              <button className="p-2 text-neutral-400 hover:text-primary-600 transition-all"><Facebook className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Firm Stats */}
          <div className="card p-8 bg-neutral-900 text-white">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Firm Statistics</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Cases Won</p>
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Expert Lawyers</p>
              </div>
              <div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Client Satisfaction</p>
              </div>
              <div>
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">AI Support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Specializations & Team */}
        <div className="lg:col-span-2 space-y-8">
          {/* Specializations */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Practice Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Constitutional Law', icon: Scale, desc: 'Expertise in fundamental rights and writ petitions.' },
                { title: 'Corporate Litigation', icon: Building2, desc: 'Handling complex business disputes and contracts.' },
                { title: 'Criminal Defense', icon: Award, desc: 'Strategic defense in high-profile criminal cases.' },
                { title: 'Family Law', icon: Users, desc: 'Compassionate handling of domestic and family matters.' },
              ].map((area, i) => (
                <div key={i} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary-200 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm mb-4 group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <area.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900 mb-2">{area.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">{area.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Awards */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Awards & Recognition</h3>
            <div className="space-y-6">
              {[
                { title: 'Best AI-Integrated Law Firm 2023', issuer: 'LegalTech Asia', date: 'Dec 2023' },
                { title: 'Top Litigation Firm in Lahore', issuer: 'Pakistan Bar Council', date: 'Oct 2022' },
                { title: 'Excellence in Corporate Law', issuer: 'Chambers & Partners', date: 'Aug 2022' },
              ].map((award, i) => (
                <div key={i} className="flex items-center gap-6 p-4 rounded-2xl border border-neutral-100">
                  <div className="w-14 h-14 bg-warning/10 rounded-xl flex items-center justify-center text-warning shrink-0">
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-neutral-900">{award.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{award.issuer} • {award.date}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Office Locations */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Our Offices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                <h4 className="text-sm font-bold text-neutral-900 mb-2">Lahore (Headquarters)</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  123 Legal Plaza, Mall Road, Lahore, Punjab 54000
                </p>
              </div>
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                <h4 className="text-sm font-bold text-neutral-900 mb-2">Islamabad Office</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Blue Area, Sector F-6, Islamabad, ICT 44000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
