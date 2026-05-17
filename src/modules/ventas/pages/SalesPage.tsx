import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function SalesPage() {
  return (
    <PlaceholderPage
      description="Ruta reservada para venta rapida. En Fase 1 queda lista la navegacion, el guard de permisos y el requisito de caja abierta."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '26 - Frontend Fase 1']}
      eyebrow="FE-PAN-004 Venta rapida"
      nextStep="Siguiente fase: construir busqueda de productos, items y seccion de pagos."
      phaseCoverage="Activa la ruta principal del cajero sin adelantar logica profunda dependiente de contratos backend."
      quickLinks={[
        { label: 'Caja activa', to: '/caja/activa' },
        { label: 'Stock', to: '/stock' },
      ]}
      title="Venta rapida lista para crecer"
    />
  );
}
