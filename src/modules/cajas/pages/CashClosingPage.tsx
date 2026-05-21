import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CloseCashBoxRequest } from '../../../services/api/types';
import { closeCashBox, fetchCashBoxSummary } from '../../../services/cash/cash-api';
import { normalizeCashBox, useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

const closeSchema = z.object({
  countedAmount: z.coerce.number().min(0, 'El monto contado no puede ser negativo.'),
  observation: z.string().optional(),
});

type CloseFormValues = z.infer<typeof closeSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function CashClosingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeCash = useOperationalStore((state) => state.activeCash);
  const setActiveCash = useOperationalStore((state) => state.setActiveCash);

  const summaryQuery = useQuery({
    queryKey: ['cash-box', 'closing-summary', activeCash?.id],
    queryFn: async () => fetchCashBoxSummary(Number(activeCash?.id)),
    enabled: Boolean(activeCash?.id),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CloseFormValues>({
    resolver: zodResolver(closeSchema),
    defaultValues: {
      countedAmount: Number(activeCash?.expectedAmount ?? 0),
      observation: '',
    },
  });

  const closeMutation = useMutation({
    mutationFn: (payload: CloseCashBoxRequest) => closeCashBox(Number(activeCash?.id), payload),
    onSuccess: (cash) => {
      setActiveCash(normalizeCashBox(cash));
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
      navigate('/caja/apertura');
    },
  });

  const summary = summaryQuery.data ? normalizeCashBox(summaryQuery.data) : activeCash;
  const countedAmount = watch('countedAmount');
  const expectedDifference = Number(countedAmount ?? 0) - Number(summary?.expectedAmount ?? 0);

  if (!activeCash) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/caja/apertura')}
            type="button"
          >
            Volver a apertura
          </button>
        }
        body="No hay una caja abierta en el estado operativo actual, por lo que no se puede iniciar un cierre."
        title="Cierre no disponible"
        tone="warning"
      />
    );
  }

  return (
    <ResourcePageShell
      badge="FE-CAJ-003 Cierre real"
      description="Pantalla conectada a `POST /api/v1/cajas/{cashBoxId}/cierres` para registrar el cierre real y la diferencia operativa."
      documents={['04 - HU-CAJ-003', '18 - API-CAJ-003', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            helper="Saldo que el sistema calcula para la caja segun apertura, ventas, ingresos extra y egresos."
            label="Monto esperado en caja"
            value={formatCurrency(summary?.expectedAmount)}
          />
          <MetricCard
            helper="Monto inicial con el que se abrio la caja para este turno."
            label="Monto inicial de apertura"
            value={formatCurrency(summary?.openingAmount)}
          />
          <MetricCard helper="Fecha y hora en la que se abrio la caja actual." label="Caja abierta desde" value={formatDateTime(summary?.openedAt)} />
        </div>
      }
      title="Cierre de caja"
    >
      {summaryQuery.isLoading ? <ResourceState body="Consultando resumen previo al cierre..." title="Cargando datos de cierre" /> : null}

      {summaryQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(summaryQuery.error, 'No se pudo obtener el resumen de caja para el cierre.')}
          title="Error al preparar cierre"
          tone="danger"
        />
      ) : null}

      {summary ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-950">Resumen antes del cierre</h2>
            <p className="mt-2 text-sm text-slate-600">Este bloque explica como el sistema obtuvo el monto esperado de caja antes de registrar el cierre.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MetricCard helper="Total vendido y registrado en esta caja." label="Ventas acumuladas" value={formatCurrency(summary.totalSales)} />
              <MetricCard helper="Total de salidas de dinero registradas en esta caja." label="Egresos registrados" value={formatCurrency(summary.totalExpenses)} />
              <MetricCard helper="Ingresos adicionales incorporados manualmente a la caja." label="Ingresos extra" value={formatCurrency(summary.additionalIncome)} />
              <MetricCard helper="Ultima diferencia registrada anteriormente, si existiera." label="Diferencia previa" value={formatCurrency(summary.differenceAmount)} />
            </div>
          </article>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-950">Registrar cierre</h2>
              <p className="mt-2 text-sm text-slate-600">Ingresa el monto fisico contado en caja. Si existe una diferencia contra lo esperado por el sistema, debes explicar el motivo.</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => {
                const differenceAmount = Number(values.countedAmount) - Number(summary.expectedAmount ?? 0);

                if (differenceAmount !== 0 && !values.observation?.trim()) {
                  setError('observation', {
                    type: 'manual',
                    message: 'La observacion es obligatoria cuando existe diferencia en el cierre.',
                  });
                  return;
                }

                clearErrors('observation');
                closeMutation.mutate(values);
              })}
            >
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Monto fisico contado</span>
                <input className={inputClass} step="0.01" type="number" {...register('countedAmount')} />
                <p className="text-xs text-slate-500">Es el dinero real que contaste al momento de cerrar la caja.</p>
                {errors.countedAmount ? <span className="text-xs text-rose-600">{errors.countedAmount.message}</span> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Observacion de cierre</span>
                <textarea className={`${inputClass} min-h-28`} {...register('observation')} />
                <p className="text-xs text-slate-500">Describe cualquier sobrante, faltante o incidencia detectada durante el cierre.</p>
                {errors.observation ? <span className="text-xs text-rose-600">{errors.observation.message}</span> : null}
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Diferencia entre el sistema y tu conteo: {formatCurrency(expectedDifference)}
              </div>

              {closeMutation.isError ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getApiErrorMessage(closeMutation.error, 'No se pudo registrar el cierre de caja.')}
                </div>
              ) : null}

              <button
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                disabled={closeMutation.isPending || summary.status !== 'ABIERTA'}
                type="submit"
              >
                {closeMutation.isPending ? 'Registrando cierre...' : 'Cerrar caja'}
              </button>
            </form>
          </section>
        </section>
      ) : null}
    </ResourcePageShell>
  );
}
