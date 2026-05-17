import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CreateExpenseRequest, ExpenseDto } from '../../../services/api/types';
import { createExpense, fetchExpenses } from '../../../services/expenses/expenses-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';

const expenseSchema = z.object({
  expenseType: z.string().min(1, 'Ingresa el tipo de egreso.'),
  category: z.string().min(1, 'Ingresa la categoria.'),
  description: z.string().min(1, 'Ingresa la descripcion.'),
  paymentMethod: z.string().optional(),
  amount: z.coerce.number().min(0, 'El monto no puede ser negativo.'),
  responsible: z.string().optional(),
  observation: z.string().optional(),
  expenseDate: z.string().min(1, 'Ingresa la fecha de egreso.'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function ExpensePage() {
  const queryClient = useQueryClient();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseType: 'OPERATIVO',
      category: '',
      description: '',
      paymentMethod: 'EFECTIVO',
      amount: 0,
      responsible: '',
      observation: '',
      expenseDate: new Date().toISOString().slice(0, 10),
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpenseRequest) => createExpense(payload),
    onSuccess: () => {
      reset({
        expenseType: 'OPERATIVO',
        category: '',
        description: '',
        paymentMethod: 'EFECTIVO',
        amount: 0,
        responsible: '',
        observation: '',
        expenseDate: new Date().toISOString().slice(0, 10),
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-box', 'summary'] });
    },
  });

  if (!activeContext) {
    return <ResourceState body="Selecciona un contexto operativo antes de registrar egresos." title="Contexto pendiente" tone="warning" />;
  }

  const expenses = expensesQuery.data ?? [];

  return (
    <ResourcePageShell
      badge="FE-EGR-001 Egreso real"
      description="Pantalla conectada a `GET /api/v1/egresos` y `POST /api/v1/egresos` para registrar salidas reales vinculadas al contexto y, cuando exista, a la caja activa."
      documents={['04 - HU-EGR-001', '18 - API-EGR-001/API-EGR-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Contexto al que se imputa el egreso." label="Contexto" value={activeContext.name} />
          <MetricCard helper="Caja asociada si esta abierta." label="Caja activa" value={activeCash ? String(activeCash.id) : 'Sin caja'} />
          <MetricCard helper="Total de egresos visibles." label="Registros" value={String(expenses.length)} />
          <MetricCard
            helper="Suma simple de lo visible en pantalla."
            label="Monto acumulado"
            value={formatCurrency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))}
          />
        </div>
      }
      title="Registro de egresos"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Registrar egreso</h2>
          <p className="mt-2 text-sm text-slate-600">El egreso se enviara al backend con contexto, monto, categoria y fecha real.</p>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit((values) =>
            createMutation.mutate({
              operationalContextId: Number(activeContext.id),
              cashBoxId: activeCash ? Number(activeCash.id) : undefined,
              expenseType: values.expenseType,
              category: values.category,
              description: values.description,
              paymentMethod: values.paymentMethod,
              amount: values.amount,
              responsible: values.responsible,
              observation: values.observation,
              expenseDate: values.expenseDate,
            }),
          )}
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tipo de egreso</span>
            <input className={inputClass} {...register('expenseType')} />
            {errors.expenseType ? <span className="text-xs text-rose-600">{errors.expenseType.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <input className={inputClass} {...register('category')} />
            {errors.category ? <span className="text-xs text-rose-600">{errors.category.message}</span> : null}
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <input className={inputClass} {...register('description')} />
            {errors.description ? <span className="text-xs text-rose-600">{errors.description.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Metodo de pago</span>
            <input className={inputClass} {...register('paymentMethod')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Monto</span>
            <input className={inputClass} step="0.01" type="number" {...register('amount')} />
            {errors.amount ? <span className="text-xs text-rose-600">{errors.amount.message}</span> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Responsable</span>
            <input className={inputClass} {...register('responsible')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha</span>
            <input className={inputClass} type="date" {...register('expenseDate')} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Observacion</span>
            <textarea className={`${inputClass} min-h-24`} {...register('observation')} />
          </label>

          <div className="md:col-span-2">
            {createMutation.isError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getApiErrorMessage(createMutation.error, 'No se pudo registrar el egreso.')}
              </div>
            ) : null}

            {createMutation.isSuccess ? (
              <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Egreso registrado correctamente.</div>
            ) : null}

            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              disabled={createMutation.isPending}
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
        <ResourceTable<ExpenseDto>
          columns={[
            {
              key: 'type',
              header: 'Tipo / categoria',
              render: (expense) => (
                <div>
                  <p className="font-medium text-slate-900">{expense.expenseType}</p>
                  <p className="text-xs text-slate-500">{expense.category}</p>
                </div>
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
            { key: 'amount', header: 'Monto', render: (expense) => formatCurrency(expense.amount) },
            {
              key: 'audit',
              header: 'Fecha / usuario',
              render: (expense) => (
                <div>
                  <p>{formatDate(expense.expenseDate)}</p>
                  <p className="text-xs text-slate-500">{expense.recordedByUsername ?? 'No disponible'} - {formatDateTime(expense.createdAt)}</p>
                </div>
              ),
            },
          ]}
          rowKey={(expense) => String(expense.id)}
          rows={expenses}
        />
      ) : null}
    </ResourcePageShell>
  );
}
