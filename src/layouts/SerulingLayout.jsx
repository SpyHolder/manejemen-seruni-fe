import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, User } from 'lucide-react';

const navItems = [
  { to: '/seruling/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seruling/penjualan', icon: Receipt, label: 'Penjualan' },
  { to: '/seruling/riwayat', icon: Package, label: 'Riwayat' },
  { to: '/seruling/profil', icon: User, label: 'Profil' },
];

export default function SerulingLayout() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-sans mx-auto max-w-md relative pb-20 shadow-2xl transition-colors">
      {/* Content Area */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 z-50 safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-3 gap-1 text-[11px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-orange-50 dark:bg-orange-500/10' : ''}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
