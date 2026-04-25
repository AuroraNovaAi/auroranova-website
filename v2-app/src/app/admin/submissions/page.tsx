'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmissions, addSubmission, updateSubmission, deleteSubmission } from '@/app/actions/submissions';
import { useState } from 'react';

export default function SubmissionsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm = {
    name: '', email: '', service: '', message: '', read: false
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['contact_submissions'],
    queryFn: () => getSubmissions(),
  });

  const addMutation = useMutation({
    mutationFn: addSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_submissions'] });
      closeForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateSubmission(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_submissions'] });
      closeForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_submissions'] });
    }
  });

  const openEditForm = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      email: item.email || '',
      service: item.service || '',
      message: item.message || '',
      read: item.read || false
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

  const markAsRead = (id: string, currentReadStatus: boolean) => {
    updateMutation.mutate({ id, payload: { read: !currentReadStatus } });
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Başvurular</h1>
      <p className="text-sm text-zinc-400 mb-7">Web sitesinden gelen iletişim formlarını ve manuel müşteri kayıtlarını yönetin</p>

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
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
        >
          {isFormOpen ? 'İptal' : '+ Manuel Kayıt Ekle'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold text-white">
              {editingId ? 'Başvuruyu Düzenle' : 'Manuel Başvuru Ekle (Örn: Telefondan Gelen)'}
            </h3>
            {editingId && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md">
                DÜZENLEME MODU
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Ad Soyad</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Müşteri Adı" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">İletişim / E-posta</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ornek@domain.com veya Telefon" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">İlgilendiği Hizmet</label>
              <input type="text" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} placeholder="Örn: SEO Paketi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Durum</label>
              <select className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                value={formData.read ? 'true' : 'false'} onChange={e => setFormData({...formData, read: e.target.value === 'true'})}>
                <option value="false">Okunmadı (Yeni)</option>
                <option value="true">Okundu / İlgilenildi</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400">Mesaj / Notlar</label>
              <textarea className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={4} placeholder="Müşteri notu veya iç notlarınız..." />
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isPending || !formData.name}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
          >
            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Submissions Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Gönderen</th>
              <th className="px-4 py-3 font-medium">Hizmet / Konu</th>
              <th className="px-4 py-3 font-medium max-w-[300px]">Mesaj</th>
              <th className="px-4 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500 animate-pulse">Başvurular yükleniyor...</td></tr>
            )}
            
            {error && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-red-400">Hata oluştu.</td></tr>
            )}

            {!isLoading && !error && submissions?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Henüz başvuru bulunmuyor.</td></tr>
            )}

            {submissions?.map((sub) => (
              <tr key={sub.id} className={`transition-colors ${!sub.read ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => markAsRead(sub.id!, sub.read)}
                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider transition-colors ${
                      sub.read ? 'bg-[#55efc4]/10 text-[#55efc4] hover:bg-[#55efc4]/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {sub.read ? 'Okundu' : 'Okunmadı'}
                  </button>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                  {sub.timestamp ? new Date(sub.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className={`font-medium ${!sub.read ? 'text-white' : 'text-zinc-300'}`}>{sub.name}</div>
                  <div className="text-xs text-zinc-500">{sub.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{sub.service || '-'}</td>
                <td className="px-4 py-3 text-zinc-400 max-w-[300px]">
                  <p className="truncate" title={sub.message}>{sub.message}</p>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button 
                    onClick={() => openEditForm(sub)}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-400 border border-white/10 rounded-md transition-colors mr-2"
                  >
                    Düzenle / İncele
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) {
                        deleteMutation.mutate(sub.id!);
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