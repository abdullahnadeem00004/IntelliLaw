import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User } from '../services/authService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const checkAuth = async () => {
    try {
      console.log('🔐 Checking authentication status...');
      const token = localStorage.getItem('token');
      console.log('📋 Token in localStorage:', !!token);
      
      const currentUser = await authAPI.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ User authenticated:', currentUser.email);
        setUser(currentUser);
        setUserProfile({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          role: (currentUser.role as UserRole) || UserRole.CLIENT,
          createdAt: new Date().toISOString()
        });
      } else {
        console.log('❌ No user found');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setUser(null);
      setUserProfile(null);
    } finally {
      console.log('✅ Auth check complete');
      setIsAuthReady(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider mounted, checking initial auth state');
    // Check if user is already logged in on component mount
    checkAuth();
  }, []);

  useEffect(() => {
    // Listen for localStorage changes (when token is added after login - different tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('📱 Storage event detected - token changed:', !!e.newValue);
        if (e.newValue) {
          // Token was added/changed, refresh auth
          setLoading(true);
          checkAuth();
        } else {
          // Token was removed, clear user
          console.log('🚪 Token removed');
          setUser(null);
          setUserProfile(null);
        }
      }
    };

    // Listen for custom token-changed event (same-tab login)
    const handleTokenChanged = () => {
      console.log('🔔 token-changed event received, refreshing auth');
      setLoading(true);
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token-changed', handleTokenChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-changed', handleTokenChanged);
    };
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAuthReady, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Keep Firebase naming for backward compatibility during migration
export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function useFirebase() {
  return useAuth();
}
