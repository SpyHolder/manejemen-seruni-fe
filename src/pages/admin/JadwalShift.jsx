import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Calendar as CalendarIcon, X, Loader2, Filter, Search, Trash2, ChevronLeft, ChevronRight, LayoutList, CalendarDays, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const STATUS_COLORS = { 
  dijadwalkan: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', 
  online: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', 
  offline: 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300', 
  selesai: 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400' 
};

export default function JadwalShift() {
  const [shifts, setShifts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [users, setUsers] = useState([]);
  const [gerobak, setGerobak] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View Modes
  const [viewMode, setViewMode] = useState('calendar'); // 'table' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filters (for table)
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [shiftFilter, setShiftFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ gerobak_id: '', user_pagi: '', user_siang: '', tanggal: '', repeat: false });
  const [saving, setSaving] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', tanggal: '', gerobak_nama: '', shift: '', user_id: '' });

  useEffect(() => { 
    fetchData(); 
  }, [tanggal, shiftFilter, userIdFilter, page, viewMode, currentMonth]);

  useEffect(() => {
    // Fetch dropdown data once
    api.get('/users', { params: { role: 'seruling', is_active: true, limit: 100 } }).then(res => setUsers(res.data.data)).catch(() => {});
    api.get('/gerobak', { params: { status: 'aktif' } }).then(res => setGerobak(res.data.data)).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        shift: shiftFilter || undefined,
        user_id: userIdFilter || undefined,
      };

      if (viewMode === 'calendar') {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        params.month = `${year}-${month}`;
      } else {
        params.page = page;
        params.limit = 10;
        params.tanggal = tanggal || undefined;
      }

      const res = await api.get('/shift', { params });
      setShifts(res.data.data);
      if (viewMode === 'table') {
        setPagination(res.data.pagination);
      }
    } catch { 
      toast.error('Gagal memuat data'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openAdd = (defaultTanggal) => { 
    setForm({ gerobak_id: '', user_pagi: '', user_siang: '', tanggal: defaultTanggal || new Date().toISOString().slice(0, 10), repeat: false }); 
    setShowModal(true); 
  };

  const openEdit = (shiftData) => {
    setEditForm({
      id: shiftData.id,
      tanggal: shiftData.tanggal,
      gerobak_nama: shiftData.gerobak?.nama_gerobak || '',
      shift: shiftData.shift,
      user_id: shiftData.user_id || '',
    });
    setEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/shift', form);
      toast.success(form.repeat ? 'Jadwal shift berhasil dibuat untuk 4 minggu.' : 'Jadwal shift berhasil dibuat');
      setShowModal(false); 
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Gagal menyimpan'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/shift/${editForm.id}`, { user_id: editForm.user_id });
      toast.success('Karyawan shift berhasil diubah');
      setEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    try { 
      await api.delete(`/shift/${id}`); 
      toast.success('Jadwal dihapus'); 
      fetchData(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Gagal'); 
    }
  };

  // Helper to filter users: a user can only have 1 of each shift type (pagi/siang) per day.
  const getAvailableUsers = (targetTanggal, targetShift, currentUserId = null) => {
    const shiftsOnDate = shifts.filter(s => s.tanggal === targetTanggal && s.shift === targetShift);
    const scheduledUserIds = shiftsOnDate.map(s => s.user_id).filter(id => id);
    return users.filter(u => {
      if (currentUserId && u.id === currentUserId) return true;
      return !scheduledUserIds.includes(u.id);
    });
  };

  // Calendar Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const renderCalendarView = () => {
    const calendarDays = getDaysInMonth(currentMonth);

    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white capitalize">
            {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"><ChevronLeft size={18}/></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 text-sm font-semibold text-stone-600 dark:text-stone-300 transition-colors">Hari Ini</button>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"><ChevronRight size={18}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-stone-200 dark:bg-stone-700 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="bg-stone-50 dark:bg-stone-900/80 p-3 text-center text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="bg-stone-50/50 dark:bg-stone-900/50 min-h-[140px]" />;
            
            // Fix local timezone offset for dateStr
            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
            const dayShifts = shifts.filter(s => s.tanggal === dateStr);
            const isToday = dateStr === new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
            
            return (
              <div key={dateStr} onClick={() => openAdd(dateStr)} className={`bg-white dark:bg-stone-800 min-h-[140px] p-2 hover:bg-orange-50/30 dark:hover:bg-stone-700/50 cursor-pointer group transition-colors relative`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-stone-700 dark:text-stone-300'}`}>
                    {date.getDate()}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-orange-500 transition-all"><Plus size={14}/></button>
                </div>
                <div className="space-y-1.5">
                  {dayShifts.map(shift => (
                    <div key={shift.id} onClick={(e) => { e.stopPropagation(); openEdit(shift); }} className={`px-2 py-1.5 rounded-lg text-xs border flex items-center justify-between group/item hover:ring-2 hover:ring-primary/30 transition-all ${shift.shift === 'pagi' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'}`}>
                      <div className="overflow-hidden">
                        <div className="font-bold flex items-center gap-1">
                          <span className="text-sm">{shift.shift === 'pagi' ? '🌅' : '🌇'}</span> 
                          <span className="truncate">{shift.gerobak?.nama_gerobak}</span>
                        </div>
                        <div className="truncate opacity-80 mt-0.5 font-medium ml-5">{shift.user?.nama?.split(' ')[0]}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(shift.id); }} className="opacity-0 group-hover/item:opacity-100 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-all shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="date" value={tanggal} onChange={e => {setTanggal(e.target.value); setPage(1);}} className="pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={shiftFilter} onChange={(e) => {setShiftFilter(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Shift</option>
            <option value="pagi">Pagi</option>
            <option value="siang">Siang</option>
          </select>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <select value={userIdFilter} onChange={(e) => {setUserIdFilter(e.target.value); setPage(1);}} className="pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none dark:text-white">
            <option value="">Semua Seruling</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
          </select>
        </div>
        <button onClick={() => {setTanggal(''); setShiftFilter(''); setUserIdFilter(''); setPage(1);}} className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors">
          Reset
        </button>
      </div>

      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Tanggal</th>
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Gerobak</th>
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Shift</th>
                <th className="text-left px-6 py-3.5 font-semibold text-stone-500">Seruling</th>
                <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Status</th>
                <th className="text-center px-6 py-3.5 font-semibold text-stone-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400">Tidak ada jadwal shift</td></tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">
                      {new Date(shift.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900 dark:text-white">{shift.gerobak?.nama_gerobak}</div>
                      <div className="text-xs text-stone-500">{shift.gerobak?.kode_gerobak}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{shift.shift === 'pagi' ? '🌅' : '🌇'}</span>
                        <span className="capitalize text-stone-700 dark:text-stone-300">{shift.shift}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-700 dark:text-stone-300">
                      {shift.user?.nama}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[shift.status]}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {shift.status === 'dijadwalkan' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(shift)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors" title="Edit Jadwal">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(shift.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Hapus Jadwal">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Jadwal Shift</h1>
          <p className="text-stone-500 text-sm mt-1">Atur jadwal karyawan & gerobak harian</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
              <CalendarDays size={16} /> Kalender
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
              <LayoutList size={16} /> Tabel
            </button>
          </div>
          <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20">
            <Plus size={16} /> Buat Jadwal
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? renderCalendarView() : renderTableView()}

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-stone-900 dark:text-white">Buat Jadwal Shift</h3><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"><X size={18} className="text-stone-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Tanggal Mulai</label><input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" /></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Gerobak</label><select value={form.gerobak_id} onChange={e => setForm({...form, gerobak_id: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="">Pilih Gerobak</option>{gerobak.map(g => <option key={g.id} value={g.id}>{g.nama_gerobak} ({g.kode_gerobak})</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">🌅 Karyawan Shift Pagi</label><select value={form.user_pagi} onChange={e => setForm({...form, user_pagi: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="">Pilih Karyawan (opsional)</option>{getAvailableUsers(form.tanggal, 'pagi').map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">🌇 Karyawan Shift Siang</label><select value={form.user_siang} onChange={e => setForm({...form, user_siang: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"><option value="">Pilih Karyawan (opsional)</option>{getAvailableUsers(form.tanggal, 'siang').map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select></div>
              <div className="flex items-center gap-3 mt-4 p-4 bg-orange-50/50 dark:bg-orange-500/5 rounded-xl border border-orange-200/50 dark:border-orange-500/10">
                <input type="checkbox" id="repeat" checked={form.repeat} onChange={e => setForm({...form, repeat: e.target.checked})} className="w-4 h-4 text-orange-500 rounded border-stone-300 focus:ring-orange-500" />
                <label htmlFor="repeat" className="text-sm font-medium text-stone-700 dark:text-stone-300 cursor-pointer select-none">Ulangi jadwal ini setiap minggu selama 1 bulan</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl w-full max-w-md p-6 animate-slide-up border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-stone-900 dark:text-white">Edit Karyawan Shift</h3><button onClick={() => setEditModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"><X size={18} className="text-stone-500" /></button></div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-500 dark:text-stone-400">Tanggal</label>
                <input type="text" value={new Date(editForm.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} disabled className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/50 text-sm text-stone-500 dark:text-stone-400 cursor-not-allowed" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5 text-stone-500 dark:text-stone-400">Gerobak</label>
                  <input type="text" value={editForm.gerobak_nama} disabled className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/50 text-sm text-stone-500 dark:text-stone-400 cursor-not-allowed" />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium mb-1.5 text-stone-500 dark:text-stone-400">Shift</label>
                  <input type="text" value={editForm.shift === 'pagi' ? '🌅 Pagi' : '🌇 Siang'} disabled className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/50 text-sm text-stone-500 dark:text-stone-400 cursor-not-allowed capitalize" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-200">Ubah Karyawan</label>
                <select value={editForm.user_id} onChange={e => setEditForm({...editForm, user_id: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white">
                  <option value="">Pilih Karyawan Baru</option>
                  {getAvailableUsers(editForm.tanggal, editForm.shift, editForm.user_id).map(u => (
                    <option key={u.id} value={u.id}>{u.nama}</option>
                  ))}
                </select>
                <p className="text-xs text-stone-500 mt-2">Karyawan yang sudah bekerja pada shift ini di tanggal yang sama tidak akan ditampilkan.</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
