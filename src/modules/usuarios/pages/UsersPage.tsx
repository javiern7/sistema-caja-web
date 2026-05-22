import { useEffect, useState } from 'react';
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
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '../../../services/api/types';
import { createUser, fetchRoles, fetchUsersPage, updateUser, updateUserStatus } from '../../../services/security/security-api';

const userSchema = z.object({
  username: z.string().min(1, 'Ingresa el usuario.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
  roleId: z.coerce.number().min(1, 'Selecciona un rol.'),
  active: z.boolean(),
});

const updateUserSchema = z.object({
  username: z.string().min(1, 'Ingresa el usuario.'),
  password: z.string().optional(),
  roleId: z.coerce.number().min(1, 'Selecciona un rol.'),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState('username,asc');
  const usersQuery = useQuery({
    queryKey: ['admin', 'usuarios', page, pageSize, sort],
    queryFn: () => fetchUsersPage({ page, size: pageSize, sort }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const rolesQuery = useQuery({ queryKey: ['admin', 'roles', 'selector'], queryFn: fetchRoles, retry: false });

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', password: '', roleId: 0, active: true },
  });
  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { username: '', password: '', roleId: 0, active: true },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateUserRequest) => createUser(values),
    onSuccess: () => {
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (values: UpdateUserRequest) => updateUser(Number(selectedUserId), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) => updateUserStatus(userId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });

  const users = usersQuery.data?.items ?? [];
  const roles = rolesQuery.data ?? [];
  const selectedUser = users.find((user) => String(user.id) === selectedUserId) ?? null;

  useEffect(() => {
    if (!selectedUser) return;
    editForm.reset({
      username: selectedUser.username,
      password: '',
      roleId: Number(selectedUser.roleId),
      active: selectedUser.active,
    });
  }, [editForm, selectedUser]);

  return (
    <ResourcePageShell
      badge="FE-SEG-002 Usuarios"
      description="Vista conectada a `GET`, `POST`, `PUT` y `PATCH` de usuarios para validar seguridad administrativa real."
      documents={['04 - HU-SEG-002', '18 - API-USR-001/API-USR-002/API-USR-003', '10 - DFC-015 auditoria minima']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Usuarios devueltos por el backend." label="Usuarios" value={String(usersQuery.data?.totalElements ?? users.length)} />
          <MetricCard helper="Acceso habilitado al sistema." label="Activos" value={String(users.filter((user) => user.active).length)} />
          <MetricCard helper="Roles vinculados a usuarios." label="Roles en uso" value={String(new Set(users.map((user) => user.roleName)).size)} />
        </div>
      }
      title="Usuarios del sistema"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Registrar usuario</h2></div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Usuario</span><input className={inputClass} {...createForm.register('username')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Contrasena</span><input className={inputClass} type="password" {...createForm.register('password')} /></label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Rol</span>
            <select className={inputClass} {...createForm.register('roleId')}>
              <option value={0}>Selecciona un rol</option>
              {roles.map((role) => <option key={role.id} value={Number(role.id)}>{role.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" {...createForm.register('active')} /><span className="text-sm text-slate-700">Activo</span></label>
          <div className="md:col-span-2">
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el usuario.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending || rolesQuery.isLoading} type="submit">{createMutation.isPending ? 'Guardando usuario...' : 'Guardar usuario'}</button>
          </div>
        </form>
      </section>

      {usersQuery.isLoading ? <ResourceState body="Consultando usuarios..." title="Cargando usuarios" /> : null}
      {usersQuery.isError ? <ResourceState body={getApiErrorMessage(usersQuery.error, 'No se pudo consultar la lista de usuarios.')} title="Error al consultar usuarios" tone="danger" /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? <ResourceState body="El backend respondio, pero todavia no hay usuarios registrados." title="Sin usuarios" tone="warning" /> : null}
      {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 ? (
        <>
          <ResourceTable<UserDto>
            columns={[
              { key: 'username', header: 'Usuario', sortable: true, sortKey: 'username', render: (user) => <button className="text-left font-medium text-slate-900" onClick={() => setSelectedUserId(String(user.id))} type="button">{user.username}</button> },
              { key: 'role', header: 'Rol', sortable: true, sortKey: 'roleName', render: (user) => <span>{user.roleName}</span> },
              { key: 'status', header: 'Estado', sortable: true, sortKey: 'active', render: (user) => <button onClick={() => toggleStatusMutation.mutate({ userId: Number(user.id), active: !user.active })} type="button"><StatusBadge label={user.active ? 'Activo' : 'Inactivo'} tone={user.active ? 'success' : 'warning'} /></button> },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay usuarios para mostrar con el criterio actual.</p>}
            isLoading={usersQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            pagination={usersQuery.data}
            rowKey={(user) => String(user.id)}
            rows={users}
            sort={{
              value: sort,
              onChange: (nextSort) => {
                setSort(nextSort);
                setPage(0);
              },
            }}
          />
          {selectedUser ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Editar usuario</h2></div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Usuario</span><input className={inputClass} {...editForm.register('username')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nueva contrasena</span><input className={inputClass} type="password" {...editForm.register('password')} /></label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Rol</span>
                  <select className={inputClass} {...editForm.register('roleId')}>
                    <option value={0}>Selecciona un rol</option>
                    {roles.map((role) => <option key={role.id} value={Number(role.id)}>{role.name}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" {...editForm.register('active')} /><span className="text-sm text-slate-700">Activo</span></label>
                <div className="md:col-span-2">
                  {updateMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error, 'No se pudo actualizar el usuario.')}</div> : null}
                  {updateMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario actualizado correctamente.</div> : null}
                  <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={updateMutation.isPending} type="submit">{updateMutation.isPending ? 'Actualizando...' : 'Guardar cambios'}</button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
