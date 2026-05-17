import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../query/queryClient';
import { AuthBootstrap } from './AuthBootstrap';
import { useAuthStore } from '../../store/auth-store';
import { AppErrorBoundary } from './AppErrorBoundary';

function DevAuthIndicator() {
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const bootstrapError = useAuthStore((state) => state.bootstrapError);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-[60] rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-soft backdrop-blur">
      <p>auth: {status}</p>
      <p>token: {token ? 'si' : 'no'}</p>
      {bootstrapError ? <p className="max-w-64 text-rose-600">error: {bootstrapError}</p> : null}
    </div>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
        <DevAuthIndicator />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
