import { useEffect, useState } from 'react';
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
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CreateProductRequest, ProductDto } from '../../../services/api/types';
import { createProduct, fetchProductsPage, updateProduct, updateProductStatus } from '../../../services/catalogs/catalogs-api';

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState('name,asc');
  const productsQuery = useQuery({
    queryKey: ['admin', 'productos', page, pageSize, sort],
    queryFn: () => fetchProductsPage({ page, size: pageSize, sort }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const createForm = useForm<ProductFormValues>({
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

  const editForm = useForm<ProductFormValues>({
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
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CreateProductRequest) => updateProduct(Number(selectedProductId), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ productId, active }: { productId: number; active: boolean }) => updateProductStatus(productId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
    },
  });

  const products = productsQuery.data?.items ?? [];
  const selectedProduct = products.find((product) => String(product.id) === selectedProductId) ?? null;
  const activeProducts = products.filter((product) => product.active).length;
  const stockControlledProducts = products.filter((product) => product.stockControlled).length;

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    editForm.reset({
      code: selectedProduct.code,
      name: selectedProduct.name,
      unitOfMeasure: selectedProduct.unitOfMeasure,
      salePrice: Number(selectedProduct.salePrice),
      referenceCost: Number(selectedProduct.referenceCost),
      minimumStock: Number(selectedProduct.minimumStock),
      stockControlled: selectedProduct.stockControlled,
      active: selectedProduct.active,
      description: selectedProduct.description ?? '',
    });
  }, [editForm, selectedProduct]);

  const handleSelectProduct = (productId: string | number) => {
    setSelectedProductId(String(productId));
  };

  return (
    <ResourcePageShell
      badge="FE-PRO-001 Productos"
      description="Vista conectada a `GET`, `POST`, `PUT` y `PATCH` de productos para validar catalogo, edicion y cambio de estado real."
      documents={['04 - HU-PRO-001', '18 - API-PRO-001/API-PRO-002/API-PRO-003', '21 - Convenciones frontend por modulos']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Respuesta real del backend local." label="Productos cargados" value={String(productsQuery.data?.totalElements ?? products.length)} />
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

        <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Codigo</span>
            <input className={inputClass} {...createForm.register('code')} />
            {createForm.formState.errors.code ? <span className="text-xs text-rose-600">{createForm.formState.errors.code.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input className={inputClass} {...createForm.register('name')} />
            {createForm.formState.errors.name ? <span className="text-xs text-rose-600">{createForm.formState.errors.name.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Unidad de medida</span>
            <input className={inputClass} {...createForm.register('unitOfMeasure')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Precio de venta</span>
            <input className={inputClass} step="0.01" type="number" {...createForm.register('salePrice')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Costo referencial</span>
            <input className={inputClass} step="0.01" type="number" {...createForm.register('referenceCost')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Stock minimo</span>
            <input className={inputClass} step="0.01" type="number" {...createForm.register('minimumStock')} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <textarea className={`${inputClass} min-h-24`} {...createForm.register('description')} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" {...createForm.register('stockControlled')} />
            <span className="text-sm text-slate-700">Controla stock</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" {...createForm.register('active')} />
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
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={createMutation.isPending} type="submit">
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
        <>
          <ResourceTable<ProductDto>
            columns={[
              {
                key: 'code',
                header: 'Codigo',
                sortable: true,
                sortKey: 'code',
                render: (product) => <span className="font-medium text-slate-900">{product.code}</span>,
              },
              {
                key: 'name',
                header: 'Producto',
                sortable: true,
                sortKey: 'name',
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
                sortable: true,
                sortKey: 'salePrice',
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
                sortable: true,
                sortKey: 'minimumStock',
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
                sortable: true,
                sortKey: 'active',
                render: (product) => (
                  <StatusBadge label={product.active ? 'Activo' : 'Inactivo'} tone={product.active ? 'success' : 'warning'} />
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (product) => {
                  const isCurrentProduct = String(product.id) === selectedProductId;
                  const isTogglingStatus = toggleStatusMutation.isPending && toggleStatusMutation.variables?.productId === Number(product.id);

                  return (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          isCurrentProduct
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        onClick={() => handleSelectProduct(product.id)}
                        type="button"
                      >
                        {isCurrentProduct ? 'Editando' : 'Editar'}
                      </button>
                      <button
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isTogglingStatus}
                        onClick={() => toggleStatusMutation.mutate({ productId: Number(product.id), active: !product.active })}
                        type="button"
                      >
                        {isTogglingStatus ? 'Actualizando...' : product.active ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
                  );
                },
              },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay productos para mostrar con el criterio actual.</p>}
            isLoading={productsQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            pagination={productsQuery.data}
            rowClassName={(product) =>
              String(product.id) === selectedProductId ? 'align-top bg-brand-50/50 ring-1 ring-inset ring-brand-100' : 'align-top'
            }
            rowKey={(product) => String(product.id)}
            rows={products}
            sort={{
              value: sort,
              onChange: (nextSort) => {
                setSort(nextSort);
                setPage(0);
              },
            }}
          />

          {selectedProduct ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-950">Editar producto</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Editando <span className="font-semibold text-slate-900">{selectedProduct.name}</span> usando `PUT /api/v1/productos/{'{productId}'}`. Para retirar un producto del uso operativo, usa `Inactivar`.
                </p>
              </div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Codigo</span>
                  <input className={inputClass} {...editForm.register('code')} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nombre</span>
                  <input className={inputClass} {...editForm.register('name')} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Unidad de medida</span>
                  <input className={inputClass} {...editForm.register('unitOfMeasure')} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Precio de venta</span>
                  <input className={inputClass} step="0.01" type="number" {...editForm.register('salePrice')} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Costo referencial</span>
                  <input className={inputClass} step="0.01" type="number" {...editForm.register('referenceCost')} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Stock minimo</span>
                  <input className={inputClass} step="0.01" type="number" {...editForm.register('minimumStock')} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Descripcion</span>
                  <textarea className={`${inputClass} min-h-24`} {...editForm.register('description')} />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input type="checkbox" {...editForm.register('stockControlled')} />
                  <span className="text-sm text-slate-700">Controla stock</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input type="checkbox" {...editForm.register('active')} />
                  <span className="text-sm text-slate-700">Activo</span>
                </label>
                <div className="md:col-span-2">
                  {updateMutation.isError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error, 'No se pudo actualizar el producto.')}</div> : null}
                  {updateMutation.isSuccess ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Producto actualizado correctamente.</div> : null}
                  <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={updateMutation.isPending} type="submit">
                    {updateMutation.isPending ? 'Actualizando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
