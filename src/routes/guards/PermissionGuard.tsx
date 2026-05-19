import { Navigate, Outlet } from 'react-router-dom';
import { type AppPermission, useAuthStore } from '../../store/auth-store';

type PermissionGuardProps = {
  permission?: AppPermission;
  anyOf?: AppPermission[];
};

export function PermissionGuard({ permission, anyOf }: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isAllowed = permission
    ? hasPermission(permission)
    : Array.isArray(anyOf) && anyOf.length > 0
      ? anyOf.some((candidate) => hasPermission(candidate))
      : false;

  if (!isAllowed) {
    return <Navigate replace to="/sin-permiso" />;
  }

  return <Outlet />;
}
