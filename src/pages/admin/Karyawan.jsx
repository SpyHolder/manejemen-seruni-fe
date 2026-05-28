import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit2, Trash2, X, Loader2, Filter, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

export default function Karyawan() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', phone: '', role: 'seruling' });
  const [saving, setSaving] = useState(false);

  // Bulk Actions & Checkbox
  const [selectedIds, setSelectedIds] = useState([]);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  useEffect(() => { 
    const delay = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(delay);
  }, [page, search, role]);

  const fetchUsers = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/users', { params: { page, limit: 10, search, role } }); 
      setUsers(res.data.data); 
      setPagination(res.data.pagination);
      setSelectedIds([]); // reset selection
    } catch { toast.error('Gagal memuat data'); } 
    finally { setLoading(false); }
  };

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

  const handleDeleteSingle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Nonaktifkan Karyawan',
      message: 'Yakin ingin menonaktifkan user ini? Jadwal masa depan karyawan ini akan otomatis dibersihkan.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/users/${id}`);
          toast.success('User dinonaktifkan');
          fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
      }
    });
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
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
      message: `Yakin ingin menonaktifkan ${selectedIds.length} karyawan yang dipilih?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Menonaktifkan karyawan...');
        try {
          await Promise.all(selectedIds.map(id => api.delete(`/users/${id}`)));
          toast.success(`${selectedIds.length} Karyawan berhasil dinonaktifkan`, { id: toastId });
          fetchUsers();
        } catch (err) {
          toast.error('Gagal menonaktifkan beberapa karyawan', { id: toastId });
        }
      }
    });
  };

  const handleBulkActivate = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Aktifkan Massal',
      message: `Yakin ingin mengaktifkan kembali ${selectedIds.length} karyawan yang dipilih?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        const toastId = toast.loading('Mengaktifkan karyawan...');
        try {
          await Promise.all(selectedIds.map(id => api.put(`/users/${id}`, { is_active: true })));
          toast.success(`${selectedIds.length} Karyawan berhasil diaktifkan`, { id: toastId });
          fetchUsers();
        } catch (err) {
          toast.error('Gagal mengaktifkan beberapa karyawan', { id: toastId });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-stone-900 dark:text-white">Karyawan</h1><p className="text-stone-500 text-sm mt-1">Kelola data karyawan seruling</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20"><Plus size={16} /> Tambah Karyawan</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="Cari karyawan..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={role} onChange={(e) => {setRole(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="seruling">Seruling</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium text-sm px-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} karyawan terpilih</span>
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

      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead><tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
              <th className="px-4 py-3.5 w-12 text-center">
                <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
              </th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Nama</th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Email</th>
              <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Telepon</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Role</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Status</th>
              <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr> : 
              users.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-stone-400">Tidak ada data karyawan</td></tr> :
              users.map((user) => (
                <tr key={user.id} className={`border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors ${selectedIds.includes(user.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">{user.nama.charAt(0)}</div><span className="font-medium text-stone-900 dark:text-white">{user.nama}</span></div></td>
                  <td className="px-6 py-4 text-stone-500">{user.email}</td>
                  <td className="px-6 py-4 text-stone-500">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${user.role === 'admin' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300'}`}>{user.role}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>{user.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500 transition-colors"><Edit2 size={15} /></button><button onClick={() => handleDeleteSingle(user.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={15} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-stone-900 dark:text-white">{editingItem ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"><X size={18} className="text-stone-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Nama</label><input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Password {editingItem && '(kosongkan jika tidak diubah)'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editingItem && { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Telepon</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Role</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="seruling">Seruling</option><option value="admin">Admin</option></select></div>
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
