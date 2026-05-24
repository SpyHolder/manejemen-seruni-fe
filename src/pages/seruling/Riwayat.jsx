import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { ShoppingCart, ChevronDown, ChevronRight, Package, Calendar } from 'lucide-react';
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

  const totalHari = transaksi.reduce((s, t) => s + t.total_harga, 0);

  return (
    <div className="bg-[#fafaf9] min-h-screen px-4 pt-6 pb-20 animate-fade-in space-y-6">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Riwayat Produk & Transaksi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Lihat histori penjualan Anda hari ini</p>
      </div>

      {/* Filter / Date Picker */}
      <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-800 p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 pl-2">
          <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pilih Tanggal:</span>
        </div>
        <input 
          type="date" 
          value={tanggal} 
          onChange={e => setTanggal(e.target.value)} 
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#111827] border-none text-sm font-semibold focus:ring-0 cursor-pointer" 
        />
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Pendapatan</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{formatCurrency(totalHari)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">Transaksi</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{transaksi.length}</p>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Daftar Transaksi</h2>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : transaksi.length === 0 ? (
          <div className="bg-white dark:bg-[#1f2937] rounded-xl p-8 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium text-sm">Belum ada transaksi di tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaksi.map((trx, i) => (
              <div key={trx.id} className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-[#111827] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.metode_pembayaran === 'cash' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      <ShoppingCart size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.metode_pembayaran.toUpperCase()}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">{formatTime(trx.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(trx.total_harga)}</span>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {expanded === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                </button>
                
                {/* Expanded Details */}
                {expanded === i && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-[#111827]/50">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Item Detail</p>
                    {trx.details?.map((d, j) => (
                      <div key={j} className="flex justify-between items-center py-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-900 dark:text-white">{d.produk?.nama_produk}</span>
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-md">x{d.jumlah}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatCurrency(d.subtotal)}</span>
                      </div>
                    ))}
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
