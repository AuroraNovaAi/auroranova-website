'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, addMember, updateMember, deleteMember } from '@/app/actions/members';
import { useState } from 'react';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm = {
    displayName: '', email: '', roles: ['member'], photoURL: '', lang: 'tr'
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['web_users'],
    queryFn: () => getMembers(),
  });

  const addMutation = useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web_users'] });
      closeForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { uid: string, payload: any }) => updateMember(data.uid, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web_users'] });
      closeForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web_users'] });
    }
  });

  const openEditForm = (item: any) => {
    setEditingId(item.uid);
    setFormData({
      displayName: item.displayName || '',
      email: item.email || '',
      roles: item.roles || ['member'],
      photoURL: item.photoURL || '',
      lang: item.lang || 'tr'
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
      updateMutation.mutate({ uid: editingId, payload: formData });
    } else {
      addMutation.mutate(formData as any);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Üyeler</h1>
      <p className="text-sm text-zinc-400 mb-7">Sistem kullanıcılarını ve yetkilerini yönetin</p>

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
          {isFormOpen ? 'İptal' : '+ Yeni Üye'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold text-white">
              {editingId ? 'Üyeyi Düzenle' : 'Yeni Üye Ekle'}
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
                value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="Örn: John Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">E-posta</label>
              <input type="email" className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ornek@domain.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Rol</label>
              <select className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                value={formData.roles[0]} onChange={e => setFormData({...formData, roles: [e.target.value]})}>
                <option value="admin">Admin</option>
                <option value="member">Üye (Member)</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isPending || !formData.displayName || !formData.email}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
          >
            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Table matching V1 styling */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Kayıt Tarihi</th>
              <th className="px-4 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500 animate-pulse">Üyeler yükleniyor...</td></tr>
            )}
            
            {error && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-red-400">Hata oluştu.</td></tr>
            )}

            {!isLoading && !error && members?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Sistemde henüz üye bulunmuyor.</td></tr>
            )}

            {members?.map((member) => (
              <tr key={member.uid} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                  </div>
                  {member.displayName || member.email}
                </td>
                <td className="px-4 py-3 text-zinc-400">{member.email}</td>
                <td className="px-4 py-3">
                  {member.roles && member.roles.includes('admin') ? (
                    <span className="px-2 py-1 text-[11px] font-semibold bg-[#C19E6A]/15 text-[#C19E6A] rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-semibold bg-[#97B3E8]/15 text-[#97B3E8] rounded-full">
                      Member
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {member.joinDate ? new Date(member.joinDate).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => openEditForm(member)}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-400 border border-white/10 rounded-md transition-colors mr-2"
                  >
                    Düzenle
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Bu üyeyi silmek istediğinize emin misiniz?')) {
                        deleteMutation.mutate(member.uid!);
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