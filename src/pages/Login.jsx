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
    <div className="flex min-h-screen bg-white dark:bg-[#1f2937]">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative">
        
        {/* Logo Top Left */}
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Seruni</span>
        </div>

        <div className="max-w-md w-full mx-auto animate-fade-in mt-12 lg:mt-0">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-8 text-sm">Please enter your details</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-[#1f2937]"
                placeholder="admin@seruni.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-[#1f2937]"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-gray-600 dark:text-gray-300">Remember for 30 days</span>
              </label>
              <a href="#" className="font-medium text-primary hover:text-primary-dark">Forgot password</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Don't have an account? </span>
            <a href="#" className="font-medium text-primary hover:text-primary-dark">Sign up</a>
          </div>
        </div>
      </div>

      {/* Right Graphic Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#f2e6ff] items-center justify-center overflow-hidden">
        {/* We use a soft orange/purple mix or just the primary color with low opacity for the background */}
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="relative z-10 w-full max-w-lg p-12 text-center flex flex-col items-center">
          {/* Mock Graphic similar to the reference */}
          <div className="w-80 h-80 rounded-full bg-primary/20 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          
          <div className="relative z-20 bg-white dark:bg-[#1f2937]/40 backdrop-blur-md border border-white/50 rounded-2xl p-8 shadow-2xl">
            <Coffee size={80} className="text-primary mx-auto mb-6 drop-shadow-xl" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Seruni Management System</h2>
            <p className="text-gray-700 dark:text-gray-200">Kelola operasional Kopi Seruling Anda dengan mudah dan efisien di satu platform terpadu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
