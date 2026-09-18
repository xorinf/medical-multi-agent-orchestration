import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100 dark:bg-charcoal-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-charcoal-600 dark:text-sage-300">Verifying clinical credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace state={{ attemptedPath: location.pathname, userRole: user.role }} />;
  }

  return <>{children}</>;
};
