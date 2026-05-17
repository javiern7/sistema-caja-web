import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthGateFallback } from '../../components/ui/AuthGateFallback';
import { useAuthStore } from '../../store/auth-store';

export function AuthGuard() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'bootstrapping') {
    return <AuthGateFallback message="Recuperando la sesion para abrir tus rutas protegidas..." />;
  }

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
