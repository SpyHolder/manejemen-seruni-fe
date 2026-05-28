import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Coffee, Truck, Users, Calendar,
  ShoppingCart, ClipboardList, DollarSign, FileText,
  LogOut, Menu, X, Search, Moon, Sun
} from 'lucide-react';

const menuGroups = [
  {
    title: 'DASHBOARD',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Analytics' }
    ]
  },
  {
    title: 'MASTER DATA',
    items: [
      { to: '/admin/produk', icon: Coffee, label: 'Produk' },
      { to: '/admin/gerobak', icon: Truck, label: 'Gerobak' },
      { to: '/admin/karyawan', icon: Users, label: 'Karyawan' }
    ]
  },
  {
    title: 'OPERASIONAL',
    items: [
      { to: '/admin/jadwal-shift', icon: Calendar, label: 'Jadwal Shift' }
    ]
  },
  {
    title: 'KEUANGAN & LAPORAN',
    items: [
      { to: '/admin/transaksi', icon: ShoppingCart, label: 'Transaksi' },
      { to: '/admin/setoran', icon: ClipboardList, label: 'Setoran' },
      { to: '/admin/keuangan', icon: DollarSign, label: 'Keuangan' },
      { to: '/admin/rekap', icon: FileText, label: 'Rekap' }
    ]
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-900 overflow-hidden font-sans text-stone-900 dark:text-stone-100 transition-colors duration-200">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 dark:bg-stone-950 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 shrink-0 border-b border-stone-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Seruni</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-stone-400 lg:hidden hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="px-4">
              <p className="px-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => { setSidebarOpen(false); setSearchQuery(''); }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-orange-500/15 text-orange-400 border-l-[3px] border-orange-400 -ml-[3px]'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-orange-400' : ''} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="px-4 py-4 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex relative w-96 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Cari halaman atau fitur..." 
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-stone-200 outline-none transition-all"
              />
              
              {/* Search Dropdown */}
              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {menuGroups.flatMap(g => g.items).filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <div className="p-3 text-sm text-stone-500 text-center">Tidak ditemukan hasil untuk "{searchQuery}"</div>
                    ) : (
                      menuGroups.flatMap(g => g.items)
                        .filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => { navigate(item.to); setSearchQuery(''); setIsSearchFocused(false); }}
                            className="flex items-center gap-3 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded-lg cursor-pointer transition-colors"
                          >
                            <item.icon size={16} className="text-stone-400" />
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{item.label}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              {isDark ? <Sun size={20} className="text-orange-400" /> : <Moon size={20} />}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-stone-200 dark:border-stone-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.nama?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold leading-tight text-stone-900 dark:text-white">{user?.nama}</p>
                <p className="text-[11px] text-stone-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button onClick={handleLogout} className="md:hidden p-2 text-red-500" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-stone-50 dark:bg-stone-900 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
