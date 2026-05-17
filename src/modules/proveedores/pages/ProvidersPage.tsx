import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function ProvidersPage() {
  return (
    <PlaceholderPage
      description="Modulo base para proveedores dentro del layout administrativo. Sirve para fijar navegacion y permisos desde temprano."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '25 - Orquestador Fase 1']}
      eyebrow="Admin proveedores"
      nextStep="Siguiente fase: listado, alta y edicion vinculadas a compras."
      phaseCoverage="Organiza el espacio administrativo sin adelantar formularios finales."
      quickLinks={[
        { label: 'Compras', to: '/compras/nueva' },
        { label: 'Productos', to: '/admin/productos' },
      ]}
      title="Proveedores preparados"
    />
  );
}
