import { getGalleryItemBySlug } from '@/app/actions/gallery';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getGalleryItemBySlug(params.slug);
  
  if (!item) {
    return {
      title: 'Proje Bulunamadı | AuroraNova',
    };
  }

  return {
    title: `${item.titleTR || 'Proje'} | AuroraNova Portföy`,
    description: item.descTR || `AuroraNova'nın ${item.titleTR} projesi detaylarını inceleyin.`,
    openGraph: {
      title: `${item.titleTR || 'Proje'} | AuroraNova Portföy`,
      description: item.descTR || `AuroraNova'nın ${item.titleTR} projesi detaylarını inceleyin.`,
      images: item.imageUrl ? [{ url: item.imageUrl }] : [],
    },
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const item = await getGalleryItemBySlug(params.slug);

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8 text-sm font-medium text-zinc-500">
          <a href="/" className="hover:text-[#c5a059] transition-colors">Ana Sayfa</a>
          <span>/</span>
          <a href="/#work" className="hover:text-[#c5a059] transition-colors">Portföy</a>
          <span>/</span>
          <span className="text-zinc-300">{item.section.charAt(0).toUpperCase() + item.section.slice(1)}</span>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-4 text-sm text-[#c5a059] mb-4 font-bold uppercase tracking-widest">
            <span>CASE STUDY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/50"></span>
            <span className="text-zinc-500">{item.section}</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            {item.titleTR}
          </h1>
          
          {item.descTR && (
            <p className="text-xl md:text-2xl text-zinc-400 mb-10 leading-relaxed font-light">
              {item.descTR}
            </p>
          )}

          {item.imageUrl && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(197,160,89,0.15)] border border-white/10 mb-16">
              <Image 
                src={item.imageUrl} 
                alt={item.titleTR || 'Proje görseli'} 
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 md:text-lg leading-loose
            prose-headings:text-white prose-headings:font-semibold prose-a:text-[#c5a059] hover:prose-a:text-[#d4af37]
            prose-img:rounded-2xl prose-img:border prose-img:border-white/10">
            {item.fullContentTR ? (
              <div dangerouslySetInnerHTML={{ __html: item.fullContentTR.replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="text-zinc-500 italic">Bu proje için henüz detaylı içerik eklenmemiş.</p>
            )}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/10 flex justify-center">
            <a href="/#work" className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-white font-medium transition-all hover:border-[#c5a059]/50">
                &larr; Portföye Dön
            </a>
        </div>

      </div>
    </div>
  );
}
