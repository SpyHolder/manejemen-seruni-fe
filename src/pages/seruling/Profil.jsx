import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, Phone, ChevronRight, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profil() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Berhasil logout');
  };

  return (
    <div className="bg-[#fafaf9] dark:bg-[#111827] min-h-screen px-4 pt-6 pb-20 animate-fade-in space-y-6 transition-colors">
      
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Profil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola informasi akun Anda</p>
      </div>

      {/* Avatar & Info Card */}
      <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center transition-colors">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 border-4 border-white dark:border-[#1f2937] shadow-sm overflow-hidden">
          <span className="text-4xl font-bold text-gray-400 dark:text-gray-500">{user?.nama?.charAt(0)}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.nama}</h2>
        <span className="inline-block px-4 py-1.5 mt-2 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wide">
          {user?.role}
        </span>
      </div>

      {/* Details List */}
      <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{user?.email}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Telepon</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{user?.phone || 'Belum diatur'}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
        </div>
        
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-primary/20 text-primary' : 'bg-orange-100 text-orange-500'}`}>
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tema Aplikasi</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}</p>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full relative transition-colors ${isDark ? 'bg-primary' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout} 
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
      >
        <LogOut size={18} /> Keluar
      </button>

    </div>
  );
}
