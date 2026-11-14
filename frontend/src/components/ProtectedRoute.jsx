import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#060a14] text-white p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          <Activity className="absolute h-6 w-6 text-blue-400 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">Verifying authorization...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and preserve requested destination
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          reason: 'diagnostic_required',
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
