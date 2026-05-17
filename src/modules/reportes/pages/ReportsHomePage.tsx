import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function ReportsHomePage() {
  return (
    <PlaceholderPage
      description="Centro inicial de reportes para dejar la ruta y el layout separados del flujo operativo diario."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '19 - Estructura real de carpetas']}
      eyebrow="Reportes"
      nextStep="Siguiente fase: filtros por modulo y exportaciones reales."
      phaseCoverage="Reserva un layout dedicado a consulta y exportacion, alineado con el mapa funcional del MVP."
      quickLinks={[
        { label: 'Caja activa', to: '/caja/activa' },
        { label: 'Productos', to: '/admin/productos' },
      ]}
      title="Centro de reportes preparado"
    />
  );
}
