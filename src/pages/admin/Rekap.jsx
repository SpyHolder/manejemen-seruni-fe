import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { FileText, Download, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Rekap() {
  const [tab, setTab] = useState('harian');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [dataHarian, setDataHarian] = useState(null);
  const [dataBulanan, setDataBulanan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedShift, setExpandedShift] = useState(null);

  const fetchHarian = async () => {
    setLoading(true);
    try { const res = await api.get('/rekap/harian', { params: { tanggal } }); setDataHarian(res.data.data); } catch { toast.error('Gagal memuat rekap'); } finally { setLoading(false); }
  };
  const fetchBulanan = async () => {
    setLoading(true);
    try { const res = await api.get('/rekap/bulanan', { params: { bulan, tahun } }); setDataBulanan(res.data.data); } catch { toast.error('Gagal memuat rekap'); } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'harian') fetchHarian(); else fetchBulanan(); }, [tab, tanggal, bulan, tahun]);

  const exportFile = async (type) => {
    try {
      const res = await api.get(`/rekap/export/${type}`, { params: { tanggal }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap-${tanggal}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type.toUpperCase()} berhasil diunduh`);
    } catch { toast.error('Gagal export'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rekap Penjualan</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Rekapitulasi harian dan bulanan</p></div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 dark:bg-[#111827] rounded-lg p-1 w-fit">
        {['harian', 'bulanan'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white dark:bg-[#1f2937] shadow text-primary' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-white'}`}>{t}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {tab === 'harian' ? (
          <>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={() => exportFile('pdf')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm font-medium hover:bg-gray-50 dark:bg-[#111827] transition-colors"><Download size={14} /> Export PDF</button>
            <button onClick={() => exportFile('excel')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm font-medium hover:bg-gray-50 dark:bg-[#111827] transition-colors"><Download size={14} /> Export Excel</button>
          </>
        ) : (
          <>
            <select value={bulan} onChange={e => setBulan(parseInt(e.target.value))} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm">
              {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>)}
            </select>
            <select value={tahun} onChange={e => setTahun(parseInt(e.target.value))} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2937] text-sm">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
      tab === 'harian' && dataHarian ? (
        <>
          {/* Grand Total */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Penjualan</p><p className="text-xl font-bold text-primary mt-1">{formatCurrency(dataHarian.grand_total?.total_penjualan)}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Transaksi</p><p className="text-xl font-bold mt-1">{dataHarian.grand_total?.total_transaksi}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Cash</p><p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(dataHarian.grand_total?.total_cash)}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">QRIS</p><p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(dataHarian.grand_total?.total_qris)}</p></div>
          </div>
          {/* Detail per Shift */}
          <div className="space-y-3">
            {dataHarian.detail?.map((item, i) => (
              <div key={i} className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button onClick={() => setExpandedShift(expandedShift === i ? null : i)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:bg-[#111827]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{item.shift?.user?.nama?.charAt(0)}</div>
                    <div className="text-left">
                      <p className="font-semibold">{item.shift?.user?.nama}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{item.shift?.gerobak?.nama_gerobak} • Shift {item.shift?.shift}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><p className="font-bold text-primary">{formatCurrency(item.ringkasan?.total_penjualan)}</p><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{item.ringkasan?.total_transaksi} trx</p></div>
                    {expandedShift === i ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                {expandedShift === i && (
                  <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-800/50">
                    <div className="grid grid-cols-3 gap-3 py-3">
                      <div className="text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Cash</p><p className="font-semibold text-sm text-green-600">{formatCurrency(item.ringkasan?.total_cash)}</p></div>
                      <div className="text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">QRIS</p><p className="font-semibold text-sm text-blue-600">{formatCurrency(item.ringkasan?.total_qris)}</p></div>
                      <div className="text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Durasi</p><p className="font-semibold text-sm">{item.ringkasan?.durasi_menit || 0}m</p></div>
                    </div>
                    {item.transaksi?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {item.transaksi.map((trx, j) => (
                          <div key={j} className="flex items-center justify-between py-2 text-sm border-t border-gray-200 dark:border-gray-800/30">
                            <div><span className="font-mono text-xs text-primary">{trx.kode_transaksi}</span><span className="ml-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">{trx.metode_pembayaran.toUpperCase()}</span></div>
                            <span className="font-semibold">{formatCurrency(trx.total_harga)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {dataHarian.detail?.length === 0 && <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Tidak ada data</div>}
          </div>
        </>
      ) : tab === 'bulanan' && dataBulanan ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Penjualan</p><p className="text-xl font-bold text-primary mt-1">{formatCurrency(dataBulanan.ringkasan?.total_penjualan)}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Transaksi</p><p className="text-xl font-bold mt-1">{dataBulanan.ringkasan?.total_transaksi}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Rata-rata/Hari</p><p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(dataBulanan.ringkasan?.rata_rata_per_hari)}</p></div>
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center"><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Hari Aktif</p><p className="text-xl font-bold mt-1">{dataBulanan.ringkasan?.hari_aktif}</p></div>
          </div>
          {dataBulanan.penjualan_per_hari?.length > 0 && (
            <div className="bg-white dark:bg-[#1f2937] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"><h3 className="font-semibold">Penjualan per Hari</h3></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800"><th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Tanggal</th><th className="text-right px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Penjualan</th><th className="text-right px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Transaksi</th></tr></thead>
                <tbody>{dataBulanan.penjualan_per_hari.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-800/50"><td className="px-6 py-2.5">{row.tanggal}</td><td className="px-6 py-2.5 text-right font-semibold">{formatCurrency(parseInt(row.total_penjualan))}</td><td className="px-6 py-2.5 text-right">{row.jumlah_transaksi}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
