import { Navigate, Outlet } from 'react-router-dom';
import { AuthGateFallback } from '../../components/ui/AuthGateFallback';
import { useAuthStore } from '../../store/auth-store';

export function GuestGuard() {
  const token = useAuthStore((state) => state.token);
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);

  if (token && (bootstrapStatus === 'idle' || bootstrapStatus === 'loading')) {
    return <AuthGateFallback message="Validando si la sesion guardada sigue activa..." />;
  }

  if (token) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
