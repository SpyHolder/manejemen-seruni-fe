import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit2, Trash2, X, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Karyawan() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', phone: '', role: 'seruling' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => {
    try { const res = await api.get('/users', { params: { limit: 100 } }); setUsers(res.data.data); } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  };
  const filtered = users.filter(u => u.nama.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const openAdd = () => { setEditingItem(null); setForm({ nama: '', email: '', password: '', phone: '', role: 'seruling' }); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setForm({ nama: item.nama, email: item.email, password: '', phone: item.phone || '', role: item.role }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form };
      if (editingItem && !data.password) delete data.password;
      if (editingItem) { await api.put(`/users/${editingItem.id}`, data); toast.success('User diperbarui'); }
      else { await api.post('/users', data); toast.success('User ditambahkan'); }
      setShowModal(false); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin menonaktifkan user ini?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User dinonaktifkan'); fetchUsers(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Karyawan</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Kelola data karyawan seruling</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all"><Plus size={16} /> Tambah Karyawan</button>
      </div>
      <div className="relative max-w-md"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari karyawan..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>

      <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Nama</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Email</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Telepon</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Role</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Status</th>
            <th className="text-center px-6 py-3.5 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:bg-[#111827]/50 transition-colors">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{user.nama.charAt(0)}</div><span className="font-medium">{user.nama}</span></div></td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500">{user.email}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500">{user.phone || '-'}</td>
                <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{user.role}</span></td>
                <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{user.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 size={15} /></button><button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold">{editingItem ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Nama</label><input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Password {editingItem && '(kosongkan jika tidak diubah)'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editingItem && { required: true })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Telepon</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Role</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="seruling">Seruling</option><option value="admin">Admin</option></select></div>
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
