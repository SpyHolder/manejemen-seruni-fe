import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit2, Trash2, X, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = { aktif: 'bg-green-50 text-green-600', nonaktif: 'bg-red-50 text-red-600', maintenance: 'bg-amber-50 text-amber-600' };

export default function Gerobak() {
  const [gerobak, setGerobak] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama_gerobak: '', kode_gerobak: '', deskripsi: '', status: 'aktif' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchGerobak(); }, []);

  const fetchGerobak = async () => {
    try { const res = await api.get('/gerobak'); setGerobak(res.data.data); } catch { toast.error('Gagal memuat gerobak'); }
    finally { setLoading(false); }
  };

  const filtered = gerobak.filter(g => g.nama_gerobak.toLowerCase().includes(search.toLowerCase()) || g.kode_gerobak.toLowerCase().includes(search.toLowerCase()));

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
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerobak</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Kelola data gerobak keliling</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all"><Plus size={16} /> Tambah Gerobak</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari gerobak..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center"><Truck size={20} className="text-blue-500" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.nama_gerobak}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{item.kode_gerobak}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>{item.status}</span>
            </div>
            {item.deskripsi && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">{item.deskripsi}</p>}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800/50">
              <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-blue-500 hover:bg-blue-50 transition-colors"><Edit2 size={14} /> Edit</button>
              <button onClick={() => handleDelete(item.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /> Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Gerobak' : 'Tambah Gerobak'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Nama Gerobak</label><input value={form.nama_gerobak} onChange={e => setForm({...form, nama_gerobak: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Gerobak TPL" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Kode Gerobak</label><input value={form.kode_gerobak} onChange={e => setForm({...form, kode_gerobak: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="GRB-001" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Deskripsi</label><textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Area TPL" /></div>
              {editingItem && (
                <div><label className="block text-sm font-medium mb-1.5">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option><option value="maintenance">Maintenance</option></select></div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:bg-[#111827] transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
