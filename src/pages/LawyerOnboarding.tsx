import React, { useState } from 'react';
import { Scale, User, MapPin, Phone, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function LawyerOnboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    licenseNumber: '',
    specialization: '',
    yearsOfExperience: '',
    barCouncil: '',
    phoneNumber: '',
    address: '',
    firmName: '',
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
        `${API_BASE_URL}/auth/complete-lawyer-profile`,
        {
          lawyerProfile: {
            fullName: formData.fullName,
            licenseNumber: formData.licenseNumber,
            specialization: formData.specialization,
            yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : 0,
            barCouncil: formData.barCouncil,
            phoneNumber: formData.phoneNumber,
            address: formData.address || undefined,
            firmName: formData.firmName || undefined,
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
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20 mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Complete Your Lawyer Profile</h1>
          <p className="text-neutral-600 mt-2">Add your professional details to get started with IntelliLaw</p>
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
                placeholder="e.g., Muhammad Ali Khan"
                className="input w-full"
                required
              />
            </div>

            {/* License Number */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Your Bar Council license number"
                className="input w-full"
                required
              />
            </div>

            {/* Specialization and Experience Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Specialization *</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Corporate Law, Criminal Law"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Years of Experience *</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  className="input w-full"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Bar Council */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Bar Council *</label>
              <input
                type="text"
                name="barCouncil"
                value={formData.barCouncil}
                onChange={handleChange}
                placeholder="e.g., Sindh Bar Council, Punjab Bar Council"
                className="input w-full"
                required
              />
            </div>

            {/* Phone Number and Address Row */}
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Office address"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Firm Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Firm Name (if applicable)</label>
              <input
                type="text"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                placeholder="Name of your law firm"
                className="input w-full"
              />
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
          Your professional information is securely stored and verified for compliance
        </p>
      </div>
    </div>
  );
}
