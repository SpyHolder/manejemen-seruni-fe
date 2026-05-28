import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coffee, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Login berhasil! 👋');
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/seruling/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-stone-900">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative">
        
        {/* Logo Top Left */}
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-stone-900 dark:text-white">Seruni</span>
        </div>

        <div className="max-w-md w-full mx-auto animate-fade-in mt-12 lg:mt-0">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-2">Selamat Datang</h1>
          <p className="text-stone-500 mb-8 text-sm">Masukkan detail akun Anda</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">Alamat Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white dark:bg-stone-800 dark:text-white"
                placeholder="admin@seruni.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white dark:bg-stone-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-stone-300 text-primary focus:ring-primary accent-primary" />
                <span className="text-stone-600 dark:text-stone-300">Ingat selama 30 hari</span>
              </label>
              <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">Lupa password</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/20"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Masuk
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-stone-500">Belum punya akun? </span>
            <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">Daftar</a>
          </div>
        </div>
      </div>

      {/* Right Graphic Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-stone-800 dark:via-stone-800 dark:to-stone-700 items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-orange-200/40 dark:bg-orange-500/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-300/20 dark:bg-orange-500/5 blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 w-full max-w-lg p-12 text-center flex flex-col items-center">
          <div className="relative z-20 bg-white/70 dark:bg-stone-800/60 backdrop-blur-xl border border-white/50 dark:border-stone-700/50 rounded-3xl p-10 shadow-2xl shadow-orange-500/10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Coffee size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white mb-3">Seruni Management</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">Kelola operasional Kopi Seruling Anda dengan mudah dan efisien di satu platform terpadu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
