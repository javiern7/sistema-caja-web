import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function ContextsAdminPage() {
  return (
    <PlaceholderPage
      description="Pantalla administrativa reservada para negocios y eventos, pieza clave para el contexto operativo del sistema."
      documents={['08 - Backlog por fases', '13 - Arquitectura funcional frontend', '17 - Layouts y rutas']}
      eyebrow="Admin contextos"
      nextStep="Siguiente fase: CRUD y cambios de estado conectados al backend."
      phaseCoverage="Conecta la futura administracion de contextos con la seleccion operativa ya definida."
      quickLinks={[
        { label: 'Seleccion de contexto', to: '/contexto' },
        { label: 'Usuarios', to: '/admin/usuarios' },
      ]}
      title="Negocios y eventos reservados"
    />
  );
}
