import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CreateExpenseRequest, ExpenseDto } from '../../../services/api/types';
import { createExpense, fetchExpenseDetail, fetchExpenses } from '../../../services/expenses/expenses-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';

const expenseTypeOptions = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo', helper: 'Gastos generales del negocio o evento que no salen directamente desde caja operativa.' },
  { value: 'CAJA', label: 'Caja', helper: 'Egresos que impactan la caja activa del contexto y requieren una caja abierta.' },
];

const categoryOptionsByType: Record<string, string[]> = {
  ADMINISTRATIVO: ['ALQUILER', 'SERVICIOS', 'LIMPIEZA', 'PERSONAL', 'MOVILIDAD', 'OTROS'],
  CAJA: ['VUELTO', 'REEMBOLSO', 'COMPRA MENOR', 'MOVILIDAD', 'MANTENIMIENTO', 'OTROS'],
};

const paymentMethodOptions = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];

const expenseSchema = z.object({
  expenseType: z.string().min(1, 'El tipo de egreso es obligatorio.'),
  category: z.string().min(1, 'La categoria es obligatoria.'),
  description: z.string().trim().min(3, 'Describe brevemente el motivo del egreso.'),
  paymentMethod: z.string().min(1, 'El metodo de pago es obligatorio.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero.'),
  responsible: z.string().trim().min(3, 'Indica la persona responsable o que autorizo el gasto.'),
  observation: z.string().optional(),
  expenseDate: z.string().min(1, 'La fecha del egreso es obligatoria.'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

function initialExpenseValues(): ExpenseFormValues {
  return {
    expenseType: 'ADMINISTRATIVO',
    category: '',
    description: '',
    paymentMethod: 'EFECTIVO',
    amount: 0,
    responsible: '',
    observation: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  };
}

export function ExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canOpenCash = hasPermission('caja.abrir');
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [lastCreatedExpense, setLastCreatedExpense] = useState<ExpenseDto | null>(null);
  const [expensesPage, setExpensesPage] = useState(0);
  const [expensesPageSize, setExpensesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expensesSort, setExpensesSort] = useState('expenseDate,desc');

  const expensesQuery = useQuery({
    queryKey: ['expenses', expensesPage, expensesPageSize, expensesSort],
    queryFn: () =>
      fetchExpenses({
        page: expensesPage,
        size: expensesPageSize,
        sort: expensesSort,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const expenseDetailQuery = useQuery({
    queryKey: ['expenses', 'detail', selectedExpenseId],
    queryFn: () => fetchExpenseDetail(Number(selectedExpenseId)),
    enabled: Boolean(selectedExpenseId),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialExpenseValues(),
  });

  const expenseType = watch('expenseType');
  const amount = Number(watch('amount') || 0);
  const categoryOptions = categoryOptionsByType[expenseType] ?? categoryOptionsByType.ADMINISTRATIVO;
  const hasOpenCash = activeCash?.status === 'ABIERTA';

  const expenses = expensesQuery.data?.items ?? [];
  const visibleAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses],
  );
  const selectedExpense = expenseDetailQuery.data ?? null;

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpenseRequest) => createExpense(payload),
    onSuccess: (expense) => {
      setLastCreatedExpense(expense);
      setSelectedExpenseId(String(expense.id));
      reset(initialExpenseValues());
      queryClient.setQueryData(['expenses', 'detail', String(expense.id)], expense);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
    },
  });

  const canSubmitExpense =
    Boolean(activeContext) &&
    hasOpenCash &&
    !createMutation.isPending &&
    amount > 0;

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
        body="Selecciona un contexto operativo antes de registrar egresos."
        title="Contexto pendiente"
        tone="warning"
      />
    );
  }

  return (
    <ResourcePageShell
      badge="FE-EGR-001 Egreso real"
      description="Pantalla conectada a `GET /api/v1/egresos`, `GET /api/v1/egresos/{expenseId}` y `POST /api/v1/egresos` para registrar y revisar egresos reales."
      documents={['04 - HU-EGR-001', '18 - API-EGR-001/API-EGR-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Contexto al que se imputa el egreso." label="Contexto" value={activeContext.name} />
          <MetricCard helper="Caja requerida para registrar egresos en esta pantalla." label="Caja activa" value={activeCash ? String(activeCash.id) : 'Sin caja'} />
          <MetricCard helper="Total de egresos visibles luego del ultimo refresco." label="Registros" value={String(expensesQuery.data?.totalElements ?? expenses.length)} />
          <MetricCard helper="Suma de los montos visibles en el listado inferior." label="Monto acumulado" value={formatCurrency(visibleAmount)} />
        </div>
      }
      title="Registro de egresos"
    >
      {!hasOpenCash ? (
        <ResourceState
          action={canOpenCash ? (
            <button
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => navigate('/caja/apertura')}
              type="button"
            >
              Ir a apertura de caja
            </button>
          ) : undefined}
          body={
            canOpenCash
              ? 'Necesitas una caja abierta para registrar egresos en este flujo operativo.'
              : 'Necesitas una caja abierta para registrar egresos en este flujo operativo. Solicita a un usuario con permiso de apertura que habilite la caja.'
          }
          title="Caja abierta pendiente"
          tone="warning"
        />
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar egreso</h2>
          <p className="mt-2 text-sm text-slate-600">Selecciona el tipo, categoria y metodo de pago, registra el monto real y confirma antes de guardar.</p>
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-slate-700">
            La categoria se esta resolviendo con un catalogo temporal de frontend para reducir errores de digitacion. Queda pendiente conectarla a un listado parametrizable desde backend o base de datos.
          </div>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit((values) => {
            if (!hasOpenCash || !activeCash) {
              setError('expenseType', {
                type: 'manual',
                message: 'No se puede registrar un egreso sin caja activa.',
              });
              return;
            }

            clearErrors('expenseType');
            const shouldContinue = window.confirm(
              `¿Confirmas registrar el egreso por ${formatCurrency(values.amount)}?\nTipo: ${values.expenseType}\nMetodo de pago: ${values.paymentMethod}`,
            );

            if (!shouldContinue) {
              return;
            }

            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              cashBoxId: Number(activeCash.id),
              expenseType: values.expenseType,
              category: values.category,
              description: values.description,
              paymentMethod: values.paymentMethod,
              amount: values.amount,
              responsible: values.responsible,
              observation: values.observation,
              expenseDate: values.expenseDate,
            });
          })}
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tipo de egreso</span>
            <select
              className={inputClass}
              {...register('expenseType', {
                onChange: (event) => {
                  const nextType = event.target.value;
                  const nextCategories = categoryOptionsByType[nextType] ?? [];
                  setValue('category', nextCategories[0] ?? '', { shouldDirty: true, shouldValidate: true });
                },
              })}
            >
              {expenseTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {expenseTypeOptions.find((option) => option.value === expenseType)?.helper ?? 'Selecciona la naturaleza del gasto.'}
            </p>
            {errors.expenseType ? <span className="text-xs text-rose-600">{errors.expenseType.message}</span> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <select className={inputClass} {...register('category')}>
              <option value="">Selecciona una categoria</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Selecciona o registra la categoria del gasto. Hoy se usa un listado guiado para mantener consistencia.</p>
            {errors.category ? <span className="text-xs text-rose-600">{errors.category.message}</span> : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <input className={inputClass} placeholder="Ej. Compra de insumos para atencion del evento." {...register('description')} />
            <p className="text-xs text-slate-500">Describe brevemente el motivo del egreso para facilitar trazabilidad y revisiones posteriores.</p>
            {errors.description ? <span className="text-xs text-rose-600">{errors.description.message}</span> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Metodo de pago</span>
            <select className={inputClass} {...register('paymentMethod')}>
              {paymentMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Indica desde que medio salio el dinero para que el movimiento quede consistente con caja.</p>
            {errors.paymentMethod ? <span className="text-xs text-rose-600">{errors.paymentMethod.message}</span> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Monto</span>
            <input className={inputClass} min="0.01" placeholder="Ej. 25.50" step="0.01" type="number" {...register('amount')} />
            <p className="text-xs text-slate-500">Ingresa el importe real del egreso. Solo se permiten valores mayores a cero.</p>
            {errors.amount ? <span className="text-xs text-rose-600">{errors.amount.message}</span> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Responsable</span>
            <input className={inputClass} placeholder="Ej. Javier Navarro" {...register('responsible')} />
            <p className="text-xs text-slate-500">Persona que realizo o autorizo el gasto.</p>
            {errors.responsible ? <span className="text-xs text-rose-600">{errors.responsible.message}</span> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha</span>
            <input className={inputClass} type="date" {...register('expenseDate')} />
            <p className="text-xs text-slate-500">Fecha efectiva en la que ocurrio el egreso.</p>
            {errors.expenseDate ? <span className="text-xs text-rose-600">{errors.expenseDate.message}</span> : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} placeholder="Dato opcional para ampliar el contexto del egreso." {...register('observation')} />
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Monto a registrar</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(amount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Registros visibles</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{expenses.length}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Monto acumulado visible</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(visibleAmount)}</p>
              </div>
            </div>
          </div>

          {!hasOpenCash ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 md:col-span-2">
              No se puede registrar un egreso sin caja activa. Abre o selecciona una caja antes de continuar.
            </div>
          ) : null}

          {!canSubmitExpense ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 md:col-span-2">
              Completa todos los campos obligatorios y verifica que exista una caja activa para habilitar el guardado.
            </div>
          ) : null}

          <div className="md:col-span-2">
            {createMutation.isError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getApiErrorMessage(createMutation.error, 'No se pudo registrar el egreso.')}
              </div>
            ) : null}

            {lastCreatedExpense ? (
              <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Egreso registrado correctamente. Se actualizo el listado y el monto acumulado visible.
              </div>
            ) : null}

            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              disabled={!canSubmitExpense}
              type="submit"
            >
              {createMutation.isPending ? 'Registrando egreso...' : 'Guardar egreso'}
            </button>
          </div>
        </form>
      </section>

      {expensesQuery.isLoading ? <ResourceState body="Consultando egresos registrados..." title="Cargando egresos" /> : null}

      {expensesQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(expensesQuery.error, 'No se pudieron consultar los egresos.')}
          title="Error al consultar egresos"
          tone="danger"
        />
      ) : null}

      {!expensesQuery.isLoading && !expensesQuery.isError ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Egresos registrados</h2>
                <p className="mt-1 text-sm text-slate-600">El listado se actualiza al registrar un nuevo egreso. Hoy el backend expone alta y consulta, pero no edicion, anulacion ni eliminacion.</p>
              </div>
              <StatusBadge label="Solo lectura para mantenimiento" tone="neutral" />
            </div>

            <ResourceTable<ExpenseDto>
              columns={[
                {
                  key: 'type',
                  header: 'Tipo / categoria',
                  sortable: true,
                  sortKey: 'expenseType',
                  render: (expense) => (
                    <button className="text-left" onClick={() => setSelectedExpenseId(String(expense.id))} type="button">
                      <p className="font-medium text-slate-900">{expense.expenseType}</p>
                      <p className="text-xs text-slate-500">{expense.category}</p>
                    </button>
                  ),
                },
                {
                  key: 'description',
                  header: 'Descripcion',
                  render: (expense) => (
                    <div>
                      <p>{expense.description}</p>
                      <p className="text-xs text-slate-500">{expense.observation ?? 'Sin observacion'}</p>
                    </div>
                  ),
                },
                { key: 'amount', header: 'Monto', sortable: true, sortKey: 'amount', render: (expense) => formatCurrency(expense.amount) },
                {
                  key: 'audit',
                  header: 'Fecha / usuario',
                  sortable: true,
                  sortKey: 'expenseDate',
                  render: (expense) => (
                    <div>
                      <p>{formatDate(expense.expenseDate)}</p>
                      <p className="text-xs text-slate-500">{expense.recordedByUsername ?? 'No disponible'} - {formatDateTime(expense.createdAt)}</p>
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (expense) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                        onClick={() => setSelectedExpenseId(String(expense.id))}
                        type="button"
                      >
                        Ver detalle
                      </button>
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">Editar: pendiente backend</span>
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">Inactivar: pendiente backend</span>
                    </div>
                  ),
                },
              ]}
              emptyState={<p className="text-sm text-slate-500">No hay egresos registrados con el criterio actual.</p>}
              isLoading={expensesQuery.isFetching}
              onPageChange={setExpensesPage}
              onPageSizeChange={(nextSize) => {
                setExpensesPageSize(nextSize);
                setExpensesPage(0);
              }}
              pagination={expensesQuery.data}
              rowKey={(expense) => String(expense.id)}
              rows={expenses}
              sort={{
                value: expensesSort,
                onChange: (nextSort) => {
                  setExpensesSort(nextSort);
                  setExpensesPage(0);
                },
              }}
            />
          </section>

          {selectedExpenseId ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Detalle de egreso #{selectedExpense?.id ?? selectedExpenseId}</h2>
                  <p className="mt-1 text-sm text-slate-600">{selectedExpense?.operationalContextName ?? activeContext.name}</p>
                </div>
                {selectedExpense ? <StatusBadge label={selectedExpense.expenseType} tone="neutral" /> : null}
              </div>

              {expenseDetailQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando detalle...</p> : null}
              {expenseDetailQuery.isError ? (
                <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getApiErrorMessage(expenseDetailQuery.error, 'No se pudo cargar el detalle del egreso.')}
                </div>
              ) : null}

              {selectedExpense ? (
                <>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard helper="Monto reportado por backend." label="Monto" value={formatCurrency(selectedExpense.amount)} />
                    <MetricCard helper="Caja vinculada al movimiento si aplica." label="Caja" value={selectedExpense.cashBoxId ? String(selectedExpense.cashBoxId) : 'Sin caja'} />
                    <MetricCard helper="Fecha efectiva del egreso." label="Fecha" value={formatDate(selectedExpense.expenseDate)} />
                    <MetricCard helper="Registro de sistema." label="Creado" value={formatDateTime(selectedExpense.createdAt)} />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">Descripcion</p>
                      <p className="mt-2 text-sm text-slate-600">{selectedExpense.description}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">Observacion</p>
                      <p className="mt-2 text-sm text-slate-600">{selectedExpense.observation ?? 'Sin observacion registrada.'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">Responsable</p>
                      <p className="mt-2 text-sm text-slate-600">{selectedExpense.responsible ?? 'No definido'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">Metodo de pago</p>
                      <p className="mt-2 text-sm text-slate-600">{selectedExpense.paymentMethod ?? 'No definido'}</p>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Acciones de mantenimiento como editar, eliminar o inactivar quedan pendientes hasta que el backend exponga reglas y endpoints para mantener trazabilidad sobre caja.
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
