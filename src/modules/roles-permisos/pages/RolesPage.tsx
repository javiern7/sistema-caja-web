import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CreateRoleRequest, RoleDto, UpdateRolePermissionsRequest } from '../../../services/api/types';
import { createRole, fetchRolesPage, updateRolePermissions } from '../../../services/security/security-api';

const roleSchema = z.object({
  name: z.string().min(1, 'Ingresa el nombre del rol.'),
  description: z.string().optional(),
  permissionsInput: z.string().optional(),
});
const permissionsSchema = z.object({
  permissionsInput: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;
type PermissionsFormValues = z.infer<typeof permissionsSchema>;
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function RolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState('name,asc');
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', page, pageSize, sort],
    queryFn: () => fetchRolesPage({ page, size: pageSize, sort }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const createForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissionsInput: '' },
  });
  const editPermissionsForm = useForm<PermissionsFormValues>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: { permissionsInput: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateRoleRequest) => createRole(values),
    onSuccess: () => {
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
  const updatePermissionsMutation = useMutation({
    mutationFn: (values: UpdateRolePermissionsRequest) => updateRolePermissions(Number(selectedRoleId), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });

  const roles = rolesQuery.data?.items ?? [];
  const selectedRole = roles.find((role) => String(role.id) === selectedRoleId) ?? null;

  useEffect(() => {
    if (!selectedRole) return;
    editPermissionsForm.reset({
      permissionsInput: selectedRole.permissions.map((permission) => permission.code).join(', '),
    });
  }, [editPermissionsForm, selectedRole]);

  return (
    <ResourcePageShell
      badge="FE-SEG-002 Roles"
      description="Vista conectada a `GET`, `POST` y `PUT /roles/{id}/permisos` para validar la capa de permisos visibles del frontend."
      documents={['04 - HU-SEG-002', '18 - API-ROL-001/API-ROL-002/API-ROL-003', '17 - Guards y reglas de acceso']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Roles publicados por el backend." label="Roles" value={String(rolesQuery.data?.totalElements ?? roles.length)} />
          <MetricCard helper="Permisos visibles en el sistema." label="Permisos totales" value={String(roles.reduce((acc, role) => acc + role.permissions.length, 0))} />
          <MetricCard helper="Roles con descripcion funcional." label="Con descripcion" value={String(roles.filter((role) => role.description).length)} />
        </div>
      }
      title="Roles y permisos"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Registrar rol</h2></div>
        <form
          className="grid gap-4"
          onSubmit={createForm.handleSubmit((values) =>
            createMutation.mutate({
              name: values.name,
              description: values.description,
              permissions: values.permissionsInput ? values.permissionsInput.split(',').map((item) => item.trim()).filter(Boolean) : [],
            }),
          )}
        >
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input className={inputClass} {...createForm.register('name')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Descripcion</span><input className={inputClass} {...createForm.register('description')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Permisos</span><textarea className={`${inputClass} min-h-24`} {...createForm.register('permissionsInput')} /></label>
          <div>
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el rol.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Rol registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending} type="submit">{createMutation.isPending ? 'Guardando rol...' : 'Guardar rol'}</button>
          </div>
        </form>
      </section>

      {rolesQuery.isLoading ? <ResourceState body="Consultando roles..." title="Cargando roles" /> : null}
      {rolesQuery.isError ? <ResourceState body={getApiErrorMessage(rolesQuery.error, 'No se pudo consultar la lista de roles.')} title="Error al consultar roles" tone="danger" /> : null}
      {!rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 ? <ResourceState body="Aun no hay roles visibles en el backend." title="Sin roles" tone="warning" /> : null}
      {!rolesQuery.isLoading && !rolesQuery.isError && roles.length > 0 ? (
        <>
          <ResourceTable<RoleDto>
            columns={[
              {
                key: 'name',
                header: 'Rol',
                sortable: true,
                sortKey: 'name',
                render: (role) => (
                  <button className="text-left" onClick={() => setSelectedRoleId(String(role.id))} type="button">
                    <p className="font-medium text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500">{role.description ?? 'Sin descripcion registrada'}</p>
                  </button>
                ),
              },
              {
                key: 'permissions',
                header: 'Permisos',
                render: (role) => (
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.length > 0 ? role.permissions.map((permission) => <span key={permission.code} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{permission.code}</span>) : <span className="text-xs text-slate-500">Sin permisos asociados</span>}
                  </div>
                ),
              },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay roles para mostrar con el criterio actual.</p>}
            isLoading={rolesQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            pagination={rolesQuery.data}
            rowKey={(role) => String(role.id)}
            rows={roles}
            sort={{
              value: sort,
              onChange: (nextSort) => {
                setSort(nextSort);
                setPage(0);
              },
            }}
          />
          {selectedRole ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Actualizar permisos del rol</h2></div>
              <form
                className="grid gap-4"
                onSubmit={editPermissionsForm.handleSubmit((values) =>
                  updatePermissionsMutation.mutate({
                    permissions: values.permissionsInput ? values.permissionsInput.split(',').map((item) => item.trim()).filter(Boolean) : [],
                  }),
                )}
              >
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Permisos</span><textarea className={`${inputClass} min-h-24`} {...editPermissionsForm.register('permissionsInput')} /></label>
                <div>
                  {updatePermissionsMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(updatePermissionsMutation.error, 'No se pudieron actualizar los permisos.')}</div> : null}
                  {updatePermissionsMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Permisos actualizados correctamente.</div> : null}
                  <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={updatePermissionsMutation.isPending} type="submit">{updatePermissionsMutation.isPending ? 'Actualizando...' : 'Guardar permisos'}</button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
