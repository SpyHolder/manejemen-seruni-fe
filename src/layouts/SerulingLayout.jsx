import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, User } from 'lucide-react';

const navItems = [
  { to: '/seruling/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seruling/penjualan', icon: Receipt, label: 'Penjualan' },
  { to: '/seruling/riwayat', icon: Package, label: 'Produk' }, // Map to actual route handling "Produk/Riwayat"
  { to: '/seruling/profil', icon: User, label: 'Profil' },
];

export default function SerulingLayout() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 dark:text-white font-sans mx-auto max-w-md relative pb-16 shadow-2xl">
      {/* Content Area */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-[#1f2937] border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-3 gap-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary' // Active icon matches the base color (orange)
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={isActive ? "fill-primary/10" : ""} />
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
