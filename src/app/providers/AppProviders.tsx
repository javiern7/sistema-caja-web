import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../query/queryClient';
import { AuthBootstrap } from './AuthBootstrap';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
    </QueryClientProvider>
  );
}
