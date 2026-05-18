import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { OperationalLayout } from '../layouts/OperationalLayout';
import { ReportsLayout } from '../layouts/ReportsLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { PostLoginLandingPage } from '../modules/auth/pages/PostLoginLandingPage';
import { ActiveCashSummaryPage } from '../modules/cajas/pages/ActiveCashSummaryPage';
import { CashClosingPage } from '../modules/cajas/pages/CashClosingPage';
import { CashHistoryPage } from '../modules/cajas/pages/CashHistoryPage';
import { CashOpeningPage } from '../modules/cajas/pages/CashOpeningPage';
import { PurchasePage } from '../modules/compras/pages/PurchasePage';
import { ContextSelectionPage } from '../modules/contexto-operativo/pages/ContextSelectionPage';
import { ExpensePage } from '../modules/egresos/pages/ExpensePage';
import { ContextsAdminPage } from '../modules/negocios-eventos/pages/ContextsAdminPage';
import { ProductsPage } from '../modules/productos/pages/ProductsPage';
import { ProvidersPage } from '../modules/proveedores/pages/ProvidersPage';
import { ReportsHomePage } from '../modules/reportes/pages/ReportsHomePage';
import { RolesPage } from '../modules/roles-permisos/pages/RolesPage';
import { StockPage } from '../modules/stock/pages/StockPage';
import { UsersPage } from '../modules/usuarios/pages/UsersPage';
import { SalesPage } from '../modules/ventas/pages/SalesPage';
import { useOperationalStore } from '../store/operational-store';
import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { OpenCashGuard } from './guards/OpenCashGuard';
import { OperationalContextGuard } from './guards/OperationalContextGuard';
import { PermissionGuard } from './guards/PermissionGuard';

function AccessDeniedPage() {
  return (
    <div className="space-y-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Acceso restringido</p>
      <h1 className="text-3xl font-semibold text-slate-950">No tienes permisos para esta ruta</h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        La estructura ya contempla bloqueo por permisos visibles, pero la validacion definitiva seguira viviendo en
        backend cuando se conecten los contratos oficiales.
      </p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/" element={<Navigate replace to="/inicio" />} />

        <Route element={<OperationalLayout />}>
          <Route path="/inicio" element={<PostLoginLandingPage />} />
          <Route path="/sin-permiso" element={<AccessDeniedPage />} />
          <Route path="/contexto" element={<ContextSelectionPage />} />

          <Route element={<OperationalContextGuard />}>
            <Route path="/caja/apertura" element={<CashOpeningPage />} />
            <Route path="/caja/historial" element={<CashHistoryPage />} />

            <Route element={<OpenCashGuard />}>
              <Route path="/caja/activa" element={<ActiveCashSummaryPage />} />
              <Route element={<PermissionGuard permission="caja.cerrar" />}>
                <Route path="/caja/cierre" element={<CashClosingPage />} />
              </Route>
              <Route element={<PermissionGuard permission="venta.registrar" />}>
                <Route path="/ventas/nueva" element={<SalesPage />} />
              </Route>
            </Route>

            <Route element={<PermissionGuard permission="egreso.registrar" />}>
              <Route path="/egresos/nuevo" element={<ExpensePage />} />
            </Route>
            <Route element={<PermissionGuard permission="compra.registrar" />}>
              <Route path="/compras/nueva" element={<PurchasePage />} />
            </Route>
            <Route element={<PermissionGuard permission="stock.consultar" />}>
              <Route path="/stock" element={<StockPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<AdminLayout />}>
          <Route element={<PermissionGuard permission="producto.ver" />}>
            <Route path="/admin/productos" element={<ProductsPage />} />
          </Route>
          <Route element={<PermissionGuard permission="proveedor.ver" />}>
            <Route path="/admin/proveedores" element={<ProvidersPage />} />
          </Route>
          <Route element={<PermissionGuard permission="usuario.ver" />}>
            <Route path="/admin/usuarios" element={<UsersPage />} />
          </Route>
          <Route element={<PermissionGuard permission="rol.ver" />}>
            <Route path="/admin/roles" element={<RolesPage />} />
          </Route>
          <Route element={<PermissionGuard permission="contexto.ver" />}>
            <Route path="/admin/contextos" element={<ContextsAdminPage />} />
          </Route>
        </Route>

        <Route element={<ReportsLayout />}>
          <Route element={<PermissionGuard permission="reporte.ver" />}>
            <Route path="/reportes" element={<ReportsHomePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
