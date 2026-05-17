import { Navigate, Outlet } from 'react-router-dom';
import { AuthGateFallback } from '../../components/ui/AuthGateFallback';
import { useAuthStore } from '../../store/auth-store';

export function GuestGuard() {
  const status = useAuthStore((state) => state.status);

  if (status === 'bootstrapping') {
    return <AuthGateFallback message="Validando si la sesion guardada sigue activa..." />;
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
