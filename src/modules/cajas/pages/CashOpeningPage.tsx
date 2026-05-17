import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';
import { useOperationalStore } from '../../../store/operational-store';

export function CashOpeningPage() {
  const activeCash = useOperationalStore((state) => state.activeCash);
  const openDemoCash = useOperationalStore((state) => state.openDemoCash);

  return (
    <PlaceholderPage
      description="Base de apertura de caja para guiar el flujo cuando el usuario ya tiene contexto, pero todavia no puede vender."
      documents={['08 - Backlog por fases', '13 - Arquitectura funcional frontend', '17 - Layouts y rutas']}
      eyebrow="FE-PAN-003 Apertura de caja"
      nextStep="Siguiente fase: integrar formulario real con validaciones y endpoint de apertura."
      phaseCoverage="Cubre ruta operativa, guard de autenticacion, guard de contexto y primer estado de caja activa."
      quickLinks={[
        { label: 'Contexto', to: '/contexto' },
        { label: 'Caja activa', to: '/caja/activa' },
      ]}
      title="Apertura guiada de caja"
    >
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-dashed border-slate-300 p-5">
          <p className="text-sm font-semibold text-slate-900">Estado actual</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {activeCash?.status === 'open'
              ? 'Ya existe una caja demo abierta. Esta vista seguira siendo el punto de entrada si una ruta requiere apertura.'
              : 'Todavia no existe caja abierta. La app esta preparada para desviar aqui antes de venta o cierre.'}
          </p>
        </article>

        <button
          className="rounded-3xl bg-slate-950 px-5 py-5 text-left text-white transition hover:bg-slate-800"
          onClick={() => openDemoCash()}
          type="button"
        >
          <p className="text-lg font-semibold">Simular apertura</p>
          <p className="mt-2 text-sm text-slate-300">Crea una caja activa demo con monto referencial de S/ 250.00.</p>
        </button>
      </div>
    </PlaceholderPage>
  );
}
