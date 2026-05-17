import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';

export function GuestGuard() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
