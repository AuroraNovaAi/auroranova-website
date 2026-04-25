export default function Navbar() {
  return (
    <nav className="nav">
            <div className="nav-top">
                <div className="nav-top-auth" id="navTopAuth">
                    <button className="nav-top-login" id="navTopLoginBtn" >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span data-i18n="navLogin">Üye Girişi</span>
                    </button>
                    <button className="nav-top-profile" id="navTopProfileBtn" style={{display: 'none'}} >
                        <img id="navTopUserPhoto" className="nav-top-avatar" src="" alt="" />
                        <span id="navTopUserName"></span>
                    </button>
                </div>
                <div className="nav-top-lang">
                    <button className="lang-toggle-btn" id="langToggleBtn">EN</button>
                </div>
                <button className="nav-hamburger" id="navHamburger" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <div className="nav-links" id="navLinks">
                <a href="#home" data-i18n="home">Home</a>
                <a href="#story" data-i18n="story">Story</a>
                <a href="#method" data-i18n="method">Method</a>
                <a href="#work" data-i18n="work">Work</a>
                <a href="#blog" data-i18n="insights">Insights</a>
                <a href="#contact" data-i18n="contact">Contact</a>
                <div className="services-dropdown">
                    <button className="services-btn" data-i18n="services">Services</button>
                    <div className="services-menu">
                        <a href="#"  data-i18n-service="branding">Creative & Branding</a>
                        <a href="#"  data-i18n-service="web">Web Development</a>
                        <a href="#"  data-i18n-service="seo">SEO Excellence</a>
                        <a href="#"  data-i18n-service="marketing">Digital Marketing</a>
                        <a href="#"  data-i18n-service="software">Software / SaaS</a>
                    </div>
                </div>
            </div>
        </nav>
  );
}