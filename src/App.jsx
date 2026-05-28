import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SerulingLayout from './layouts/SerulingLayout';

// Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Produk from './pages/admin/Produk';
import Gerobak from './pages/admin/Gerobak';
import Karyawan from './pages/admin/Karyawan';
import JadwalShift from './pages/admin/JadwalShift';
import Transaksi from './pages/admin/Transaksi';
import Setoran from './pages/admin/Setoran';
import Keuangan from './pages/admin/Keuangan';
import Rekap from './pages/admin/Rekap';

// Seruling Pages
import SerulingDashboard from './pages/seruling/Dashboard';
import Penjualan from './pages/seruling/Penjualan';
import Riwayat from './pages/seruling/Riwayat';
import Profil from './pages/seruling/Profil';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-stone-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seruling/dashboard'} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-stone-900">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seruling/dashboard'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="produk" element={<Produk />} />
        <Route path="gerobak" element={<Gerobak />} />
        <Route path="karyawan" element={<Karyawan />} />
        <Route path="jadwal-shift" element={<JadwalShift />} />
        <Route path="transaksi" element={<Transaksi />} />
        <Route path="setoran" element={<Setoran />} />
        <Route path="keuangan" element={<Keuangan />} />
        <Route path="rekap" element={<Rekap />} />
      </Route>

      {/* Seruling Routes */}
      <Route path="/seruling" element={<ProtectedRoute requiredRole="seruling"><SerulingLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SerulingDashboard />} />
        <Route path="penjualan" element={<Penjualan />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="profil" element={<Profil />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: '#292524',
                  color: '#fafaf9',
                  fontSize: '14px',
                  padding: '12px 16px',
                  border: '1px solid #44403c',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
