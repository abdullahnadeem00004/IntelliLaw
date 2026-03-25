import React, { useState } from 'react';
import { Scale, Building2, MapPin, Phone, Globe, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FirmOnboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firmName: '',
    firmLicense: '',
    country: '',
    city: '',
    address: '',
    phoneNumber: '',
    website: '',
    numberOfLawyers: '',
    specialization: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        `${API_BASE_URL}/auth/complete-firm-profile`,
        {
          firmProfile: {
            firmName: formData.firmName,
            firmLicense: formData.firmLicense,
            country: formData.country,
            city: formData.city,
            address: formData.address,
            phoneNumber: formData.phoneNumber,
            website: formData.website || undefined,
            numberOfLawyers: formData.numberOfLawyers ? parseInt(formData.numberOfLawyers) : undefined,
            specialization: formData.specialization || undefined,
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
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary-500/20 mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Complete Your Firm Profile</h1>
          <p className="text-neutral-600 mt-2">Add your law firm details to get started with IntelliLaw</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl shadow-neutral-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Firm Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Firm Name *</label>
              <input
                type="text"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                placeholder="e.g., Smith & Associates Law Firm"
                className="input w-full"
                required
              />
            </div>

            {/* Firm License */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Firm License Number *</label>
              <input
                type="text"
                name="firmLicense"
                value={formData.firmLicense}
                onChange={handleChange}
                placeholder="Your firm's license number"
                className="input w-full"
                required
              />
            </div>

            {/* Country and City Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Pakistan"
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
                placeholder="Full office address"
                className="input w-full"
                rows={2}
                required
              ></textarea>
            </div>

            {/* Phone and Website Row */}
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="www.yourfirm.com"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Number of Lawyers and Specialization Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Number of Lawyers</label>
                <input
                  type="number"
                  name="numberOfLawyers"
                  value={formData.numberOfLawyers}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  className="input w-full"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Corporate Law, Criminal Law"
                  className="input w-full"
                />
              </div>
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
          Your firm information is securely stored and will help us customize your experience
        </p>
      </div>
    </div>
  );
}
