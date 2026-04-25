import Link from 'next/link';

export default function AdminTopbar() {
  return (
    <header className="h-[54px] bg-zinc-950/80 border-b border-zinc-800 flex items-center px-5 gap-4 sticky top-0 z-50 shrink-0 backdrop-blur-md">
      <div className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
        <em className="text-[#97B3E8] not-italic">Aurora</em>Nova
      </div>
      <span className="text-[9px] tracking-[1.5px] uppercase text-[#C19E6A] bg-[#C19E6A]/10 border border-[#C19E6A]/25 rounded px-1.5 py-0.5">
        Admin
      </span>
      <div className="flex-1" />
      <span className="text-xs text-white/50 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
        Admin User
      </span>
      <Link href="/" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/55 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
        &larr; Siteye Dön
      </Link>
      <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/55 text-xs font-medium hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-colors">
        Çıkış
      </button>
    </header>
  );
}
