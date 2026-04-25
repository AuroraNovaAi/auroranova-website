export default function AiVideoPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">AI Video Üretici</h1>
      <p className="text-sm text-zinc-400 mb-7">Metinden harika sinematik videolar yaratın.</p>
      
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-10 shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
        <span className="text-4xl mb-4">🎬</span>
        <h2 className="text-lg font-medium text-zinc-200 mb-2">AI Modülü Yükleniyor... (API Bekleniyor)</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Bu özellik için Luma, Runway veya benzeri bir video API entegrasyonu sağlandığında modül aktif edilecektir.</p>
      </div>
    </div>
  );
}