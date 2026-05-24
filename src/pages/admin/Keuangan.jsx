import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Keuangan() {
  const [ringkasan, setRingkasan] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ringkasan');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ kategori: '', deskripsi: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [ringkasanRes, entriesRes] = await Promise.all([
        api.get('/keuangan/ringkasan'),
        api.get('/keuangan', { params: { limit: 50 } }),
      ]);
      setRingkasan(ringkasanRes.data.data);
      setEntries(entriesRes.data.data);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data ini?')) return;
    try { await api.delete(`/keuangan/${id}`); toast.success('Dihapus'); fetchData(); } catch { toast.error('Gagal'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keuangan</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Profit & pengeluaran bisnis</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all"><Plus size={16} /> Tambah Pengeluaran</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp size={18} className="text-green-500" /></div><span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Pemasukan</span></div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(ringkasan?.total_pemasukan)}</p>
        </div>
        <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown size={18} className="text-red-500" /></div><span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Pengeluaran</span></div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(ringkasan?.total_pengeluaran)}</p>
        </div>
        <div className="bg-primary rounded-lg p-5 text-white">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1f2937]/20 flex items-center justify-center"><DollarSign size={18} /></div><span className="text-sm text-white/70">Profit Bersih</span></div>
          <p className="text-2xl font-bold">{formatCurrency(ringkasan?.profit)}</p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"><h3 className="font-semibold">Riwayat Pengeluaran</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
            <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Tanggal</th>
            <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Kategori</th>
            <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Deskripsi</th>
            <th className="text-right px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Jumlah</th>
            <th className="text-center px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Aksi</th>
          </tr></thead>
          <tbody>
            {entries.filter(e => e.tipe === 'pengeluaran').map(entry => (
              <tr key={entry.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:bg-[#111827]/50">
                <td className="px-6 py-3">{entry.tanggal}</td>
                <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-600">{entry.kategori}</span></td>
                <td className="px-6 py-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">{entry.deskripsi || '-'}</td>
                <td className="px-6 py-3 text-right font-semibold text-red-600">{formatCurrency(entry.jumlah)}</td>
                <td className="px-6 py-3 text-center"><button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 text-xs">✕</button></td>
              </tr>
            ))}
            {entries.filter(e => e.tipe === 'pengeluaran').length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Belum ada pengeluaran</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold">Tambah Pengeluaran</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Kategori</label><select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Pilih Kategori</option><option value="Bahan Baku">Bahan Baku</option><option value="Operasional">Operasional</option><option value="Peralatan">Peralatan</option><option value="Transportasi">Transportasi</option><option value="Lainnya">Lainnya</option></select></div>
              <div><label className="block text-sm font-medium mb-1.5">Deskripsi</label><input value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Beli biji kopi 5kg" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Jumlah (Rp)</label><input type="number" value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} required min="0" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:bg-[#111827]">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
