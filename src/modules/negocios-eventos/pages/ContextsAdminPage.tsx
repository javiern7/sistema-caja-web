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
import type { CreateOperationalContextRequest, OperationalContextDto } from '../../../services/api/types';
import { createOperationalContext, fetchOperationalContextsAdmin, updateOperationalContext } from '../../../services/operational-contexts/operational-contexts-api';

const contextSchema = z.object({
  code: z.string().min(1, 'Ingresa el codigo.'),
  name: z.string().min(1, 'Ingresa el nombre.'),
  type: z.enum(['NEGOCIO', 'EVENTO']),
  status: z.enum(['PLANIFICADO', 'EN_CURSO', 'CERRADO', 'CANCELADO']),
  startDate: z.string().min(1, 'Ingresa la fecha de inicio.'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

type ContextFormValues = z.infer<typeof contextSchema>;
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function ContextsAdminPage() {
  const queryClient = useQueryClient();
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const contextsQuery = useQuery({
    queryKey: ['admin', 'negocios-eventos'],
    queryFn: fetchOperationalContextsAdmin,
    retry: false,
  });

  const createForm = useForm<ContextFormValues>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'NEGOCIO',
      status: 'PLANIFICADO',
      startDate: '',
      endDate: '',
      description: '',
    },
  });
  const editForm = useForm<ContextFormValues>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'NEGOCIO',
      status: 'PLANIFICADO',
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateOperationalContextRequest) => createOperationalContext(values),
    onSuccess: () => {
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'negocios-eventos'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (values: CreateOperationalContextRequest) => updateOperationalContext(Number(selectedContextId), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'negocios-eventos'] });
    },
  });

  const contexts = contextsQuery.data ?? [];
  const selectedContext = contexts.find((context) => String(context.id) === selectedContextId) ?? null;

  useEffect(() => {
    if (!selectedContext) return;
    editForm.reset({
      code: selectedContext.code ?? '',
      name: selectedContext.name ?? selectedContext.nombre ?? '',
      type: (selectedContext.type ?? selectedContext.tipo ?? 'NEGOCIO') as 'NEGOCIO' | 'EVENTO',
      status: (selectedContext.status ?? selectedContext.estado ?? 'PLANIFICADO') as 'PLANIFICADO' | 'EN_CURSO' | 'CERRADO' | 'CANCELADO',
      startDate: selectedContext.startDate ?? '',
      endDate: selectedContext.endDate ?? '',
      description: selectedContext.description ?? '',
    });
  }, [editForm, selectedContext]);

  return (
    <ResourcePageShell
      badge="FE-NEG-001 Contextos"
      description="Vista conectada a `GET`, `POST` y `PUT` de negocios/eventos para validar la administracion real del contexto operativo."
      documents={['04 - HU-NEG-001', '18 - API-NEG-001/API-NEG-002/API-NEG-003', '13 - Contexto operativo frontend']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Negocios o eventos devueltos por el backend." label="Contextos" value={String(contexts.length)} />
          <MetricCard helper="Contextos de tipo evento." label="Eventos" value={String(contexts.filter((context) => (context.type ?? context.tipo) === 'EVENTO').length)} />
          <MetricCard helper="Contextos de tipo negocio." label="Negocios" value={String(contexts.filter((context) => (context.type ?? context.tipo) === 'NEGOCIO').length)} />
        </div>
      }
      title="Negocios y eventos"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Registrar contexto operativo</h2></div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Codigo</span><input className={inputClass} {...createForm.register('code')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input className={inputClass} {...createForm.register('name')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Tipo</span><select className={inputClass} {...createForm.register('type')}><option value="NEGOCIO">Negocio</option><option value="EVENTO">Evento</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Estado</span><select className={inputClass} {...createForm.register('status')}><option value="PLANIFICADO">Planificado</option><option value="EN_CURSO">En curso</option><option value="CERRADO">Cerrado</option><option value="CANCELADO">Cancelado</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Fecha inicio</span><input className={inputClass} type="date" {...createForm.register('startDate')} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Fecha fin</span><input className={inputClass} type="date" {...createForm.register('endDate')} /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Descripcion</span><textarea className={`${inputClass} min-h-24`} {...createForm.register('description')} /></label>
          <div className="md:col-span-2">
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el contexto.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Contexto registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending} type="submit">{createMutation.isPending ? 'Guardando contexto...' : 'Guardar contexto'}</button>
          </div>
        </form>
      </section>

      {contextsQuery.isLoading ? <ResourceState body="Consultando contextos administrativos..." title="Cargando contextos" /> : null}
      {contextsQuery.isError ? <ResourceState body={getApiErrorMessage(contextsQuery.error, 'No se pudieron cargar los negocios y eventos.')} title="Error al consultar contextos" tone="danger" /> : null}
      {!contextsQuery.isLoading && !contextsQuery.isError && contexts.length === 0 ? <ResourceState body="Todavia no existen contextos registrados en el backend." title="Sin contextos" tone="warning" /> : null}
      {!contextsQuery.isLoading && !contextsQuery.isError && contexts.length > 0 ? (
        <>
          <ResourceTable<OperationalContextDto>
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                render: (context) => (
                  <button className="text-left" onClick={() => setSelectedContextId(String(context.id))} type="button">
                    <p className="font-medium text-slate-900">{context.name ?? context.nombre}</p>
                    <p className="text-xs text-slate-500">{context.code ?? 'Sin codigo'}</p>
                  </button>
                ),
              },
              { key: 'type', header: 'Tipo', render: (context) => <span>{context.type ?? context.tipo ?? 'Sin tipo'}</span> },
              {
                key: 'dates',
                header: 'Fechas',
                render: (context) => (
                  <div>
                    <p>Inicio: {context.startDate ?? 'No definido'}</p>
                    <p className="text-xs text-slate-500">Fin: {context.endDate ?? 'No definido'}</p>
                  </div>
                ),
              },
              { key: 'status', header: 'Estado', render: (context) => <StatusBadge label={String(context.status ?? context.estado ?? 'SIN_ESTADO')} tone="neutral" /> },
            ]}
            rowKey={(context) => String(context.id)}
            rows={contexts}
          />
          {selectedContext ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Editar contexto operativo</h2></div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Codigo</span><input className={inputClass} {...editForm.register('code')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input className={inputClass} {...editForm.register('name')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Tipo</span><select className={inputClass} {...editForm.register('type')}><option value="NEGOCIO">Negocio</option><option value="EVENTO">Evento</option></select></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Estado</span><select className={inputClass} {...editForm.register('status')}><option value="PLANIFICADO">Planificado</option><option value="EN_CURSO">En curso</option><option value="CERRADO">Cerrado</option><option value="CANCELADO">Cancelado</option></select></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Fecha inicio</span><input className={inputClass} type="date" {...editForm.register('startDate')} /></label>
                <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Fecha fin</span><input className={inputClass} type="date" {...editForm.register('endDate')} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Descripcion</span><textarea className={`${inputClass} min-h-24`} {...editForm.register('description')} /></label>
                <div className="md:col-span-2">
                  {updateMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error, 'No se pudo actualizar el contexto.')}</div> : null}
                  {updateMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Contexto actualizado correctamente.</div> : null}
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
