import { create } from 'zustand';

export type AppPermission =
  | 'caja.abrir'
  | 'caja.cerrar'
  | 'venta.registrar'
  | 'compra.registrar'
  | 'egreso.registrar'
  | 'stock.consultar'
  | 'producto.ver'
  | 'proveedor.ver'
  | 'usuario.ver'
  | 'rol.ver'
  | 'contexto.ver'
  | 'reporte.ver';

export type AppRole = 'Administrador' | 'Supervisor' | 'Cajero';

export type AuthUser = {
  id: string;
  displayName: string;
  role: AppRole;
  permissions: AppPermission[];
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  signInAsDemo: (role?: AppRole) => void;
  signOut: () => void;
  hasPermission: (permission: AppPermission) => boolean;
};

const rolePermissions: Record<AppRole, AppPermission[]> = {
  Administrador: [
    'caja.abrir',
    'caja.cerrar',
    'venta.registrar',
    'compra.registrar',
    'egreso.registrar',
    'stock.consultar',
    'producto.ver',
    'proveedor.ver',
    'usuario.ver',
    'rol.ver',
    'contexto.ver',
    'reporte.ver',
  ],
  Supervisor: [
    'caja.abrir',
    'caja.cerrar',
    'venta.registrar',
    'compra.registrar',
    'egreso.registrar',
    'stock.consultar',
    'reporte.ver',
  ],
  Cajero: ['caja.abrir', 'caja.cerrar', 'venta.registrar', 'egreso.registrar', 'stock.consultar'],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  signInAsDemo: (role = 'Administrador') =>
    set({
      token: `demo-token-${role.toLowerCase()}`,
      user: {
        id: 'demo-user',
        displayName: 'Operador Demo',
        role,
        permissions: rolePermissions[role],
      },
    }),
  signOut: () => set({ token: null, user: null }),
  hasPermission: (permission) => Boolean(get().user?.permissions.includes(permission)),
}));
