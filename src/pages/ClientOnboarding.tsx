import React, { useState } from 'react';
import { Scale, User, MapPin, Phone, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    cnic: '',
    companyName: '',
    isIndividual: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/complete-client-profile`,
        {
          clientProfile: {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            city: formData.city,
            cnic: formData.cnic || undefined,
            companyName: !formData.isIndividual ? formData.companyName : undefined,
            isIndividual: formData.isIndividual,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh auth state to update profile completion status
      window.dispatchEvent(new Event('token-changed'));

      // Small delay to allow auth context to update
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to complete profile. Please try again.');
      console.error('Profile completion failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white">
      <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-neutral-600 mt-2">Help us get to know you better to protect your cases and documents</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl shadow-neutral-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g., Ahmed Hassan"
                className="input w-full"
                required
              />
            </div>

            {/* Account Type Toggle */}
            <div className="p-4 rounded-xl border border-primary-200 bg-primary-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isIndividual"
                  checked={formData.isIndividual}
                  onChange={handleChange}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium text-neutral-700">I am an individual client</span>
              </label>
              {!formData.isIndividual && (
                <p className="text-xs text-neutral-600 mt-2">
                  Your account is set up as a business/company
                </p>
              )}
            </div>

            {/* CNIC or Company Name - Conditional */}
            {formData.isIndividual ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">CNIC (optional)</label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  placeholder="12345-1234567-1"
                  className="input w-full"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="input w-full"
                  required={!formData.isIndividual}
                />
              </div>
            )}

            {/* Phone Number and City Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+92-300-1234567"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Karachi, Lahore"
                  className="input w-full"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your full address"
                className="input w-full"
                rows={2}
                required
              ></textarea>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl border border-error/20 bg-error/10 text-error text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 group flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Creating your profile...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          Your information is securely stored and encrypted for your privacy
        </p>
      </div>
    </div>
  );
}
