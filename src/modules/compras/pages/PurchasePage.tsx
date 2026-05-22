import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CancelPurchaseRequest, CreatePurchaseRequest, PurchaseDto, PurchaseListItemDto } from '../../../services/api/types';
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
}).superRefine((values, context) => {
  const requiresDocumentNumber = values.documentType && values.documentType !== 'SIN_DOCUMENTO';

  if (requiresDocumentNumber && !values.documentNumber?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El numero de documento es obligatorio para el tipo de comprobante seleccionado.',
      path: ['documentNumber'],
    });
  }
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

const documentTypeOptions = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'TICKET', label: 'Ticket' },
  { value: 'NOTA_VENTA', label: 'Nota de venta' },
  { value: 'SIN_DOCUMENTO', label: 'Sin documento' },
];

const paymentMethodOptions = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA', 'CREDITO'];

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function PurchasePage() {
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [lastCreatedPurchase, setLastCreatedPurchase] = useState<PurchaseDto | null>(null);
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [purchasesPageSize, setPurchasesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [purchasesSort, setPurchasesSort] = useState('purchaseDate,desc');

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
    queryKey: ['purchases', purchasesPage, purchasesPageSize, purchasesSort],
    queryFn: () =>
      fetchPurchases({
        page: purchasesPage,
        size: purchasesPageSize,
        sort: purchasesSort,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
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
    setValue,
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
  const providerId = watch('providerId');
  const documentType = watch('documentType');
  const paymentMethod = watch('paymentMethod');
  const estimatedTotal = roundCurrency(purchaseItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0));
  const products = useMemo(() => (productsQuery.data ?? []).filter((product) => product.active), [productsQuery.data]);
  const providers = useMemo(() => (providersQuery.data ?? []).filter((provider) => provider.active), [providersQuery.data]);
  const productMap = useMemo(() => new Map(products.map((product) => [Number(product.id), product])), [products]);

  const itemRowMessages = purchaseItems.map((item) => {
    const product = productMap.get(Number(item.productId));
    const quantity = Number(item.quantity || 0);
    const unitCost = Number(item.unitCost || 0);
    const issues: string[] = [];

    if (!product) {
      return {
        helper: 'Selecciona un producto para registrar cantidad, costo unitario y subtotal.',
        issues,
        subtotal: 0,
      };
    }

    if (quantity <= 0) {
      issues.push('La cantidad debe ser mayor a cero.');
    }

    if (unitCost <= 0) {
      issues.push('El costo unitario debe ser mayor a cero.');
    }

    return {
      helper: `Costo referencial del catalogo: ${formatCurrency(product.referenceCost)}. Unidad: ${product.unitOfMeasure}. Esta compra actualizara el stock del producto al registrarse.`,
      issues,
      subtotal: roundCurrency(quantity * unitCost),
    };
  });

  const hasItemIssues = itemRowMessages.some((row) => row.issues.length > 0);
  const hasIncompleteItem = purchaseItems.some((item) => Number(item.productId) <= 0);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseRequest) => createPurchase(payload),
    onSuccess: (purchase) => {
      setLastCreatedPurchase(purchase);
      setSelectedPurchaseId(String(purchase.id));
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

  useEffect(() => {
    purchaseItems.forEach((item, index) => {
      const product = productMap.get(Number(item.productId));
      if (!product) {
        return;
      }

      const currentCost = Number(item.unitCost || 0);
      if (currentCost <= 0) {
        setValue(`items.${index}.unitCost`, Number(product.referenceCost), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [productMap, purchaseItems, setValue]);

  if (!activeContext) {
    return <ResourceState body="Selecciona un contexto operativo antes de registrar compras." title="Contexto pendiente" tone="warning" />;
  }

  const purchases = purchasesQuery.data?.items ?? [];
  const selectedPurchase = purchaseDetailQuery.data ?? null;
  const canSubmitPurchase =
    providerId > 0 &&
    Boolean(paymentMethod?.trim()) &&
    purchaseItems.length > 0 &&
    !hasIncompleteItem &&
    !hasItemIssues &&
    estimatedTotal > 0 &&
    !createMutation.isPending;

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
          <p className="mt-2 text-sm text-slate-600">Completa proveedor, comprobante, metodo de pago e items para registrar la compra con un resumen claro antes de guardar.</p>
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-slate-700">
            Al registrar la compra se actualizara el stock de los productos seleccionados. Hoy el backend soporta registro, consulta y anulacion parcial o total por items; no expone edicion ni eliminacion fisica.
          </div>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) => {
            const providerName = providers.find((provider) => Number(provider.id) === Number(values.providerId))?.name ?? 'Proveedor seleccionado';
            const shouldContinue = window.confirm(
              `¿Confirmas registrar esta compra?\nProveedor: ${providerName}\nTotal: ${formatCurrency(estimatedTotal)}\nItems: ${values.items.length}\nMetodo de pago: ${values.paymentMethod ?? 'No definido'}`,
            );

            if (!shouldContinue) {
              return;
            }

            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              providerId: values.providerId,
              purchaseDate: values.purchaseDate,
              documentType: values.documentType,
              documentNumber: values.documentNumber,
              paymentMethod: values.paymentMethod,
              items: values.items,
              observation: values.observation,
            });
          })}
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
              <p className="text-xs text-slate-500">Selecciona el proveedor responsable de la compra. Este campo es obligatorio.</p>
              {errors.providerId ? <span className="text-xs text-rose-600">{errors.providerId.message}</span> : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Fecha de compra</span>
              <input className={inputClass} type="date" {...register('purchaseDate')} />
              <p className="text-xs text-slate-500">Fecha efectiva en la que se realizo la compra al proveedor.</p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Tipo de documento</span>
              <select className={inputClass} {...register('documentType')}>
                {documentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Selecciona el comprobante entregado por el proveedor. Este catalogo hoy se resuelve desde frontend.</p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Numero de documento</span>
              <input
                className={inputClass}
                placeholder={documentType === 'SIN_DOCUMENTO' ? 'Opcional si no existe comprobante.' : 'Ej. F001-123456'}
                {...register('documentNumber')}
              />
              <p className="text-xs text-slate-500">
                {documentType === 'SIN_DOCUMENTO'
                  ? 'Si no hay comprobante, puedes dejarlo vacio, pero se recomienda explicar el caso en observacion.'
                  : 'Obligatorio para el tipo de documento seleccionado.'}
              </p>
              {errors.documentNumber ? <span className="text-xs text-rose-600">{errors.documentNumber.message}</span> : null}
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Metodo de pago</span>
              <select className={inputClass} {...register('paymentMethod')}>
                {paymentMethodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Indica como se pago la compra. Si negocio define compras pendientes, este campo podria ampliarse luego con estado de pago.</p>
              {errors.paymentMethod ? <span className="text-xs text-rose-600">{errors.paymentMethod.message}</span> : null}
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
            <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid md:grid-cols-[1.4fr_0.6fr_0.7fr_0.8fr_auto]">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Costo unitario</span>
              <span>Subtotal</span>
              <span>Accion</span>
            </div>
            <div className="space-y-3">
              {itemsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1.4fr_0.6fr_0.7fr_0.8fr_auto]">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Producto</span>
                      <select
                        className={inputClass}
                        {...register(`items.${index}.productId`, {
                          onChange: (event) => {
                            const selectedProduct = productMap.get(Number(event.target.value));
                            if (!selectedProduct) {
                              return;
                            }

                            setValue(`items.${index}.unitCost`, Number(selectedProduct.referenceCost), {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          },
                        })}
                      >
                        <option value={0}>Selecciona un producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={Number(product.id)}>
                            {product.name} ({product.code})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Cantidad</span>
                      <input className={inputClass} min="0.01" placeholder="Ej. 10" step="0.01" type="number" {...register(`items.${index}.quantity`)} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Costo unitario</span>
                      <input className={inputClass} min="0.01" placeholder="Ej. 12.50" step="0.01" type="number" {...register(`items.${index}.unitCost`)} />
                    </label>
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Subtotal</span>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatCurrency(itemRowMessages[index]?.subtotal ?? 0)}
                      </div>
                    </div>
                    <button
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      onClick={() => itemsFieldArray.remove(index)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-500">{itemRowMessages[index]?.helper}</p>
                    {itemRowMessages[index]?.issues.map((issue) => (
                      <p key={issue} className="text-xs text-rose-600">
                        {issue}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {errors.items ? <span className="text-xs text-rose-600">{errors.items.message as string}</span> : null}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} placeholder="Dato opcional para ampliar la referencia de la compra o justificar casos sin documento." {...register('observation')} />
          </label>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Items</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{purchaseItems.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Subtotal</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(estimatedTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total compra</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(estimatedTotal)}</p>
            </div>
          </div>

          {!canSubmitPurchase ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Completa proveedor, comprobante, metodo de pago e items validos para habilitar el guardado de la compra.
            </div>
          ) : null}

          {createMutation.isError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(createMutation.error, 'No se pudo registrar la compra.')}
            </div>
          ) : null}

          {lastCreatedPurchase ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Compra registrada correctamente. Se actualizo el listado y el stock de los productos involucrados.
            </div>
          ) : null}

          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={!canSubmitPurchase}
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
          <ResourceTable<PurchaseListItemDto>
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
              { key: 'date', header: 'Fecha', sortable: true, sortKey: 'purchaseDate', render: (purchase) => formatDate(purchase.purchaseDate) },
              { key: 'total', header: 'Total', sortable: true, sortKey: 'totalAmount', render: (purchase) => formatCurrency(purchase.totalAmount) },
              { key: 'items', header: 'Items', render: (purchase) => `${purchase.itemsCount ?? 0} item(s)` },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay compras registradas con los criterios actuales.</p>}
            isLoading={purchasesQuery.isFetching}
            onPageChange={setPurchasesPage}
            onPageSizeChange={(nextSize) => {
              setPurchasesPageSize(nextSize);
              setPurchasesPage(0);
            }}
            pagination={purchasesQuery.data}
            rowKey={(purchase) => String(purchase.id)}
            rows={purchases}
            sort={{
              value: purchasesSort,
              onChange: (nextSort) => {
                setPurchasesSort(nextSort);
                setPurchasesPage(0);
              },
            }}
          />

          {selectedPurchaseId ? (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Detalle de compra #{selectedPurchase?.id ?? selectedPurchaseId}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedPurchase?.providerName ?? 'Proveedor no disponible'}</p>
                  </div>
                  {selectedPurchase ? (
                    <StatusBadge
                      label={selectedPurchase.status}
                      tone={selectedPurchase.status === 'REGISTRADA' ? 'success' : selectedPurchase.status === 'ANULADA_PARCIAL' ? 'warning' : 'danger'}
                    />
                  ) : null}
                </div>

                {purchaseDetailQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando detalle...</p> : null}
                {purchaseDetailQuery.isError ? (
                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {getApiErrorMessage(purchaseDetailQuery.error, 'No se pudo cargar el detalle de la compra.')}
                  </div>
                ) : null}

                {selectedPurchase ? (
                  <>
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
                  </>
                ) : null}
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
                    {selectedPurchase ? cancelItemsFieldArray.fields.map((field, index) => {
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
                    }) : null}
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
                    disabled={cancelMutation.isPending || selectedPurchase?.status === 'ANULADA'}
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
