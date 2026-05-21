import { NavLink, Outlet } from 'react-router-dom';

const adminSections = [
  {
    title: 'Catalogos y contexto',
    links: [
      { to: '/admin/productos', label: 'Productos' },
      { to: '/admin/proveedores', label: 'Proveedores' },
      { to: '/admin/contextos', label: 'Negocios/Eventos' },
    ],
  },
  {
    title: 'Seguridad',
    links: [
      { to: '/admin/usuarios', label: 'Usuarios' },
      { to: '/admin/roles', label: 'Roles y permisos' },
    ],
  },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-app-gradient px-4 py-4">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">Administracion</p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900">Catalogos y seguridad</h1>
            </div>
            <NavLink
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              to="/inicio"
            >
              Volver al inicio
            </NavLink>
          </div>
          <p className="mt-3 text-sm text-slate-600">Separamos catalogos operativos del bloque de seguridad para que la administracion sea mas facil de recorrer.</p>
          <nav className="mt-6 space-y-5">
            {adminSections.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{section.title}</p>
                <div className="mt-2 space-y-2">
                  {section.links.map((link) => (
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
                </div>
              </div>
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
