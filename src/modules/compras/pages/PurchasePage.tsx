import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CreatePurchaseRequest, PurchaseDto } from '../../../services/api/types';
import { fetchProducts, fetchProviders } from '../../../services/catalogs/catalogs-api';
import { createPurchase, fetchPurchases } from '../../../services/purchases/purchases-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDate } from '../../../utils/format';

const purchaseSchema = z.object({
  providerId: z.coerce.number().min(1, 'Selecciona un proveedor.'),
  purchaseDate: z.string().min(1, 'Ingresa la fecha de compra.'),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, 'Selecciona un producto.'),
        quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a cero.'),
        unitCost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
      }),
    )
    .min(1, 'Agrega al menos un item.'),
  observation: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function PurchasePage() {
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);

  const productsQuery = useQuery({
    queryKey: ['admin', 'productos'],
    queryFn: fetchProducts,
    retry: false,
  });

  const providersQuery = useQuery({
    queryKey: ['admin', 'proveedores'],
    queryFn: fetchProviders,
    retry: false,
  });

  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      providerId: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      documentType: 'FACTURA',
      documentNumber: '',
      paymentMethod: 'EFECTIVO',
      items: [{ productId: 0, quantity: 1, unitCost: 0 }],
      observation: '',
    },
  });

  const itemsFieldArray = useFieldArray({ control, name: 'items' });
  const purchaseItems = watch('items');
  const estimatedTotal = purchaseItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseRequest) => createPurchase(payload),
    onSuccess: () => {
      reset({
        providerId: 0,
        purchaseDate: new Date().toISOString().slice(0, 10),
        documentType: 'FACTURA',
        documentNumber: '',
        paymentMethod: 'EFECTIVO',
        items: [{ productId: 0, quantity: 1, unitCost: 0 }],
        observation: '',
      });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  if (!activeContext) {
    return <ResourceState body="Selecciona un contexto operativo antes de registrar compras." title="Contexto pendiente" tone="warning" />;
  }

  const products = (productsQuery.data ?? []).filter((product) => product.active);
  const providers = (providersQuery.data ?? []).filter((provider) => provider.active);
  const purchases = purchasesQuery.data ?? [];

  return (
    <ResourcePageShell
      badge="FE-CMP-001 Compra real"
      description="Pantalla conectada a `GET /api/v1/compras` y `POST /api/v1/compras` usando proveedores y productos reales del backend."
      documents={['04 - HU-CMP-001', '18 - API-CMP-001/API-CMP-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Contexto al que se imputa la compra." label="Contexto" value={activeContext.name} />
          <MetricCard helper="Base para completar el documento." label="Proveedores activos" value={String(providers.length)} />
          <MetricCard helper="Base para items de compra." label="Productos activos" value={String(products.length)} />
          <MetricCard helper="Suma estimada del formulario actual." label="Total estimado" value={formatCurrency(estimatedTotal)} />
        </div>
      }
      title="Registro de compras"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar compra</h2>
          <p className="mt-2 text-sm text-slate-600">La compra se enviara con contexto, proveedor, fecha e items alineados al contrato real.</p>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) =>
            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              providerId: values.providerId,
              purchaseDate: values.purchaseDate,
              documentType: values.documentType,
              documentNumber: values.documentNumber,
              paymentMethod: values.paymentMethod,
              items: values.items,
              observation: values.observation,
            }),
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Proveedor</span>
              <select className={inputClass} {...register('providerId')}>
                <option value={0}>Selecciona un proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={Number(provider.id)}>
                    {provider.name}
                  </option>
                ))}
              </select>
              {errors.providerId ? <span className="text-xs text-rose-600">{errors.providerId.message}</span> : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Fecha de compra</span>
              <input className={inputClass} type="date" {...register('purchaseDate')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Tipo de documento</span>
              <input className={inputClass} {...register('documentType')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Numero de documento</span>
              <input className={inputClass} {...register('documentNumber')} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Metodo de pago</span>
              <input className={inputClass} {...register('paymentMethod')} />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900">Items de compra</h3>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                onClick={() => itemsFieldArray.append({ productId: 0, quantity: 1, unitCost: 0 })}
                type="button"
              >
                Agregar item
              </button>
            </div>
            <div className="space-y-3">
              {itemsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-3xl border border-slate-200 p-4 md:grid-cols-[1.4fr_0.6fr_0.7fr_auto]">
                  <select className={inputClass} {...register(`items.${index}.productId`)}>
                    <option value={0}>Selecciona un producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={Number(product.id)}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                  <input className={inputClass} step="0.01" type="number" {...register(`items.${index}.quantity`)} />
                  <input className={inputClass} step="0.01" type="number" {...register(`items.${index}.unitCost`)} />
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    onClick={() => itemsFieldArray.remove(index)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {errors.items ? <span className="text-xs text-rose-600">{errors.items.message as string}</span> : null}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} {...register('observation')} />
          </label>

          {createMutation.isError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(createMutation.error, 'No se pudo registrar la compra.')}
            </div>
          ) : null}

          {createMutation.isSuccess ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Compra registrada correctamente.</div>
          ) : null}

          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? 'Registrando compra...' : 'Guardar compra'}
          </button>
        </form>
      </section>

      {purchasesQuery.isLoading ? <ResourceState body="Consultando compras registradas..." title="Cargando compras" /> : null}

      {purchasesQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(purchasesQuery.error, 'No se pudieron consultar las compras.')}
          title="Error al consultar compras"
          tone="danger"
        />
      ) : null}

      {!purchasesQuery.isLoading && !purchasesQuery.isError ? (
        <ResourceTable<PurchaseDto>
          columns={[
            {
              key: 'provider',
              header: 'Proveedor',
              render: (purchase) => (
                <div>
                  <p className="font-medium text-slate-900">{purchase.providerName ?? 'Proveedor no disponible'}</p>
                  <p className="text-xs text-slate-500">{purchase.documentType ?? 'Sin tipo'} {purchase.documentNumber ?? ''}</p>
                </div>
              ),
            },
            { key: 'status', header: 'Estado', render: (purchase) => purchase.status },
            { key: 'date', header: 'Fecha', render: (purchase) => formatDate(purchase.purchaseDate) },
            { key: 'total', header: 'Total', render: (purchase) => formatCurrency(purchase.totalAmount) },
            { key: 'items', header: 'Items', render: (purchase) => `${purchase.items.length} item(s)` },
          ]}
          rowKey={(purchase) => String(purchase.id)}
          rows={purchases}
        />
      ) : null}
    </ResourcePageShell>
  );
}
