'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlogPosts, addBlogPost, deleteBlogPost } from '@/app/actions/blog';
import { uploadImage } from '@/app/actions/upload';
import { useState } from 'react';

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<'TR' | 'EN'>('TR');
  
  const [formData, setFormData] = useState({
    order: 1, active: true,
    titleTR: '', titleEN: '',
    catTR: '', catEN: '',
    author: 'AuroraNova Team',
    readTime: '',
    imageUrl: '',
    date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  });

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['blog_posts'],
    queryFn: () => getBlogPosts(),
  });

  const addMutation = useMutation({
    mutationFn: addBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      setIsFormOpen(false);
      setFormData(prev => ({ ...prev, titleTR: '', titleEN: '', catTR: '', catEN: '', imageUrl: '' }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
    }
  });

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Blog Yazıları</h1>
      <p className="text-sm text-zinc-400 mb-7">Blog içeriklerini yönetin — Türkçe & İngilizce</p>

      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-colors"
        >
          {isFormOpen ? 'İptal' : '+ Yeni Yazı'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
          {/* Lang Tabs */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setActiveLang('TR')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'TR' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇹🇷 Türkçe</button>
            <button onClick={() => setActiveLang('EN')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'EN' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇬🇧 English</button>
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
              <label className="text-xs font-medium text-zinc-400">Başlık ({activeLang})</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={activeLang === 'TR' ? formData.titleTR : formData.titleEN} 
                onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'titleTR' : 'titleEN']: e.target.value})} 
                placeholder="Blog başlığı..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Kategori ({activeLang})</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={activeLang === 'TR' ? formData.catTR : formData.catEN} 
                onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'catTR' : 'catEN']: e.target.value})} 
                placeholder="Örn: Tasarım Trendleri" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Yazar</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Okuma Süresi</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#c5a059] transition-colors" 
                value={formData.readTime} onChange={e => setFormData({...formData, readTime: e.target.value})} placeholder="5 min read" />
            </div>
          </div>
          
          <button 
            onClick={() => addMutation.mutate(formData as any)}
            disabled={addMutation.isPending || (!formData.titleTR && !formData.titleEN)}
            className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)]"
          >
            {addMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Görsel</th>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500 animate-pulse">Veriler yükleniyor...</td></tr>
            )}
            
            {error && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-red-400">Hata oluştu.</td></tr>
            )}

            {!isLoading && !error && posts?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Henüz blog yazısı bulunmuyor.</td></tr>
            )}

            {posts?.map((post) => (
              <tr key={post.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                    {post.imageUrl ? (
                        <div className="w-12 h-8 rounded overflow-hidden border border-white/10">
                            <img src={post.imageUrl} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <span className="text-zinc-600 text-xs">Yok</span>
                    )}
                </td>
                <td className="px-4 py-3 text-white">{post.titleTR || post.titleEN || 'Başlıksız'}</td>
                <td className="px-4 py-3">{post.catTR || post.catEN || '-'}</td>
                <td className="px-4 py-3">{post.date || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                    post.active ? 'bg-[#c5a059]/10 text-[#c5a059]' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {post.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-md transition-colors mr-2">
                    Düzenle
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) {
                        deleteMutation.mutate(post.id!);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 disabled:opacity-50 border border-white/10 rounded-md transition-colors"
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