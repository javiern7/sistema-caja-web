import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';

export function StockPage() {
  return (
    <PlaceholderPage
      description="Consulta operativa de stock como base visual y de navegacion. Todavia no depende de un endpoint real."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '20 - Checklist de arranque']}
      eyebrow="Stock operativo"
      nextStep="Siguiente fase: tabla, filtros y trazabilidad de movimientos segun modulo de stock."
      phaseCoverage="Prepara una ruta clara para supervisores y cajeros sin mezclar aun logica de movimientos."
      quickLinks={[
        { label: 'Venta rapida', to: '/ventas/nueva' },
        { label: 'Compras', to: '/compras/nueva' },
      ]}
      title="Consulta de stock preparada"
    />
  );
}
