import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentSession } from '../../services/auth/auth-api';
import { getApiErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/auth-store';

export function AuthBootstrap() {
  const token = useAuthStore((state) => state.token);
  const status = useAuthStore((state) => state.status);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const invalidateSession = useAuthStore((state) => state.invalidateSession);

  const sessionQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentSession,
    enabled: Boolean(token) && status === 'bootstrapping',
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    if (status !== 'bootstrapping') {
      return;
    }

    if (sessionQuery.isSuccess) {
      hydrateSession(sessionQuery.data);
      return;
    }

    if (sessionQuery.isError) {
      invalidateSession(getApiErrorMessage(sessionQuery.error, 'No se pudo recuperar la sesion actual.'));
    }
  }, [
    hydrateSession,
    invalidateSession,
    sessionQuery.data,
    sessionQuery.error,
    sessionQuery.isError,
    sessionQuery.isSuccess,
    status,
    token,
  ]);

  if (token && status === 'bootstrapping') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
        <div className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <p className="text-sm font-semibold text-slate-900">Validando sesion y permisos...</p>
        </div>
      </div>
    );
  }

  return null;
}
