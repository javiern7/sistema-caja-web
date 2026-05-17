import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function ProductsPage() {
  return (
    <PlaceholderPage
      description="Base administrativa del catalogo de productos para que el frontend ya tenga su ruta y layout oficial."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '19 - Estructura real de carpetas']}
      eyebrow="Admin productos"
      nextStep="Siguiente fase: tabla, filtros y formularios nuevo/editar."
      phaseCoverage="Deja listo el modulo administrativo prioritario para la futura fase de catalogos operativos."
      quickLinks={[
        { label: 'Proveedores', to: '/admin/proveedores' },
        { label: 'Stock', to: '/stock' },
      ]}
      title="Catalogo de productos reservado"
    />
  );
}
