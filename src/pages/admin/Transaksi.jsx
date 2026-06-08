import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Eye, Trash2, X, Search, Filter, Calendar, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

export default function Transaksi() {
  const [transaksi, setTransaksi] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  // Filters
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [metodeFilter, setMetodeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

  useEffect(() => {
    api.get('/users', { params: { role: 'seruling', is_active: true, limit: 100 } })
      .then(res => setUsers(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => { 
    const delay = setTimeout(() => fetchTransaksi(), 300);
    return () => clearTimeout(delay);
  }, [tanggal, search, userIdFilter, metodeFilter, page]);

  const fetchTransaksi = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/transaksi', { 
        params: { 
          page, 
          limit: 10, 
          tanggal: tanggal || undefined, 
          search: search || undefined,
          user_id: userIdFilter || undefined,
          metode_pembayaran: metodeFilter || undefined
        } 
      }); 
      setTransaksi(res.data.data); 
      setPagination(res.data.pagination);
      setSelectedIds([]); // reset selection
    } catch { 
      toast.error('Gagal memuat'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteSingle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Yakin ingin menghapus transaksi ini? Data yang dihapus tidak bisa dikembalikan.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try { 
          await api.delete(`/transaksi/${id}`); 
          toast.success('Dihapus'); 
          fetchTransaksi(); 
        } catch (e) { 
          toast.error(e.response?.data?.message || 'Gagal'); 
        }
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transaksi.length && transaksi.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transaksi.map(t => t.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Massal',
      message: `Yakin ingin menghapus ${selectedIds.length} transaksi yang dipilih?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Menghapus data...');
        try {
          await Promise.all(selectedIds.map(id => api.delete(`/transaksi/${id}`)));
          toast.success(`${selectedIds.length} Transaksi berhasil dihapus`, { id: toastId });
          fetchTransaksi();
        } catch (err) {
          toast.error('Gagal menghapus beberapa data', { id: toastId });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-stone-900 dark:text-white">Transaksi</h1><p className="text-stone-500 text-sm mt-1">Data transaksi penjualan</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="Cari kode transaksi..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white" />
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="date" value={tanggal} onChange={e => {setTanggal(e.target.value); setPage(1);}} className="pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={userIdFilter} onChange={(e) => {setUserIdFilter(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Seruling</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={metodeFilter} onChange={(e) => {setMetodeFilter(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Metode</option>
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
          </select>
        </div>
        <button onClick={() => {setSearch(''); setTanggal(''); setUserIdFilter(''); setMetodeFilter(''); setPage(1);}} className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors">
          Reset
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium text-sm px-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} transaksi terpilih</span>
          </div>
          <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
            <Trash2 size={16} /> Hapus Terpilih
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
              <th className="px-4 py-3.5 w-12 text-center">
                <input type="checkbox" checked={selectedIds.length === transaksi.length && transaksi.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
              </th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Kode</th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Seruling</th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Gerobak</th>
              <th className="text-right px-6 py-3.5 font-semibold text-stone-500">Total</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Metode</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Status</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Waktu</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr> :
              transaksi.length === 0 ? <tr><td colSpan={9} className="px-6 py-12 text-center text-stone-400">Tidak ada transaksi</td></tr> :
              transaksi.map(trx => (
                <tr key={trx.id} className={`border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors ${selectedIds.includes(trx.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" checked={selectedIds.includes(trx.id)} onChange={() => toggleSelect(trx.id)} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">{trx.kode_transaksi}</td>
                  <td className="px-6 py-4 text-stone-900 dark:text-white">{trx.user?.nama}</td>
                  <td className="px-6 py-4 text-stone-500">{trx.gerobak?.nama_gerobak}</td>
                  <td className="px-6 py-4 text-right font-semibold text-stone-900 dark:text-white">{formatCurrency(trx.total_harga)}</td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${trx.metode_pembayaran === 'cash' ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>{trx.metode_pembayaran.toUpperCase()}</span></td>
                  <td className="px-6 py-4 text-center">
                    {trx.metode_pembayaran === 'qris' ? (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        trx.payment_status === 'paid' ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                        trx.payment_status === 'expired' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                        trx.payment_status === 'cancelled' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' :
                        'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400'
                      }`}>
                        {trx.payment_status === 'paid' ? 'LUNAS' : trx.payment_status === 'expired' ? 'EXPIRED' : trx.payment_status === 'cancelled' ? 'BATAL' : 'PENDING'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">LUNAS</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-stone-500 text-xs">{formatTime(trx.created_at)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetail(trx)} className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500 transition-colors"><Eye size={15} /></button>
                      <button onClick={() => handleDeleteSingle(trx.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 border border-stone-200 dark:border-stone-700 animate-slide-up shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100 dark:border-stone-700">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Detail Transaksi</h3>
                <p className="text-xs font-mono text-primary mt-1">{detail.kode_transaksi}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-stone-50 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700/50 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-stone-500">Seruling</span><span className="font-medium text-stone-900 dark:text-white">{detail.user?.nama}</span></div>
                <div className="flex justify-between text-sm"><span className="text-stone-500">Gerobak</span><span className="font-medium text-stone-900 dark:text-white">{detail.gerobak?.nama_gerobak}</span></div>
                <div className="flex justify-between text-sm"><span className="text-stone-500">Waktu</span><span className="font-medium text-stone-900 dark:text-white">{new Date(detail.created_at).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-stone-500">Metode</span><span className="font-medium uppercase text-stone-900 dark:text-white">{detail.metode_pembayaran}</span></div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-3">Pesanan</h4>
                <div className="space-y-3">
                  {detail.details?.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs font-medium">{item.jumlah}x</div>
                        <span className="font-medium text-stone-800 dark:text-stone-200">{item.produk?.nama_produk}</span>
                      </div>
                      <span className="font-medium text-stone-900 dark:text-white">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100 dark:border-stone-700 flex justify-between items-center">
              <span className="font-bold text-stone-900 dark:text-white">Total Akhir</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(detail.total_harga)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />
    </div>
  );
}
