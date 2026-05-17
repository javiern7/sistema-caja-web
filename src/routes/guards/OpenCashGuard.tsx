import { Navigate, Outlet } from 'react-router-dom';
import { useOperationalStore } from '../../store/operational-store';

export function OpenCashGuard() {
  const activeCash = useOperationalStore((state) => state.activeCash);

  if (!activeCash || activeCash.status !== 'ABIERTA') {
    return <Navigate replace to="/caja/apertura" />;
  }

  return <Outlet />;
}
