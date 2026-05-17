import { Navigate, Outlet } from 'react-router-dom';
import { type AppPermission, useAuthStore } from '../../store/auth-store';

type PermissionGuardProps = {
  permission: AppPermission;
};

export function PermissionGuard({ permission }: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(permission)) {
    return <Navigate replace to="/sin-permiso" />;
  }

  return <Outlet />;
}
