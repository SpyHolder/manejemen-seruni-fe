import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Loader2, CheckSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function Keuangan() {
  const [ringkasan, setRingkasan] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ kategori: '', deskripsi: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ringkasanRes, entriesRes] = await Promise.all([
        api.get('/keuangan/ringkasan'),
        api.get('/keuangan', { params: { limit: 50 } }),
      ]);
      setRingkasan(ringkasanRes.data.data);
      setEntries(entriesRes.data.data);
      setSelectedIds([]); // reset selection
    } catch { toast.error('Gagal memuat'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/keuangan', { ...form, tipe: 'pengeluaran' });
      toast.success('Pengeluaran ditambahkan');
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setSaving(false); }
  };

  const handleDeleteSingle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pengeluaran',
      message: 'Hapus data pengeluaran ini?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try { 
          await api.delete(`/keuangan/${id}`); 
          toast.success('Dihapus'); 
          fetchData(); 
        } catch { toast.error('Gagal'); }
      }
    });
  };

  const pengeluaran = entries.filter(e => e.tipe === 'pengeluaran');

  const toggleSelectAll = () => {
    if (selectedIds.length === pengeluaran.length && pengeluaran.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pengeluaran.map(e => e.id));
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
      message: `Yakin ingin menghapus ${selectedIds.length} data pengeluaran yang dipilih?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Menghapus data...');
        try {
          await Promise.all(selectedIds.map(id => api.delete(`/keuangan/${id}`)));
          toast.success(`${selectedIds.length} Data berhasil dihapus`, { id: toastId });
          fetchData();
        } catch (err) {
          toast.error('Gagal menghapus beberapa data', { id: toastId });
        }
      }
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-stone-900 dark:text-white">Keuangan</h1><p className="text-stone-500 text-sm mt-1">Profit & pengeluaran bisnis</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20"><Plus size={16} /> Tambah Pengeluaran</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 card-hover">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center"><TrendingUp size={18} className="text-green-500" /></div><span className="text-sm text-stone-500">Pemasukan</span></div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(ringkasan?.total_pemasukan)}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 card-hover">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center"><TrendingDown size={18} className="text-red-500" /></div><span className="text-sm text-stone-500">Pengeluaran</span></div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(ringkasan?.total_pengeluaran)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><DollarSign size={18} /></div><span className="text-sm text-orange-100">Profit Bersih</span></div>
          <p className="text-2xl font-bold">{formatCurrency(ringkasan?.profit)}</p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium text-sm px-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} data terpilih</span>
          </div>
          <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
            <Trash2 size={16} /> Hapus Terpilih
          </button>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700"><h3 className="font-semibold text-stone-900 dark:text-white">Riwayat Pengeluaran</h3></div>
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
            <th className="px-4 py-3 w-12 text-center">
              <input type="checkbox" checked={selectedIds.length === pengeluaran.length && pengeluaran.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
            </th>
            <th className="text-left px-6 py-3 font-semibold text-stone-500">Tanggal</th>
            <th className="text-left px-6 py-3 font-semibold text-stone-500">Kategori</th>
            <th className="text-left px-6 py-3 font-semibold text-stone-500">Deskripsi</th>
            <th className="text-right px-6 py-3 font-semibold text-stone-500">Jumlah</th>
            <th className="text-center px-6 py-3 font-semibold text-stone-500">Aksi</th>
          </tr></thead>
          <tbody>
            {pengeluaran.map(entry => (
              <tr key={entry.id} className={`border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors ${selectedIds.includes(entry.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelect(entry.id)} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                </td>
                <td className="px-6 py-3 text-stone-900 dark:text-white">{entry.tanggal}</td>
                <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-lg text-xs bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 font-medium">{entry.kategori}</span></td>
                <td className="px-6 py-3 text-stone-500">{entry.deskripsi || '-'}</td>
                <td className="px-6 py-3 text-right font-semibold text-red-600">{formatCurrency(entry.jumlah)}</td>
                <td className="px-6 py-3 text-center"><button onClick={() => handleDeleteSingle(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 text-xs transition-colors"><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {pengeluaran.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-stone-400">Belum ada pengeluaran</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-stone-900 dark:text-white">Tambah Pengeluaran</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"><X size={18} className="text-stone-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Kategori</label><select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="">Pilih Kategori</option><option value="Bahan Baku">Bahan Baku</option><option value="Operasional">Operasional</option><option value="Peralatan">Peralatan</option><option value="Transportasi">Transportasi</option><option value="Lainnya">Lainnya</option></select></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Deskripsi</label><input value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" placeholder="Beli biji kopi 5kg" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Jumlah (Rp)</label><input type="number" value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} required min="0" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
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
