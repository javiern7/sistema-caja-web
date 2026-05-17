import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function UsersPage() {
  return (
    <PlaceholderPage
      description="Base de usuarios para el futuro modulo de seguridad. Mantiene visible la ruta oficial del mapa funcional."
      documents={['08 - Backlog por fases', '13 - Arquitectura funcional frontend', '17 - Layouts y rutas']}
      eyebrow="Admin usuarios"
      nextStep="Siguiente fase: lista de usuarios, altas y asignacion de roles."
      phaseCoverage="Permite organizar la navegacion administrativa sin mezclar implementacion funcional adelantada."
      quickLinks={[
        { label: 'Roles y permisos', to: '/admin/roles' },
        { label: 'Contextos', to: '/admin/contextos' },
      ]}
      title="Usuarios en base tecnica"
    />
  );
}
