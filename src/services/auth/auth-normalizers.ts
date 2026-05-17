import type { AuthApiUser, AuthSessionPayload } from '../api/types';

type PermissionLike = string | { code?: string | null } | null | undefined;

type AuthUserLike =
  | AuthApiUser
  | {
      id?: string | number | null;
      username?: string | null;
      userName?: string | null;
      displayName?: string | null;
      fullName?: string | null;
      nombreCompleto?: string | null;
      role?: string | null;
      roleName?: string | null;
      rol?: string | null;
      email?: string | null;
    };

type AuthSessionLike = {
  token?: string | null;
  accessToken?: string | null;
  user?: AuthUserLike | null;
  usuario?: AuthUserLike | null;
  permissions?: PermissionLike[] | null;
  permisos?: PermissionLike[] | null;
};

function normalizePermissions(input: PermissionLike[] | null | undefined): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item && typeof item === 'object' && typeof item.code === 'string') {
        return item.code;
      }

      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function normalizeAuthUser(input: AuthUserLike | null | undefined): AuthApiUser {
  const candidate = (input ?? {}) as {
    id?: string | number | null;
    username?: string | null;
    userName?: string | null;
    displayName?: string | null;
    fullName?: string | null;
    nombreCompleto?: string | null;
    role?: string | null;
    roleName?: string | null;
    rol?: string | null;
    email?: string | null;
  };

  return {
    id: candidate.id ?? candidate.username ?? candidate.userName ?? candidate.email ?? 'unknown-user',
    username: candidate.username ?? candidate.userName ?? candidate.email ?? undefined,
    displayName: candidate.displayName ?? candidate.fullName ?? candidate.nombreCompleto ?? candidate.username ?? candidate.userName ?? undefined,
    fullName: candidate.fullName ?? candidate.nombreCompleto ?? undefined,
    role: candidate.role ?? candidate.roleName ?? candidate.rol ?? 'Usuario',
    roleName: candidate.roleName ?? candidate.role ?? candidate.rol ?? undefined,
    email: candidate.email ?? undefined,
  };
}

export function normalizeAuthSessionPayload(input: unknown): AuthSessionPayload {
  const session = (input ?? {}) as AuthSessionLike;

  return {
    token: session.token ?? session.accessToken ?? '',
    user: normalizeAuthUser(session.user ?? session.usuario),
    permissions: normalizePermissions(session.permissions ?? session.permisos),
  };
}

export function normalizeHydratedAuthSession(input: unknown): Omit<AuthSessionPayload, 'token'> {
  const session = (input ?? {}) as AuthSessionLike & AuthUserLike;

  const nestedUser = session.user ?? session.usuario;
  const fallbackUser = nestedUser ? nestedUser : session;

  return {
    user: normalizeAuthUser(fallbackUser),
    permissions: normalizePermissions(session.permissions ?? session.permisos),
  };
}
