import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ justifyContent: 'center' }}>
          <div className="auth-logo" style={{ fontSize: 40 }}>chasr</div>
          <div className="spinner-large" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={{ pathname: '/login', search: location.search }} replace />;
  }

  // Check if profile is incomplete (no name = just registered)
  if (!user.name) {
    return <Navigate to={{ pathname: '/register', search: location.search }} replace />;
  }

  return <>{children}</>;
}
