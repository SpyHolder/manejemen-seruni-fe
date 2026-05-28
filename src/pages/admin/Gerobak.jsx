import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit2, Trash2, X, Truck, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const STATUS_COLORS = { aktif: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', nonaktif: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', maintenance: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };

export default function Gerobak() {
  const [gerobak, setGerobak] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama_gerobak: '', kode_gerobak: '', deskripsi: '', status: 'aktif' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    const delay = setTimeout(() => fetchGerobak(), 300);
    return () => clearTimeout(delay);
  }, [page, search, status]);

  const fetchGerobak = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/gerobak', { params: { page, limit: 12, search, status } }); 
      setGerobak(res.data.data); 
      setPagination(res.data.pagination);
    } catch { toast.error('Gagal memuat gerobak'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingItem(null); setForm({ nama_gerobak: '', kode_gerobak: '', deskripsi: '', status: 'aktif' }); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setForm({ nama_gerobak: item.nama_gerobak, kode_gerobak: item.kode_gerobak, deskripsi: item.deskripsi || '', status: item.status }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingItem) { await api.put(`/gerobak/${editingItem.id}`, form); toast.success('Gerobak diperbarui'); }
      else { await api.post('/gerobak', form); toast.success('Gerobak ditambahkan'); }
      setShowModal(false); fetchGerobak();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menonaktifkan gerobak ini?')) return;
    try { await api.delete(`/gerobak/${id}`); toast.success('Gerobak dinonaktifkan'); fetchGerobak(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-stone-900 dark:text-white">Gerobak</h1><p className="text-stone-500 text-sm mt-1">Kelola data gerobak keliling</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20"><Plus size={16} /> Tambah Gerobak</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="Cari gerobak..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={status} onChange={(e) => {setStatus(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="maintenance">Maintenance</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : gerobak.length === 0 ? (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-12 text-center text-stone-400">Tidak ada data gerobak</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gerobak.map((item) => (
              <div key={item.id} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center"><Truck size={20} className="text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-white">{item.nama_gerobak}</h3>
                  <p className="text-xs text-stone-500">{item.kode_gerobak}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[item.status]}`}>{item.status}</span>
            </div>
            {item.deskripsi && <p className="text-sm text-stone-500 mb-4">{item.deskripsi}</p>}
            <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-700">
              <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"><Edit2 size={14} /> Edit</button>
              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Nonaktifkan"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">{editingItem ? 'Edit Gerobak' : 'Tambah Gerobak'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"><X size={18} className="text-stone-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Nama Gerobak</label><input value={form.nama_gerobak} onChange={e => setForm({...form, nama_gerobak: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" placeholder="Gerobak TPL" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Kode Gerobak</label><input value={form.kode_gerobak} onChange={e => setForm({...form, kode_gerobak: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" placeholder="GRB-001" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Deskripsi</label><textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none dark:text-white" placeholder="Area TPL" /></div>
              {editingItem && (
                <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option><option value="maintenance">Maintenance</option></select></div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
