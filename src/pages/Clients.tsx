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
  MoreVertical, 
  Mail, 
  Phone, 
  Briefcase, 
  ChevronRight,
  UserPlus,
  MessageSquare,
  History,
  Loader2,
  X
} from 'lucide-react';

export default function Clients() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    // Clients fetching will be implemented when backend service is ready
    setClients([]);
    setLoading(false);
  }, [user]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const normalizedEmail = newClient.email.trim();
      const normalizedPhone = newClient.phoneNumber.trim();
      const normalizedAddress = {
        province: newClient.address.province.trim(),
        district: newClient.address.district.trim(),
        city: newClient.address.city.trim(),
        area: newClient.address.area.trim(),
        postalCode: newClient.address.postalCode.trim(),
      };

      // TODO: Implement add client API integration
      // const response = await axios.post('/api/clients', {
      //   displayName: newClient.displayName.trim(),
      //   email: normalizedEmail || null,
      //   phoneNumber: normalizedPhone || null,
      //   type: newClient.type,
      //   address: normalizedAddress,
      // });
      setShowAddModal(false);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add client. Check permissions and required fields.';
      setSubmitError(message);
      const err = error as { code?: string; message?: string };
      console.error('Add client failed:', {
        code: err?.code,
        message: err?.message,
        userUid: user?.uid,
        userRole: userProfile?.role,
        payload: {
          displayName: newClient.displayName.trim(),
          email: newClient.email.trim() || null,
          phoneNumber: newClient.phoneNumber.trim() || null,
          type: newClient.type,
          createdByUid: user?.uid,
          firmId: userProfile?.firmId || 'default-firm',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Clients', value: clients.length.toString(), icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Active Clients', value: clients.length.toString(), icon: Briefcase, color: 'text-success', bg: 'bg-success/10' },
          { label: 'New This Month', value: '12', icon: UserPlus, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Retention Rate', value: '94%', icon: History, color: 'text-warning', bg: 'bg-warning/10' },
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
          </select>
          <button className="btn btn-secondary p-2">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="card p-6 hover:border-primary-300 transition-all group cursor-pointer relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-white shadow-sm">
                  {client.displayName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 truncate max-w-[150px]">{client.displayName}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-neutral-100 text-neutral-500`}>
                    {client.type || 'Individual'}
                  </span>
                </div>
              </div>
              <button className="p-1.5 text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span className="truncate">{client.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{client.phoneNumber || 'No phone provided'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Active Cases</p>
                <p className="text-sm font-bold text-neutral-900">1</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Last Contact</p>
                <p className="text-sm font-bold text-neutral-900">Recently</p>
              </div>
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-10 text-neutral-500">
            No clients found.
          </div>
        )}

        {/* Add New Client Placeholder */}
        <button onClick={() => setShowAddModal(true)} className="card p-6 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all group">
          <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Add New Client</span>
        </button>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-neutral-900">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-8 space-y-8">
              {submitError && (
                <div className="p-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm">
                  {submitError}
                </div>
              )}

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
                  required
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
                  onClick={() => setShowAddModal(false)}
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
