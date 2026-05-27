import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { OpenCashBoxRequest } from '../../../services/api/types';
import { openCashBox } from '../../../services/cash/cash-api';
import { normalizeCashBox, useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

const openingSchema = z.object({
  openingAmount: z.coerce.number().min(0, 'El monto de apertura no puede ser negativo.'),
  observation: z.string().optional(),
});

type OpeningFormValues = z.infer<typeof openingSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function CashOpeningPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);
  const setActiveCash = useOperationalStore((state) => state.setActiveCash);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpeningFormValues>({
    resolver: zodResolver(openingSchema),
    defaultValues: {
      openingAmount: 0,
      observation: '',
    },
  });

  const openMutation = useMutation({
    mutationFn: (values: OpenCashBoxRequest) => openCashBox(values),
    onSuccess: (cash) => {
      const normalizedCash = normalizeCashBox(cash);
      setActiveCash(normalizedCash);
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      reset();
      navigate('/caja/activa');
    },
  });

  if (!activeContext) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/contexto')}
            type="button"
          >
            Ir a seleccionar contexto
          </button>
        }
        body="Primero necesitas elegir un negocio o evento para que la apertura se registre con el contexto correcto."
        title="Contexto pendiente"
        tone="warning"
      />
    );
  }

  return (
    <ResourcePageShell
      badge="FE-CAJ-001 Apertura real"
      description="Pantalla conectada a `POST /api/v1/cajas/aperturas` para registrar la apertura real de caja sobre el contexto operativo seleccionado."
      documents={['04 - HU-CAJ-001', '18 - API-CAJ-001', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Contexto sobre el que se registrara la apertura." label="Contexto activo" value={activeContext.name} />
          <MetricCard helper="Tipo visible para el cajero o supervisor." label="Tipo" value={activeContext.kind} />
          <MetricCard
            helper="Si ya existe una apertura activa, el flujo debe continuar por resumen o cierre."
            label="Estado actual"
            value={activeCash?.status === 'ABIERTA' ? 'Caja abierta' : 'Sin apertura'}
          />
        </div>
      }
      title="Apertura de caja"
    >
      {activeCash?.status === 'ABIERTA' ? (
        <ResourceState
          action={
            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => navigate('/caja/activa')}
              type="button"
            >
              Ir a caja activa
            </button>
          }
          body={`Ya existe una caja abierta para ${activeCash.operationalContextName ?? activeContext.name} con apertura de ${formatCurrency(
            activeCash.openingAmount,
          )}.`}
          title="Apertura ya registrada"
          tone="warning"
        />
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar apertura</h2>
          <p className="mt-2 text-sm text-slate-600">
            El backend solicita `operationalContextId`, `openingAmount` y una observacion opcional.
          </p>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit((values) =>
            openMutation.mutate({
              operationalContextId: Number(activeContext.id),
              openingAmount: values.openingAmount,
              observation: values.observation,
            }),
          )}
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Monto de apertura</span>
            <input className={inputClass} step="0.01" type="number" {...register('openingAmount')} />
            {errors.openingAmount ? <span className="text-xs text-rose-600">{errors.openingAmount.message}</span> : null}
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">Contexto de registro</p>
            <p className="mt-2 text-sm text-slate-600">{activeContext.name}</p>
            <p className="text-xs text-slate-500">ID enviado al backend: {activeContext.id}</p>
          </div>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Observacion de apertura</span>
            <textarea className={`${inputClass} min-h-24`} {...register('observation')} />
          </label>

          <div className="md:col-span-2">
            {openMutation.isError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getApiErrorMessage(openMutation.error, 'No se pudo registrar la apertura de caja.')}
              </div>
            ) : null}
            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              disabled={openMutation.isPending || activeCash?.status === 'ABIERTA'}
              type="submit"
            >
              {openMutation.isPending ? 'Registrando apertura...' : 'Abrir caja'}
            </button>
          </div>
        </form>
      </section>

      {activeCash ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">Ultimo estado conocido</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MetricCard helper="Ultima apertura sincronizada localmente." label="Monto" value={formatCurrency(activeCash.openingAmount)} />
            <MetricCard helper="Fecha y hora reportada por backend." label="Apertura" value={formatDateTime(activeCash.openedAt)} />
            <MetricCard helper="Usuario que abrio la caja." label="Responsable" value={activeCash.openedByUsername ?? 'No disponible'} />
          </div>
        </section>
      ) : null}
    </ResourcePageShell>
  );
}
