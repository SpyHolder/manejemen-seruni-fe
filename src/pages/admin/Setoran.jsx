import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP = { belum_setor: { label: 'Belum Setor', color: 'bg-amber-50 text-amber-600', icon: Clock }, sudah_setor: { label: 'Sudah Setor', color: 'bg-blue-50 text-blue-600', icon: AlertCircle }, terverifikasi: { label: 'Terverifikasi', color: 'bg-green-50 text-green-600', icon: CheckCircle } };

export default function Setoran() {
  const [setoran, setSetoran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { fetchSetoran(); }, [tanggal]);
  const fetchSetoran = async () => {
    setLoading(true);
    try { const res = await api.get('/setoran', { params: { tanggal } }); setSetoran(res.data.data); } catch { toast.error('Gagal memuat'); } finally { setLoading(false); }
  };

  const handleVerify = async (id) => {
    try { await api.put(`/setoran/${id}/verify`); toast.success('Setoran terverifikasi ✅'); fetchSetoran(); } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Setoran</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Verifikasi setoran harian seruling</p></div>
        <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
      setoran.length === 0 ? (
        <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center"><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Belum ada setoran untuk tanggal ini</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setoran.map(s => {
            const st = STATUS_MAP[s.status];
            return (
              <div key={s.id} className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{s.user?.nama?.charAt(0)}</div>
                    <div><p className="font-semibold">{s.user?.nama}</p><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{s.gerobak?.nama_gerobak} • {s.shiftAssignment?.shift}</p></div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#111827]"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Total</p><p className="font-bold text-sm">{formatCurrency(s.total_penjualan)}</p></div>
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#111827]"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Cash</p><p className="font-bold text-sm text-green-600">{formatCurrency(s.total_cash)}</p></div>
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#111827]"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">QRIS</p><p className="font-bold text-sm text-blue-600">{formatCurrency(s.total_qris)}</p></div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800/50">
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Yang disetor (Cash)</p><p className="font-bold text-primary">{formatCurrency(s.jumlah_setor)}</p></div>
                  {s.status === 'sudah_setor' && (
                    <button onClick={() => handleVerify(s.id)} className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"><CheckCircle size={14} /> Verifikasi</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
