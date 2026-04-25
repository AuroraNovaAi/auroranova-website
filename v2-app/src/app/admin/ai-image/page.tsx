'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateImage } from '@/app/actions/ai-image';
import { fetchGeminiImageModels } from '@/app/actions/ai-models';

export default function AiImagePage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('imagen-3.0-generate-001');
  const [modelsList, setModelsList] = useState<{name: string, displayName: string, description: string}[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const fetchModelsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchGeminiImageModels();
      if (!res.success) throw new Error(res.error);
      return res.models;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setModelsList(data);
        setModel(data[0].name);
      }
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await generateImage(prompt, model);
      if (!res.success) throw new Error(res.error);
      return res.imageBase64;
    },
    onSuccess: (data) => {
      setResultImage(data || null);
    }
  });

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `auroranova-ai-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedModelData = modelsList.find(m => m.name === model);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">AI Görsel Stüdyosu (Nano Banana)</h1>
      <p className="text-sm text-zinc-400 mb-7">Gemini Image modelleri ile web siteniz için yüksek kaliteli görseller üretin.</p>

      {/* Input Panel */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 gap-5 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Görseli İngilizce Tarif Edin (Prompt)</label>
            <textarea 
              className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors resize-y min-h-[100px]" 
              placeholder="Example: A futuristic city skyline at sunset, cyberpunk style, hyperrealistic 4k"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center relative z-10">
              <label className="text-xs font-medium text-zinc-400">Kullanılacak AI Modeli</label>
              <div className="group relative">
                <span className="text-xs text-[#55efc4] cursor-help flex items-center gap-1 hover:text-[#42cfab] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  Hangi Modeli Seçmeliyim?
                </span>
                <div className="absolute right-0 top-6 w-80 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-[13px] text-zinc-300">
                  <p className="mb-3"><strong className="text-white block mb-0.5">🎨 Imagen Modelleri (Örn: imagen-3.0 / 4.0)</strong>Sadece görsel üretmek için özel olarak eğitilmiş en üst düzey modellerdir. Kusursuz ışıklandırma, fotogerçekçi sonuçlar ve resim içi metin yazımı için bunu seçin.</p>
                  <p><strong className="text-white block mb-0.5">🧪 Gemini Modelleri (Örn: gemini-3.1-flash)</strong>Deneysel melez (multimodal) modellerdir. Görsel üretebilirler ancak kalite ve detay kontrolü bakımından Imagen serisinin gerisinde kalırlar.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <select 
                  className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors flex-1"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {modelsList.length === 0 ? (
                    <>
                      <option value="imagen-3.0-generate-001">imagen-3.0-generate-001 (Varsayılan)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Deneysel)</option>
                    </>
                  ) : (
                    modelsList.map(m => (
                      <option key={m.name} value={m.name}>{m.name} ({m.displayName})</option>
                    ))
                  )}
                </select>
                <button 
                  onClick={() => fetchModelsMutation.mutate()}
                  disabled={fetchModelsMutation.isPending}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-lg whitespace-nowrap"
                >
                  {fetchModelsMutation.isPending ? 'Taranıyor...' : 'Modelleri Tarayıp Getir'}
                </button>
              </div>

              {selectedModelData && (
                <div 
                  className="p-3 bg-[#55efc4]/5 border-l-2 border-[#55efc4] rounded-r-md text-[13px] text-zinc-300 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const modelName = selectedModelData.name.toLowerCase();
                      if (modelName.includes('imagen') || modelName.includes('vision') || modelName.includes('image')) {
                        return `
                          <strong style="color:#fff;">Açıklama:</strong> Seçtiğiniz bu model görsel üretim (Image Generation) için optimize edilmiştir.<br><br>
                          <strong style="color:#fff;">En İyi Sonuç İçin Prompt İpuçları (Resmi Kılavuz):</strong>
                          <ul style="margin:8px 0 0 20px; padding:0; list-style-type: disc;">
                              <li><strong>Özne (Subject):</strong> Ana objeyi net belirtin (Örn: <em>Siyah bir kedi</em>).</li>
                              <li><strong>Ortam (Setting):</strong> Arka planı detaylandırın (Örn: <em>Neon ışıklı, yağmurlu bir sokak</em>).</li>
                              <li><strong>Işık & Stil (Style):</strong> Sanat tarzı ve ışık ekleyin (Örn: <em>Sinematik ışık, cyberpunk, 8k çözünürlük, fotogerçekçi</em>).</li>
                              <li><strong>İngilizce:</strong> Mümkünse komutları İngilizce verin.</li>
                          </ul>
                        `;
                      } else if (modelName.includes('flash')) {
                        return `
                          <strong style="color:#fff;">Açıklama:</strong> Google'ın hız ve verimlilik odaklı modelidir. Nano Banana gibi görsel/multimedya görevlerinde hızlı tepki verir.<br><br>
                          <strong style="color:#fff;">Genel Kural:</strong> Ne kadar spesifik, detaylı ve bağlamı net bir komut (prompt) girerseniz, o kadar iyi sonuç alırsınız.
                        `;
                      } else {
                        return `
                          <strong style="color:#fff;">Açıklama:</strong> ${selectedModelData.description || 'Bu Google AI modeli için özel bir kılavuz bulunmuyor.'}<br><br>
                          <strong style="color:#fff;">Genel Kural:</strong> Ne kadar spesifik, detaylı ve bağlamı net bir komut (prompt) girerseniz, o kadar iyi sonuç alırsınız.
                        `;
                      }
                    })()
                  }}
                />
              )}
            </div>
            
            {fetchModelsMutation.isError && (
              <span className="text-xs text-red-400 mt-1">Hata: {fetchModelsMutation.error?.message}</span>
            )}
            {fetchModelsMutation.isSuccess && (
              <span className="text-xs text-emerald-400 mt-1">{modelsList.length} model başarıyla getirildi.</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !prompt.trim()}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2"
          >
            {generateMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Üretiliyor...
              </>
            ) : 'Görsel Üret'}
          </button>
          
          {generateMutation.isError && (
            <span className="text-xs text-red-400">Hata: {generateMutation.error?.message}</span>
          )}
        </div>
      </div>

      {/* Output Panel */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
        <label className="text-xs font-medium text-zinc-400 block mb-3">Üretilen Görsel:</label>
        
        <div className="min-h-[300px] border border-dashed border-zinc-700/50 rounded-xl flex items-center justify-center mb-4 overflow-hidden bg-zinc-900/30 relative">
          {!resultImage ? (
            <span className="text-[13px] text-zinc-500">Sonuç burada görünecek...</span>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img src={resultImage} alt="Generated AI Image" className="max-w-full max-h-[600px] rounded-lg object-contain shadow-2xl" />
            </div>
          )}
        </div>

        {resultImage && (
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Bilgisayara İndir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}