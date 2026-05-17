import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function ExpensePage() {
  return (
    <PlaceholderPage
      description="Punto de entrada del modulo de egresos, preparado para convivir con caja activa y permisos del usuario."
      documents={['02 - Reglas de negocio', '13 - Arquitectura funcional frontend', '17 - Layouts y rutas']}
      eyebrow="FE-PAN-008 Egresos"
      nextStep="Siguiente fase: conectar motivos, montos, observaciones y relacion con caja cuando aplique."
      phaseCoverage="Fija guard de autenticacion, guard de contexto y guard de permiso del modulo."
      quickLinks={[
        { label: 'Caja activa', to: '/caja/activa' },
        { label: 'Cierre', to: '/caja/cierre' },
      ]}
      title="Egresos listos para integracion"
    />
  );
}
