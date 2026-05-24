import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Minus, ShoppingCart, Loader2, CreditCard, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Penjualan() {
  const [produk, setProduk] = useState([]);
  const [cart, setCart] = useState({});
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [metode, setMetode] = useState('cash');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [produkRes, shiftRes] = await Promise.all([api.get('/produk'), api.get('/shift/today')]);
      setProduk(produkRes.data.data.filter(p => p.is_active));
      const shifts = shiftRes.data.data;
      const active = shifts.find(s => s.status === 'online');
      setShift(active || null);
    } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  };

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(prev => {
    const next = { ...prev };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = produk.find(p => p.id === parseInt(id));
    return p ? { produk_id: p.id, nama: p.nama_produk, harga: p.harga, jumlah: qty, subtotal: p.harga * qty } : null;
  }).filter(Boolean);

  const totalHarga = cartItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async () => {
    if (!shift) { toast.error('Anda harus online terlebih dahulu'); return; }
    if (cartItems.length === 0) { toast.error('Keranjang kosong'); return; }
    setSubmitting(true);
    try {
      await api.post('/transaksi', {
        items: cartItems.map(i => ({ produk_id: i.produk_id, jumlah: i.jumlah })),
        metode_pembayaran: metode,
        shift_assignment_id: shift.id,
      });
      toast.success('Transaksi berhasil! 🎉');
      setCart({});
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;

  const grouped = {};
  produk.forEach(p => { if (!grouped[p.kategori]) grouped[p.kategori] = []; grouped[p.kategori].push(p); });

  return (
    <div className="px-4 pt-6 pb-6 space-y-6 animate-fade-in bg-white dark:bg-[#1f2937] min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Input Penjualan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">Pilih produk pesanan pelanggan</p>
      </div>

      {!shift && (
        <div className="rounded-lg p-4 border bg-red-50 border-red-200 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-red-600 font-medium">Anda harus online di halaman Dashboard terlebih dahulu untuk membuat transaksi baru.</p>
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-6 pb-20">
        {Object.entries(grouped).map(([kategori, items]) => (
          <div key={kategori}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{kategori}</h2>
            <div className="grid grid-cols-1 gap-3">
              {items.map(p => (
                <div key={p.id} className="rounded-xl p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {/* Placeholder Image area */}
                      <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">Img</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{p.nama_produk}</p>
                      <p className="text-primary font-bold text-sm mt-0.5">{formatCurrency(p.harga)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#111827] rounded-lg p-1 border border-gray-100 dark:border-gray-800/50">
                    <button onClick={() => removeFromCart(p.id)} disabled={!cart[p.id]} className="w-8 h-8 rounded-md bg-white dark:bg-[#1f2937] text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-sm disabled:opacity-30 disabled:shadow-none transition-all"><Minus size={16} /></button>
                    <span className="w-4 text-center font-bold text-sm text-gray-900 dark:text-white">{cart[p.id] || 0}</span>
                    <button onClick={() => addToCart(p.id)} className="w-8 h-8 rounded-md bg-white dark:bg-[#1f2937] text-primary flex items-center justify-center shadow-sm hover:text-orange-600 transition-all"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShoppingCart size={18} /> Ringkasan ({cartItems.reduce((s,i)=>s+i.jumlah,0)} Item)</h3>
              <span className="text-primary font-bold text-lg">{formatCurrency(totalHarga)}</span>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2">
              <button onClick={() => setMetode('cash')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${metode === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-[#111827]'}`}><Banknote size={16} /> Cash</button>
              <button onClick={() => setMetode('qris')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${metode === 'qris' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-[#111827]'}`}><CreditCard size={16} /> QRIS</button>
            </div>

            <button onClick={handleSubmit} disabled={submitting || !shift} className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-black/10">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              {submitting ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
