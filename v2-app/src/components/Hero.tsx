export default function Hero() {
  return (
    <section className="hero" id="home">
            <div className="hero-content">
                <h1>AuroraNova</h1>
                <p className="subtitle">Where Creativity Meets Innovation</p>
                <p className="tagline">Aurora-inspired digital excellence transforming visions into digital reality through European design excellence and cutting-edge technology</p>
            </div>
    
            
            <div className="constellation">
                <div className="service-star star-1 visible" data-service="branding"></div>
                <div className="service-star star-2 visible" data-service="web"></div>
                <div className="service-star star-3 visible" data-service="seo"></div>
                <div className="service-star star-4 visible" data-service="marketing"></div>
                <div className="service-star star-5 visible" data-service="software"></div>
            </div>
    
            
            <div className="service-info" id="branding-info">
                <h3>Creative & Branding</h3>
                <p>European design excellence meets strategic brand development. From logos to complete visual identity systems that captivate and inspire.</p>
            </div>
    
            <div className="service-info" id="web-info">
                <h3>Web Development</h3>
                <p>Cutting-edge websites that captivate and convert. From concept to launch with technical precision and artistic vision.</p>
            </div>
    
            <div className="service-info" id="seo-info">
                <h3>SEO Excellence</h3>
                <p>Strategic optimization that puts your business at the top of search results and drives sustainable organic growth.</p>
            </div>
    
            <div className="service-info" id="marketing-info">
                <h3>Digital Marketing</h3>
                <p>Data-driven campaigns that generate qualified leads and build lasting customer relationships across all digital channels.</p>
            </div>
    
            <div className="service-info" id="software-info">
                <h3>Software / SaaS</h3>
                <p>Custom SaaS products and scalable software solutions built to grow with your business.</p>
            </div>
    
            <div className="scroll-indicator"><span data-translate="hero.scroll">Scroll to explore</span></div>
        </section>
  );
}