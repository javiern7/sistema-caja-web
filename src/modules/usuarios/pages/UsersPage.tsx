import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CreateUserRequest, UserDto } from '../../../services/api/types';
import { createUser, fetchRoles, fetchUsers } from '../../../services/security/security-api';

const userSchema = z.object({
  username: z.string().min(1, 'Ingresa el usuario.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
  roleId: z.coerce.number().min(1, 'Selecciona un rol.'),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: fetchUsers, retry: false });
  const rolesQuery = useQuery({ queryKey: ['admin', 'roles', 'selector'], queryFn: fetchRoles, retry: false });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', password: '', roleId: 0, active: true },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateUserRequest) => createUser(values),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  return (
    <ResourcePageShell
      badge="FE-SEG-002 Usuarios"
      description="Vista conectada a `GET /api/v1/usuarios` y `POST /api/v1/usuarios` para validar el bloque de seguridad administrativa."
      documents={['04 - HU-SEG-002', '18 - API-USR-001/API-USR-002', '10 - DFC-015 auditoria minima']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Usuarios devueltos por el backend." label="Usuarios" value={String(users.length)} />
          <MetricCard helper="Acceso habilitado al sistema." label="Activos" value={String(users.filter((user) => user.active).length)} />
          <MetricCard helper="Roles vinculados a usuarios." label="Roles en uso" value={String(new Set(users.map((user) => user.roleName)).size)} />
        </div>
      }
      title="Usuarios del sistema"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar usuario</h2>
          <p className="mt-2 text-sm text-slate-600">Formulario alineado al contrato `CreateUserRequest`.</p>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Usuario</span>
            <input className={inputClass} {...register('username')} />
            {errors.username ? <span className="text-xs text-rose-600">{errors.username.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Contrasena</span>
            <input className={inputClass} type="password" {...register('password')} />
            {errors.password ? <span className="text-xs text-rose-600">{errors.password.message}</span> : null}
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Rol</span>
            <select className={inputClass} {...register('roleId')}>
              <option value={0}>Selecciona un rol</option>
              {roles.map((role) => (
                <option key={role.id} value={Number(role.id)}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId ? <span className="text-xs text-rose-600">{errors.roleId.message}</span> : null}
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2">
            <input type="checkbox" {...register('active')} />
            <span className="text-sm text-slate-700">Activo</span>
          </label>
          <div className="md:col-span-2">
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el usuario.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending || rolesQuery.isLoading} type="submit">
              {createMutation.isPending ? 'Guardando usuario...' : 'Guardar usuario'}
            </button>
          </div>
        </form>
      </section>

      {usersQuery.isLoading ? <ResourceState body="Consultando usuarios..." title="Cargando usuarios" /> : null}
      {usersQuery.isError ? <ResourceState body={getApiErrorMessage(usersQuery.error, 'No se pudo consultar la lista de usuarios.')} title="Error al consultar usuarios" tone="danger" /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? <ResourceState body="El backend respondio, pero todavia no hay usuarios registrados." title="Sin usuarios" tone="warning" /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 ? (
        <ResourceTable<UserDto>
          columns={[
            { key: 'username', header: 'Usuario', render: (user) => <span className="font-medium text-slate-900">{user.username}</span> },
            { key: 'role', header: 'Rol', render: (user) => <span>{user.roleName}</span> },
            { key: 'status', header: 'Estado', render: (user) => <StatusBadge label={user.active ? 'Activo' : 'Inactivo'} tone={user.active ? 'success' : 'warning'} /> },
          ]}
          rowKey={(user) => String(user.id)}
          rows={users}
        />
      ) : null}
    </ResourcePageShell>
  );
}
