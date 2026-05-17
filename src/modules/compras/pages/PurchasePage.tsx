import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function PurchasePage() {
  return (
    <PlaceholderPage
      description="Ruta base del registro de compras. En esta fase se asegura su lugar dentro del mapa de rutas y del layout operativo."
      documents={['08 - Backlog por fases', '17 - Layouts y rutas', '19 - Estructura real de carpetas']}
      eyebrow="FE-PAN-007 Compras"
      nextStep="Siguiente fase: formulario real enlazado a proveedores, productos y costos."
      phaseCoverage="Deja lista la ruta protegida por permisos y el espacio natural del modulo en la aplicacion."
      quickLinks={[
        { label: 'Proveedores', to: '/admin/proveedores' },
        { label: 'Productos', to: '/admin/productos' },
      ]}
      title="Registro de compras reservado"
    />
  );
}
