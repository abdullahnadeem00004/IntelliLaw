import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';

/**
 * Login page - redirects to role selection
 * This maintains backward compatibility but all new logins go through role-based flow
 */
export default function Login() {
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    // If user is already logged in, go to dashboard
    if (isAuthReady && user) {
      navigate('/', { replace: true });
      return;
    }

    // Otherwise redirect to role selection
    if (isAuthReady) {
      navigate('/role-selection', { replace: true });
    }
  }, [user, isAuthReady, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-600">Redirecting...</p>
      </div>
    </div>
  );
}


