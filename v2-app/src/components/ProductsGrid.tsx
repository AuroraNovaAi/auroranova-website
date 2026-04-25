'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductsGrid({ products }: { products: any[] }) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    if (products.length === 0) {
        return <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', gridColumn: '1/-1'}}>Henüz ürün eklenmemiş.</div>;
    }

    let activeProducts = [...products];

    // Handle expired discounts
    activeProducts = activeProducts.map(p => {
        const product = { ...p };
        if (product.discountEndDate) {
            const endDate = new Date(product.discountEndDate);
            // If the discount has expired (end of that day), revert prices
            endDate.setHours(23, 59, 59, 999);
            if (endDate < new Date()) {
                if (product.originalPriceMonthly) product.priceMonthly = product.originalPriceMonthly;
                if (product.originalPriceYearly) product.priceYearly = product.originalPriceYearly;
                if (product.originalPriceLifetime) product.priceLifetime = product.originalPriceLifetime;
                
                product.originalPriceMonthly = undefined;
                product.originalPriceYearly = undefined;
                product.originalPriceLifetime = undefined;
            }
        }
        return product;
    });

    let maxDiscount = 0;
    activeProducts.forEach(p => {
        if (p.priceYearly && p.originalPriceYearly && p.originalPriceYearly > p.priceYearly) {
            const discount = Math.round(((p.originalPriceYearly - p.priceYearly) / p.originalPriceYearly) * 100);
            if (discount > maxDiscount) maxDiscount = discount;
        } else if (p.priceMonthly && p.priceYearly) {
            const totalMonthly = p.priceMonthly * 12;
            if (totalMonthly > p.priceYearly) {
                 const discount = Math.round(((totalMonthly - p.priceYearly) / totalMonthly) * 100);
                 if (discount > maxDiscount) maxDiscount = discount;
            }
        }
    });

    return (
        <>
            <div className="flex items-center justify-center gap-6 mb-12 mt-4 text-sm font-bold tracking-wide">
                <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`transition-colors duration-300 outline-none focus:outline-none bg-transparent border-none p-0 m-0 ${billingCycle === 'monthly' ? 'text-[#c5a059]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Aylık Ödeme
                </button>
                
                <span className="text-zinc-700 select-none text-xl font-light">/</span>
                
                <div className="relative flex flex-col items-center justify-center">
                    {maxDiscount > 0 && (
                        <span className={`absolute -top-5 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all duration-300 ${billingCycle === 'yearly' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-[0_0_10px_rgba(197,160,89,0.2)]' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'}`}>
                            %{maxDiscount} İndirim
                        </span>
                    )}
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`transition-colors duration-300 outline-none focus:outline-none bg-transparent border-none p-0 m-0 ${billingCycle === 'yearly' ? 'text-[#c5a059]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Yıllık Ödeme
                    </button>
                </div>
            </div>

            <div className="products-grid" id="productsGrid">
                {activeProducts.map((p) => {
                    const name = p.nameTR || p.nameEN || 'İsimsiz Ürün';
                    const desc = p.descriptionTR || p.descriptionEN || '';
                    const currency = p.currency || '₺';
                    
                    // Determine which price to show based on billing cycle
                    let currentPrice = p.priceLifetime;
                    let originalPrice = p.originalPriceLifetime;
                    let licenseLabel = 'Tek Seferlik';

                    if (billingCycle === 'monthly' && p.priceMonthly !== undefined) {
                        currentPrice = p.priceMonthly;
                        originalPrice = p.originalPriceMonthly;
                        licenseLabel = 'Aylık';
                    } else if (billingCycle === 'yearly' && p.priceYearly !== undefined) {
                        currentPrice = p.priceYearly;
                        originalPrice = p.originalPriceYearly;
                        licenseLabel = 'Yıllık';
                    } else if (p.priceMonthly !== undefined) { // Fallbacks
                        currentPrice = p.priceMonthly;
                        originalPrice = p.originalPriceMonthly;
                        licenseLabel = 'Aylık';
                    } else if (p.priceYearly !== undefined) {
                        currentPrice = p.priceYearly;
                        originalPrice = p.originalPriceYearly;
                        licenseLabel = 'Yıllık';
                    }

                    if (currentPrice === undefined) return null; // Skip if no price available
                    
                    const priceStr = currentPrice.toLocaleString('tr-TR');
                    const origPriceStr = originalPrice ? originalPrice.toLocaleString('tr-TR') : null;

                    let endDateStr = null;
                    if (p.discountEndDate && originalPrice && originalPrice > currentPrice) {
                        const endDate = new Date(p.discountEndDate);
                        if (endDate > new Date()) {
                            endDateStr = endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
                        }
                    }

                    return (
                        <div key={p.id} className="product-card relative overflow-hidden">
                            {endDateStr && (
                                <div className="absolute top-3 right-3 z-10 bg-[#c5a059] text-black text-[9px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    SON GÜN: {endDateStr}
                                </div>
                            )}
                            {p.imageUrl && (
                                <a href={`/services/${p.slug || p.id}`} className="block relative w-full h-[150px] mb-[15px] rounded-lg overflow-hidden">
                                  <Image src={p.imageUrl} alt={name} fill className="object-cover hover:opacity-80 transition-opacity" sizes="(max-width: 768px) 100vw, 300px" />
                                </a>
                            )}
                            <h3><a href={`/services/${p.slug || p.id}`} className="hover:text-[#c5a059] transition-colors">{name}</a></h3>
                            <div className="price flex items-baseline gap-2">
                                {origPriceStr && (
                                    <span className="text-sm text-zinc-500 line-through opacity-70">
                                        {currency}{origPriceStr}
                                    </span>
                                )}
                                <div>
                                    <span className="price-currency">{currency}</span>{priceStr}
                                </div>
                            </div>
                            <div className="license">{licenseLabel}</div>
                            <p>{desc}</p>
                            <div className="flex gap-3 mt-4">
                               <a href="#contact" className="btn flex-1 text-center">Hemen Başlayalım</a>
                               <a href={`/services/${p.slug || p.id}`} className="btn flex-1 text-center bg-transparent border border-white/20 hover:border-[#c5a059] hover:text-[#c5a059]">İncele</a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
