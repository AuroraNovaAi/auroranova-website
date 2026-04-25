'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, addProduct, deleteProduct } from '@/app/actions/products';
import { uploadImage } from '@/app/actions/upload';
import { useState } from 'react';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    nameTR: '', nameEN: '', descriptionTR: '', descriptionEN: '',
    currency: '₺' as const,
    priceMonthly: '' as number | '', originalPriceMonthly: '' as number | '',
    priceYearly: '' as number | '', originalPriceYearly: '' as number | '',
    priceLifetime: '' as number | '', originalPriceLifetime: '' as number | '', discountEndDate: '',
    type: 'product' as const, active: true, imageUrl: ''
  });

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsFormOpen(false);
      setFormData({ 
        nameTR: '', nameEN: '', descriptionTR: '', descriptionEN: '', 
        currency: '₺', priceMonthly: '' as number | '', originalPriceMonthly: '' as number | '', 
        priceYearly: '' as number | '', originalPriceYearly: '' as number | '', priceLifetime: '' as number | '', 
        originalPriceLifetime: '' as number | '', discountEndDate: '', type: 'product', active: true, imageUrl: '' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Ürünler</h1>
      <p className="text-sm text-zinc-400 mb-7">SaaS ürünlerinizi yönetin</p>

      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-[0_2px_4px_rgba(99,102,241,0.2)] transition-colors"
        >
          {isFormOpen ? 'İptal' : '+ Yeni Ürün'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Ürün Adı (TR)</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.nameTR} onChange={e => setFormData({...formData, nameTR: e.target.value})} placeholder="Örn: Premium Paket" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Product Name (EN)</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.nameEN} onChange={e => setFormData({...formData, nameEN: e.target.value})} placeholder="Ex: Premium Package" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Açıklama (TR)</label>
              <textarea className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.descriptionTR} onChange={e => setFormData({...formData, descriptionTR: e.target.value})} rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Para Birimi</label>
              <select className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as any})}>
                <option value="₺">₺ (TRY)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5"></div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Aylık İndirimsiz Fiyat</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.originalPriceMonthly} onChange={e => setFormData({...formData, originalPriceMonthly: e.target.value ? Number(e.target.value) : ''})} placeholder="İsteğe Bağlı" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Aylık Fiyat</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: e.target.value ? Number(e.target.value) : ''})} placeholder="Boş bırakılabilir" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Yıllık İndirimsiz Fiyat</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.originalPriceYearly} onChange={e => setFormData({...formData, originalPriceYearly: e.target.value ? Number(e.target.value) : ''})} placeholder="İsteğe Bağlı" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Yıllık Fiyat</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.priceYearly} onChange={e => setFormData({...formData, priceYearly: e.target.value ? Number(e.target.value) : ''})} placeholder="Boş bırakılabilir" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Tek Seferlik İndirimsiz</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.originalPriceLifetime} onChange={e => setFormData({...formData, originalPriceLifetime: e.target.value ? Number(e.target.value) : ''})} placeholder="İsteğe Bağlı" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Tek Seferlik Fiyat</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.priceLifetime} onChange={e => setFormData({...formData, priceLifetime: e.target.value ? Number(e.target.value) : ''})} placeholder="Boş bırakılabilir" />
            </div>
            
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">İndirim Bitiş Tarihi (İsteğe Bağlı)</label>
              <input type="date" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.discountEndDate || ''} onChange={e => setFormData({...formData, discountEndDate: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Görsel (Yükle veya Link Gir)</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                  value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://... veya Dosya Yükleyin" />
                <label className="cursor-pointer px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-100 transition-colors flex items-center justify-center relative overflow-hidden">
                  <span>Yükle</span>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                         const fd = new FormData();
                         fd.append('file', file);
                         const res = await uploadImage(fd);
                         if (res.url) {
                            setFormData(prev => ({...prev, imageUrl: res.url as string}));
                         } else {
                            alert(res.error || 'Yükleme başarısız');
                         }
                     }
                  }} />
                </label>
              </div>
              {formData.imageUrl && (
                  <div className="mt-2 relative w-32 h-20 rounded-md overflow-hidden border border-white/10 shadow-lg">
                      <img src={formData.imageUrl} className="w-full h-full object-cover" />
                  </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              const cleanData: any = { ...formData };
              if (cleanData.priceMonthly === '') cleanData.priceMonthly = undefined;
              if (cleanData.originalPriceMonthly === '') cleanData.originalPriceMonthly = undefined;
              if (cleanData.priceYearly === '') cleanData.priceYearly = undefined;
              if (cleanData.originalPriceYearly === '') cleanData.originalPriceYearly = undefined;
              if (cleanData.priceLifetime === '') cleanData.priceLifetime = undefined;
              if (cleanData.originalPriceLifetime === '') cleanData.originalPriceLifetime = undefined;
              if (cleanData.discountEndDate === '') cleanData.discountEndDate = undefined;
              addMutation.mutate(cleanData as any);
            }}
            disabled={addMutation.isPending || !formData.nameTR || !formData.nameEN}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
          >
            {addMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Ürün Adı</th>
              <th className="px-4 py-3 font-medium">Fiyat</th>
              <th className="px-4 py-3 font-medium">Lisans</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  <div className="animate-pulse">Veriler yükleniyor...</div>
                </td>
              </tr>
            )}
            
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-400">
                  Hata: Bağlantı kurulamadı. Lütfen .env.local anahtarlarını kontrol edin.
                </td>
              </tr>
            )}

            {!isLoading && !error && products?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Henüz ürün bulunmuyor. Yeni bir ürün ekleyerek başlayın.
                </td>
              </tr>
            )}

            {products?.map((product) => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{product.nameTR}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-[11px] text-zinc-400">
                    {product.priceMonthly !== undefined && <span>Aylık: {product.currency}{product.priceMonthly}</span>}
                    {product.priceYearly !== undefined && <span>Yıllık: {product.currency}{product.priceYearly}</span>}
                    {product.priceLifetime !== undefined && <span>Tek Seferlik: {product.currency}{product.priceLifetime}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {/* Empty for backward compatibility in column count if needed, or remove <th> */}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                    product.active 
                      ? 'bg-[#55efc4]/10 text-[#55efc4]' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {product.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-md transition-colors mr-2">
                    Düzenle
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                        deleteMutation.mutate(product.id!);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-md transition-colors"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}