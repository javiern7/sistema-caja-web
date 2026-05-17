import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentSession } from '../../services/auth/auth-api';
import { getApiErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/auth-store';

export function AuthBootstrap() {
  const token = useAuthStore((state) => state.token);
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const setBootstrapStatus = useAuthStore((state) => state.setBootstrapStatus);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const sessionQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentSession,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      setBootstrapStatus('ready');
      return;
    }

    if (sessionQuery.isLoading) {
      setBootstrapStatus('loading');
      return;
    }

    if (sessionQuery.isSuccess) {
      hydrateSession(sessionQuery.data);
      return;
    }

    if (sessionQuery.isError) {
      clearSession();
      setBootstrapStatus('error', getApiErrorMessage(sessionQuery.error, 'No se pudo recuperar la sesion actual.'));
    }
  }, [
    clearSession,
    hydrateSession,
    sessionQuery.data,
    sessionQuery.error,
    sessionQuery.isError,
    sessionQuery.isLoading,
    sessionQuery.isSuccess,
    setBootstrapStatus,
    token,
  ]);

  if (token && (bootstrapStatus === 'loading' || sessionQuery.isLoading)) {
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
