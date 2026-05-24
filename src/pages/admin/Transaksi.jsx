import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { Search, Eye, Trash2, X, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transaksi() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [detail, setDetail] = useState(null);

  useEffect(() => { fetchTransaksi(); }, [tanggal]);
  const fetchTransaksi = async () => {
    setLoading(true);
    try { const res = await api.get('/transaksi', { params: { tanggal, limit: 100 } }); setTransaksi(res.data.data); } catch { toast.error('Gagal memuat'); } finally { setLoading(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    try { await api.delete(`/transaksi/${id}`); toast.success('Dihapus'); fetchTransaksi(); } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Data transaksi penjualan</p></div>
        <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Kode</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Seruling</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Gerobak</th>
            <th className="text-right px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Total</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Metode</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Waktu</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr> :
            transaksi.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Tidak ada transaksi</td></tr> :
            transaksi.map(trx => (
              <tr key={trx.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:bg-[#111827]/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-primary">{trx.kode_transaksi}</td>
                <td className="px-6 py-4">{trx.user?.nama}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500">{trx.gerobak?.nama_gerobak}</td>
                <td className="px-6 py-4 text-right font-semibold">{formatCurrency(trx.total_harga)}</td>
                <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${trx.metode_pembayaran === 'cash' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{trx.metode_pembayaran.toUpperCase()}</span></td>
                <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs">{formatTime(trx.created_at)}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setDetail(trx)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><Eye size={15} /></button>
                    <button onClick={() => handleDelete(trx.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Detail Transaksi</h3><button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button></div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Kode</span><span className="font-mono text-primary">{detail.kode_transaksi}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Seruling</span><span>{detail.user?.nama}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Gerobak</span><span>{detail.gerobak?.nama_gerobak}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Metode</span><span className="uppercase">{detail.metode_pembayaran}</span></div>
              <hr className="border-gray-200 dark:border-gray-800" />
              <p className="font-semibold">Items:</p>
              {detail.details?.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span>{d.produk?.nama_produk} <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">x{d.jumlah}</span></span>
                  <span className="font-medium">{formatCurrency(d.subtotal)}</span>
                </div>
              ))}
              <hr className="border-gray-200 dark:border-gray-800" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{formatCurrency(detail.total_harga)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
