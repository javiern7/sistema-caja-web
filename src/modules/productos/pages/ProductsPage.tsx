import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CreateProductRequest, ProductDto } from '../../../services/api/types';
import { createProduct, fetchProducts } from '../../../services/catalogs/catalogs-api';

const productSchema = z.object({
  code: z.string().min(1, 'Ingresa el codigo.'),
  name: z.string().min(1, 'Ingresa el nombre del producto.'),
  unitOfMeasure: z.string().min(1, 'Ingresa la unidad de medida.'),
  salePrice: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  referenceCost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  minimumStock: z.coerce.number().min(0, 'El stock minimo no puede ser negativo.'),
  stockControlled: z.boolean(),
  active: z.boolean(),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ['admin', 'productos'],
    queryFn: fetchProducts,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      name: '',
      unitOfMeasure: 'UND',
      salePrice: 0,
      referenceCost: 0,
      minimumStock: 0,
      stockControlled: true,
      active: true,
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateProductRequest) => createProduct(values),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
    },
  });

  const products = productsQuery.data ?? [];
  const activeProducts = products.filter((product) => product.active).length;
  const stockControlledProducts = products.filter((product) => product.stockControlled).length;

  return (
    <ResourcePageShell
      badge="FE-PRO-001 Productos"
      description="Vista conectada al endpoint `GET /api/v1/productos` y `POST /api/v1/productos` para validar catalogo operativo y registro administrativo real."
      documents={['04 - HU-PRO-001', '18 - API-PRO-001/API-PRO-002', '21 - Convenciones frontend por modulos']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Respuesta real del backend local." label="Productos cargados" value={String(products.length)} />
          <MetricCard helper="Base para ventas y consultas." label="Productos activos" value={String(activeProducts)} />
          <MetricCard helper="Relacionados con reglas de inventario." label="Controlan stock" value={String(stockControlledProducts)} />
        </div>
      }
      title="Catalogo de productos"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar producto</h2>
          <p className="mt-2 text-sm text-slate-600">Formulario alineado al contrato `CreateProductRequest` del backend.</p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Codigo</span>
            <input className={inputClass} {...register('code')} />
            {errors.code ? <span className="text-xs text-rose-600">{errors.code.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input className={inputClass} {...register('name')} />
            {errors.name ? <span className="text-xs text-rose-600">{errors.name.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Unidad de medida</span>
            <input className={inputClass} {...register('unitOfMeasure')} />
            {errors.unitOfMeasure ? <span className="text-xs text-rose-600">{errors.unitOfMeasure.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Precio de venta</span>
            <input className={inputClass} step="0.01" type="number" {...register('salePrice')} />
            {errors.salePrice ? <span className="text-xs text-rose-600">{errors.salePrice.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Costo referencial</span>
            <input className={inputClass} step="0.01" type="number" {...register('referenceCost')} />
            {errors.referenceCost ? <span className="text-xs text-rose-600">{errors.referenceCost.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Stock minimo</span>
            <input className={inputClass} step="0.01" type="number" {...register('minimumStock')} />
            {errors.minimumStock ? <span className="text-xs text-rose-600">{errors.minimumStock.message}</span> : null}
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <textarea className={`${inputClass} min-h-24`} {...register('description')} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" {...register('stockControlled')} />
            <span className="text-sm text-slate-700">Controla stock</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" {...register('active')} />
            <span className="text-sm text-slate-700">Activo</span>
          </label>
          <div className="md:col-span-2">
            {createMutation.isError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getApiErrorMessage(createMutation.error, 'No se pudo registrar el producto.')}
              </div>
            ) : null}
            {createMutation.isSuccess ? (
              <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Producto registrado correctamente.</div>
            ) : null}
            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Guardando producto...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </section>

      {productsQuery.isLoading ? <ResourceState body="Consultando productos desde el backend..." title="Cargando catalogo" /> : null}

      {productsQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(productsQuery.error, 'No se pudo cargar el catalogo de productos.')}
          title="Error al consultar productos"
          tone="danger"
        />
      ) : null}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <ResourceState body="El backend respondio correctamente pero todavia no hay productos registrados." title="Catalogo vacio" tone="warning" />
      ) : null}

      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 ? (
        <ResourceTable<ProductDto>
          columns={[
            { key: 'code', header: 'Codigo', render: (product) => <span className="font-medium text-slate-900">{product.code}</span> },
            {
              key: 'name',
              header: 'Producto',
              render: (product) => (
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.description ?? 'Sin descripcion registrada'}</p>
                </div>
              ),
            },
            {
              key: 'pricing',
              header: 'Precio / costo',
              render: (product) => (
                <div>
                  <p>Venta: S/ {Number(product.salePrice).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Costo: S/ {Number(product.referenceCost).toFixed(2)}</p>
                </div>
              ),
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (product) => (
                <div>
                  <p>Minimo: {Number(product.minimumStock).toFixed(2)}</p>
                  <StatusBadge label={product.stockControlled ? 'Controlado' : 'Libre'} tone={product.stockControlled ? 'success' : 'neutral'} />
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              render: (product) => <StatusBadge label={product.active ? 'Activo' : 'Inactivo'} tone={product.active ? 'success' : 'warning'} />,
            },
          ]}
          rowKey={(product) => String(product.id)}
          rows={products}
        />
      ) : null}
    </ResourcePageShell>
  );
}
