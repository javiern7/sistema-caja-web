import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';
import { useOperationalStore } from '../../../store/operational-store';

export function CashClosingPage() {
  const activeCash = useOperationalStore((state) => state.activeCash);
  const closeDemoCash = useOperationalStore((state) => state.closeDemoCash);

  return (
    <PlaceholderPage
      description="Pantalla inicial de cierre reservada para el flujo que exige diferencia, observacion y validacion backend."
      documents={['02 - Reglas de negocio', '13 - Arquitectura funcional frontend', '17 - Layouts y rutas']}
      eyebrow="FE-PAN-006 Cierre de caja"
      nextStep="Siguiente fase: integrar calculos, diferencias y observacion obligatoria segun regla."
      phaseCoverage="Deja lista la ruta protegida para cierre y el punto visual donde se acoplara el formulario real."
      quickLinks={[
        { label: 'Caja activa', to: '/caja/activa' },
        { label: 'Egresos', to: '/egresos/nuevo' },
      ]}
      title="Cierre de caja preparado"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <article className="flex-1 rounded-3xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900">Validacion futura</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            El frontend no cerrara la caja por si solo: solo guiara al usuario, mostrara estados y dejara la regla
            sensible al backend.
          </p>
        </article>
        <button
          className="rounded-3xl bg-slate-950 px-5 py-5 text-left text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-72"
          disabled={activeCash?.status !== 'open'}
          onClick={() => closeDemoCash()}
          type="button"
        >
          <p className="text-lg font-semibold">Simular cierre</p>
          <p className="mt-2 text-sm text-slate-300">Solo disponible cuando exista caja demo abierta.</p>
        </button>
      </div>
    </PlaceholderPage>
  );
}
