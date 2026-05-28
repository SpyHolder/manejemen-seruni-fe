import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Power, MapPin, Calendar, CalendarDays, Receipt, CheckCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function SerulingDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [stats, setStats] = useState(null);
  const [shift, setShift] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineDuration, setOnlineDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('hari_ini');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'primary', onConfirm: null });

  useEffect(() => {
    fetchData();
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  useEffect(() => {
    let interval;
    if (isOnline && shift?.online_at) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(shift.online_at).getTime()) / 60000);
        setOnlineDuration(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnline, shift]);

  const fetchData = async () => {
    try {
      const [statsRes, shiftRes] = await Promise.all([
        api.get('/dashboard/seruling/stats'),
        api.get('/shift/today'),
      ]);
      setStats(statsRes.data.data);
      const shifts = shiftRes.data.data;
      if (shifts.length > 0) {
        const activeShift = shifts.find(s => s.status === 'online') || shifts.find(s => s.status === 'dijadwalkan') || shifts[0];
        setShift(activeShift);
        if (activeShift.status === 'online') {
          setIsOnline(true);
          startLocationTracking(activeShift);
        }
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const startLocationTracking = (shiftData) => {
    if (!navigator.geolocation) { toast.error('Browser tidak mendukung Geolocation'); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (socket) {
          socket.emit('location:update', {
            user_id: user.id, gerobak_id: shiftData.gerobak_id,
            latitude: pos.coords.latitude, longitude: pos.coords.longitude,
            nama: user.nama, gerobak_nama: shiftData.gerobak?.nama_gerobak,
          });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );
    setWatchId(id);
  };

  const handleStartShift = async () => {
    if (!navigator.geolocation) { toast.error('Browser tidak mendukung Geolocation'); return; }
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') { toast.error('Izin lokasi ditolak'); return; }
      const res = await api.put(`/shift/${shift.id}/online`);
      setShift(res.data.data); 
      setIsOnline(true);
      startLocationTracking(res.data.data);
      toast.success('Shift Dimulai! Anda sekarang Online.');
    } catch (error) { toast.error('Gagal memulai shift'); }
  };

  const handleEndShift = async () => {
    const toastId = toast.loading('Memproses akhir shift...');
    try {
      if (watchId) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
      if (socket) socket.emit('location:offline', { user_id: user.id });
      
      // 1. Go Offline
      const resOffline = await api.put(`/shift/${shift.id}/offline`);
      
      // 2. Create Setoran
      await api.post('/setoran', { shift_assignment_id: shift.id });

      setShift({ ...shift, ...resOffline.data.data, status: 'selesai' }); 
      setIsOnline(false);
      
      toast.success(`Shift selesai! Laporan setoran berhasil dibuat. Durasi: ${resOffline.data.data.durasi_menit} menit`, { id: toastId, duration: 4000 });
      fetchData(); // Refresh data to update stats
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Gagal mengakhiri shift', { id: toastId }); 
    }
  };

  const promptToggleOnline = () => {
    if (!shift) { toast.error('Tidak ada jadwal shift hari ini'); return; }
    
    if (!isOnline) {
      setConfirmModal({
        isOpen: true,
        title: 'Mulai Shift?',
        message: 'Anda akan memulai shift sekarang. Lokasi Anda akan dilacak selama shift berlangsung.',
        type: 'primary',
        confirmText: 'Ya, Mulai Shift',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false });
          handleStartShift();
        }
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Akhiri Shift & Setor?',
        message: 'Ini akan mengakhiri shift Anda dan otomatis merekap semua penjualan menjadi Laporan Setoran. Anda tidak bisa menerima pesanan lagi setelah ini.',
        type: 'warning',
        confirmText: 'Ya, Akhiri Shift',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false });
          handleEndShift();
        }
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-white dark:bg-stone-900"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-stone-900 min-h-screen px-4 pt-6 pb-6 animate-fade-in space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Dashboard Penjualan</h1>
        <p className="text-sm text-stone-500 mt-0.5">Halo, {user?.nama} 👋</p>
      </div>

      {/* Online Toggle Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isOnline ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30' : shift?.status === 'selesai' ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
        <div>
          <p className="font-semibold text-stone-900 dark:text-white text-sm">
            {isOnline ? 'Anda sedang Online' : shift?.status === 'selesai' ? 'Shift Selesai ✅' : 'Anda sedang Offline'}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {isOnline ? `Durasi: ${Math.floor(onlineDuration / 60)}j ${onlineDuration % 60}m` : shift?.status === 'selesai' ? 'Setoran sudah direkap' : shift ? 'Mulai shift Anda sekarang' : 'Tidak ada jadwal hari ini'}
          </p>
        </div>
        <button
          onClick={promptToggleOnline}
          disabled={!shift || shift.status === 'selesai'}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
            isOnline ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
            : shift && shift.status !== 'selesai' ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg' 
            : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
          }`}
        >
          {shift?.status === 'selesai' ? <CheckCircle size={20} /> : <Power size={20} />}
        </button>
      </div>

      {/* Shift Details */}
      {shift && (
        <div className="flex items-center gap-3 px-1">
          <MapPin size={16} className="text-stone-400" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{shift.gerobak?.nama_gerobak} - Shift {shift.shift}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="min-w-[200px] bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-stone-500 mb-2">Total Penjualan</p>
          <p className="text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(stats?.total_penjualan_harian)}</p>
          <p className="text-[10px] text-stone-500 font-medium mt-1">Hari ini</p>
        </div>
        <div className="min-w-[200px] bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-stone-500 mb-2">Jumlah Transaksi</p>
          <p className="text-xl font-bold text-stone-900 dark:text-white">{stats?.jumlah_transaksi_harian || 0} Transaksi</p>
          <p className="text-[10px] text-stone-500 font-medium mt-1">Hari ini</p>
        </div>
        <div className="min-w-[200px] bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-stone-500 mb-2">Total Bulanan</p>
          <p className="text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(stats?.total_penjualan_bulanan)}</p>
          <p className="text-[10px] text-stone-500 font-medium mt-1">Bulan ini</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'hari_ini', label: 'Hari Ini', icon: Calendar },
          { id: '7_hari', label: '7 Hari', icon: CalendarDays },
          { id: 'bulan_ini', label: 'Bulan Ini', icon: Receipt },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${
              activeFilter === filter.id ? 'border-primary bg-orange-50 dark:bg-orange-500/10 text-primary' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeFilter === filter.id ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-stone-100 dark:bg-stone-700'}`}>
              <filter.icon size={18} />
            </div>
            <span className="text-[11px] font-semibold">{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-1">Tren Penjualan (7 Hari)</h3>
        <p className="text-xs text-stone-500 mb-6">Penjualan (Rp)</p>
        
        <div className="h-40 w-full">
          {stats?.penjualan_harian?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.penjualan_harian}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="tanggal" hide />
                <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip formatter={v => formatCurrency(v)} labelFormatter={v => `Tgl: ${v}`} contentStyle={{ backgroundColor: '#292524', borderColor: '#44403c', color: '#fafaf9', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="natural" dataKey="total" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-stone-400">Belum ada data</div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />
    </div>
  );
}
