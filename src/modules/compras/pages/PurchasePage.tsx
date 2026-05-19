import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CancelPurchaseRequest, CreatePurchaseRequest, PurchaseDto } from '../../../services/api/types';
import { fetchProducts, fetchProviders } from '../../../services/catalogs/catalogs-api';
import { cancelPurchase, createPurchase, fetchPurchaseDetail, fetchPurchases } from '../../../services/purchases/purchases-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';

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

const cancelPurchaseSchema = z.object({
  reason: z.string().min(3, 'Ingresa un motivo de anulacion.'),
  cancelledItems: z
    .array(
      z.object({
        purchaseItemId: z.coerce.number(),
        cancelledQuantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa.'),
      }),
    )
    .min(1),
}).superRefine((values, context) => {
  if (!values.cancelledItems.some((item) => Number(item.cancelledQuantity) > 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes indicar al menos un item con cantidad mayor a cero para anular.',
      path: ['cancelledItems'],
    });
  }
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;
type CancelPurchaseFormValues = z.infer<typeof cancelPurchaseSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function PurchasePage() {
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

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

  const purchaseDetailQuery = useQuery({
    queryKey: ['purchases', 'detail', selectedPurchaseId],
    queryFn: () => fetchPurchaseDetail(Number(selectedPurchaseId)),
    enabled: Boolean(selectedPurchaseId),
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

  const cancelForm = useForm<CancelPurchaseFormValues>({
    resolver: zodResolver(cancelPurchaseSchema),
    defaultValues: {
      reason: '',
      cancelledItems: [],
    },
  });

  const itemsFieldArray = useFieldArray({ control, name: 'items' });
  const cancelItemsFieldArray = useFieldArray({ control: cancelForm.control, name: 'cancelledItems' });
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

  const cancelMutation = useMutation({
    mutationFn: (payload: CancelPurchaseRequest) => cancelPurchase(Number(selectedPurchaseId), payload),
    onSuccess: (purchase) => {
      queryClient.setQueryData(['purchases', 'detail', selectedPurchaseId], purchase);
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  useEffect(() => {
    if (!purchaseDetailQuery.data) {
      return;
    }

    cancelForm.reset({
      reason: '',
      cancelledItems: purchaseDetailQuery.data.items.map((item) => ({
        purchaseItemId: Number(item.id),
        cancelledQuantity: Math.max(Number(item.quantity) - Number(item.cancelledQuantity), 0),
      })),
    });
  }, [cancelForm, purchaseDetailQuery.data]);

  if (!activeContext) {
    return <ResourceState body="Selecciona un contexto operativo antes de registrar compras." title="Contexto pendiente" tone="warning" />;
  }

  const products = (productsQuery.data ?? []).filter((product) => product.active);
  const providers = (providersQuery.data ?? []).filter((provider) => provider.active);
  const purchases = purchasesQuery.data ?? [];
  const selectedPurchase = purchaseDetailQuery.data ?? purchases.find((purchase) => String(purchase.id) === selectedPurchaseId) ?? null;

  return (
    <ResourcePageShell
      badge="FE-CMP-001 Compra real"
      description="Pantalla conectada a `GET /api/v1/compras`, `GET /api/v1/compras/{purchaseId}` y `POST /api/v1/compras/{purchaseId}/anulacion` usando proveedores y productos reales del backend."
      documents={['04 - HU-CMP-001', '18 - API-CMP-001/API-CMP-002/API-CMP-003', '26 - Frontend Fase operativa']}
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
        <>
          <ResourceTable<PurchaseDto>
            columns={[
              {
                key: 'provider',
                header: 'Proveedor',
                render: (purchase) => (
                  <button className="text-left" onClick={() => setSelectedPurchaseId(String(purchase.id))} type="button">
                    <p className="font-medium text-slate-900">{purchase.providerName ?? 'Proveedor no disponible'}</p>
                    <p className="text-xs text-slate-500">{purchase.documentType ?? 'Sin tipo'} {purchase.documentNumber ?? ''}</p>
                  </button>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (purchase) => (
                  <StatusBadge
                    label={purchase.status}
                    tone={purchase.status === 'REGISTRADA' ? 'success' : purchase.status === 'ANULADA_PARCIAL' ? 'warning' : 'danger'}
                  />
                ),
              },
              { key: 'date', header: 'Fecha', render: (purchase) => formatDate(purchase.purchaseDate) },
              { key: 'total', header: 'Total', render: (purchase) => formatCurrency(purchase.totalAmount) },
              { key: 'items', header: 'Items', render: (purchase) => `${purchase.items.length} item(s)` },
            ]}
            rowKey={(purchase) => String(purchase.id)}
            rows={purchases}
          />

          {selectedPurchase ? (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Detalle de compra #{selectedPurchase.id}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedPurchase.providerName ?? 'Proveedor no disponible'}</p>
                  </div>
                  <StatusBadge
                    label={selectedPurchase.status}
                    tone={selectedPurchase.status === 'REGISTRADA' ? 'success' : selectedPurchase.status === 'ANULADA_PARCIAL' ? 'warning' : 'danger'}
                  />
                </div>

                {purchaseDetailQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando detalle...</p> : null}
                {purchaseDetailQuery.isError ? (
                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {getApiErrorMessage(purchaseDetailQuery.error, 'No se pudo cargar el detalle de la compra.')}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Subtotal de la compra." label="Subtotal" value={formatCurrency(selectedPurchase.subtotalAmount)} />
                  <MetricCard helper="Total consolidado por backend." label="Total" value={formatCurrency(selectedPurchase.totalAmount)} />
                  <MetricCard helper="Fecha real de compra." label="Fecha" value={formatDate(selectedPurchase.purchaseDate)} />
                  <MetricCard helper="Creacion registrada por backend." label="Creada" value={formatDateTime(selectedPurchase.createdAt)} />
                </div>

                <div className="mt-6 space-y-3">
                  {selectedPurchase.items.map((item) => {
                    const remaining = Math.max(Number(item.quantity) - Number(item.cancelledQuantity), 0);
                    return (
                      <div key={String(item.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">{item.productName}</p>
                          <p className="text-sm text-slate-600">{formatCurrency(item.subtotalAmount)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.productCode} - {item.quantity} unid. | Anulado: {item.cancelledQuantity} | Disponible: {remaining}
                        </p>
                      </div>
                    );
                  })}
                  <div className="text-sm text-slate-600">
                    <p><span className="font-medium text-slate-900">Observacion:</span> {selectedPurchase.observation ?? 'Sin observacion'}</p>
                    <p><span className="font-medium text-slate-900">Motivo de anulacion:</span> {selectedPurchase.cancellationReason ?? 'No aplica'}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-950">Anulacion de compra</h2>
                <p className="mt-2 text-sm text-slate-600">El backend permite anular por item y cantidad pendiente.</p>

                <form
                  className="mt-5 space-y-4"
                  onSubmit={cancelForm.handleSubmit((values) =>
                    cancelMutation.mutate({
                      reason: values.reason,
                      cancelledItems: values.cancelledItems.filter((item) => Number(item.cancelledQuantity) > 0),
                    }),
                  )}
                >
                  <div className="space-y-3">
                    {cancelItemsFieldArray.fields.map((field, index) => {
                      const detailItem = selectedPurchase.items.find((item) => Number(item.id) === Number(field.purchaseItemId));
                      const availableQuantity = detailItem
                        ? Math.max(Number(detailItem.quantity) - Number(detailItem.cancelledQuantity), 0)
                        : 0;

                      return (
                        <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.4fr_0.8fr]">
                          <div>
                            <p className="font-medium text-slate-900">{detailItem?.productName ?? `Item ${field.purchaseItemId}`}</p>
                            <p className="text-xs text-slate-500">Disponible para anular: {availableQuantity}</p>
                          </div>
                          <input
                            className={inputClass}
                            max={availableQuantity}
                            min={0}
                            step="0.01"
                            type="number"
                            {...cancelForm.register(`cancelledItems.${index}.cancelledQuantity`)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Motivo</span>
                    <textarea className={`${inputClass} min-h-28`} {...cancelForm.register('reason')} />
                    {cancelForm.formState.errors.reason ? (
                      <span className="text-xs text-rose-600">{cancelForm.formState.errors.reason.message}</span>
                    ) : null}
                  </label>

                  {cancelMutation.isError ? (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {getApiErrorMessage(cancelMutation.error, 'No se pudo anular la compra.')}
                    </div>
                  ) : null}

                  {cancelMutation.isSuccess ? (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Compra anulada o ajustada correctamente.</div>
                  ) : null}

                  <button
                    className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                    disabled={cancelMutation.isPending || selectedPurchase.status === 'ANULADA'}
                    type="submit"
                  >
                    {cancelMutation.isPending ? 'Procesando anulacion...' : 'Aplicar anulacion'}
                  </button>
                </form>
              </article>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
