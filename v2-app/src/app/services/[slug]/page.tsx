import { getProductBySlug } from '@/app/actions/products';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Hizmet Bulunamadı | AuroraNova',
    };
  }

  return {
    title: `${product.nameTR} | AuroraNova`,
    description: product.descriptionTR || `AuroraNova'nın ${product.nameTR} hizmetini keşfedin.`,
    openGraph: {
      title: `${product.nameTR} | AuroraNova`,
      description: product.descriptionTR || `AuroraNova'nın ${product.nameTR} hizmetini keşfedin.`,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8 text-sm font-medium text-zinc-500">
          <a href="/" className="hover:text-[#c5a059] transition-colors">Ana Sayfa</a>
          <span>/</span>
          <a href="/#services" className="hover:text-[#c5a059] transition-colors">Hizmetler</a>
          <span>/</span>
          <span className="text-zinc-300">{product.nameTR}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div>
            {product.imageUrl ? (
              <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(197,160,89,0.1)] border border-white/5">
                <Image 
                  src={product.imageUrl} 
                  alt={product.nameTR} 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-video md:aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
                <span className="text-zinc-600">Görsel Yok</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="inline-block px-3 py-1 bg-[#c5a059]/10 text-[#c5a059] rounded-full text-xs font-bold uppercase tracking-widest w-max mb-4 border border-[#c5a059]/20">
              {product.type === 'service' ? 'Kurumsal Hizmet' : 'Yazılım Çözümü'}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
              {product.nameTR}
            </h1>
            
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              {product.descriptionTR || 'Bu hizmet için henüz detaylı bir açıklama girilmemiştir.'}
            </p>
            
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl mb-8 backdrop-blur-sm">
               {/* Fiyat Gösterimi (Basit) */}
               <div className="text-sm text-zinc-400 mb-2 font-medium">Başlangıç Fiyatı</div>
               <div className="text-3xl font-bold text-[#c5a059]">
                 {product.currency || '₺'}
                 {product.priceMonthly?.toLocaleString('tr-TR') || product.priceYearly?.toLocaleString('tr-TR') || product.priceLifetime?.toLocaleString('tr-TR') || 'İletişime Geçin'}
                 {product.priceMonthly ? <span className="text-base text-zinc-500 font-normal"> /ay</span> : ''}
               </div>
            </div>

            <a 
              href="/#contact" 
              className="px-8 py-4 bg-[#c5a059] text-black rounded-lg font-bold text-center hover:bg-[#d4af37] transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:shadow-[0_0_30px_rgba(197,160,89,0.5)]"
            >
              Hemen Başvur & Kuruluma Başla
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
