import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Calendar, X, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = { dijadwalkan: 'bg-blue-50 text-blue-600', online: 'bg-green-50 text-green-600', offline: 'bg-gray-100 text-gray-600 dark:text-gray-300', selesai: 'bg-purple-50 text-purple-600' };

export default function JadwalShift() {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [gerobak, setGerobak] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ gerobak_id: '', user_pagi: '', user_siang: '', tanggal: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [tanggal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftRes, usersRes, gerobakRes] = await Promise.all([
        api.get('/shift', { params: { tanggal } }),
        api.get('/users', { params: { role: 'seruling', is_active: true, limit: 100 } }),
        api.get('/gerobak', { params: { status: 'aktif' } }),
      ]);
      setShifts(shiftRes.data.data);
      setUsers(usersRes.data.data);
      setGerobak(gerobakRes.data.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  // Group shifts by gerobak
  const grouped = {};
  shifts.forEach(s => {
    if (!grouped[s.gerobak_id]) grouped[s.gerobak_id] = { gerobak: s.gerobak, pagi: null, siang: null };
    grouped[s.gerobak_id][s.shift] = s;
  });

  const openAdd = () => { setForm({ gerobak_id: '', user_pagi: '', user_siang: '', tanggal }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/shift', form);
      toast.success('Jadwal shift berhasil dibuat');
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    try { await api.delete(`/shift/${id}`); toast.success('Jadwal dihapus'); fetchData(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal Shift</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Atur jadwal karyawan & gerobak harian</p></div>
        <div className="flex items-center gap-3">
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all"><Plus size={16} /> Buat Jadwal</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-500 dark:text-gray-400 dark:text-gray-500/30 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Belum ada jadwal untuk tanggal ini</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 text-primary text-sm font-medium hover:underline">+ Buat Jadwal Baru</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(grouped).map((group, i) => (
            <div key={i} className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-800/50">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Calendar size={18} className="text-blue-500" /></div>
                <div><h3 className="font-semibold">{group.gerobak?.nama_gerobak}</h3><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{group.gerobak?.kode_gerobak}</p></div>
              </div>
              {['pagi', 'siang'].map(shift => (
                <div key={shift} className={`flex items-center justify-between py-3 ${shift === 'pagi' ? 'border-b border-gray-200 dark:border-gray-800/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{shift === 'pagi' ? '🌅' : '🌇'}</span>
                    <div>
                      <p className="text-sm font-medium capitalize">Shift {shift}</p>
                      {group[shift] ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{group[shift].user?.nama}</p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500/50 italic">Belum ada</p>
                      )}
                    </div>
                  </div>
                  {group[shift] && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[group[shift].status]}`}>{group[shift].status}</span>
                      {group[shift].status === 'dijadwalkan' && (
                        <button onClick={() => handleDelete(group[shift].id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 text-xs">✕</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#1f2937] rounded-lg w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold">Buat Jadwal Shift</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-50 dark:bg-[#111827]"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Gerobak</label><select value={form.gerobak_id} onChange={e => setForm({...form, gerobak_id: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Pilih Gerobak</option>{gerobak.map(g => <option key={g.id} value={g.id}>{g.nama_gerobak} ({g.kode_gerobak})</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1.5">🌅 Karyawan Shift Pagi</label><select value={form.user_pagi} onChange={e => setForm({...form, user_pagi: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Pilih Karyawan (opsional)</option>{users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1.5">🌇 Karyawan Shift Siang</label><select value={form.user_siang} onChange={e => setForm({...form, user_siang: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Pilih Karyawan (opsional)</option>{users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select></div>
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
