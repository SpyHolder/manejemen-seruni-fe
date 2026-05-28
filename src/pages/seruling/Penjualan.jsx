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
  const [cartOpen, setCartOpen] = useState(false);
  const [cetakStruk, setCetakStruk] = useState(true);

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
      setCartOpen(false);
      // Logika cetak struk (sementara hanya console log)
      if (cetakStruk) {
        console.log('Mencetak struk untuk transaksi ini...');
        // Nantinya dihubungkan dengan library print Bluetooth/Thermal
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-white dark:bg-stone-900"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const grouped = {};
  produk.forEach(p => { if (!grouped[p.kategori]) grouped[p.kategori] = []; grouped[p.kategori].push(p); });

  return (
    <div className="px-4 pt-6 pb-6 space-y-6 animate-fade-in bg-white dark:bg-stone-900 min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Input Penjualan</h1>
        <p className="text-sm text-stone-500 mt-0.5">Pilih produk pesanan pelanggan</p>
      </div>

      {!shift && (
        <div className="rounded-xl p-4 border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Anda harus online di halaman Dashboard terlebih dahulu untuk membuat transaksi baru.</p>
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-6 pb-20">
        {Object.entries(grouped).map(([kategori, items]) => (
          <div key={kategori}>
            <h2 className="text-sm font-bold text-stone-900 dark:text-white mb-3">{kategori}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p.id)}
                  className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-sm overflow-hidden flex flex-col relative cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Image Section */}
                  <div className="aspect-square bg-stone-100 dark:bg-stone-900 w-full relative">
                    {p.gambar ? (
                      <img src={p.gambar.startsWith('http') ? p.gambar : `http://localhost:5000${p.gambar}`} alt={p.nama_produk} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                        <span className="text-4xl">☕</span>
                      </div>
                    )}
                    {/* Badge Kuantitas */}
                    {cart[p.id] > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white dark:border-stone-800 animate-fade-in">
                        {cart[p.id]}
                      </div>
                    )}
                  </div>
                  
                  {/* Detail Section */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="font-bold text-sm text-stone-900 dark:text-white leading-tight line-clamp-2">{p.nama_produk}</p>
                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(p.harga)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Button to open Cart */}
      {cartItems.length > 0 && !cartOpen && (
        <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 animate-slide-up">
          <button 
            onClick={() => setCartOpen(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-500/30 p-4 flex items-center justify-between active:scale-95 transition-transform border border-orange-400"
          >
            <div className="flex items-center gap-3">
              <div className="relative bg-white/20 p-2 rounded-xl">
                <ShoppingCart size={20} className="text-white" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-orange-500">
                  {cartItems.reduce((s,i)=>s+i.jumlah,0)}
                </span>
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block">Lanjut Pembayaran</span>
                <span className="text-[11px] font-medium text-orange-100">{cartItems.reduce((s,i)=>s+i.jumlah,0)} item dipilih</span>
              </div>
            </div>
            <span className="font-black text-lg">{formatCurrency(totalHarga)}</span>
          </button>
        </div>
      )}

      {/* Slide-up Cart Modal / Bottom Sheet */}
      {cartOpen && (
        <div className="relative z-[60]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setCartOpen(false)}></div>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up border-t border-stone-200 dark:border-stone-800">
            {/* Handle for drag indicator */}
            <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setCartOpen(false)}>
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full"></div>
            </div>
            
            <div className="px-5 pb-3 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">Pesanan Saat Ini</h3>
              <button onClick={() => setCartOpen(false)} className="text-sm font-medium text-primary hover:text-orange-600">Tutup</button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.map(item => {
                const productInfo = produk.find(p => p.id === item.produk_id);
                return (
                  <div key={item.produk_id} className="flex gap-3 items-center bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-100 dark:border-stone-700/50">
                    <div className="w-14 h-14 bg-stone-200 dark:bg-stone-700 rounded-lg overflow-hidden shrink-0">
                       {productInfo?.gambar ? (
                          <img src={productInfo.gambar.startsWith('http') ? productInfo.gambar : `http://localhost:5000${productInfo.gambar}`} alt={item.nama} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">☕</div>
                        )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-stone-900 dark:text-white line-clamp-1">{item.nama}</p>
                      <p className="text-primary font-bold text-sm">{formatCurrency(item.harga)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl p-1 border border-stone-200 dark:border-stone-700 shadow-sm shrink-0">
                      <button onClick={() => removeFromCart(item.produk_id)} className="w-8 h-8 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"><Minus size={16} /></button>
                      <span className="w-4 text-center font-bold text-sm text-stone-900 dark:text-white">{item.jumlah}</span>
                      <button onClick={() => addToCart(item.produk_id)} className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-primary flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"><Plus size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Checkout Section */}
            <div className="p-5 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 rounded-t-2xl shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-stone-500 font-medium">Total Pembayaran</span>
                <span className="text-2xl font-black text-stone-900 dark:text-white">{formatCurrency(totalHarga)}</span>
              </div>

              {/* Payment Method */}
              <div className="flex gap-3 mb-4">
                <button onClick={() => setMetode('cash')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all border-2 ${metode === 'cash' ? 'border-primary bg-orange-50 dark:bg-orange-500/10 text-primary' : 'border-stone-100 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700'}`}>
                  <Banknote size={20} /> Cash
                </button>
                <button onClick={() => setMetode('qris')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all border-2 ${metode === 'qris' ? 'border-primary bg-orange-50 dark:bg-orange-500/10 text-primary' : 'border-stone-100 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700'}`}>
                  <CreditCard size={20} /> QRIS
                </button>
              </div>
              
              {/* Toggle Cetak Struk */}
              <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl mb-4 cursor-pointer">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${cetakStruk ? 'bg-primary border-primary' : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600'}`}>
                  {cetakStruk && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <input type="checkbox" checked={cetakStruk} onChange={(e) => setCetakStruk(e.target.checked)} className="hidden" />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Cetak Struk (Printer Bluetooth)</span>
              </label>

              <button onClick={handleSubmit} disabled={submitting || !shift} className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <ShoppingCart size={20} />}
                {submitting ? 'Memproses...' : 'Buat Pesanan & Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
