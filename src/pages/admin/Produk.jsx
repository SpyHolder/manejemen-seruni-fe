import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Search, Edit2, Trash2, X, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Produk() {
  const [produk, setProduk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama_produk: '', kategori: '', harga: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProduk(); }, []);

  const fetchProduk = async () => {
    try {
      const res = await api.get('/produk', { params: { limit: 100 } });
      setProduk(res.data.data);
    } catch (err) { toast.error('Gagal memuat produk'); }
    finally { setLoading(false); }
  };

  const filtered = produk.filter(p =>
    p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
    p.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingItem(null); setForm({ nama_produk: '', kategori: '', harga: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setForm({ nama_produk: item.nama_produk, kategori: item.kategori, harga: item.harga }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/produk/${editingItem.id}`, form);
        toast.success('Produk berhasil diperbarui');
      } else {
        await api.post('/produk', form);
        toast.success('Produk berhasil ditambahkan');
      }
      setShowModal(false);
      fetchProduk();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await api.delete(`/produk/${id}`);
      toast.success('Produk berhasil dihapus');
      fetchProduk();
    } catch (err) { toast.error('Gagal menghapus'); }
  };

  const categories = [...new Set(produk.map(p => p.kategori))];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produk</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Kelola daftar menu minuman</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Produk</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Kategori</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Harga</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Status</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:bg-[#111827]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package size={16} className="text-primary" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{item.nama_produk}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{item.kategori}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.harga)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Tidak ada produk ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Produk</label>
                <input value={form.nama_produk} onChange={e => setForm({...form, nama_produk: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Kopi Aren" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Pilih Kategori</option>
                  <option value="Kopi">Kopi</option>
                  <option value="Non-Kopi">Non-Kopi</option>
                  <option value="Minuman Segar">Minuman Segar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Harga (Rp)</label>
                <input type="number" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} required min="0" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="10000" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:bg-[#111827] transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null} {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
