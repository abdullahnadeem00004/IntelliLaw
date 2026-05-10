import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Briefcase, CheckCircle2, Loader2, Mail, Phone, Scale, Search, ShieldCheck, Users } from 'lucide-react';
import { RegisteredUserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Lawyers() {
  const [lawyers, setLawyers] = useState<RegisteredUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/profiles/lawyers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to fetch lawyer profiles');
        }

        setLawyers(await response.json());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lawyer profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  const filteredLawyers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return lawyers.filter((lawyer) => {
      const profile = lawyer.lawyerProfile;
      return [
        lawyer.displayName,
        lawyer.email,
        profile?.fullName,
        profile?.licenseNumber,
        profile?.specialization,
        profile?.barCouncil,
        profile?.firmName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [lawyers, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading lawyer profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lawyers</h1>
          <p className="text-neutral-500 text-sm mt-1">Registered lawyer profiles available to your firm.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Registered Lawyers', value: lawyers.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Completed Profiles', value: lawyers.filter((lawyer) => lawyer.isProfileComplete).length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Specializations', value: new Set(lawyers.map((lawyer) => lawyer.lawyerProfile?.specialization).filter(Boolean)).size, icon: Briefcase, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Verified Access', value: lawyers.filter((lawyer) => lawyer.role === 'LAWYER').length, icon: ShieldCheck, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase">{stat.label}</p>
              <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, license, specialization, or bar council..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLawyers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500">
            {lawyers.length === 0 ? 'No registered lawyer profiles found.' : 'No lawyers match your search.'}
          </div>
        ) : (
          filteredLawyers.map((lawyer) => {
            const profile = lawyer.lawyerProfile;
            const name = profile?.fullName || lawyer.displayName;
            const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={lawyer.uid} className="card p-6 hover:border-primary-300 transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                    {initials || 'L'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 truncate">{name}</h3>
                    <p className="text-xs text-neutral-500 truncate">{profile?.specialization || 'General Practice'}</p>
                    <span className={`badge mt-2 ${lawyer.isProfileComplete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {lawyer.isProfileComplete ? 'Profile Complete' : 'Incomplete Profile'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-neutral-600">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="truncate">{lawyer.email}</span>
                  </div>
                  {profile?.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span>{profile.phoneNumber}</span>
                    </div>
                  )}
                  {profile?.licenseNumber && (
                    <div className="flex items-center gap-3">
                      <Scale className="w-4 h-4 text-neutral-400" />
                      <span>{profile.licenseNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-neutral-400 uppercase">Experience</p>
                    <p className="font-bold text-neutral-900 mt-1">{profile?.yearsOfExperience ?? 0} years</p>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-400 uppercase">Bar Council</p>
                    <p className="font-bold text-neutral-900 mt-1 truncate">{profile?.barCouncil || 'N/A'}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
