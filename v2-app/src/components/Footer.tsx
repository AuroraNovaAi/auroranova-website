export default function Footer() {
  return (
    <footer className="site-footer">
            <div className="footer-grid">
                
                <div>
                    <div className="footer-brand-name">AuroraNova</div>
                    <p className="footer-tagline" id="footerTagline">European design excellence meets innovative digital solutions. We build experiences that inspire.</p>
                    <div className="footer-trust-badges">
                        <div className="footer-badge">
                            <span className="footer-badge-icon">&#x2601;</span>
                            <span id="footerBuiltWith">Built on Google Cloud &amp; Firebase</span>
                        </div>
                        <div className="footer-badge">
                            <span className="footer-badge-icon">&#x1F512;</span>
                            <span id="footerGdpr">GDPR compliant · European data centres</span>
                        </div>
                        <div className="footer-badge">
                            <span className="footer-badge-icon">&#x1F6E1;</span>
                            <span id="footerSsl">SSL secured · 99.9% uptime SLA</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div className="footer-col-title" id="footerQuickLinksTitle">Quick Links</div>
                    <ul className="footer-links">
                        <li><a href="#story"      data-i18n-nav="story">Story</a></li>
                        <li><a href="#method"    data-i18n-nav="method">Method</a></li>
                        <li><a href="#work"        data-i18n-nav="work">Work</a></li>
                        <li><a href="#blog"        data-i18n-nav="insights">Insights</a></li>
                        <li><a href="#contact"  data-i18n-nav="contact">Contact</a></li>
                    </ul>
                </div>
                
                <div>
                    <div className="footer-col-title" id="footerServicesTitle">Services</div>
                    <ul className="footer-links">
                        <li><a href="#contact"   data-i18n-service-footer="branding">Creative &amp; Branding</a></li>
                        <li><a href="#contact"        data-i18n-service-footer="web">Web Development</a></li>
                        <li><a href="#contact"        data-i18n-service-footer="seo">SEO Excellence</a></li>
                        <li><a href="#contact"  data-i18n-service-footer="marketing">Digital Marketing</a></li>
                        <li><a href="#contact"   data-i18n-service-footer="software">Software / SaaS</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <span className="footer-copyright" id="footerCopyright">© 2025 AuroraNova. All rights reserved.</span>
                <div className="footer-social">
                    <a href="mailto:tutku.eser@auroranovaai.com" id="footerPrivacyLink">Privacy Policy</a>
                </div>
            </div>
        </footer>
  );
}