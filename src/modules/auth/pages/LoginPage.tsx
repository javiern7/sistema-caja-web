import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAuthStore, type AppRole } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';

const demoRoles: AppRole[] = ['Administrador', 'Supervisor', 'Cajero'];

export function LoginPage() {
  const navigate = useNavigate();
  const signInAsDemo = useAuthStore((state) => state.signInAsDemo);
  const clearOperationalState = useOperationalStore((state) => state.clearOperationalState);
  const [selectedRole, setSelectedRole] = useState<AppRole>('Administrador');

  const helperText = useMemo(
    () =>
      ({
        Administrador: 'Acceso amplio para validar catalogos, permisos y navegacion administrativa.',
        Supervisor: 'Perfil intermedio para revisar rutas operativas, contexto y caja.',
        Cajero: 'Perfil operativo para validar el flujo principal del dia a dia.',
      })[selectedRole],
    [selectedRole],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <StatusBadge label="FE-PAN-001 Login" tone="neutral" />
        <h2 className="text-3xl font-semibold text-slate-950">Ingreso base para la Fase 1</h2>
        <p className="text-sm leading-6 text-slate-600">
          Esta pantalla cubre el punto de entrada del frontend y deja lista la ruta publica para conectar el
          formulario real de autenticacion en la siguiente fase.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {demoRoles.map((role) => (
          <button
            key={role}
            className={`rounded-3xl border px-4 py-4 text-left transition ${
              selectedRole === role
                ? 'border-brand-500 bg-brand-50 shadow-soft'
                : 'border-slate-200 bg-white hover:border-brand-200'
            }`}
            onClick={() => setSelectedRole(role)}
            type="button"
          >
            <p className="text-sm font-semibold text-slate-900">{role}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Sesion demo para validar permisos y navegacion.</p>
          </button>
        ))}
      </div>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          clearOperationalState();
          signInAsDemo(selectedRole);
          navigate('/');
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Usuario o correo</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-brand-500"
            defaultValue="operador.demo@sistemacaja.local"
            placeholder="usuario@empresa.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Contrasena</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-brand-500"
            defaultValue="demo1234"
            placeholder="********"
            type="password"
          />
        </label>

        <div className="rounded-3xl bg-slate-100 px-4 py-4 text-sm leading-6 text-slate-600">{helperText}</div>

        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          type="submit"
        >
          Ingresar a la base del frontend
        </button>
      </form>
    </div>
  );
}
