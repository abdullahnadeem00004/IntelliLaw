import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { RegisteredUserProfile } from '../types';
import AddressInput from '../components/forms/AddressInput';
import PhoneInput from '../components/forms/PhoneInput';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ClientDirectoryEntry {
  id: string;
  source: 'registered' | 'added';
  displayName: string;
  email?: string;
  phoneNumber?: string;
  type: 'Individual' | 'Corporate' | 'Organization';
  address?: {
    province?: string;
    district?: string;
    city?: string;
    area?: string;
    postalCode?: string;
  };
  createdAt: string;
  isProfileComplete?: boolean;
}

const emptyAddress = {
  province: '',
  district: '',
  city: '',
  area: '',
  postalCode: '',
};

function normalizeRegisteredClient(client: RegisteredUserProfile): ClientDirectoryEntry {
  const profile = client.clientProfile;
  const isIndividual = profile?.isIndividual !== false;

  return {
    id: client.uid,
    source: 'registered',
    displayName: profile?.fullName || client.displayName,
    email: client.email,
    phoneNumber: profile?.phoneNumber,
    type: isIndividual ? 'Individual' : 'Corporate',
    address: {
      city: profile?.city,
      area: profile?.address,
    },
    createdAt: client.createdAt,
    isProfileComplete: client.isProfileComplete,
  };
}

function normalizeAddedClient(client: any): ClientDirectoryEntry {
  return {
    id: client._id,
    source: 'added',
    displayName: client.displayName,
    email: client.email,
    phoneNumber: client.phoneNumber,
    type: client.type || 'Individual',
    address: client.address || {},
    createdAt: client.createdAt,
    isProfileComplete: true,
  };
}

export default function Clients() {
  const [clients, setClients] = useState<ClientDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClient, setNewClient] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    type: 'Individual',
    address: emptyAddress,
  });

  const resetNewClient = () => {
    setNewClient({
      displayName: '',
      email: '',
      phoneNumber: '',
      type: 'Individual',
      address: emptyAddress,
    });
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [registeredResponse, addedResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/profiles/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!registeredResponse.ok) {
        const data = await registeredResponse.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch registered client profiles');
      }

      if (!addedResponse.ok) {
        const data = await addedResponse.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch added clients');
      }

      const registeredClients = await registeredResponse.json();
      const addedClients = await addedResponse.json();

      setClients([
        ...registeredClients.map(normalizeRegisteredClient),
        ...addedClients.map(normalizeAddedClient),
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: newClient.displayName.trim(),
          email: newClient.email.trim() || undefined,
          phoneNumber: newClient.phoneNumber.trim() || undefined,
          type: newClient.type,
          address: newClient.address,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to add client');
      }

      setSuccessMessage('Client added successfully. You can now use them in cases and invoices.');
      setShowAddModal(false);
      resetNewClient();
      await fetchClients();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return clients.filter((client) => {
      const matchesSearch = [
        client.displayName,
        client.email,
        client.phoneNumber,
        client.address?.city,
        client.address?.area,
        client.address?.province,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesType = activeTypeFilter === 'All Types' || client.type === activeTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, activeTypeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
          <p className="text-neutral-500 text-sm mt-1">Registered clients and clients added by your account for cases and invoices.</p>
        </div>
        <button
          onClick={() => {
            resetNewClient();
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Registered', value: clients.filter((client) => client.source === 'registered').length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Added Clients', value: clients.filter((client) => client.source === 'added').length, icon: UserPlus, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Corporate', value: clients.filter((client) => client.type === 'Corporate').length, icon: Building2, color: 'text-warning', bg: 'bg-warning/10' },
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

      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city, or area..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <select
          className="input-field py-2 text-sm w-full md:w-40"
          value={activeTypeFilter}
          onChange={(event) => setActiveTypeFilter(event.target.value)}
        >
          <option>All Types</option>
          <option>Individual</option>
          <option>Corporate</option>
          <option>Organization</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500">
            {clients.length === 0 ? 'No clients found. Add one to get started.' : 'No clients match your search.'}
          </div>
        ) : (
          filteredClients.map((client) => {
            const initials = client.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={`${client.source}-${client.id}`} className="card p-6 hover:border-primary-300 transition-all">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                      {initials || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-neutral-900 truncate">{client.displayName}</h3>
                      <p className="text-xs text-neutral-500 truncate">{client.email || 'No email added'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${client.type === 'Corporate' ? 'bg-warning/10 text-warning' : 'bg-primary-100 text-primary-700'}`}>
                      {client.type}
                    </span>
                    <span className={`badge ${client.source === 'registered' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                      {client.source === 'registered' ? 'Registered' : 'Added'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-neutral-600">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span>{client.phoneNumber}</span>
                    </div>
                  )}
                  {(client.address?.city || client.address?.area || client.address?.province) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                      <span>{[client.address?.area, client.address?.city, client.address?.province].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-neutral-400 uppercase">Added</p>
                    <p className="font-bold text-neutral-900 mt-1">{new Date(client.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-400 uppercase">Use In</p>
                    <p className="font-bold text-neutral-900 mt-1">Cases, invoices</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-neutral-900">Add Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Client Name</label>
                  <input
                    type="text"
                    required
                    value={newClient.displayName}
                    onChange={(event) => setNewClient({ ...newClient, displayName: event.target.value })}
                    className="input-field text-sm"
                    placeholder="Full name or company name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Client Type</label>
                  <select
                    value={newClient.type}
                    onChange={(event) => setNewClient({ ...newClient, type: event.target.value })}
                    className="input-field text-sm"
                  >
                    <option>Individual</option>
                    <option>Corporate</option>
                    <option>Organization</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(event) => setNewClient({ ...newClient, email: event.target.value })}
                    className="input-field text-sm"
                    placeholder="client@example.com"
                  />
                </div>
                <PhoneInput
                  value={newClient.phoneNumber}
                  onChange={(value) => setNewClient({ ...newClient, phoneNumber: value })}
                  label="Phone Number"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-widest">Address</h3>
                <AddressInput
                  value={newClient.address}
                  onChange={(address) => setNewClient({ ...newClient, address })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary px-6"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isSubmitting ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
