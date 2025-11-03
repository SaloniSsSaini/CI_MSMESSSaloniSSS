import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, redirectPath = '/' }) => {
  const { isRegistered } = useRegistration();
  const location = useLocation();

  if (!isRegistered) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;

