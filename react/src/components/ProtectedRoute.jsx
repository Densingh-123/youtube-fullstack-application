import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login but save the attempted URL to redirect back later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
