import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CreateSaleRequest, SaleDto, SaleListItemDto } from '../../../services/api/types';
import { fetchProducts } from '../../../services/catalogs/catalogs-api';
import { cancelSale, createSale, fetchSaleDetail, fetchSales } from '../../../services/sales/sales-api';
import { fetchCurrentStock } from '../../../services/stock/stock-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, 'Selecciona un producto.'),
        quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a cero.'),
        unitPrice: z.coerce.number().min(0.01, 'El precio unitario debe ser mayor a cero.'),
      }),
    )
    .min(1, 'Agrega al menos un item.'),
  payments: z
    .array(
      z.object({
        paymentMethod: z.string().min(1, 'Selecciona el metodo de pago.'),
        amount: z.coerce.number().min(0.01, 'El monto del pago debe ser mayor a cero.'),
      }),
    )
    .min(1, 'Agrega al menos un pago.'),
  observation: z.string().optional(),
}).superRefine((values, context) => {
  const itemTotal = values.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const paymentTotal = values.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  if (Number(itemTotal.toFixed(2)) !== Number(paymentTotal.toFixed(2))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El total pagado debe coincidir exactamente con el total de la venta.',
      path: ['payments'],
    });
  }
});

const cancelSaleSchema = z.object({
  reason: z.string().min(3, 'Ingresa un motivo de anulacion.'),
});

type SaleFormValues = z.infer<typeof saleSchema>;
type CancelSaleFormValues = z.infer<typeof cancelSaleSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

const paymentMethodOptions = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function isWholeNumber(value: number) {
  return Math.abs(value - Math.round(value)) < 0.000001;
}

function formatSummaryAmount(hasValues: boolean, amount: number) {
  return hasValues ? formatCurrency(amount) : 'Pendiente';
}

export function SalesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [lastCreatedSale, setLastCreatedSale] = useState<SaleDto | null>(null);
  const [salesPage, setSalesPage] = useState(0);
  const [salesPageSize, setSalesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [salesSort, setSalesSort] = useState('createdAt,desc');

  const productsQuery = useQuery({
    queryKey: ['admin', 'productos'],
    queryFn: fetchProducts,
    retry: false,
  });

  const stockQuery = useQuery({
    queryKey: ['stock', 'current'],
    queryFn: fetchCurrentStock,
    retry: false,
  });

  const salesQuery = useQuery({
    queryKey: ['sales', salesPage, salesPageSize, salesSort],
    queryFn: () =>
      fetchSales({
        page: salesPage,
        size: salesPageSize,
        sort: salesSort,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const saleDetailQuery = useQuery({
    queryKey: ['sales', 'detail', selectedSaleId],
    queryFn: () => fetchSaleDetail(Number(selectedSaleId)),
    enabled: Boolean(selectedSaleId),
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
      payments: [{ paymentMethod: 'EFECTIVO', amount: 0 }],
      observation: '',
    },
  });

  const cancelForm = useForm<CancelSaleFormValues>({
    resolver: zodResolver(cancelSaleSchema),
    defaultValues: { reason: '' },
  });

  const itemsFieldArray = useFieldArray({ control, name: 'items' });
  const paymentsFieldArray = useFieldArray({ control, name: 'payments' });
  const watchedItems = watch('items');
  const watchedPayments = watch('payments');
  const hasMeaningfulItems = watchedItems.some(
    (item) => Number(item.productId) > 0 || Number(item.quantity || 0) > 0 || Number(item.unitPrice || 0) > 0,
  );
  const hasMeaningfulPayments = watchedPayments.some((payment) => Number(payment.amount || 0) > 0);
  const calculatedTotal = roundCurrency(
    watchedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
  );
  const paymentTotal = roundCurrency(watchedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  const paymentDifference = roundCurrency(paymentTotal - calculatedTotal);

  const products = useMemo(() => (productsQuery.data ?? []).filter((product) => product.active), [productsQuery.data]);
  const canManageProducts = hasPermission('producto.gestionar');
  const hasProducts = products.length > 0;
  const productMap = useMemo(() => new Map(products.map((product) => [Number(product.id), product])), [products]);
  const stockMap = useMemo(
    () => new Map((stockQuery.data ?? []).map((item) => [Number(item.productId), item])),
    [stockQuery.data],
  );

  const itemRowMessages = watchedItems.map((item) => {
    const product = productMap.get(Number(item.productId));
    const stock = stockMap.get(Number(item.productId));
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const issues: string[] = [];

    if (!product) {
      return {
        helper: 'Selecciona un producto para autocompletar el precio y validar existencias.',
        issues,
        subtotal: 0,
      };
    }

    if (quantity <= 0) {
      issues.push('La cantidad debe ser mayor a cero.');
    }

    if (product.unitOfMeasure.toUpperCase() === 'UNIDAD' && quantity > 0 && !isWholeNumber(quantity)) {
      issues.push('Este producto se vende por unidad y no admite decimales.');
    }

    if (unitPrice <= 0) {
      issues.push('El precio unitario debe ser mayor a cero.');
    }

    if (product.stockControlled && stock && quantity > Number(stock.currentStock)) {
      issues.push(`Stock insuficiente. Disponible: ${Number(stock.currentStock).toFixed(2)} ${product.unitOfMeasure.toLowerCase()}.`);
    }

    const helperParts = [
      `Precio sugerido: ${formatCurrency(product.salePrice)}.`,
      `Unidad: ${product.unitOfMeasure}.`,
      product.stockControlled
        ? stock
          ? `Stock disponible: ${Number(stock.currentStock).toFixed(2)}.`
          : 'Stock controlado. Consultando existencia disponible...'
        : 'Producto sin control de stock.',
    ];

    return {
      helper: helperParts.join(' '),
      issues,
      subtotal: roundCurrency(quantity * unitPrice),
    };
  });

  const paymentRowMessages = watchedPayments.map((payment) => {
    const amount = Number(payment.amount || 0);
    const issues: string[] = [];

    if (amount <= 0) {
      issues.push('El monto del pago debe ser mayor a cero.');
    }

    return {
      issues,
    };
  });

  const hasItemIssues = itemRowMessages.some((row) => row.issues.length > 0);
  const hasPaymentIssues = paymentRowMessages.some((row) => row.issues.length > 0);
  const hasIncompleteItem = watchedItems.some((item) => Number(item.productId) <= 0);

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const product = productMap.get(Number(item.productId));
      if (!product) {
        return;
      }

      const currentPrice = Number(item.unitPrice || 0);
      if (currentPrice <= 0) {
        setValue(`items.${index}.unitPrice`, Number(product.salePrice), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [productMap, setValue, watchedItems]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateSaleRequest) => createSale(payload),
    onSuccess: (sale) => {
      setLastCreatedSale(sale);
      setSelectedSaleId(String(sale.id));
      reset({
        items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
        payments: [{ paymentMethod: 'EFECTIVO', amount: 0 }],
        observation: '',
      });
      queryClient.setQueryData(['sales', 'detail', String(sale.id)], sale);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (values: CancelSaleFormValues) => cancelSale(Number(selectedSaleId), values),
    onSuccess: (sale) => {
      cancelForm.reset({ reason: '' });
      queryClient.setQueryData(['sales', 'detail', selectedSaleId], sale);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const canSubmitSale =
    Boolean(activeContext) &&
    activeCash?.status === 'ABIERTA' &&
    watchedItems.length > 0 &&
    watchedPayments.length > 0 &&
    !productsQuery.isLoading &&
    !createMutation.isPending &&
    !hasIncompleteItem &&
    !hasItemIssues &&
    !hasPaymentIssues &&
    calculatedTotal > 0 &&
    paymentTotal > 0 &&
    paymentDifference === 0;

  if (!activeContext) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/contexto')}
            type="button"
          >
            Ir a seleccionar contexto
          </button>
        }
        body="Selecciona un contexto operativo antes de registrar ventas."
        title="Contexto pendiente"
        tone="warning"
      />
    );
  }

  if (!activeCash) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/caja/apertura')}
            type="button"
          >
            Ir a apertura de caja
          </button>
        }
        body="Necesitas contexto operativo y caja abierta para registrar ventas reales."
        title="Venta no disponible"
        tone="warning"
      />
    );
  }

  if (activeCash.status !== 'ABIERTA') {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/caja/apertura')}
            type="button"
          >
            Ir a apertura de caja
          </button>
        }
        body="La caja visible en el estado operativo ya no esta abierta. Debes abrir una nueva caja antes de registrar ventas."
        title="Caja abierta pendiente"
        tone="warning"
      />
    );
  }

  const sales = salesQuery.data?.items ?? [];
  const selectedSale = saleDetailQuery.data ?? null;

  return (
    <ResourcePageShell
      badge="FE-VTA-001 Venta real"
      description="Pantalla conectada a `GET /api/v1/ventas`, `GET /api/v1/ventas/{saleId}` y `POST /api/v1/ventas/{saleId}/anulacion` usando caja activa, items y pagos reales contra backend."
      documents={['04 - HU-VTA-001', '18 - API-VTA-001/API-VTA-002/API-VTA-003', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Caja que recibira la venta." label="Caja activa" value={String(activeCash.id)} />
          <MetricCard helper="Contexto operativo enviado al backend." label="Contexto" value={activeContext.name} />
          <MetricCard
            helper="Se mostrara cuando registres al menos un item valido en el formulario."
            label="Total venta"
            value={formatSummaryAmount(hasMeaningfulItems, calculatedTotal)}
          />
          <MetricCard
            helper="Se mostrara cuando registres un pago valido en el formulario."
            label="Total pagado"
            value={formatSummaryAmount(hasMeaningfulPayments, paymentTotal)}
          />
        </div>
      }
      title="Venta rapida"
    >
      {!productsQuery.isLoading && !productsQuery.isError && !hasProducts ? (
        <ResourceState
          action={
            canManageProducts ? (
              <button
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => navigate('/admin/productos')}
                type="button"
              >
                Ir a productos
              </button>
            ) : undefined
          }
          body={
            canManageProducts
              ? 'Todavia no hay productos activos para vender. Registra o activa productos antes de continuar.'
              : 'Todavia no hay productos activos para vender. Solicita al equipo administrador que registre o active productos.'
          }
          title="Productos pendientes"
          tone="warning"
        />
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar venta</h2>
          <p className="mt-2 text-sm text-slate-600">Selecciona un producto, ingresa cantidad, verifica el total y registra el pago antes de guardar la venta.</p>
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-slate-700">
            El precio unitario se completa con el precio de venta del catalogo. El boton <span className="font-semibold text-slate-900">Guardar venta</span> solo se habilita cuando items y pagos son validos y el total pagado coincide con el total de la venta.
          </div>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) => {
            if (paymentDifference !== 0) {
              setError('payments', {
                type: 'manual',
                message: 'El total pagado debe coincidir exactamente con el total de la venta.',
              });
              return;
            }

            clearErrors('payments');
            const primaryPaymentMethod = values.payments[0]?.paymentMethod ?? 'Sin definir';
            const shouldContinue = window.confirm(
              `¿Confirmas registrar la venta por ${formatCurrency(calculatedTotal)}?\nForma de pago principal: ${primaryPaymentMethod}\nItems: ${values.items.length}`,
            );

            if (!shouldContinue) {
              return;
            }

            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              cashBoxId: Number(activeCash.id),
              items: values.items,
              payments: values.payments,
              observation: values.observation,
            });
          })}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900">Items</h3>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                onClick={() => itemsFieldArray.append({ productId: 0, quantity: 1, unitPrice: 0 })}
                type="button"
              >
                Agregar item
              </button>
            </div>
            <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid md:grid-cols-[1.4fr_0.6fr_0.7fr_0.8fr_auto]">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Precio unitario</span>
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

                            setValue(`items.${index}.unitPrice`, Number(selectedProduct.salePrice), {
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
                      <input className={inputClass} min="0.01" placeholder="Ej. 1" step="0.01" type="number" {...register(`items.${index}.quantity`)} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Precio unitario</span>
                      <input
                        className={inputClass}
                        min="0.01"
                        placeholder="Ej. 10.00"
                        step="0.01"
                        type="number"
                        {...register(`items.${index}.unitPrice`)}
                      />
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900">Pagos</h3>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                onClick={() => paymentsFieldArray.append({ paymentMethod: 'EFECTIVO', amount: 0 })}
                type="button"
              >
                Agregar pago
              </button>
            </div>
            <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid md:grid-cols-[1fr_1fr_auto]">
              <span>Forma de pago</span>
              <span>Monto pagado</span>
              <span>Accion</span>
            </div>
            <div className="space-y-3">
              {paymentsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Forma de pago</span>
                      <select className={inputClass} {...register(`payments.${index}.paymentMethod`)}>
                        {paymentMethodOptions.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">Monto pagado</span>
                      <input className={inputClass} min="0.01" placeholder="Ej. 20.00" step="0.01" type="number" {...register(`payments.${index}.amount`)} />
                    </label>
                    <button
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      onClick={() => paymentsFieldArray.remove(index)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-500">Puedes registrar varios medios de pago siempre que la suma coincida con el total de la venta.</p>
                    {paymentRowMessages[index]?.issues.map((issue) => (
                      <p key={issue} className="text-xs text-rose-600">
                        {issue}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {errors.payments ? <span className="text-xs text-rose-600">{errors.payments.message as string}</span> : null}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} placeholder="Dato opcional para dejar una referencia de la venta." {...register('observation')} />
          </label>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total venta</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(calculatedTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total pagado</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(paymentTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Diferencia</p>
              <p className={`mt-1 text-lg font-semibold ${paymentDifference === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatCurrency(paymentDifference)}
              </p>
            </div>
          </div>

          {!canSubmitSale ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Completa producto, cantidad, precio y pagos validos. El total pagado debe coincidir con el total de la venta para habilitar el guardado.
            </div>
          ) : null}

          {productsQuery.isError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(productsQuery.error, 'No se pudo consultar el catalogo de productos.')}
            </div>
          ) : null}

          {stockQuery.isError ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {getApiErrorMessage(stockQuery.error, 'No se pudo consultar el stock actual. La venta sigue disponible, pero sin validacion preventiva de existencias.')}
            </div>
          ) : null}

          {!hasProducts && !productsQuery.isLoading ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No hay productos activos disponibles para registrar una venta.
            </div>
          ) : null}

          {lastCreatedSale ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Venta registrada correctamente. Comprobante interno: {lastCreatedSale.internalReceiptSeries ?? 'INT'}-{lastCreatedSale.internalReceiptNumber ?? lastCreatedSale.id}.
            </div>
          ) : null}

          {createMutation.isSuccess && !lastCreatedSale ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Venta registrada correctamente.</div>
          ) : null}

          {createMutation.isError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(createMutation.error, 'No se pudo registrar la venta.')}
            </div>
          ) : null}

          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={!canSubmitSale || createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? 'Registrando venta...' : 'Guardar venta'}
          </button>
        </form>
      </section>

      {salesQuery.isLoading ? <ResourceState body="Consultando ventas registradas..." title="Cargando ventas" /> : null}

      {salesQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(salesQuery.error, 'No se pudieron consultar las ventas.')}
          title="Error al consultar ventas"
          tone="danger"
        />
      ) : null}

      {!salesQuery.isLoading && !salesQuery.isError ? (
        <>
          <ResourceTable<SaleListItemDto>
            columns={[
              {
                key: 'receipt',
                header: 'Comprobante',
                sortable: true,
                sortKey: 'internalReceiptNumber',
                render: (sale) => (
                  <button className="text-left" onClick={() => setSelectedSaleId(String(sale.id))} type="button">
                    <p className="font-medium text-slate-900">{`${sale.internalReceiptSeries ?? 'INT'}-${sale.internalReceiptNumber ?? sale.id}`}</p>
                    <p className="text-xs text-slate-500">{sale.operationalContextName ?? activeContext.name}</p>
                  </button>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (sale) => <StatusBadge label={sale.status} tone={sale.status === 'ANULADA' ? 'warning' : 'success'} />,
              },
              { key: 'total', header: 'Total', sortable: true, sortKey: 'totalAmount', render: (sale) => formatCurrency(sale.totalAmount) },
              {
                key: 'items',
                header: 'Items',
                render: (sale) => `${sale.itemsCount ?? 0} item(s)`,
              },
              {
                key: 'audit',
                header: 'Registrada',
                sortable: true,
                sortKey: 'createdAt',
                render: (sale) => (
                  <div>
                    <p>{sale.soldByUsername ?? 'No disponible'}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(sale.createdAt)}</p>
                  </div>
                ),
              },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay ventas registradas con los criterios actuales.</p>}
            isLoading={salesQuery.isFetching}
            onPageChange={setSalesPage}
            onPageSizeChange={(nextSize) => {
              setSalesPageSize(nextSize);
              setSalesPage(0);
            }}
            pagination={salesQuery.data}
            rowKey={(sale) => String(sale.id)}
            rows={sales}
            sort={{
              value: salesSort,
              onChange: (nextSort) => {
                setSalesSort(nextSort);
                setSalesPage(0);
              },
            }}
          />

          {selectedSaleId ? (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Detalle de venta #{selectedSale?.id ?? selectedSaleId}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedSale?.operationalContextName ?? activeContext.name}</p>
                  </div>
                  {selectedSale ? (
                    <StatusBadge label={selectedSale.status} tone={selectedSale.status === 'ANULADA' ? 'warning' : 'success'} />
                  ) : null}
                </div>

                {saleDetailQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando detalle...</p> : null}
                {saleDetailQuery.isError ? (
                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {getApiErrorMessage(saleDetailQuery.error, 'No se pudo cargar el detalle de la venta.')}
                  </div>
                ) : null}

                {selectedSale ? (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <MetricCard helper="Subtotal informado por backend." label="Subtotal" value={formatCurrency(selectedSale.subtotalAmount)} />
                      <MetricCard helper="Total de la venta." label="Total" value={formatCurrency(selectedSale.totalAmount)} />
                      <MetricCard helper="Caja asociada a la operacion." label="Caja" value={String(selectedSale.cashBoxId)} />
                      <MetricCard helper="Fecha real de registro." label="Creada" value={formatDateTime(selectedSale.createdAt)} />
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Items</p>
                        <div className="mt-3 space-y-3">
                          {selectedSale.items.map((item) => (
                            <div key={String(item.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <p className="font-medium text-slate-900">{item.productName}</p>
                                <p className="text-sm text-slate-600">{formatCurrency(item.subtotalAmount)}</p>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{item.productCode} - {item.quantity} x {formatCurrency(item.unitPrice)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">Pagos</p>
                        <div className="mt-3 space-y-3">
                          {selectedSale.payments.map((payment) => (
                            <div key={String(payment.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <p className="font-medium text-slate-900">{payment.paymentMethod}</p>
                                <p className="text-sm text-slate-600">{formatCurrency(payment.amount)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-slate-600">
                        <p><span className="font-medium text-slate-900">Observacion:</span> {selectedSale.observation ?? 'Sin observacion'}</p>
                        <p><span className="font-medium text-slate-900">Motivo de anulacion:</span> {selectedSale.cancellationReason ?? 'No aplica'}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-950">Anulacion de venta</h2>
                <p className="mt-2 text-sm text-slate-600">Disponible solo si la sesion tiene permiso `venta.anular` y la venta aun no fue anulada.</p>

                {!hasPermission('venta.anular') ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Tu sesion no tiene permiso para anular ventas.
                  </div>
                ) : null}

                <form className="mt-5 space-y-4" onSubmit={cancelForm.handleSubmit((values) => cancelMutation.mutate(values))}>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Motivo</span>
                    <textarea className={`${inputClass} min-h-28`} {...cancelForm.register('reason')} />
                    {cancelForm.formState.errors.reason ? (
                      <span className="text-xs text-rose-600">{cancelForm.formState.errors.reason.message}</span>
                    ) : null}
                  </label>

                  {cancelMutation.isError ? (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {getApiErrorMessage(cancelMutation.error, 'No se pudo anular la venta.')}
                    </div>
                  ) : null}

                  {cancelMutation.isSuccess ? (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Venta anulada correctamente.</div>
                  ) : null}

                  <button
                    className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                    disabled={!hasPermission('venta.anular') || selectedSale?.status === 'ANULADA' || cancelMutation.isPending}
                    type="submit"
                  >
                    {cancelMutation.isPending ? 'Anulando venta...' : 'Anular venta'}
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
