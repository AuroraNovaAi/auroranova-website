'use client';

import { useState, useRef } from 'react';
import { getCloudinarySignature, generateTransformationUrl } from '@/app/actions/video-editor';

export default function VideoEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publicId, setPublicId] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPublicId(null);
      setResultUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10); // Start progress

      // 1. Get secure signature from backend
      const auth = await getCloudinarySignature();

      // 2. Prepare Form Data for direct upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', auth.apiKey || '');
      formData.append('timestamp', auth.timestamp.toString());
      formData.append('signature', auth.signature);
      formData.append('folder', auth.folder);

      // 3. Upload directly from browser to Cloudinary
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          // Keep it at 99% until Cloudinary confirms processing
          setProgress(percentComplete < 100 ? percentComplete : 99);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setPublicId(response.public_id);
          setProgress(100);
          setUploading(false);
        } else {
          console.error("Upload failed", xhr.responseText);
          alert('Yükleme başarısız oldu. Lütfen API anahtarlarınızı kontrol edin.');
          setUploading(false);
          setProgress(0);
        }
      };

      xhr.onerror = () => {
        console.error("Upload error");
        alert('İnternet bağlantısında bir sorun oluştu.');
        setUploading(false);
        setProgress(0);
      };

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${auth.cloudName}/video/upload`, true);
      xhr.send(formData);

    } catch (err) {
      console.error(err);
      alert('Yükleme başlatılamadı. .env.local ayarlarınızı kontrol edin.');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleAction = async (action: string) => {
    if (!publicId) return;

    try {
      setProcessing(true);
      const options = { start: startTime, end: endTime };
      const url = await generateTransformationUrl(publicId, action, options);
      
      setResultUrl(url);
    } catch (err) {
      console.error(err);
      alert('İşlem sırasında bir hata oluştu.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Klasik Video Editör</h1>
      <p className="text-sm text-zinc-400 mb-7">Videoları kesin, terse çevirin, klonlayın ve birleştirin (Sıfır Kalite Kaybı).</p>

      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-md mb-8">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">1. Video Dosyasını Seçin (Maks 100 MB)</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="video/mp4,video/webm,video/quicktime" 
              className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {file && !publicId && !uploading && (
              <button 
                onClick={handleUpload}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
              >
                Buluta Yükle
              </button>
            )}
          </div>

          {uploading && (
            <div className="w-full bg-zinc-900 rounded-full h-2.5 mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          {uploading && <p className="text-xs text-zinc-500">Yükleniyor... %{progress}</p>}
          
          {publicId && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Video buluta başarıyla yüklendi! Artık düzenleyebilirsiniz.
            </div>
          )}
        </div>
      </div>

      <div className={`transition-all duration-500 ${publicId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
          
          {/* Timeline Input */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-200 mb-3">2. İsteğe Bağlı: Zaman Aralığı Belirleyin (Saniye)</h2>
            <div className="flex gap-4 items-center">
              <input 
                type="number" 
                placeholder="Başlangıç (sn)" 
                min="0"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
              />
              <input 
                type="number" 
                placeholder="Bitiş (sn)" 
                min="0"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-xs text-zinc-500">(Boş bırakırsanız videonun tamamına uygulanır)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-200 mb-3">3. Uygulanacak İşlemi Seçin</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleAction('trim')} disabled={processing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50">Sadece Kes</button>
              <button onClick={() => handleAction('boomerang')} disabled={processing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50">Boomerang (İleri + Geri)</button>
              <button onClick={() => handleAction('reverse')} disabled={processing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50">Terse Çevir (Geri Sar)</button>
              <button onClick={() => handleAction('clone2x')} disabled={processing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50">Klonla (Peşpeşe Ekle)</button>
              <button onClick={() => handleAction('remove_audio')} disabled={processing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50">Sesi Sil (Sessiz Yap)</button>
            </div>
          </div>

          {/* Result Preview */}
          <div className="pt-6 border-t border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-200 mb-4">Sonuç (Önizleme & İndir)</h2>
            
            <div className="w-full bg-zinc-900 border border-zinc-800 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative">
              {processing && (
                <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Bulutta işleniyor... (URL oluşturuluyor)</span>
                  </div>
                </div>
              )}
              
              {!resultUrl && !processing ? (
                <span className="text-zinc-500 text-sm">Videoyu seçip bir işleme tıkladığınızda sonuç burada belirecek.</span>
              ) : resultUrl ? (
                <div className="w-full h-full flex flex-col items-center">
                  <video 
                    src={resultUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-[400px] w-full object-contain bg-black"
                  />
                  <div className="p-4 w-full flex justify-between items-center bg-zinc-950">
                    <p className="text-xs text-zinc-400">Not: Cloudinary videoyu ilk kez işlediği için video hemen açılmazsa 5-10 saniye bekleyin.</p>
                    <a 
                      href={resultUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      download
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Videoyu İndir
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}