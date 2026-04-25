import { getBlogPostBySlug } from '@/app/actions/blog';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Yazı Bulunamadı | AuroraNova',
    };
  }

  return {
    title: `${post.titleTR} | AuroraNova Blog`,
    description: post.excerptTR || `AuroraNova Blog'da ${post.titleTR} yazısını okuyun.`,
    openGraph: {
      title: `${post.titleTR} | AuroraNova Blog`,
      description: post.excerptTR || `AuroraNova Blog'da ${post.titleTR} yazısını okuyun.`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8 text-sm font-medium text-zinc-500">
          <a href="/" className="hover:text-[#c5a059] transition-colors">Ana Sayfa</a>
          <span>/</span>
          <a href="/#blog" className="hover:text-[#c5a059] transition-colors">Blog</a>
          <span>/</span>
          <span className="text-zinc-300">{post.catTR || 'Kategori Yok'}</span>
        </div>

        <div className="mb-12">
          {post.imageUrl && (
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(197,160,89,0.1)] border border-white/5 mb-8">
              <Image 
                src={post.imageUrl} 
                alt={post.titleTR || 'Blog görseli'} 
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-[#c5a059] mb-4 font-medium uppercase tracking-wider">
            <span>{post.catTR || 'Blog'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/50"></span>
            <span className="text-zinc-500">{post.date}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
            <span className="text-zinc-500">{post.readTime || '3 min read'}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            {post.titleTR}
          </h1>
          
          <div className="flex items-center gap-3 mb-10 pb-10 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-400">
              {post.author ? post.author.charAt(0) : 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-300">{post.author || 'AuroraNova Ekibi'}</span>
              <span className="text-xs text-zinc-500">Yazar</span>
            </div>
          </div>
          
          {post.excerptTR && (
            <p className="text-xl text-zinc-400 mb-8 leading-relaxed font-medium italic">
              "{post.excerptTR}"
            </p>
          )}

          <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed 
            prose-headings:text-white prose-a:text-[#c5a059] hover:prose-a:text-[#d4af37]
            prose-img:rounded-xl prose-img:border prose-img:border-white/10">
            {/* Burada ReactMarkdown veya benzeri kullanılabilir ama şimdilik div içine basıyoruz */}
            <div dangerouslySetInnerHTML={{ __html: post.contentTR?.replace(/\n/g, '<br/>') || 'İçerik hazırlanıyor...' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
