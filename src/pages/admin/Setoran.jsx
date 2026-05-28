import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { CheckCircle, Clock, AlertCircle, Calendar, Filter, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const STATUS_MAP = { 
  belum_setor: { label: 'Belum Setor', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', icon: Clock }, 
  sudah_setor: { label: 'Sudah Setor', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: AlertCircle }, 
  terverifikasi: { label: 'Terverifikasi', color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', icon: CheckCircle } 
};

export default function Setoran() {
  const [setoran, setSetoran] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal
  const [detail, setDetail] = useState(null);
  const [detailTransactions, setDetailTransactions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Filters
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [page, setPage] = useState(1);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'primary', onConfirm: null });

  useEffect(() => {
    api.get('/users', { params: { role: 'seruling', is_active: true, limit: 100 } })
      .then(res => setUsers(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => { 
    fetchSetoran(); 
  }, [tanggal, status, userIdFilter, page]);

  const fetchSetoran = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/setoran', { 
        params: { 
          page, 
          limit: 12, 
          tanggal: tanggal || undefined, 
          status: status || undefined, 
          user_id: userIdFilter || undefined 
        } 
      }); 
      setSetoran(res.data.data); 
      setPagination(res.data.pagination);
      setSelectedIds([]); // reset selection
    } catch { 
      toast.error('Gagal memuat'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerifySingle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Verifikasi Setoran',
      message: 'Apakah Anda yakin setoran fisik uang sudah sesuai?',
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try { 
          await api.put(`/setoran/${id}/verify`, {}); 
          toast.success('Setoran terverifikasi ✅'); 
          fetchSetoran(); 
        } catch (e) { 
          toast.error(e.response?.data?.message || 'Gagal'); 
        }
      }
    });
  };

  const openDetail = async (setoran) => {
    setDetail(setoran);
    setLoadingDetail(true);
    setDetailTransactions([]);
    try {
      const res = await api.get('/transaksi', {
        params: {
          shift_assignment_id: setoran.shift_assignment_id,
          limit: 100
        }
      });
      setDetailTransactions(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat detail transaksi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleSelectAll = () => {
    // Only select those that can be verified (sudah_setor)
    const verifiable = setoran.filter(s => s.status === 'sudah_setor');
    if (selectedIds.length === verifiable.length && verifiable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(verifiable.map(s => s.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkVerify = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Verifikasi Massal',
      message: `Yakin ingin memverifikasi ${selectedIds.length} setoran yang dipilih?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Memverifikasi setoran...');
        try {
          await Promise.all(selectedIds.map(id => api.put(`/setoran/${id}/verify`, {})));
          toast.success(`${selectedIds.length} Setoran berhasil diverifikasi`, { id: toastId });
          fetchSetoran();
        } catch (err) {
          toast.error('Gagal memverifikasi beberapa setoran', { id: toastId });
        }
      }
    });
  };

  const verifiableCount = setoran.filter(s => s.status === 'sudah_setor').length;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-stone-900 dark:text-white">Setoran</h1><p className="text-stone-500 text-sm mt-1">Verifikasi setoran harian seruling</p></div>
      </div>

      {/* Filters & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="date" value={tanggal} onChange={e => {setTanggal(e.target.value); setPage(1);}} className="pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <select value={status} onChange={(e) => {setStatus(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
              <option value="">Semua Status</option>
              <option value="belum_setor">Belum Setor</option>
              <option value="sudah_setor">Sudah Setor</option>
              <option value="terverifikasi">Terverifikasi</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <select value={userIdFilter} onChange={(e) => {setUserIdFilter(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
              <option value="">Semua Seruling</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
            </select>
          </div>
          <button onClick={() => {setTanggal(''); setStatus(''); setUserIdFilter(''); setPage(1);}} className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors">
            Reset
          </button>
        </div>
        
        {/* Select All Checkbox */}
        {verifiableCount > 0 && (
          <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer">
            <input 
              type="checkbox" 
              checked={selectedIds.length === verifiableCount && verifiableCount > 0} 
              onChange={toggleSelectAll} 
              className="w-4 h-4 rounded border-stone-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Pilih Semua ({verifiableCount})</span>
          </label>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-primary font-medium text-sm px-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} setoran terpilih</span>
          </div>
          <button onClick={handleBulkVerify} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
            <CheckCircle size={16} /> Verifikasi Terpilih
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : setoran.length === 0 ? (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-12 text-center"><p className="text-stone-400">Tidak ada setoran yang sesuai filter</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setoran.map(s => {
              const st = STATUS_MAP[s.status];
              const isVerifiable = s.status === 'sudah_setor';
              const isSelected = selectedIds.includes(s.id);
              
              return (
                <div key={s.id} className={`bg-white dark:bg-stone-800 rounded-xl border ${isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-stone-200 dark:border-stone-700'} p-5 card-hover relative`}>
                  {/* Card Checkbox */}
                  {isVerifiable && (
                    <div className="absolute top-4 right-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleSelect(s.id)} 
                        className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer shadow-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">{s.user?.nama?.charAt(0)}</div>
                      <div className={isVerifiable ? 'pr-8' : ''}>
                        <p className="font-semibold text-stone-900 dark:text-white">{s.user?.nama}</p>
                        <p className="text-xs text-stone-500">{s.gerobak?.nama_gerobak} • {s.shiftAssignment?.shift}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${st.color}`}>{st.label}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900"><p className="text-xs text-stone-500">Total</p><p className="font-bold text-sm text-stone-900 dark:text-white">{formatCurrency(s.total_penjualan)}</p></div>
                    <div className="text-center p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900"><p className="text-xs text-stone-500">Cash</p><p className="font-bold text-sm text-green-600">{formatCurrency(s.total_cash)}</p></div>
                    <div className="text-center p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900"><p className="text-xs text-stone-500">QRIS</p><p className="font-bold text-sm text-blue-600">{formatCurrency(s.total_qris)}</p></div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-700">
                    <div><p className="text-xs text-stone-500">Yang disetor (Cash)</p><p className="font-bold text-primary">{formatCurrency(s.jumlah_setor)}</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetail(s)} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center shadow-sm">
                        Detail
                      </button>
                      {isVerifiable && (
                        <button onClick={() => handleVerifySingle(s.id)} className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5 shadow-sm">
                          <CheckCircle size={14} /> Verifikasi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
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

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-2xl p-6 border border-stone-200 dark:border-stone-700 animate-slide-up shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100 dark:border-stone-700">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Rincian Transaksi Setoran</h3>
                <p className="text-xs font-medium text-stone-500 mt-1">{detail.user?.nama} • {detail.gerobak?.nama_gerobak}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-400 transition-colors"><CheckSquare size={20} className="hidden" /><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {loadingDetail ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : detailTransactions.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">Tidak ada transaksi yang tercatat pada shift ini.</div>
              ) : (
                <div className="space-y-3">
                  {detailTransactions.map((trx, idx) => (
                    <div key={trx.id} className="p-4 rounded-xl border border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-primary">{trx.kode_transaksi}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${trx.metode_pembayaran === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>{trx.metode_pembayaran}</span>
                      </div>
                      <div className="space-y-2 mt-3 pl-2 border-l-2 border-stone-200 dark:border-stone-700">
                        {trx.details?.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-stone-700 dark:text-stone-300">{item.jumlah}x {item.produk?.nama_produk}</span>
                            <span className="font-medium text-stone-900 dark:text-white">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end items-center mt-3 pt-2 border-t border-stone-200 dark:border-stone-700">
                        <span className="text-sm font-bold text-stone-900 dark:text-white">{formatCurrency(trx.total_harga)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
