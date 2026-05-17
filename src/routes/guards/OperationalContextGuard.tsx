import { Navigate, Outlet } from 'react-router-dom';
import { useOperationalStore } from '../../store/operational-store';

export function OperationalContextGuard() {
  const activeContext = useOperationalStore((state) => state.activeContext);

  if (!activeContext) {
    return <Navigate replace to="/contexto" />;
  }

  return <Outlet />;
}
