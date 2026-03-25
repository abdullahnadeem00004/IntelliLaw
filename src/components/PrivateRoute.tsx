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
    return <Navigate to="/login" replace />;
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
