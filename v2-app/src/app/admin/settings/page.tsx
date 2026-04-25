'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    maintenanceMode: false,
    contactEmail: '',
    contactPhone: '',
    socialInstagram: '',
    socialLinkedin: '',
    socialTwitter: '',
  });

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings_global'],
    queryFn: () => getSettings(),
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        maintenanceMode: settings.maintenanceMode || false,
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        socialInstagram: settings.socialInstagram || '',
        socialLinkedin: settings.socialLinkedin || '',
        socialTwitter: settings.socialTwitter || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings_global'] });
      alert('Ayarlar başarıyla kaydedildi!');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Sistem Ayarları</h1>
      <p className="text-sm text-zinc-400 mb-7">Web sitesinin genel durumunu ve iletişim kanallarını yönetin</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl max-w-3xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="text-zinc-400 animate-pulse text-sm">Ayarlar Yükleniyor...</div>
          </div>
        )}

        {/* Maintenance Toggle */}
        <div className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-8">
          <div>
            <h3 className="text-sm font-semibold text-yellow-500 mb-1">Bakım Modu</h3>
            <p className="text-xs text-zinc-400">Aktif edildiğinde, ziyaretçiler sadece 'Yapım Aşamasında' sayfasını görür. (Adminler siteyi görmeye devam eder).</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={formData.maintenanceMode}
              onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})}
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>

        <h3 className="text-xs font-bold text-white/30 uppercase tracking-[1.2px] mb-4 pb-2 border-b border-white/5">
          İletişim & Sosyal Medya
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">İletişim E-posta Adresi</label>
            <input type="email" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
              value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} placeholder="ornek@domain.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Telefon Numarası</label>
            <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
              value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} placeholder="+90 555 123 45 67" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Instagram URL</label>
            <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
              value={formData.socialInstagram} onChange={e => setFormData({...formData, socialInstagram: e.target.value})} placeholder="https://instagram.com/..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">LinkedIn URL</label>
            <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
              value={formData.socialLinkedin} onChange={e => setFormData({...formData, socialLinkedin: e.target.value})} placeholder="https://linkedin.com/..." />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={updateMutation.isPending || isLoading}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
        >
          {updateMutation.isPending ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
        </button>
      </div>
    </div>
  );
}