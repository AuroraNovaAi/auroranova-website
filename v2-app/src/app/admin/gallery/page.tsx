'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGalleryItems, addGalleryItem, deleteGalleryItem, updateGalleryItem } from '@/app/actions/gallery';
import { uploadImage } from '@/app/actions/upload';
import { useState } from 'react';
import Image from 'next/image';

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'TR' | 'EN'>('TR');
  
  const defaultForm = {
    section: 'story', order: 1, imageUrl: '',
    titleTR: '', titleEN: '', descTR: '', descEN: '',
    fullContentTR: '', fullContentEN: ''
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['gallery_items'],
    queryFn: () => getGalleryItems(),
  });

  const addMutation = useMutation({
    mutationFn: addGalleryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_items'] });
      closeForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateGalleryItem(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_items'] });
      closeForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_items'] });
    }
  });

  const openEditForm = (item: any) => {
    setEditingId(item.id);
    setFormData({
      section: item.section || 'story',
      order: item.order || 1,
      imageUrl: item.imageUrl || '',
      titleTR: item.titleTR || '',
      titleEN: item.titleEN || '',
      descTR: item.descTR || '',
      descEN: item.descEN || '',
      fullContentTR: item.fullContentTR || '',
      fullContentEN: item.fullContentEN || ''
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
    } else {
      addMutation.mutate(formData as any);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Galeri (Portföy)</h1>
      <p className="text-sm text-zinc-400 mb-7">Portföy ve vizyon fotoğraflarınızı yönetin — Türkçe & İngilizce</p>

      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => {
            if (isFormOpen) {
              closeForm();
            } else {
              setFormData(defaultForm);
              setEditingId(null);
              setIsFormOpen(true);
            }
          }}
          className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-colors"
        >
          {isFormOpen ? 'İptal' : '+ Yeni Görsel'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-5">
            <div className="flex gap-2">
              <button onClick={() => setActiveLang('TR')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'TR' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇹🇷 Türkçe</button>
              <button onClick={() => setActiveLang('EN')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'EN' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇬🇧 English</button>
            </div>
            {editingId && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md">
                DÜZENLEME MODU
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Görsel (Yükle veya Link Gir)</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Bölüm (Section)</label>
              <select className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors"
                value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                <option value="story">Story (Biz Kimiz)</option>
                <option value="method">Method (Nasıl Çalışıyoruz)</option>
                <option value="work">Work (Portföy & Neler Yaptık)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Sıra (Order)</label>
              <input type="number" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Başlık ({activeLang})</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={activeLang === 'TR' ? formData.titleTR : formData.titleEN} 
                onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'titleTR' : 'titleEN']: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Kısa Açıklama ({activeLang})</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={activeLang === 'TR' ? formData.descTR : formData.descEN} 
                onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'descTR' : 'descEN']: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Tam Sayfa İçeriği ({activeLang}) (Detay Sayfası İçin)</label>
              <textarea className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={activeLang === 'TR' ? formData.fullContentTR : formData.fullContentEN} 
                onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'fullContentTR' : 'fullContentEN']: e.target.value})} rows={4} placeholder="Eğer bu projenin kendine ait bir detay sayfası (Case Study) olacaksa içeriği buraya girin." />
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isPending || (!formData.imageUrl)}
            className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)]"
          >
            {isPending ? 'Kaydediliyor...' : editingId ? 'Değişiklikleri Kaydet' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Grid Layout for Gallery */}
      {isLoading ? (
        <div className="text-center py-10 text-zinc-500 animate-pulse">Görseller yükleniyor...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-400">Hata oluştu.</div>
      ) : items?.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Galeri henüz boş.</div>
      ) : (
        <div>
          {['story', 'method', 'work'].map((sectionName) => {
            const sectionItems = items?.filter(item => item.section === sectionName) || [];
            if (sectionItems.length === 0) return null;
            
            return (
              <div key={sectionName} className="mb-9">
                <h2 className="text-[11px] font-bold text-[#c5a059] uppercase tracking-[1.2px] mb-3 pb-2 border-b border-white/5">
                  {sectionName === 'work' ? 'PORTFÖY' : sectionName === 'story' ? 'HİKAYEMİZ' : 'METODOLOJİ'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionItems.map(item => (
                    <div key={item.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col group relative overflow-hidden backdrop-blur-sm">
                      <div className="w-full h-32 bg-zinc-950 rounded-lg mb-3 relative overflow-hidden border border-white/5">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.titleTR || 'Gallery'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 hover:scale-105 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Görsel Yok</div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/80 text-[#c5a059] font-medium text-[9px] px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md border border-white/10">
                          Sıra: {item.order}
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1 truncate">{item.titleTR || item.titleEN || 'İsimsiz Görsel'}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">{item.descTR || item.descEN || '-'}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <a href={`/work/${item.slug || item.id}`} target="_blank" className="text-[10px] text-[#c5a059] hover:underline">
                          Sayfayı Gör
                        </a>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => openEditForm(item)}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-[#c5a059]/20 text-zinc-300 hover:text-[#c5a059] rounded transition-colors"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Silmek istediğinize emin misiniz?')) deleteMutation.mutate(item.id!); }}
                            disabled={deleteMutation.isPending}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-red-500/20 text-red-400 rounded transition-colors disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}