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
import { createOperationalContext, fetchOperationalContextsAdmin } from '../../../services/operational-contexts/operational-contexts-api';

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
  const contextsQuery = useQuery({
    queryKey: ['admin', 'negocios-eventos'],
    queryFn: fetchOperationalContextsAdmin,
    retry: false,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContextFormValues>({
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
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'negocios-eventos'] });
    },
  });

  const contexts = contextsQuery.data ?? [];

  return (
    <ResourcePageShell
      badge="FE-NEG-001 Contextos"
      description="Vista conectada a `GET /api/v1/negocios-eventos` y `POST /api/v1/negocios-eventos` para validar la administracion real del contexto operativo."
      documents={['04 - HU-NEG-001', '18 - API-NEG-001/API-NEG-002', '13 - Contexto operativo frontend']}
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
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar contexto operativo</h2>
          <p className="mt-2 text-sm text-slate-600">Formulario alineado al contrato `CreateOperationalContextRequest`.</p>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Codigo</span>
            <input className={inputClass} {...register('code')} />
            {errors.code ? <span className="text-xs text-rose-600">{errors.code.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input className={inputClass} {...register('name')} />
            {errors.name ? <span className="text-xs text-rose-600">{errors.name.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tipo</span>
            <select className={inputClass} {...register('type')}>
              <option value="NEGOCIO">Negocio</option>
              <option value="EVENTO">Evento</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Estado</span>
            <select className={inputClass} {...register('status')}>
              <option value="PLANIFICADO">Planificado</option>
              <option value="EN_CURSO">En curso</option>
              <option value="CERRADO">Cerrado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha inicio</span>
            <input className={inputClass} type="date" {...register('startDate')} />
            {errors.startDate ? <span className="text-xs text-rose-600">{errors.startDate.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha fin</span>
            <input className={inputClass} type="date" {...register('endDate')} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <textarea className={`${inputClass} min-h-24`} {...register('description')} />
          </label>
          <div className="md:col-span-2">
            {createMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createMutation.error, 'No se pudo registrar el contexto.')}</div> : null}
            {createMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Contexto registrado correctamente.</div> : null}
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? 'Guardando contexto...' : 'Guardar contexto'}
            </button>
          </div>
        </form>
      </section>

      {contextsQuery.isLoading ? <ResourceState body="Consultando contextos administrativos..." title="Cargando contextos" /> : null}
      {contextsQuery.isError ? <ResourceState body={getApiErrorMessage(contextsQuery.error, 'No se pudieron cargar los negocios y eventos.')} title="Error al consultar contextos" tone="danger" /> : null}
      {!contextsQuery.isLoading && !contextsQuery.isError && contexts.length === 0 ? <ResourceState body="Todavia no existen contextos registrados en el backend." title="Sin contextos" tone="warning" /> : null}
      {!contextsQuery.isLoading && !contextsQuery.isError && contexts.length > 0 ? (
        <ResourceTable<OperationalContextDto>
          columns={[
            {
              key: 'name',
              header: 'Nombre',
              render: (context) => (
                <div>
                  <p className="font-medium text-slate-900">{context.name ?? context.nombre}</p>
                  <p className="text-xs text-slate-500">{context.code ?? 'Sin codigo'}</p>
                </div>
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
      ) : null}
    </ResourcePageShell>
  );
}
