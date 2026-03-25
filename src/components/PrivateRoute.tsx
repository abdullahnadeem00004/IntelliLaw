import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './FirebaseProvider';
import { UserRole } from '../types';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * PrivateRoute component to protect routes based on authentication and user role
 * Also checks if user profile is complete, redirecting to onboarding if needed
 *
 * @param children - The component to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route. If empty, any authenticated user is allowed
 */
export default function PrivateRoute({ children, allowedRoles = [] }: PrivateRouteProps) {
  const { user, userProfile, loading, isAuthReady } = useAuth();

  // Show loading while checking auth
  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user || !userProfile) {
    console.warn('🔒 PrivateRoute: User not authenticated, redirecting to login');
    return <Navigate to="/role-selection" replace />;
  }

  // Check if profile is complete
  const isProfileComplete = (userProfile as any).isProfileComplete || (userProfile as any).isProfileComplete === undefined;
  const userType = (userProfile as any).userType;

  if (!isProfileComplete && userType) {
    console.warn(`📋 PrivateRoute: User profile incomplete, redirecting to ${userType} onboarding`);
    if (userType === 'FIRM') {
      return <Navigate to="/onboarding/firm" replace />;
    } else if (userType === 'LAWYER') {
      return <Navigate to="/onboarding/lawyer" replace />;
    } else if (userType === 'CLIENT') {
      return <Navigate to="/onboarding/client" replace />;
    }
  }

  // No role restrictions - allow access
  if (allowedRoles.length === 0) {
    console.log('✅ PrivateRoute: User authenticated, role restrictions: none');
    return <>{children}</>;
  }

  // Check if user has allowed role
  const hasAccess = allowedRoles.includes(userProfile.role);

  if (!hasAccess) {
    console.warn(`🚫 PrivateRoute: User role "${userProfile.role}" not in allowed roles [${allowedRoles.join(', ')}]`);
    // Redirect to dashboard instead of login (user is already logged in)
    return <Navigate to="/" replace />;
  }

  console.log(`✅ PrivateRoute: User role "${userProfile.role}" has access`);
  return <>{children}</>;
}
