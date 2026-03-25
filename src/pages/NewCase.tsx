import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Briefcase, 
  User, 
  Scale, 
  FileText, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Search,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { UserRole } from '../types';
import { PAKISTAN_COURTS, CASE_PRIORITIES } from '../constants';
import { createCase } from '../services/caseService';

import AddressInput from '../components/forms/AddressInput';
import PhoneInput from '../components/forms/PhoneInput';

const steps = [
  { id: 1, label: 'Case Details', icon: Briefcase },
  { id: 2, label: 'Client Info', icon: User },
  { id: 3, label: 'Legal Info', icon: Scale },
  { id: 4, label: 'Review', icon: FileText },
];

export default function NewCase() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check if user has permission to create cases
  const canCreateCase = userProfile && [UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN].includes(userProfile.role);
  const canSetJudge = userProfile && [UserRole.LAWYER, UserRole.ADMIN].includes(userProfile.role);
  const canSetOpposingCounsel = userProfile && [UserRole.LAWYER, UserRole.ADMIN].includes(userProfile.role);

  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    type: 'Civil',
    priority: 'MEDIUM',
    description: '',
    clientName: '',
    clientType: 'Individual',
    clientEmail: '',
    clientPhone: '',
    clientAddress: {
      province: '',
      district: '',
      city: '',
      area: '',
      postalCode: '',
    },
    court: PAKISTAN_COURTS[0],
    judge: '',
    opposingParty: '',
    opposingCounsel: '',
    nextHearingDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (address: any) => {
    setFormData(prev => ({ ...prev, clientAddress: address }));
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, clientPhone: phone }));
  };

  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setClientSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clients?search=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search clients');
      }

      const data = await response.json();
      setClientSearchResults(data);
    } catch (err) {
      console.error('Error searching clients:', err);
      setClientSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectClient = (client: any) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.displayName,
      clientEmail: client.email || '',
      clientPhone: client.phoneNumber || '',
      clientType: client.type || 'Individual',
      clientAddress: client.address || {
        province: '',
        district: '',
        city: '',
        area: '',
        postalCode: '',
      },
    }));
    setShowClientSearch(false);
    setClientSearchQuery('');
    setClientSearchResults([]);
  };

  const nextStep = () => {
    if (currentStep === steps.length) {
      handleSubmit();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await createCase({
        title: formData.title,
        caseNumber: formData.caseNumber,
        category: formData.type,
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        description: formData.description,
        court: formData.court,
        judge: formData.judge,
        clientName: formData.clientName,
        assignedLawyerUid: user.uid,
        assignedLawyerName: user.displayName || user.email || 'Assigned Lawyer',
        nextHearingDate: formData.nextHearingDate || null,
      });
      navigate('/cases');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create case. Please try again.';
      setError(message);
      console.error('Error creating case:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Permission Check */}
      {!canCreateCase && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-error/10 text-error">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
            <p className="text-neutral-500 mb-6">You don't have permission to create cases. Only Lawyers, Staff, and Admins can create new cases.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {canCreateCase && (
        <>
          {/* Header */}
          <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Register New Case</h1>
        <p className="text-neutral-500 mt-2">Follow the steps to register a legal proceeding in the system.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0"></div>
        {steps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
              currentStep >= step.id 
                ? "bg-primary-600 border-primary-100 text-white shadow-lg shadow-primary-500/20" 
                : "bg-white border-neutral-100 text-neutral-400"
            }`}>
              {currentStep > step.id ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>
            <span className={`text-xs font-bold mt-3 uppercase tracking-wider ${
              currentStep >= step.id ? "text-primary-600" : "text-neutral-400"
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="card p-8 min-h-[400px]">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error creating case</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-neutral-900">Basic Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Case Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. State vs. Ahmed Ali" 
                  className="input-field" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Case Number (Internal/Court)</label>
                <input 
                  type="text" 
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  placeholder="e.g. LHC-2024-001" 
                  className="input-field" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Case Category</label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option>Civil</option>
                  <option>Criminal</option>
                  <option>Family</option>
                  <option>Corporate</option>
                  <option>Tax</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Priority Level</label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input-field"
                >
                  {CASE_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">Case Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4} 
                placeholder="Brief overview of the legal matter..." 
                className="input-field resize-none"
              ></textarea>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-neutral-900">Client Information</h3>
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-primary-700">Existing Client?</span>
              </div>
              <button 
                onClick={() => setShowClientSearch(true)}
                className="btn btn-primary py-1.5 px-3 text-xs"
              >
                Search Database
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Client Name</label>
                <input 
                  type="text" 
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="input-field" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Client Type</label>
                <select 
                  name="clientType"
                  value={formData.clientType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option>Individual</option>
                  <option>Corporate</option>
                  <option>Organization</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Email Address</label>
                <input 
                  type="email" 
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className="input-field" 
                />
              </div>
              <PhoneInput 
                value={formData.clientPhone}
                onChange={handlePhoneChange}
                label="Client Phone Number"
                required
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">Client Address</h4>
              <AddressInput 
                value={formData.clientAddress}
                onChange={handleAddressChange}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-neutral-900">Legal & Court Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Court Name</label>
                <select 
                  name="court"
                  value={formData.court}
                  onChange={handleChange}
                  className="input-field"
                >
                  {PAKISTAN_COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Judge Name {!canSetJudge && <span className="text-error">(Lawyers & Admins Only)</span>}</label>
                <input 
                  type="text" 
                  name="judge"
                  value={formData.judge}
                  onChange={handleChange}
                  disabled={!canSetJudge}
                  className="input-field" 
                  placeholder={!canSetJudge ? "Only lawyers can set this" : "e.g. Justice Ahmed"} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Opposing Party</label>
                <input 
                  type="text" 
                  name="opposingParty"
                  value={formData.opposingParty}
                  onChange={handleChange}
                  className="input-field" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">Opposing Counsel {!canSetOpposingCounsel && <span className="text-error">(Lawyers & Admins Only)</span>}</label>
                <input 
                  type="text" 
                  name="opposingCounsel"
                  value={formData.opposingCounsel}
                  onChange={handleChange}
                  disabled={!canSetOpposingCounsel}
                  className="input-field"
                  placeholder={!canSetOpposingCounsel ? "Only lawyers can set this" : "e.g. Barrister xyz"}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">Next Hearing (Optional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="date" 
                  name="nextHearingDate"
                  value={formData.nextHearingDate}
                  onChange={handleChange}
                  className="input-field pl-10" 
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-neutral-900">Review & Confirm</h3>
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase">Case Title</p>
                  <p className="text-base font-bold text-neutral-900">{formData.title || 'Untitled Case'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase">Client</p>
                  <p className="text-base font-bold text-neutral-900">{formData.clientName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase">Court</p>
                  <p className="text-base font-bold text-neutral-900">{formData.court}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase">Priority</p>
                  <span className={`badge ${CASE_PRIORITIES.find(p => p.value === formData.priority)?.color}`}>
                    {formData.priority}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <p className="text-xs text-warning font-bold uppercase tracking-wider">AI Analysis: Reviewing case details for potential conflicts...</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-200">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            Step <span className="font-bold text-neutral-900">{currentStep}</span> of <span className="font-bold text-neutral-900">{steps.length}</span>
          </div>

          <button 
            onClick={nextStep}
            disabled={loading || (currentStep === 1 && (!formData.title || !formData.caseNumber)) || (currentStep === 2 && !formData.clientName) || (currentStep === 3 && !formData.court)}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length ? (
              <>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {loading ? 'Creating...' : 'Create Case'}
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
        </>
      )}

      {/* Client Search Modal */}
      {showClientSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-neutral-900">Search Existing Clients</h2>
              <button 
                onClick={() => {
                  setShowClientSearch(false);
                  setClientSearchQuery('');
                  setClientSearchResults([]);
                }}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    searchClients(e.target.value);
                  }}
                  className="input-field pl-10 w-full"
                  autoFocus
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              )}

              {!isSearching && clientSearchResults.length > 0 && (
                <div className="space-y-2">
                  {clientSearchResults.map((client) => (
                    <button
                      key={client._id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full p-4 text-left border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{client.displayName}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {client.email && <span>{client.email}</span>}
                            {client.email && client.phoneNumber && <span> • </span>}
                            {client.phoneNumber && <span>{client.phoneNumber}</span>}
                          </p>
                          {client.type && (
                            <span className="inline-block mt-2 text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                              {client.type}
                            </span>
                          )}
                        </div>
                        <span className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                          Select →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && clientSearchQuery && clientSearchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No clients found matching your search.</p>
                  <p className="text-sm text-neutral-400 mt-2">Try a different search term or create a new client.</p>
                </div>
              )}

              {!isSearching && !clientSearchQuery && clientSearchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-500">Enter a name, email, or phone number to search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

