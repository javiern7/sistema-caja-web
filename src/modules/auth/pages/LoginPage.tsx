import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorCode, getApiErrorMessage } from '../../../services/api/errors';
import { loginRequest } from '../../../services/auth/auth-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';

const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario o correo.'),
  password: z.string().min(1, 'Ingresa tu contrasena.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const clearOperationalState = useOperationalStore((state) => state.clearOperationalState);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      clearOperationalState();
      setSession(session);

      const fallbackRoute = '/';
      const nextRoute = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? fallbackRoute;

      navigate(nextRoute, { replace: true });
    },
  });

  const apiMessage = useMemo(() => {
    if (!loginMutation.error) {
      return null;
    }

    const code = getApiErrorCode(loginMutation.error);

    if (code === 'AUTH_INVALID_CREDENTIALS') {
      return 'Las credenciales no son validas. Revisa usuario y contrasena.';
    }

    if (code === 'AUTH_USER_INACTIVE') {
      return 'Tu usuario esta inactivo. Solicita habilitacion al administrador.';
    }

    return getApiErrorMessage(loginMutation.error, 'No se pudo iniciar sesion en este momento.');
  }, [loginMutation.error]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <StatusBadge label="HU-SEG-001 Login" tone="neutral" />
        <h2 className="text-3xl font-semibold text-slate-950">Ingreso seguro al sistema</h2>
        <p className="text-sm leading-6 text-slate-600">
          Esta pantalla consume el contrato `POST /api/v1/auth/login` y prepara la recuperacion de sesion,
          permisos y rutas protegidas del frontend.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Usuario o correo</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-brand-500"
            placeholder="usuario@empresa.com"
            {...register('username')}
          />
          {errors.username ? <span className="text-xs text-rose-600">{errors.username.message}</span> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Contrasena</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-brand-500"
            placeholder="********"
            type="password"
            {...register('password')}
          />
          {errors.password ? <span className="text-xs text-rose-600">{errors.password.message}</span> : null}
        </label>

        <div className="rounded-3xl bg-slate-100 px-4 py-4 text-sm leading-6 text-slate-600">
          Cubre `HU-SEG-001` y deja lista la sesion para `HU-SEG-002` mediante `GET /api/v1/auth/me`.
        </div>

        {apiMessage ? <div className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{apiMessage}</div> : null}

        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? 'Validando acceso...' : 'Ingresar al sistema'}
        </button>
      </form>
    </div>
  );
}
