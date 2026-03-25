import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Client } from '../types';
import AddressInput from '../components/forms/AddressInput';
import PhoneInput from '../components/forms/PhoneInput';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail, 
  Phone, 
  Briefcase,
  UserPlus,
  MessageSquare,
  History,
  Loader2,
  X,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    address: {
      province: '',
      district: '',
      city: '',
      area: '',
      postalCode: '',
    },
    type: 'Individual'
  });

  // Fetch clients on mount
  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      const formattedClients = data.map((client: any) => ({
        id: client._id,
        displayName: client.displayName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        type: client.type,
        address: client.address,
        createdByUid: client.createdByUid,
        firmId: client.firmId,
        createdAt: client.createdAt,
      }));
      setClients(formattedClients);
      setSubmitError(null);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:5000/api/clients/${editingId}`
        : 'http://localhost:5000/api/clients';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: newClient.displayName.trim(),
          email: newClient.email.trim() || undefined,
          phoneNumber: newClient.phoneNumber.trim() || undefined,
          type: newClient.type,
          address: {
            province: newClient.address.province.trim(),
            district: newClient.address.district.trim(),
            city: newClient.address.city.trim(),
            area: newClient.address.area.trim(),
            postalCode: newClient.address.postalCode.trim(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(editingId ? 'Failed to update client' : 'Failed to add client');
      }

      setSuccessMessage(editingId ? 'Client updated successfully!' : 'Client added successfully!');
      setShowAddModal(false);
      setEditingId(null);
      setNewClient({
        displayName: '',
        email: '',
        phoneNumber: '',
        address: {
          province: '',
          district: '',
          city: '',
          area: '',
          postalCode: '',
        },
        type: 'Individual'
      });

      await fetchClients();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save client.';
      setSubmitError(message);
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setSuccessMessage('Client deleted successfully!');
      await fetchClients();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete client');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingId(client.id);
    setNewClient({
      displayName: client.displayName,
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      address: {
        province: client.address?.province || '',
        district: client.address?.district || '',
        city: client.address?.city || '',
        area: client.address?.area || '',
        postalCode: client.address?.postalCode || '',
      },
      type: client.type,
    });
    setShowAddModal(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (client.phoneNumber && client.phoneNumber.includes(searchTerm));
    
    const matchesType = activeTypeFilter === 'All Types' || client.type === activeTypeFilter;
    
    return matchesSearch && matchesType;
  });

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Client Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Maintain relationships and track client history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Bulk Message
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setNewClient({
                displayName: '',
                email: '',
                phoneNumber: '',
                address: {
                  province: '',
                  district: '',
                  city: '',
                  area: '',
                  postalCode: '',
                },
                type: 'Individual'
              });
              setShowAddModal(true);
            }} 
            className="btn btn-primary"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Client
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

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Clients', value: clients.length.toString(), icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Active Clients', value: clients.length.toString(), icon: Briefcase, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Individuals', value: clients.filter(c => c.type === 'Individual').length.toString(), icon: UserPlus, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Corporate', value: clients.filter(c => c.type === 'Corporate').length.toString(), icon: History, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
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

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="input-field py-2 text-sm w-full md:w-40"
            value={activeTypeFilter}
            onChange={(e) => setActiveTypeFilter(e.target.value)}
          >
            <option>All Types</option>
            <option>Individual</option>
            <option>Corporate</option>
            <option>Organization</option>
          </select>
          <button className="btn btn-secondary p-2">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-10 text-neutral-500">
            {clients.length === 0 ? 'No clients yet. Add one to get started!' : 'No clients found matching your search.'}
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="card p-6 hover:border-primary-300 transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-white shadow-sm">
                    {client.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 truncate max-w-[150px]">{client.displayName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-neutral-100 text-neutral-500`}>
                      {client.type || 'Individual'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClient(client)}
                    className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-1.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phoneNumber && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span>{client.phoneNumber}</span>
                  </div>
                )}
              </div>

              {client.address?.city && (
                <div className="text-xs text-neutral-500 mb-6 pb-4 border-b border-neutral-100">
                  <p>{client.address.area}, {client.address.city}</p>
                  {client.address.province && <p>{client.address.province}</p>}
                </div>
              )}

              <div className="text-[10px] font-bold text-neutral-400 uppercase">
                Added {new Date(client.createdAt).toLocaleDateString()}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </div>
          ))
        )}

        {/* Add New Client Placeholder */}
        <button 
          onClick={() => {
            setEditingId(null);
            setNewClient({
              displayName: '',
              email: '',
              phoneNumber: '',
              address: {
                province: '',
                district: '',
                city: '',
                area: '',
                postalCode: '',
              },
              type: 'Individual'
            });
            setShowAddModal(true);
          }} 
          className="card p-6 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Add New Client</span>
        </button>
      </div>

      {/* Add/Edit Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }} 
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
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
                    onChange={(e) => setNewClient({...newClient, displayName: e.target.value})}
                    className="input-field text-sm" 
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Client Type</label>
                  <select 
                    value={newClient.type}
                    onChange={(e) => setNewClient({...newClient, type: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="input-field text-sm" 
                    placeholder="email@example.com"
                  />
                </div>
                <PhoneInput 
                  value={newClient.phoneNumber}
                  onChange={(val) => setNewClient({...newClient, phoneNumber: val})}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-widest">Address Details</h4>
                <AddressInput 
                  value={newClient.address}
                  onChange={(val) => setNewClient({...newClient, address: val})}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
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
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Client' : 'Add Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
