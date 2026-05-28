import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, Truck, Coffee } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIE_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'];
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('location:request-all');
    socket.on('location:all', (data) => setLocations(data));
    socket.on('location:broadcast', (data) => {
      setLocations(prev => [...prev.filter(l => l.user_id !== data.user_id), data]);
    });
    socket.on('location:offline', (data) => {
      setLocations(prev => prev.filter(l => l.user_id !== data.user_id));
    });
    return () => { socket.off('location:all'); socket.off('location:broadcast'); socket.off('location:offline'); };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [s, c] = await Promise.all([api.get('/dashboard/admin/stats'), api.get('/dashboard/admin/charts')]);
      setStats(s.data.data); setCharts(c.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Grid: Welcome Card + 4 Stat Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden text-white shadow-lg shadow-orange-500/20">
          <div className="relative z-10">
            <p className="text-orange-100 text-sm font-medium mb-1">Selamat datang kembali 👋</p>
            <h2 className="text-2xl font-bold mb-4">
              {user?.nama?.split(' ')[0]}
            </h2>
            <div className="mb-1 flex items-center gap-3">
              <span className="text-3xl font-black">{formatCurrency(stats?.total_penjualan_bulanan || 0)}</span>
            </div>
            <p className="text-orange-100 text-xs mb-5">Total penjualan bulan ini</p>
            <button onClick={() => navigate('/admin/transaksi')} className="px-5 py-2 bg-white text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm">
              Lihat Detail
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4">
            <Coffee size={150} />
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        {/* 4 Stat Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Transaksi', val: stats?.jumlah_transaksi_harian || 0, icon: ShoppingCart, color: '#f97316', trend: '+14%' },
            { title: 'Total Penjualan', val: formatCurrency(stats?.total_penjualan_harian || 0).replace('Rp', '').trim(), icon: DollarSign, color: '#22c55e', trend: '+24%' },
            { title: 'Total Produk', val: stats?.total_produk || 0, icon: Package, color: '#f59e0b', trend: '', down: true },
            { title: 'Gerobak Aktif', val: locations.length, icon: Truck, color: '#ea580c', trend: '' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 flex flex-col justify-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                <card.icon size={24} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-stone-900 dark:text-white">{card.val}</h3>
                <p className="text-sm font-medium text-stone-500 mt-1">{card.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Grid: Donut Chart + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart: Produk Terlaris */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 flex flex-col">
          <h3 className="text-base font-bold text-stone-900 dark:text-white mb-6">Produk Terlaris</h3>
          <div className="flex-1 min-h-[250px] relative">
            {charts?.produk_terlaris?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.produk_terlaris.slice(0, 4).map(p => ({
                      name: p.produk?.nama_produk || 'Unknown',
                      value: parseInt(p.dataValues?.total_terjual || p.total_terjual || 0)
                    }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" dataKey="value"
                    paddingAngle={5}
                  >
                    {charts.produk_terlaris.slice(0, 4).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#292524', borderColor: '#44403c', color: '#fafaf9', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fafaf9' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Penjualan Harian */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 flex flex-col">
          <h3 className="text-base font-bold text-stone-900 dark:text-white mb-6">Ringkasan Penjualan</h3>
          <div className="flex-1 min-h-[250px]">
            {charts?.penjualan_harian?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.penjualan_harian} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#44403c" strokeOpacity={0.15} />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716c' }} tickFormatter={v => v?.slice(8)} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716c' }} tickFormatter={v => `${(v/1000)}k`} />
                  <Tooltip cursor={{fill: '#f5f5f4', opacity: 0.5}} formatter={v => formatCurrency(v)} contentStyle={{ backgroundColor: '#292524', borderColor: '#44403c', color: '#fafaf9', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-stone-400">Belum ada data</div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-stone-100 dark:border-stone-700 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-l-transparent animate-[spin_3s_linear_infinite]" />
              <div>
                <p className="text-xs text-stone-500 font-semibold mb-1">Bulanan</p>
                <p className="text-xl font-bold text-stone-900 dark:text-white">{stats?.jumlah_transaksi_bulanan || 0} Trx</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-b-transparent animate-[spin_4s_linear_infinite]" />
              <div>
                <p className="text-xs text-stone-500 font-semibold mb-1">Harian</p>
                <p className="text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(stats?.total_penjualan_harian || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-stone-900 dark:text-white">Lokasi Gerobak Live</h3>
          <span className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {locations.length} Aktif
          </span>
        </div>
        <div className="h-[300px] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 z-0 relative">
          <MapContainer center={[0.9167, 104.4500]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {locations.map(loc => (
              <Marker key={loc.user_id} position={[loc.latitude, loc.longitude]} icon={greenIcon}>
                <Popup><p className="font-semibold text-sm">{loc.nama}</p><p className="text-xs text-stone-500">{loc.gerobak_nama}</p></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

    </div>
  );
}
