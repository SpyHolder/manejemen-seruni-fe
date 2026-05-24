import { useState, useEffect } from 'react';
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
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, Truck, Gift } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIE_COLORS = ['#38bdf8', '#f97316', '#4ade80', '#c084fc', '#818cf8', '#f87171'];
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function AdminDashboard() {
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

  const dummySparklineData1 = [{v: 10},{v: 25},{v: 15},{v: 40},{v: 30},{v: 60},{v: 45}];
  const dummySparklineData2 = [{v: 45},{v: 30},{v: 50},{v: 25},{v: 60},{v: 10},{v: 30}];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Grid: Welcome Card + 4 Stat Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden transition-colors">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Congratulations {user?.nama?.split(' ')[0]} <Gift className="inline text-yellow-500" size={20} />
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">Ringkasan operasional Seruni hari ini.</p>
            <div className="mb-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{formatCurrency(stats?.total_penjualan_bulanan || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">Total penjualan bulan ini</p>
            <button className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              View Details
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <Coffee size={150} />
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Transaksi', val: stats?.jumlah_transaksi_harian || 0, icon: ShoppingCart, color: '#3b82f6', trend: '+14%' },
            { title: 'Total Penjualan', val: formatCurrency(stats?.total_penjualan_harian || 0).replace('Rp', '').trim(), icon: DollarSign, color: '#10b981', trend: '+24%' },
            { title: 'Total Produk', val: stats?.total_produk || 0, icon: Package, color: '#f59e0b', trend: '-5%', down: true },
            { title: 'Gerobak Aktif', val: locations.length, icon: Truck, color: '#f97316', trend: '+2%' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                  <card.icon size={16} />
                </div>
                <span className={`text-xs font-bold ${card.down ? 'text-red-500' : 'text-green-500'} flex items-center gap-1`}>
                  {card.trend} {card.down ? <TrendingDown size={12}/> : <TrendingUp size={12}/>}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.val}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{card.title}</p>
              </div>
              <div className="h-10 mt-3 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={i % 2 === 0 ? dummySparklineData1 : dummySparklineData2}>
                    <defs>
                      <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={card.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={card.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={card.color} strokeWidth={2} fill={`url(#grad${i})`} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Grid: Donut Chart + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart: Produk Terlaris */}
        <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Produk Terlaris</h3>
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
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Penjualan Harian */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Sales Overview</h3>
          <div className="flex-1 min-h-[250px]">
            {charts?.penjualan_harian?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.penjualan_harian} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => v?.slice(8)} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `${(v/1000)}k`} />
                  <Tooltip cursor={{fill: '#f3f4f6', opacity: 0.1}} formatter={v => formatCurrency(v)} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">Belum ada data</div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-l-transparent animate-[spin_3s_linear_infinite]" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-bold mb-1">Monthly</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.jumlah_transaksi_bulanan || 0} Trx</p>
                <p className="text-[10px] text-green-500 font-bold">+16.5%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-b-transparent animate-[spin_4s_linear_infinite]" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-bold mb-1">Harian</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.total_penjualan_harian || 0)}</p>
                <p className="text-[10px] text-green-500 font-bold">+24.9%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Lokasi Gerobak Live</h3>
          <span className="px-3 py-1 bg-green-500/10 text-green-500 dark:text-green-400 text-xs font-semibold rounded-full border border-green-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {locations.length} Aktif
          </span>
        </div>
        <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-0 relative">
          <MapContainer center={[-0.9, 100.35]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {locations.map(loc => (
              <Marker key={loc.user_id} position={[loc.latitude, loc.longitude]} icon={greenIcon}>
                <Popup><p className="font-semibold text-sm">{loc.nama}</p><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{loc.gerobak_nama}</p></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

    </div>
  );
}
