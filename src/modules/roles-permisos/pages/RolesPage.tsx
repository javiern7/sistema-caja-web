import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function RolesPage() {
  return (
    <PlaceholderPage
      description="Pantalla base para futuros permisos visibles del sistema. En Fase 1 sirve para fijar estructura y ruteo."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '20 - Checklist de arranque']}
      eyebrow="Admin roles"
      nextStep="Siguiente fase: matriz de permisos, detalle de rol y gestion visible."
      phaseCoverage="Prepara el modulo de seguridad del frontend sin resolver aun reglas definitivas del backend."
      quickLinks={[
        { label: 'Usuarios', to: '/admin/usuarios' },
        { label: 'Contextos', to: '/admin/contextos' },
      ]}
      title="Roles y permisos preparados"
    />
  );
}
