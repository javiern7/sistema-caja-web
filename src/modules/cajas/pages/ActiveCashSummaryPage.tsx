import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';
import { useOperationalStore } from '../../../store/operational-store';

export function ActiveCashSummaryPage() {
  const activeCash = useOperationalStore((state) => state.activeCash);

  return (
    <PlaceholderPage
      description="Resumen base de caja activa para mantener visible el estado operativo y el acceso futuro al cierre."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '26 - Frontend Fase 1']}
      eyebrow="FE-PAN-005 Caja activa"
      nextStep="Siguiente fase: conectar movimientos reales, totales y resumen operativo desde backend."
      phaseCoverage="Consolida un punto comun dentro del layout operativo para caja activa y futuras metricas del turno."
      quickLinks={[
        { label: 'Venta rapida', to: '/ventas/nueva' },
        { label: 'Cierre', to: '/caja/cierre' },
      ]}
      title="Resumen operativo de caja"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Estado</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{activeCash?.status === 'open' ? 'Abierta' : 'Pendiente'}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Monto apertura</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">S/ {activeCash ? activeCash.openingAmount.toFixed(2) : '0.00'}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Siguiente uso</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Servira para ventas, egresos relacionados y cierre.</p>
        </article>
      </div>
    </PlaceholderPage>
  );
}
