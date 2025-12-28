import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, loading, refreshToken } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (!isAuthenticated && !loading && requireAuth) {
      const tryRefresh = async () => {
        await refreshToken();
      };
      tryRefresh();
    }
  }, [isAuthenticated, loading, requireAuth, refreshToken]);

  if (loading) {
    return <Loading message="Verifying authentication..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
export const withProtectedRoute = (Component, requireAuth = true) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requireAuth={requireAuth}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};
export default ProtectedRoute;