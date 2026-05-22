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
import type { CreateProviderRequest, ProviderDto, UpdateProviderRequest } from '../../../services/api/types';
import { createProvider, fetchProvidersPage, updateProvider } from '../../../services/catalogs/catalogs-api';

const providerSchema = z.object({
  name: z.string().min(1, 'Ingresa el nombre del proveedor.'),
  documentNumber: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Ingresa un correo valido.').or(z.literal('')).optional(),
  active: z.boolean(),
});

type ProviderFormValues = z.infer<typeof providerSchema>;
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState('name,asc');
  const providersQuery = useQuery({
    queryKey: ['admin', 'proveedores', page, pageSize, sort],
    queryFn: () => fetchProvidersPage({ page, size: pageSize, sort }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const createForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { name: '', documentNumber: '', contactName: '', phone: '', email: '', active: true },
  });
  const editForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { name: '', documentNumber: '', contactName: '', phone: '', email: '', active: true },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateProviderRequest) => createProvider(values),
    onSuccess: () => {
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'proveedores'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateProviderRequest) => updateProvider(Number(selectedProviderId), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'proveedores'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ providerId, values }: { providerId: number; values: UpdateProviderRequest }) => updateProvider(providerId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'proveedores'] });
    },
  });

  const providers = providersQuery.data?.items ?? [];
  const selectedProvider = providers.find((provider) => String(provider.id) === selectedProviderId) ?? null;
  const activeProviders = providers.filter((provider) => provider.active).length;

  useEffect(() => {
    if (!selectedProvider) return;
    editForm.reset({
      name: selectedProvider.name,
      documentNumber: selectedProvider.documentNumber ?? '',
      contactName: selectedProvider.contactName ?? '',
      phone: selectedProvider.phone ?? '',
      email: selectedProvider.email ?? '',
      active: selectedProvider.active,
    });
  }, [editForm, selectedProvider]);

  const handleSelectProvider = (providerId: string | number) => {
    setSelectedProviderId(String(providerId));
  };

  return (
    <ResourcePageShell
      badge="FE-PRV-001 Proveedores"
      description="Vista conectada a `GET`, `POST` y `PUT` de proveedores para validar catalogo, actualizacion y uso real en compras."
      documents={['04 - HU-COM-001', '18 - API-PRV-001/API-PRV-002/API-PRV-003', '25 - Orquestador Fase 1']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Datos entregados por tu backend actual." label="Proveedores" value={String(providersQuery.data?.totalElements ?? providers.length)} />
          <MetricCard helper="Disponibles para compras operativas." label="Activos" value={String(activeProviders)} />
          <MetricCard helper="Listos para enlazar con compras." label="Contactos visibles" value={String(providers.filter((provider) => provider.contactName).length)} />
        </div>
      }
      title="Proveedores"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar proveedor</h2>
          <p className="mt-2 text-sm text-slate-600">Formulario alineado al contrato `CreateProviderRequest` del backend.</p>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input className={inputClass} {...createForm.register('name')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Documento</span><input className={inputClass} {...createForm.register('documentNumber')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Contacto</span><input className={inputClass} {...createForm.register('contactName')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Telefono</span><input className={inputClass} {...createForm.register('phone')} /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Correo</span><input className={inputClass} {...createForm.register('email')} /></label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" {...createForm.register('active')} /><span className="text-sm text-slate-700">Activo</span></label>
          <div className="md:col-span-2">
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el proveedor.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Proveedor registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending} type="submit">{createMutation.isPending ? 'Guardando proveedor...' : 'Guardar proveedor'}</button>
          </div>
        </form>
      </section>

      {providersQuery.isLoading ? <ResourceState body="Consultando proveedores..." title="Cargando proveedores" /> : null}
      {providersQuery.isError ? <ResourceState body={getApiErrorMessage(providersQuery.error, 'No se pudo cargar la lista de proveedores.')} title="Error al consultar proveedores" tone="danger" /> : null}
      {!providersQuery.isLoading && !providersQuery.isError && providers.length === 0 ? <ResourceState body="Aun no hay proveedores registrados en el backend." title="Lista vacia" tone="warning" /> : null}
      {!providersQuery.isLoading && !providersQuery.isError && providers.length > 0 ? (
        <>
          <ResourceTable<ProviderDto>
            columns={[
              {
                key: 'name',
                header: 'Proveedor',
                sortable: true,
                sortKey: 'name',
                render: (provider) => (
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{provider.name}</p>
                    <p className="text-xs text-slate-500">{provider.documentNumber ?? 'Sin documento'}</p>
                  </div>
                ),
              },
              {
                key: 'contact',
                header: 'Contacto',
                sortable: true,
                sortKey: 'contactName',
                render: (provider) => (
                  <div>
                    <p>{provider.contactName ?? 'No definido'}</p>
                    <p className="text-xs text-slate-500">{provider.phone ?? provider.email ?? 'Sin telefono ni correo'}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                sortable: true,
                sortKey: 'active',
                render: (provider) => <StatusBadge label={provider.active ? 'Activo' : 'Inactivo'} tone={provider.active ? 'success' : 'warning'} />,
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (provider) => {
                  const isCurrentProvider = String(provider.id) === selectedProviderId;
                  const isTogglingStatus = toggleStatusMutation.isPending && toggleStatusMutation.variables?.providerId === Number(provider.id);

                  return (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          isCurrentProvider
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        onClick={() => handleSelectProvider(provider.id)}
                        type="button"
                      >
                        {isCurrentProvider ? 'Editando' : 'Editar'}
                      </button>
                      <button
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isTogglingStatus}
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            providerId: Number(provider.id),
                            values: {
                              name: provider.name,
                              documentNumber: provider.documentNumber ?? '',
                              contactName: provider.contactName ?? '',
                              phone: provider.phone ?? '',
                              email: provider.email ?? '',
                              active: !provider.active,
                            },
                          })
                        }
                        type="button"
                      >
                        {isTogglingStatus ? 'Actualizando...' : provider.active ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
                  );
                },
              },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay proveedores para mostrar con el criterio actual.</p>}
            isLoading={providersQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            pagination={providersQuery.data}
            rowClassName={(provider) =>
              String(provider.id) === selectedProviderId ? 'align-top bg-brand-50/50 ring-1 ring-inset ring-brand-100' : 'align-top'
            }
            rowKey={(provider) => String(provider.id)}
            rows={providers}
            sort={{
              value: sort,
              onChange: (nextSort) => {
                setSort(nextSort);
                setPage(0);
              },
            }}
          />
          {selectedProvider ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-950">Editar proveedor</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Editando <span className="font-semibold text-slate-900">{selectedProvider.name}</span> usando `PUT /api/v1/proveedores/{'{providerId}'}`. Para retirar un proveedor del flujo operativo, usa `Inactivar`.
                </p>
              </div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input className={inputClass} {...editForm.register('name')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Documento</span><input className={inputClass} {...editForm.register('documentNumber')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Contacto</span><input className={inputClass} {...editForm.register('contactName')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Telefono</span><input className={inputClass} {...editForm.register('phone')} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Correo</span><input className={inputClass} {...editForm.register('email')} /></label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" {...editForm.register('active')} /><span className="text-sm text-slate-700">Activo</span></label>
                <div className="md:col-span-2">
                  {updateMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error, 'No se pudo actualizar el proveedor.')}</div> : null}
                  {updateMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Proveedor actualizado correctamente.</div> : null}
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
