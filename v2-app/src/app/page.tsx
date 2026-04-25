import './public.css';
import { getProducts } from '@/app/actions/products';
import { getBlogPosts } from '@/app/actions/blog';
import { getGalleryItems } from '@/app/actions/gallery';

import Image from 'next/image';
import ProductsGrid from '@/components/ProductsGrid';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

export default async function Home() {
  const products = await getProducts();
  const blogs = await getBlogPosts();
  
  const activeProducts = products.filter(p => p.active);
  const activeBlogs = blogs.filter(b => b.active);  
  
  const galleryItems = await getGalleryItems();
  const storyGallery = galleryItems.filter(i => i.section === 'story').sort((a,b) => a.order - b.order);
  const methodGallery = galleryItems.filter(i => i.section === 'method').sort((a,b) => a.order - b.order);
  const workGallery = galleryItems.filter(i => i.section === 'work').sort((a,b) => a.order - b.order);

  return (
    <div className="public-theme-wrapper">
      <video className="video-background" autoPlay muted loop playsInline preload="none">
          <source src="https://firebasestorage.googleapis.com/v0/b/auroranova-website.firebasestorage.app/o/scnfcpzwjmqz9pj5ahfp.mp4?alt=media" type="video/mp4" />
      </video>

      <Navbar />
      <Hero />

      <section className="section" id="story">
          <div className="section-content">
              <h2>Our Story</h2>
              <p>From European design excellence to innovative digital solutions, we craft experiences that transcend boundaries and redefine possibilities</p>

              <div className="photo-gallery">
                  {storyGallery.map(item => (
                      <div key={item.id} className="photo-card">
                          {item.imageUrl && (
                              <Image src={item.imageUrl} alt={item.titleTR || 'Gallery'} fill className="object-cover" />
                          )}
                          <div className="photo-overlay">
                              <h4>{item.titleTR || item.titleEN}</h4>
                              <p>{item.descTR || item.descEN}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      <section className="section" id="method">
          <div className="section-content">
              <h2>The AuroraNova Method</h2>
              <p>Our unique approach combines strategic thinking, creative excellence, and technical mastery to deliver transformative digital experiences</p>

              <div className="photo-gallery">
                  {methodGallery.map(item => (
                      <div key={item.id} className="photo-card">
                          {item.imageUrl && (
                              <Image src={item.imageUrl} alt={item.titleTR || 'Gallery'} fill className="object-cover" />
                          )}
                          <div className="photo-overlay">
                              <h4>{item.titleTR || item.titleEN}</h4>
                              <p>{item.descTR || item.descEN}</p>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="trust-bar" id="methodTrustBar">
                  <div className="trust-bar-item">
                      <span className="trust-bar-icon">&#x2615;</span>
                      <span data-i18n="trustGcloud">Google Cloud altyapısı</span>
                  </div>
                  <div className="trust-bar-divider"></div>
                  <div className="trust-bar-item">
                      <span className="trust-bar-icon">&#x1F512;</span>
                      <span data-i18n="trustGdpr">GDPR uyumlu</span>
                  </div>
                  <div className="trust-bar-divider"></div>
                  <div className="trust-bar-item">
                      <span className="trust-bar-icon">&#x26A1;</span>
                      <span data-i18n="trustRealtime">Gerçek zamanlı veri</span>
                  </div>
                  <div className="trust-bar-divider"></div>
                  <div className="trust-bar-item">
                      <span className="trust-bar-icon">&#x1F30D;</span>
                      <span data-i18n="trustEurope">Avrupa veri merkezleri</span>
                  </div>
              </div>
          </div>
      </section>

      <section className="section" id="products">
          <div className="section-content">
              <h2>Services & Packages</h2>
              <p>Transparent pricing and comprehensive service packages tailored for your digital transformation</p>
              <ProductsGrid products={activeProducts} />
          </div>
      </section>

      <section className="section" id="work">
          <div className="section-content">
              <h2>Work With Us</h2>
              <p>Ready to transform your digital presence? Let's create something extraordinary together</p>

              <div className="photo-gallery">
                  {workGallery.map(item => (
                      <a key={item.id} href={`/work/${item.slug || item.id}`} className="photo-card block">
                          {item.imageUrl && (
                              <Image src={item.imageUrl} alt={item.titleTR || 'Gallery'} fill className="object-cover" />
                          )}
                          <div className="photo-overlay">
                              <h4>{item.titleTR || item.titleEN}</h4>
                              <p>{item.descTR || item.descEN}</p>
                          </div>
                      </a>
                  ))}
              </div>
          </div>
      </section>

      <section className="section blog-section" id="blog">
          <div className="section-content">
              <h2>Insights & Innovation</h2>
              <p>Explore our latest thoughts on design, technology, and digital transformation</p>

              <div className="blog-grid">
                  {activeBlogs.length === 0 ? (
                      <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', gridColumn: '1/-1'}}>Henüz blog yazısı eklenmemiş.</div>
                  ) : (
                      activeBlogs.map((b) => {
                          return (
                              <a key={b.id} href={`/blog/${b.slug || b.id}`} className="blog-card blog-card-link" style={{display: 'block', textDecoration: 'none', color: 'inherit'}}>
                                  {b.imageUrl && (
                                      <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-white/5">
                                          <Image src={b.imageUrl} alt={b.titleTR || 'Blog görseli'} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                                      </div>
                                  )}
                                  <div className="blog-meta mt-2">
                                      <span className="blog-category">{b.catTR || b.catEN || 'Blog'}</span>
                                      <span>{b.date}</span>
                                  </div>
                                  <h3 className="hover:text-[#c5a059] transition-colors">{b.titleTR || b.titleEN}</h3>
                                  <p>{b.excerptTR || b.excerptEN}</p>
                                  <span className="read-more">Devamını Oku →</span>
                              </a>
                          );
                      })
                  )}
              </div>
          </div>
      </section>

      <section className="section" id="contact">
          <div className="section-content">
              <h2>Let's Create Together</h2>
              <p>Ready to embark on a journey of digital transformation? We're here to bring your vision to life</p>

              <div className="photo-gallery">
                  <div className="photo-card" >
                      <Image src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop&crop=center" alt="Get In Touch" loading="lazy" width="400" height="300" />
                      <div className="photo-overlay">
                          <h4>Start the Conversation</h4>
                          <p>tutku.eser@auroranovaai.com</p>
                      </div>
                  </div>
                  <div className="photo-card" >
                      <Image src="/assets/izmir.jpg" alt="Izmir" loading="lazy" width="400" height="300" />
                      <div className="photo-overlay">
                          <h4>Our Base</h4>
                          <p>Izmir, Turkey - Gateway to Civilization</p>
                      </div>
                  </div>
                  <div className="photo-card" >
                      <Image src="https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=300&fit=crop&crop=center" alt="Let's Meet" loading="lazy" width="400" height="300" />
                      <div className="photo-overlay">
                          <h4>Let's Collaborate</h4>
                          <p>Schedule a consultation to discuss your project</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <Footer />

      <div id="auth-modal" style={{display: 'none'}} role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
          <div className="auth-overlay" ></div>
          <div className="auth-box" >
              <button className="auth-close"  aria-label="Kapat">&#x2715;</button>
              <div className="auth-logo">&#x2728;</div>
              <h3 id="authModalTitle" data-i18n="authTitle">AuroraNova'ya Hoş Geldiniz</h3>
              <p data-i18n="authDesc">Ürün ve hizmetlerinize erişmek için giriş yapın</p>
              <button className="google-btn" >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span data-i18n="googleBtn">Google ile Giriş Yap</span>
              </button>
              <div id="auth-error" className="auth-error"></div>
              <p className="auth-divider" data-i18n="authPrivacy">Giriş yaparak gizlilik politikamızı kabul etmiş olursunuz.</p>
          </div>
      </div>

      <div id="member-dashboard" style={{display: 'none'}} role="dialog" aria-modal="true" aria-labelledby="dashboardTitle">
          <div className="dashboard-overlay" ></div>
          <div className="dashboard-box" >
              <div className="dashboard-header">
                  <img id="dashUserPhoto" className="dashboard-avatar" src="" alt="" />
                  <div className="dashboard-user-info">
                      <span id="dashUserName" className="dashboard-name"></span>
                      <span id="dashUserEmail" className="dashboard-email"></span>
                  </div>
                  <div className="dashboard-header-actions">
                      <button className="dashboard-signout-btn" >
                          <span data-i18n="signOut">Çıkış Yap</span>
                      </button>
                      <button className="dashboard-close"  aria-label="Kapat">&#x2715;</button>
                  </div>
              </div>
              <div className="dashboard-body">
                  <p className="dashboard-section-title" id="dashboardTitle" data-i18n="myProducts">Ürünlerim</p>
                  <div id="dashProductList">
                      <div className="dashboard-empty">
                          <span className="dashboard-empty-icon">&#x1F4E6;</span>
                          <p data-i18n="noProducts">Henüz bir ürününüz bulunmuyor.</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}
