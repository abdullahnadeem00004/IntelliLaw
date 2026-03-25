import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/FirebaseProvider';
import { AlertCircle } from 'lucide-react';

/**
 * Component that handles Google OAuth callback
 * Extracts token from URL params and stores it in localStorage
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, isAuthReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [hasStoredToken, setHasStoredToken] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const errorCode = searchParams.get('error');

    console.log('🔍 OAuth callback params:', { token: !!token, userId: !!userId, errorCode });

    // Handle OAuth errors
    if (errorCode) {
      const errorMessages: Record<string, string> = {
        'oauth_failed': 'Google authentication failed. Check your Google OAuth credentials in backend/.env',
        'no_user_data': 'No user data received from Google',
        'callback_error': 'Error processing OAuth callback',
      };
      const msg = errorMessages[errorCode] || `OAuth error: ${errorCode}`;
      console.error('❌ OAuth Error:', msg);
      setError(msg);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (token && !hasStoredToken) {
      console.log('✅ Token received from OAuth, storing in localStorage');
      // Store token in localStorage
      localStorage.setItem('token', token);
      setHasStoredToken(true);
      
      // Trigger token-changed event to notify AuthProvider
      console.log('📢 Dispatching token-changed event');
      window.dispatchEvent(new Event('token-changed'));
    }
  }, [searchParams, hasStoredToken, navigate]);

  // Once token is stored and AuthProvider has processed it, redirect
  useEffect(() => {
    if (hasStoredToken && isAuthReady) {
      console.log('👤 Auth ready check - user:', !!user, 'loading:', loading);
      
      if (user) {
        console.log('✅ User authenticated! Redirecting to dashboard');
        // Small delay to ensure all state updates are processed
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } else if (!loading) {
        console.warn('⚠️  User not found after auth check');
        // Only show error if auth is ready and still no user
        setTimeout(() => {
          console.log('🔁 Auth check failed, redirecting to login');
          navigate('/login', { replace: true });
        }, 500);
      }
    }
  }, [hasStoredToken, isAuthReady, user, loading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="card p-8 shadow-xl shadow-neutral-200/50 border border-error/20 bg-error/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
              <div>
                <h2 className="font-bold text-error mb-2">OAuth Error</h2>
                <p className="text-sm text-neutral-600 mb-4">{error}</p>
                <p className="text-xs text-neutral-500">Redirecting to login in 3 seconds...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-600">Signing you in with Google...</p>
        <p className="text-xs text-neutral-400 mt-2">
          {!hasStoredToken && 'Extracting token...'}
          {hasStoredToken && !isAuthReady && 'Verifying credentials...'}
          {hasStoredToken && isAuthReady && 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
