'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/members', icon: '👥', label: 'Üyeler' },
  { href: '/admin/products', icon: '📦', label: 'Ürünler' },
  { href: '/admin/submissions', icon: '📨', label: 'Başvurular' },
  { href: '/admin/settings', icon: '⚙️', label: 'Ayarlar' },
];

const contentItems = [
  { href: '/admin/content', icon: '✏️', label: 'Site İçeriği' },
  { href: '/admin/blog', icon: '📝', label: 'Blog' },
  { href: '/admin/gallery', icon: '🖼️', label: 'Galeri' },
];

const aiItems = [
  { href: '/admin/ai-text', icon: '🧠', label: 'AI Metin' },
  { href: '/admin/ai-image', icon: '🎨', label: 'AI Görsel' },
  { href: '/admin/ai-video', icon: '🎬', label: 'AI Video' },
  { href: '/admin/video-editor', icon: '✂️', label: 'Video Editör' },
];

function NavItem({ href, icon, label, isActive }: { href: string, icon: string, label: string, isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all mb-1 ${
        isActive 
          ? 'bg-indigo-500 text-white shadow-[0_2px_8px_rgba(99,102,241,0.25)]' 
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
      }`}
    >
      <span className="text-[15px] w-5 text-center shrink-0">{icon}</span>
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <nav className="w-[200px] bg-zinc-950 border-r border-zinc-800 shrink-0 p-4 sticky top-[54px] h-[calc(100vh-54px)] overflow-y-auto">
      {navItems.map(item => (
        <NavItem key={item.href} {...item} isActive={pathname === item.href} />
      ))}
      <div className="h-px bg-white/10 my-2" />
      {contentItems.map(item => (
        <NavItem key={item.href} {...item} isActive={pathname === item.href} />
      ))}
      <div className="h-px bg-white/10 my-2" />
      {aiItems.map(item => (
        <NavItem key={item.href} {...item} isActive={pathname === item.href} />
      ))}
    </nav>
  );
}
