import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthApiUser, AuthSessionPayload } from '../services/api/types';
import { AUTH_STORAGE_KEY } from './storage';

export type AppPermission = string;

export type AppRole = 'Administrador' | 'Supervisor' | 'Cajero';

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole | string;
  permissions: AppPermission[];
};

export type AuthStatus = 'anonymous' | 'bootstrapping' | 'authenticated';

type HydratableSession =
  | Omit<AuthSessionPayload, 'token'>
  | (AuthApiUser & {
      permissions?: string[];
      permisos?: string[];
    });

type FlattenedHydratableSession = AuthApiUser & {
  permissions?: string[];
  permisos?: string[];
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  bootstrapError: string | null;
  setSession: (session: AuthSessionPayload) => void;
  hydrateSession: (session: HydratableSession) => void;
  clearSession: () => void;
  invalidateSession: (error?: string | null) => void;
  hasPermission: (permission: AppPermission) => boolean;
};

function normalizeRole(role: string): AppRole | string {
  const upperRole = role.toUpperCase();

  if (upperRole === 'ADMINISTRADOR' || upperRole === 'ADMIN') {
    return 'Administrador';
  }

  if (upperRole === 'SUPERVISOR') {
    return 'Supervisor';
  }

  if (upperRole === 'CAJERO') {
    return 'Cajero';
  }

  return role;
}

function normalizeUser(user: AuthApiUser, permissions: string[]): AuthUser {
  return {
    id: String(user.id),
    username: user.username ?? user.email ?? String(user.id),
    displayName: user.displayName ?? user.fullName ?? user.username ?? user.email ?? 'Usuario',
    role: normalizeRole(user.role ?? user.roleName ?? 'Usuario'),
    permissions: Array.isArray(permissions) ? permissions : [],
  };
}

function isPersistedAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthUser>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.displayName === 'string' &&
    typeof candidate.role === 'string' &&
    Array.isArray(candidate.permissions)
  );
}

function isNestedHydratedSession(session: HydratableSession): session is Omit<AuthSessionPayload, 'token'> {
  return 'user' in session;
}

function resolveHydratedSession(session: HydratableSession): { user: AuthApiUser; permissions: string[] } {
  if (isNestedHydratedSession(session)) {
    return {
      user: session.user,
      permissions: session.permissions ?? [],
    };
  }

  const flattenedSession = session as FlattenedHydratableSession;

  return {
    user: flattenedSession,
    permissions: flattenedSession.permissions ?? flattenedSession.permisos ?? [],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: 'anonymous',
      bootstrapError: null,
      setSession: (session) =>
        set({
          token: session.token,
          user: normalizeUser(session.user, session.permissions),
          status: 'authenticated',
          bootstrapError: null,
        }),
      hydrateSession: (session) =>
        set((state) => {
          const resolved = resolveHydratedSession(session);

          return {
            token: state.token,
            user: normalizeUser(resolved.user, resolved.permissions),
            status: 'authenticated',
            bootstrapError: null,
          };
        }),
      clearSession: () =>
        set({
          token: null,
          user: null,
          status: 'anonymous',
          bootstrapError: null,
        }),
      invalidateSession: (error = null) =>
        set({
          token: null,
          user: null,
          status: 'anonymous',
          bootstrapError: error,
        }),
      hasPermission: (permission) => Boolean(get().user?.permissions?.includes(permission)),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<AuthState> | undefined;
        const persistedToken = typeof typedPersistedState?.token === 'string' ? typedPersistedState.token : null;
        const persistedUser = isPersistedAuthUser(typedPersistedState?.user) ? typedPersistedState.user : null;
        const hasValidSession = Boolean(persistedToken && persistedUser);

        return {
          ...currentState,
          ...typedPersistedState,
          token: hasValidSession ? persistedToken : null,
          user: hasValidSession ? persistedUser : null,
          status: hasValidSession ? 'bootstrapping' : 'anonymous',
          bootstrapError: null,
        };
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
