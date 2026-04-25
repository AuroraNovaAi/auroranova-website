'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@/app/actions/ai-text';
import { fetchGeminiModels } from '@/app/actions/ai-models';

export default function AiTextPage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [modelsList, setModelsList] = useState<{name: string, displayName: string, description: string}[]>([]);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchModelsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchGeminiModels();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.models;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setModelsList(data);
        setModel(data[0].name); // Select first dynamically fetched model
      }
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await generateText(prompt, model);
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.text;
    },
    onSuccess: (data) => {
      setResult(data || '');
      setCopied(false);
    }
  });

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedModelData = modelsList.find(m => m.name === model);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">AI Metin Asistanı</h1>
      <p className="text-sm text-zinc-400 mb-7">Gemini ile saniyeler içinde blog yazıları ve içerikler üretin.</p>

      {/* Input Panel */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 gap-5 mb-5">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Ne hakkında yazmak istersiniz?</label>
            <textarea 
              className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors resize-y min-h-[100px]" 
              placeholder="Örnek: 2026 web tasarım trendleri hakkında 3 paragraflık SEO uyumlu, ikna edici bir blog yazısı yaz. Türkçe olsun."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center relative z-10">
              <label className="text-xs font-medium text-zinc-400">Kullanılacak AI Modeli</label>
              <div className="group relative">
                <span className="text-xs text-indigo-400 cursor-help flex items-center gap-1 hover:text-indigo-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  Hangi Modeli Seçmeliyim?
                </span>
                <div className="absolute right-0 top-6 w-80 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-[13px] text-zinc-300">
                  <p className="mb-3"><strong className="text-white block mb-0.5">⚡ Flash Modeller (Örn: gemini-2.5-flash)</strong>Hız ve maliyet odaklıdır. Standart blog yazıları, makaleler ve SEO etiketleri üretmek için en ideal ve hızlı seçimdir.</p>
                  <p><strong className="text-white block mb-0.5">🧠 Pro Modeller (Örn: gemini-1.5-pro)</strong>Derin analiz gerektiren çok uzun, teknik ve karmaşık görevler içindir. Çıktı kalitesi çok yüksektir ancak çok daha yavaş çalışır.</p>
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
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Varsayılan - Hızlı)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Manuel Giriş)</option>
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

              {selectedModelData && selectedModelData.description && (
                <div className="p-3 bg-[#55efc4]/5 border-l-2 border-[#55efc4] rounded-r-md text-[13px] text-zinc-300 leading-relaxed">
                  {selectedModelData.description}
                </div>
              )}
            </div>

            {fetchModelsMutation.isError && (
              <span className="text-xs text-red-400 mt-1">Hata: {fetchModelsMutation.error?.message}</span>
            )}
            {fetchModelsMutation.isSuccess && (
              <span className="text-xs text-emerald-400 mt-1">{modelsList.length} model başarıyla getirildi. Listeden seçebilirsiniz.</span>
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
            ) : 'Üret'}
          </button>
          
          {generateMutation.isError && (
            <span className="text-xs text-red-400">Hata: {generateMutation.error?.message}</span>
          )}
        </div>
      </div>

      {/* Output Panel */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-zinc-400">Üretilen İçerik:</label>
          <button 
            onClick={handleCopy}
            disabled={!result}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
        </div>
        
        <textarea 
          readOnly
          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-[15px] leading-relaxed text-zinc-200 outline-none resize-y min-h-[300px] font-sans"
          placeholder="Sonuç burada görünecek..."
          value={result}
        />
      </div>
    </div>
  );
}