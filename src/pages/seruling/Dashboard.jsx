import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Power, MapPin, Calendar, CalendarDays, Receipt } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import toast from 'react-hot-toast';

// Dummy data for the chart to match the reference image visually
const dummyChartData = [
  { value: 400 }, { value: 300 }, { value: 200 }, { value: 278 }, 
  { value: 189 }, { value: 239 }, { value: 349 }, { value: 200 }
];

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

  const handleToggleOnline = async () => {
    if (!shift) { toast.error('Tidak ada jadwal shift hari ini'); return; }
    try {
      if (!isOnline) {
        if (!navigator.geolocation) { toast.error('Browser tidak mendukung Geolocation'); return; }
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') { toast.error('Izin lokasi ditolak'); return; }
        const res = await api.put(`/shift/${shift.id}/online`);
        setShift(res.data.data); setIsOnline(true);
        startLocationTracking(res.data.data);
        toast.success('Online!');
      } else {
        if (watchId) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
        if (socket) socket.emit('location:offline', { user_id: user.id });
        const res = await api.put(`/shift/${shift.id}/offline`);
        setShift({ ...shift, ...res.data.data }); setIsOnline(false);
        toast.success(`Offline. Durasi: ${res.data.data.durasi_menit} menit`);
      }
    } catch (error) { toast.error('Gagal mengubah status'); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-[#1f2937] min-h-screen px-4 pt-6 pb-6 animate-fade-in space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Penjualan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">Halo, {user?.nama} 👋</p>
      </div>

      {/* Online Toggle Card */}
      <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${isOnline ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 dark:bg-[#111827] border-gray-200 dark:border-gray-800'}`}>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{isOnline ? 'Anda sedang Online' : 'Anda sedang Offline'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
            {isOnline ? `Durasi: ${Math.floor(onlineDuration / 60)}j ${onlineDuration % 60}m` : shift ? 'Mulai shift Anda sekarang' : 'Tidak ada jadwal hari ini'}
          </p>
        </div>
        <button
          onClick={handleToggleOnline}
          disabled={!shift || shift.status === 'selesai'}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
            isOnline ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
            : shift && shift.status !== 'selesai' ? 'bg-gray-900 text-white shadow-lg' 
            : 'bg-gray-200 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <Power size={20} />
        </button>
      </div>

      {/* Shift Details (if any) */}
      {shift && (
        <div className="flex items-center gap-3 px-1">
          <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{shift.gerobak?.nama_gerobak} - Shift {shift.shift}</span>
        </div>
      )}

      {/* Horizontal Scroll Stats */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="min-w-[200px] bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">Total Penjualan</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.total_penjualan_harian)}</p>
          <p className="text-[10px] text-green-600 font-medium mt-1">+ Hari ini</p>
        </div>
        <div className="min-w-[200px] bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">Jumlah Transaksi</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.jumlah_transaksi_harian || 0} Transaksi</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium mt-1">Hari ini</p>
        </div>
        <div className="min-w-[200px] bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 snap-start shrink-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">Total Bulanan</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.total_penjualan_bulanan)}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium mt-1">Bulan ini</p>
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
            className={`flex flex-col items-center justify-center py-4 rounded-lg border transition-colors ${
              activeFilter === filter.id ? 'border-gray-900 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 dark:text-gray-500'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeFilter === filter.id ? 'bg-gray-200' : 'bg-gray-100'}`}>
              <filter.icon size={18} />
            </div>
            <span className="text-[11px] font-medium">{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Tren Total Penjualan</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">Penjualan (Rp)</p>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dummyChartData}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
              <Area type="natural" dataKey="value" stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">Tanggal</span>
        </div>
      </div>

    </div>
  );
}
