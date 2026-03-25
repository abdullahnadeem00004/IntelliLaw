import React, { useEffect, useState } from 'react';
import { Scale, ArrowRight, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI, LoginCredentials, SignupCredentials } from '../services/authService';
import { useAuth } from '../components/FirebaseProvider';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { user, loading, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (isAuthReady && user) {
      navigate('/', { replace: true });
    }
  }, [user, isAuthReady, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);

    try {
      const credentials: LoginCredentials = { email, password };
      await authAPI.login(credentials);
      
      // Trigger a storage event to notify auth provider of token change
      window.dispatchEvent(new Event('token-changed'));
      
      // Small delay to ensure auth state updates before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSigningUp(true);

    try {
      const credentials: SignupCredentials = { email, password, displayName };
      await authAPI.signup(credentials);
      
      // Trigger a storage event to notify auth provider of token change
      window.dispatchEvent(new Event('token-changed'));
      
      // Small delay to ensure auth state updates before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || 'Sign up failed. Please try again.');
      console.error('Sign up failed:', error);
    } finally {
      setIsSigningUp(false);
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary-500/20 mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">IntelliLaw</h1>
          <p className="text-neutral-500 mt-2">AI-Powered Legal Management for Pakistan</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl shadow-neutral-200/50">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-neutral-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {isSignUp ? 'Sign up to access your legal dashboard' : 'Sign in to access your legal dashboard'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="input"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSigningIn || isSigningUp}
              className="btn btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 group flex items-center justify-center"
            >
              {isSigningIn || isSigningUp ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-neutral-400">Or continue with</span>
            </div>
          </div>

          <a 
            href="http://localhost:5000/api/auth/google"
            onClick={() => {
              console.log('🔵 Google Sign-In button clicked, redirecting to OAuth...');
            }}
            className="btn btn-secondary w-full py-3 text-base font-medium flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#1F2937"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </a>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-neutral-400">Or</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
            }}
            className="btn btn-secondary w-full py-3 text-base font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400">
          By continuing, you agree to IntelliLaw's <br />
          <button className="underline hover:text-neutral-600">Terms of Service</button> and <button className="underline hover:text-neutral-600">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
}

