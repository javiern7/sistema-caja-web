import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/proveedores', label: 'Proveedores' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/roles', label: 'Roles y permisos' },
  { to: '/admin/contextos', label: 'Negocios/Eventos' },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-app-gradient px-4 py-4">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">Administracion</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Catalogos y seguridad</h1>
          <nav className="mt-6 space-y-2">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
