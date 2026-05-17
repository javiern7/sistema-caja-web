import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthGateFallback } from '../../components/ui/AuthGateFallback';
import { useAuthStore } from '../../store/auth-store';

export function AuthGuard() {
  const token = useAuthStore((state) => state.token);
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const location = useLocation();

  if (token && (bootstrapStatus === 'idle' || bootstrapStatus === 'loading')) {
    return <AuthGateFallback message="Recuperando la sesion para abrir tus rutas protegidas..." />;
  }

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
