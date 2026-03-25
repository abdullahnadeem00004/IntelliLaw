import React, { useEffect } from 'react';
import { Scale, Building2, User, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';

export type UserRole = 'FIRM' | 'LAWYER' | 'CLIENT';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const roles: RoleOption[] = [
  {
    id: 'FIRM',
    title: 'Law Firm',
    description: 'Manage your law firm, cases, and team members',
    icon: <Building2 className="w-8 h-8" />,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'LAWYER',
    title: 'Lawyer',
    description: 'Manage your cases and client interactions',
    icon: <Scale className="w-8 h-8" />,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'CLIENT',
    title: 'Client',
    description: 'Access your cases and legal documents',
    icon: <User className="w-8 h-8" />,
    color: 'from-emerald-500 to-emerald-600',
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (isAuthReady && user) {
      navigate('/', { replace: true });
    }
  }, [user, isAuthReady, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    sessionStorage.setItem('selectedRole', role);
    navigate(`/auth/login/${role}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white">
      <div className="max-w-6xl w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-4">IntelliLaw</h1>
          <p className="text-xl text-neutral-600 mb-2">AI-Powered Legal Management for Pakistan</p>
          <p className="text-neutral-500">Select your role to get started</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className="group relative p-8 rounded-2xl border border-neutral-200 bg-white hover:border-primary-600 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                {role.icon}
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{role.title}</h3>
                <p className="text-neutral-600 text-sm mb-6">{role.description}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-primary-600 font-semibold text-sm relative z-10 group-hover:translate-x-2 transition-transform duration-300">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
            <Users className="w-4 h-4" />
            <p>Choose the role that best fits your needs</p>
          </div>
          <p className="text-xs text-neutral-400">
            By continuing, you agree to IntelliLaw's <br />
            <button className="underline hover:text-neutral-600">Terms of Service</button> and <button className="underline hover:text-neutral-600">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}
