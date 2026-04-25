'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSiteContent, updateSiteContent } from '@/app/actions/content';
import { useState, useEffect } from 'react';

const CONTENT_SECTIONS = [
  { id: 'hero', label: 'Ana Sayfa Hero' },
  { id: 'about', label: 'Hakkımızda (About)' },
  { id: 'services', label: 'Hizmetler Intro' },
  { id: 'footer', label: 'Footer & İletişim' },
  { id: 'seo', label: 'Global SEO Meta' },
];

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(CONTENT_SECTIONS[0].id);
  const [activeLang, setActiveLang] = useState<'TR' | 'EN'>('TR');
  
  const [formData, setFormData] = useState({ contentTR: '', contentEN: '' });

  const { data: contentData, isLoading, error } = useQuery({
    queryKey: ['site_content'],
    queryFn: () => getSiteContent(),
  });

  // When active tab or data changes, load the current content into the form state
  useEffect(() => {
    if (contentData) {
      const currentDoc = contentData.find(c => c.id === activeTab);
      if (currentDoc) {
        setFormData({
          contentTR: currentDoc.contentTR || '',
          contentEN: currentDoc.contentEN || '',
        });
      } else {
        setFormData({ contentTR: '', contentEN: '' }); // Reset if no data exists yet for this tab
      }
    }
  }, [activeTab, contentData]);

  const updateMutation = useMutation({
    mutationFn: (payload: { contentTR: string, contentEN: string }) => updateSiteContent(activeTab, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      alert('İçerik başarıyla kaydedildi!');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Site İçeriği</h1>
      <p className="text-sm text-zinc-400 mb-7">Web sitenizin ana metinlerini ve SEO ayarlarını güncelleyin</p>

      {/* Tabs matching V1 style */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {CONTENT_SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === section.id 
                ? 'bg-[#97B3E8]/15 border-[#97B3E8]/40 text-[#97B3E8]' 
                : 'bg-transparent border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="text-zinc-400 animate-pulse text-sm">İçerik Yükleniyor...</div>
          </div>
        )}

        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-2">
            <button onClick={() => setActiveLang('TR')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'TR' ? 'bg-[#55efc4]/10 text-[#55efc4] border-[#55efc4]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇹🇷 Türkçe</button>
            <button onClick={() => setActiveLang('EN')} className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeLang === 'EN' ? 'bg-[#55efc4]/10 text-[#55efc4] border-[#55efc4]/30' : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}>🇬🇧 English</button>
          </div>
          
          <div className="text-xs text-zinc-500">
            Düzeltilen Bölüm: <span className="font-semibold text-zinc-300">{CONTENT_SECTIONS.find(s => s.id === activeTab)?.label}</span>
          </div>
        </div>

        <div className="mb-5">
          <textarea 
            className="w-full min-h-[300px] p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors resize-y font-mono" 
            value={activeLang === 'TR' ? formData.contentTR : formData.contentEN} 
            onChange={e => setFormData({...formData, [activeLang === 'TR' ? 'contentTR' : 'contentEN']: e.target.value})} 
            placeholder={`${activeLang} içeriği buraya girin (HTML destekler)...`}
          />
        </div>
        
        <button 
          onClick={handleSave}
          disabled={updateMutation.isPending || isLoading}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
        >
          {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  );
}