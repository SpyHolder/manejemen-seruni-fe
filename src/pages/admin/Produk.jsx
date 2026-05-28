import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Search, Edit2, Trash2, X, Package, Loader2, Filter, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

export default function Produk() {
  const [produk, setProduk] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [page, setPage] = useState(1);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama_produk: '', kategori: '', harga: '', gambar: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bulk Actions & Checkbox
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  useEffect(() => { 
    const delay = setTimeout(() => fetchProduk(), 300);
    return () => clearTimeout(delay);
  }, [page, search, kategori]);

  const fetchProduk = async () => {
    setLoading(true);
    try {
      const res = await api.get('/produk', { 
        params: { 
          page, limit: 10, search: search || undefined, kategori: kategori || undefined
        } 
      });
      setProduk(res.data.data);
      setPagination(res.data.pagination);
      setSelectedIds([]); // reset selection on page change
    } catch (err) { 
      toast.error('Gagal memuat produk'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openAdd = () => { setEditingItem(null); setForm({ nama_produk: '', kategori: '', harga: '', gambar: null }); setImagePreview(null); setShowModal(true); };
  const openEdit = (item) => { 
    setEditingItem(item); 
    setForm({ nama_produk: item.nama_produk, kategori: item.kategori, harga: item.harga, gambar: null }); 
    setImagePreview(item.gambar ? `http://localhost:5000${item.gambar}` : null); // Note: Assuming proxy doesn't rewrite image URLs perfectly or we can just use the path
    setShowModal(true); 
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, gambar: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nama_produk', form.nama_produk);
      formData.append('kategori', form.kategori);
      formData.append('harga', form.harga);
      if (form.gambar) {
        formData.append('gambar', form.gambar);
      }

      if (editingItem) {
        await api.put(`/produk/${editingItem.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produk berhasil diperbarui');
      } else {
        await api.post('/produk', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produk berhasil ditambahkan');
      }
      setShowModal(false); fetchProduk();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDeleteSingle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Produk',
      message: 'Yakin ingin menghapus/menonaktifkan produk ini?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/produk/${id}`);
          toast.success('Produk dinonaktifkan');
          fetchProduk();
        } catch (err) { toast.error('Gagal menonaktifkan'); }
      }
    });
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.length === produk.length && produk.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(produk.map(p => p.id));
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
      title: 'Nonaktifkan Massal',
      message: `Yakin ingin menonaktifkan ${selectedIds.length} produk yang dipilih?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Menonaktifkan data...');
        try {
          await Promise.all(selectedIds.map(id => api.delete(`/produk/${id}`)));
          toast.success(`${selectedIds.length} Produk berhasil dinonaktifkan`, { id: toastId });
          fetchProduk();
        } catch (err) {
          toast.error('Gagal menonaktifkan beberapa data', { id: toastId });
        }
      }
    });
  };

  const handleBulkActivate = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Aktifkan Massal',
      message: `Yakin ingin mengaktifkan kembali ${selectedIds.length} produk yang dipilih?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Mengaktifkan data...');
        try {
          await Promise.all(selectedIds.map(id => api.put(`/produk/${id}`, { is_active: true })));
          toast.success(`${selectedIds.length} Produk berhasil diaktifkan`, { id: toastId });
          fetchProduk();
        } catch (err) {
          toast.error('Gagal mengaktifkan beberapa data', { id: toastId });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Produk</h1>
          <p className="text-stone-500 text-sm mt-1">Kelola daftar menu minuman</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={kategori} onChange={(e) => {setKategori(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Kategori</option>
            <option value="Kopi">Kopi</option>
            <option value="Non-Kopi">Non-Kopi</option>
            <option value="Minuman Segar">Minuman Segar</option>
          </select>
        </div>
        <button onClick={() => {setSearch(''); setKategori(''); setPage(1);}} className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors">
          Reset
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium text-sm px-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} produk terpilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkActivate} className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
              Aktifkan
            </button>
            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
              <Trash2 size={16} /> Nonaktifkan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3.5 w-12 text-center">
                  <input type="checkbox" checked={selectedIds.length === produk.length && produk.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                </th>
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Produk</th>
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Kategori</th>
                <th className="text-right px-6 py-3.5 font-semibold text-stone-500">Harga</th>
                <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Status</th>
                <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : produk.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400">Tidak ada produk ditemukan</td></tr>
              ) : (
                produk.map((item) => (
                  <tr key={item.id} className={`border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors ${selectedIds.includes(item.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                          {item.gambar ? (
                            <img src={item.gambar.startsWith('http') ? item.gambar : `http://localhost:5000${item.gambar}`} alt={item.nama_produk} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-primary" />
                          )}
                        </div>
                        <span className="font-medium text-stone-900 dark:text-white">{item.nama_produk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">{item.kategori}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-stone-900 dark:text-white">{formatCurrency(item.harga)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${item.is_active ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => handleDeleteSingle(item.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">{editingItem ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"><X size={18} className="text-stone-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Nama Produk</label>
                <input value={form.nama_produk} onChange={e => setForm({...form, nama_produk: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" placeholder="Kopi Aren" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Kategori</label>
                <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white">
                  <option value="">Pilih Kategori</option>
                  <option value="Kopi">Kopi</option>
                  <option value="Non-Kopi">Non-Kopi</option>
                  <option value="Minuman Segar">Minuman Segar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Harga (Rp)</label>
                <input type="number" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} required min="0" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" placeholder="10000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Gambar Produk</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-orange-500/10 dark:file:text-orange-400 dark:hover:file:bg-orange-500/20 transition-colors" />
                    <p className="text-[10px] text-stone-500 mt-1">Format: JPG, PNG, WEBP (Otomatis dikompres & diubah ke WEBP)</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null} {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
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
