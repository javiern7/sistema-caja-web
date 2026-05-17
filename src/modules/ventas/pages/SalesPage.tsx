import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CreateSaleRequest, SaleDto } from '../../../services/api/types';
import { fetchProducts } from '../../../services/catalogs/catalogs-api';
import { createSale, fetchSales } from '../../../services/sales/sales-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, 'Selecciona un producto.'),
        quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a cero.'),
        unitPrice: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
      }),
    )
    .min(1, 'Agrega al menos un item.'),
  payments: z
    .array(
      z.object({
        paymentMethod: z.string().min(1, 'Selecciona el metodo de pago.'),
        amount: z.coerce.number().min(0, 'El monto no puede ser negativo.'),
      }),
    )
    .min(1, 'Agrega al menos un pago.'),
  observation: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

const paymentMethodOptions = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];

export function SalesPage() {
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);

  const productsQuery = useQuery({
    queryKey: ['admin', 'productos'],
    queryFn: fetchProducts,
    retry: false,
  });

  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: fetchSales,
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
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

  const itemsFieldArray = useFieldArray({ control, name: 'items' });
  const paymentsFieldArray = useFieldArray({ control, name: 'payments' });
  const watchedItems = watch('items');
  const watchedPayments = watch('payments');
  const calculatedTotal = watchedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0,
  );
  const paymentTotal = watchedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const createMutation = useMutation({
    mutationFn: (payload: CreateSaleRequest) => createSale(payload),
    onSuccess: () => {
      reset({
        items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
        payments: [{ paymentMethod: 'EFECTIVO', amount: 0 }],
        observation: '',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  if (!activeContext || !activeCash) {
    return (
      <ResourceState
        body="Necesitas contexto operativo y caja abierta para registrar ventas reales."
        title="Venta no disponible"
        tone="warning"
      />
    );
  }

  const products = (productsQuery.data ?? []).filter((product) => product.active);
  const sales = salesQuery.data ?? [];

  return (
    <ResourcePageShell
      badge="FE-VTA-001 Venta real"
      description="Pantalla conectada a `GET /api/v1/ventas` y `POST /api/v1/ventas` usando caja activa, items y pagos reales contra backend."
      documents={['04 - HU-VTA-001', '18 - API-VTA-001/API-VTA-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Caja que recibira la venta." label="Caja activa" value={String(activeCash.id)} />
          <MetricCard helper="Contexto operativo enviado al backend." label="Contexto" value={activeContext.name} />
          <MetricCard helper="Suma calculada del formulario actual." label="Total de items" value={formatCurrency(calculatedTotal)} />
          <MetricCard helper="Comparacion rapida con pagos digitados." label="Pagos ingresados" value={formatCurrency(paymentTotal)} />
        </div>
      }
      title="Venta rapida"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar venta</h2>
          <p className="mt-2 text-sm text-slate-600">El backend requiere `operationalContextId`, `cashBoxId`, `items` y `payments`.</p>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) =>
            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              cashBoxId: Number(activeCash.id),
              items: values.items,
              payments: values.payments,
              observation: values.observation,
            }),
          )}
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
                  <input className={inputClass} step="0.01" type="number" {...register(`items.${index}.unitPrice`)} />
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
            <div className="space-y-3">
              {paymentsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-3xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
                  <select className={inputClass} {...register(`payments.${index}.paymentMethod`)}>
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <input className={inputClass} step="0.01" type="number" {...register(`payments.${index}.amount`)} />
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    onClick={() => paymentsFieldArray.remove(index)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {errors.payments ? <span className="text-xs text-rose-600">{errors.payments.message as string}</span> : null}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} {...register('observation')} />
          </label>

          {createMutation.isError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(createMutation.error, 'No se pudo registrar la venta.')}
            </div>
          ) : null}

          {createMutation.isSuccess ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Venta registrada correctamente.</div>
          ) : null}

          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={createMutation.isPending || productsQuery.isLoading}
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
        <ResourceTable<SaleDto>
          columns={[
            {
              key: 'receipt',
              header: 'Comprobante',
              render: (sale) => (
                <div>
                  <p className="font-medium text-slate-900">{`${sale.internalReceiptSeries ?? 'INT'}-${sale.internalReceiptNumber ?? sale.id}`}</p>
                  <p className="text-xs text-slate-500">{sale.operationalContextName ?? activeContext.name}</p>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              render: (sale) => sale.status,
            },
            { key: 'total', header: 'Total', render: (sale) => formatCurrency(sale.totalAmount) },
            {
              key: 'items',
              header: 'Items',
              render: (sale) => `${sale.items.length} item(s)`,
            },
            {
              key: 'audit',
              header: 'Registrada',
              render: (sale) => (
                <div>
                  <p>{sale.soldByUsername ?? 'No disponible'}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(sale.createdAt)}</p>
                </div>
              ),
            },
          ]}
          rowKey={(sale) => String(sale.id)}
          rows={sales}
        />
      ) : null}
    </ResourcePageShell>
  );
}
