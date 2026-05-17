import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';
import { useOperationalStore } from '../../../store/operational-store';

export function ContextSelectionPage() {
  const availableContexts = useOperationalStore((state) => state.availableContexts);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const setActiveContext = useOperationalStore((state) => state.setActiveContext);

  return (
    <PlaceholderPage
      description="Pantalla base para elegir negocio o evento antes de permitir la operacion diaria. Responde al nivel de contexto operativo definido para el MVP."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '25 - Orquestador Fase 1']}
      eyebrow="FE-PAN-002 Contexto operativo"
      nextStep="Siguiente fase: conectar contextos reales del backend y aplicar redireccion dinamica segun el flujo."
      phaseCoverage="Fija la ruta autenticada inicial, el estado compartido de contexto y la redireccion necesaria para pantallas operativas."
      quickLinks={[
        { label: 'Ir a apertura', to: '/caja/apertura' },
        { label: 'Ver caja activa', to: '/caja/activa' },
      ]}
      title="Seleccion de negocio o evento"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {availableContexts.map((context) => {
          const isActive = context.id === activeContext?.id;
          return (
            <button
              key={context.id}
              className={`rounded-3xl border p-5 text-left transition ${
                isActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'
              }`}
              onClick={() => setActiveContext(context)}
              type="button"
            >
              <p className="text-lg font-semibold text-slate-900">{context.name}</p>
              <p className="mt-2 text-sm text-slate-500">Tipo: {context.kind}</p>
              <p className="mt-4 text-sm text-slate-600">
                {isActive ? 'Contexto activo para las rutas operativas.' : 'Disponible para operar en el MVP.'}
              </p>
            </button>
          );
        })}
      </div>
    </PlaceholderPage>
  );
}
