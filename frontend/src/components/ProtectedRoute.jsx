import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'ngo_admin') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'field_worker') return <Navigate to="/report" replace />;
    if (user?.role === 'volunteer') return <Navigate to="/my-tasks" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
