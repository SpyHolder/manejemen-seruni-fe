import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { ShoppingCart, ChevronDown, ChevronRight, Package, Calendar, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Riwayat() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchRiwayat(); }, [tanggal]);
  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transaksi', { params: { tanggal, limit: 100 } });
      setTransaksi(res.data.data);
    } catch { toast.error('Gagal memuat'); }
    finally { setLoading(false); }
  };

  const cancelQris = async (id) => {
    try {
      await api.post(`/transaksi/${id}/cancel-qris`);
      toast.success('Transaksi QRIS dibatalkan');
      fetchRiwayat();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gagal membatalkan');
    }
  };

  const totalHari = transaksi.reduce((s, t) => s + t.total_harga, 0);

  return (
    <div className="bg-white dark:bg-stone-900 min-h-screen px-4 pt-6 pb-20 animate-fade-in space-y-6">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Riwayat Transaksi</h1>
        <p className="text-sm text-stone-500">Lihat histori penjualan Anda hari ini</p>
      </div>

      {/* Filter / Date Picker */}
      <div className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2 pl-2">
          <Calendar size={18} className="text-stone-400" />
          <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Pilih Tanggal:</span>
        </div>
        <input 
          type="date" 
          value={tanggal} 
          onChange={e => setTanggal(e.target.value)} 
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-sm font-semibold focus:ring-0 cursor-pointer dark:text-white" 
        />
      </div>

      {/* Summary Card */}
      <div className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Total Pendapatan</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">{formatCurrency(totalHari)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Transaksi</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">{transaksi.length}</p>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-sm font-bold text-stone-900 dark:text-white mb-3">Daftar Transaksi</h2>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : transaksi.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-8 border border-stone-200 dark:border-stone-700 text-center">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium text-sm">Belum ada transaksi di tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaksi.map((trx, i) => (
              <div key={trx.id} className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.metode_pembayaran === 'cash' ? 'bg-green-50 dark:bg-green-500/10 text-green-600' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'}`}>
                      <ShoppingCart size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        {trx.metode_pembayaran.toUpperCase()}
                        {trx.metode_pembayaran === 'qris' && trx.payment_status && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            trx.payment_status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                            trx.payment_status === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                            trx.payment_status === 'cancelled' ? 'bg-stone-200 text-stone-500 dark:bg-stone-600 dark:text-stone-300' :
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400'
                          }`}>
                            {trx.payment_status === 'paid' ? 'LUNAS' : trx.payment_status === 'expired' ? 'EXPIRED' : trx.payment_status === 'cancelled' ? 'BATAL' : 'PENDING'}
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-medium text-stone-500 mt-0.5">{formatTime(trx.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-stone-900 dark:text-white">{formatCurrency(trx.total_harga)}</span>
                    <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center text-stone-500">
                      {expanded === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                </button>
                
                {/* Expanded Details */}
                {expanded === i && (
                  <div className="px-4 pb-4 pt-2 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-2">Item Detail</p>
                    {trx.details?.map((d, j) => (
                      <div key={j} className="flex justify-between items-center py-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-stone-900 dark:text-white">{d.produk?.nama_produk}</span>
                          <span className="text-xs font-bold text-stone-400 bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded-md">x{d.jumlah}</span>
                        </div>
                        <span className="text-sm font-bold text-stone-700 dark:text-stone-200">{formatCurrency(d.subtotal)}</span>
                      </div>
                    ))}
                    {/* Cancel button for pending QRIS */}
                    {trx.metode_pembayaran === 'qris' && trx.payment_status === 'pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); cancelQris(trx.id); }}
                        className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Batalkan Transaksi
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
