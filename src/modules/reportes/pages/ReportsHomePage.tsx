import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { AuditOperationDto } from '../../../services/api/types';
import { fetchAuditOperations, fetchSystemHealth } from '../../../services/reports/reports-api';
import { formatDateTime } from '../../../utils/format';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function ReportsHomePage() {
  const [moduleFilter, setModuleFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');

  const auditQuery = useQuery({
    queryKey: ['reports', 'audit', moduleFilter, usernameFilter],
    queryFn: () =>
      fetchAuditOperations({
        module: moduleFilter || undefined,
        username: usernameFilter || undefined,
      }),
    retry: false,
  });

  const healthQuery = useQuery({
    queryKey: ['reports', 'system-health'],
    queryFn: fetchSystemHealth,
    retry: false,
  });

  const operations = auditQuery.data ?? [];
  const moduleCount = new Set(operations.map((operation) => operation.module)).size;
  const usersCount = new Set(operations.map((operation) => operation.username)).size;

  return (
    <ResourcePageShell
      badge="FE-REP-001 Auditoria"
      description="Primer centro real de reportes del frontend: auditoría operativa filtrable y estado técnico del backend para validación funcional."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '18 - API-AUD-001/API-SYS-001']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Operaciones auditadas visibles con el filtro actual." label="Eventos" value={String(operations.length)} />
          <MetricCard helper="Módulos que aparecen en auditoría." label="Módulos" value={String(moduleCount)} />
          <MetricCard helper="Usuarios que generaron eventos." label="Usuarios" value={String(usersCount)} />
          <MetricCard helper="Disponibilidad reportada por el backend." label="Backend" value={healthQuery.data?.status ?? 'Sin dato'} />
        </div>
      }
      title="Auditoría y reportes"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Módulo</span>
            <input
              className={inputClass}
              onChange={(event) => setModuleFilter(event.target.value)}
              placeholder="ventas, compras, auth..."
              value={moduleFilter}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Usuario</span>
            <input
              className={inputClass}
              onChange={(event) => setUsernameFilter(event.target.value)}
              placeholder="admin, cajero..."
              value={usernameFilter}
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Filtros ligados a `GET /api/v1/auditoria/operaciones`.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Auditoría operativa</h2>
              <p className="mt-2 text-sm text-slate-600">Consulta filtrable de operaciones registradas por el backend.</p>
            </div>
            <StatusBadge
              label={auditQuery.isLoading ? 'Cargando' : auditQuery.isError ? 'Error' : 'Listo'}
              tone={auditQuery.isError ? 'warning' : auditQuery.isLoading ? 'neutral' : 'success'}
            />
          </div>

          {auditQuery.isLoading ? <ResourceState body="Consultando auditoría..." title="Cargando auditoría" /> : null}
          {auditQuery.isError ? (
            <ResourceState
              body={getApiErrorMessage(auditQuery.error, 'No se pudo consultar la auditoría operativa.')}
              title="Error al consultar auditoría"
              tone="danger"
            />
          ) : null}
          {!auditQuery.isLoading && !auditQuery.isError && operations.length === 0 ? (
            <ResourceState body="No hay eventos de auditoría para los filtros actuales." title="Sin eventos" tone="warning" />
          ) : null}
          {!auditQuery.isLoading && !auditQuery.isError && operations.length > 0 ? (
            <ResourceTable<AuditOperationDto>
              columns={[
                {
                  key: 'module',
                  header: 'Módulo',
                  render: (operation) => (
                    <div>
                      <p className="font-medium text-slate-900">{operation.module}</p>
                      <p className="text-xs text-slate-500">{operation.operationType}</p>
                    </div>
                  ),
                },
                {
                  key: 'entity',
                  header: 'Entidad',
                  render: (operation) => (
                    <div>
                      <p>{operation.entityType}</p>
                      <p className="text-xs text-slate-500">{operation.entityId}</p>
                    </div>
                  ),
                },
                { key: 'user', header: 'Usuario', render: (operation) => operation.username },
                { key: 'date', header: 'Fecha', render: (operation) => formatDateTime(operation.occurredAt) },
                {
                  key: 'detail',
                  header: 'Detalle',
                  render: (operation) => <span className="text-xs text-slate-600">{operation.detail ?? 'Sin detalle'}</span>,
                },
              ]}
              rowKey={(operation) => String(operation.id)}
              rows={operations}
            />
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">Estado técnico</h2>
          <p className="mt-2 text-sm text-slate-600">Lectura del endpoint `GET /api/v1/system/health` para validación rápida.</p>

          {healthQuery.isLoading ? <ResourceState body="Consultando estado del backend..." title="Cargando health check" /> : null}
          {healthQuery.isError ? (
            <ResourceState
              body={getApiErrorMessage(healthQuery.error, 'No se pudo consultar el estado del backend.')}
              title="Error en health check"
              tone="danger"
            />
          ) : null}

          {healthQuery.data ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">Estado</p>
                <StatusBadge label={healthQuery.data.status} tone={healthQuery.data.status === 'UP' ? 'success' : 'warning'} />
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <p><span className="font-medium text-slate-900">Aplicación:</span> {healthQuery.data.application}</p>
                <p className="mt-2"><span className="font-medium text-slate-900">Perfiles:</span> {healthQuery.data.profiles.join(', ') || 'Sin perfil activo'}</p>
                <p className="mt-2"><span className="font-medium text-slate-900">Timestamp:</span> {formatDateTime(healthQuery.data.timestamp)}</p>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </ResourcePageShell>
  );
}
