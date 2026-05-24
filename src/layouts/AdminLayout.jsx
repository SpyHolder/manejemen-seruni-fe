import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Coffee, Truck, Users, Calendar,
  ShoppingCart, ClipboardList, DollarSign, FileText,
  LogOut, Menu, X, Search, Bell, Moon, Sun, ChevronDown
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
      { to: '/admin/produk', icon: Coffee, label: 'Products' },
      { to: '/admin/gerobak', icon: Truck, label: 'Carts' },
      { to: '/admin/karyawan', icon: Users, label: 'Users' }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { to: '/admin/jadwal-shift', icon: Calendar, label: 'Shifts' }
    ]
  },
  {
    title: 'FINANCE & REPORTS',
    items: [
      { to: '/admin/transaksi', icon: ShoppingCart, label: 'Transactions' },
      { to: '/admin/setoran', icon: ClipboardList, label: 'Deposits' },
      { to: '/admin/keuangan', icon: DollarSign, label: 'Finance' },
      { to: '/admin/rekap', icon: FileText, label: 'Reports' }
    ]
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111827] overflow-hidden font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1f2937] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo / Header Sidebar */}
        <div className="flex items-center gap-3 px-6 h-16 shrink-0 border-b border-gray-100 dark:border-gray-800/50">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Seruni</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-500 dark:text-gray-400 dark:text-gray-500 lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="px-4">
              <p className="px-2 text-xs font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'opacity-70'} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#1f2937] border-b border-gray-200 dark:border-gray-800 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <Menu size={24} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex relative w-96 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800/50 border-none text-sm focus:ring-2 focus:ring-primary/20 dark:text-gray-200 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun size={20} className="text-orange-400" /> : <Moon size={20} />}
            </button>
            
            {/* Notifications */}
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-[#1f2937]"></span>
            </button>

            {/* Profile Dropdown (Mock) */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {user?.nama?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold leading-tight">{user?.nama}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 hidden md:block" />
            </div>
            
            <button onClick={handleLogout} className="md:hidden p-2 text-red-500" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#111827] transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
