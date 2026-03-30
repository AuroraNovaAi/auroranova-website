        // =================================================================
        // AURORANOVA CONTENT MANAGEMENT SYSTEM
        // =================================================================

        // PHOTO CONTENT DATABASE
        const photoContent = {
            PHOTO_STORY_01: {
                title: "Collaborative Excellence",
                description: "Building innovative solutions through seamless teamwork and shared vision",
                fullContent: "At AuroraNova, collaboration isn't just a buzzword—it's the cornerstone of our creative process. Our multidisciplinary team brings together designers, developers, strategists, and innovators who work in perfect harmony to transform your vision into digital reality. We believe that the best solutions emerge when diverse minds come together with a shared purpose.",
                image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop"
            },
            PHOTO_STORY_02: {
                title: "European Design Heritage",
                description: "Timeless design principles meet contemporary digital innovation",
                fullContent: "Our design philosophy is deeply rooted in centuries of European aesthetic excellence, from the clean lines of Scandinavian minimalism to the sophisticated elegance of Italian craftsmanship. We blend these timeless principles with cutting-edge digital innovation to create experiences that are both beautiful and functional.",
                image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop"
            },
            PHOTO_STORY_03: {
                title: "Innovation at Core",
                description: "Where creative vision meets technological excellence",
                fullContent: "Innovation drives everything we do at AuroraNova. We're constantly exploring new technologies, design methodologies, and creative approaches to stay ahead of the curve. Our commitment to innovation ensures that your digital presence isn't just current—it's future-ready.",
                image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop"
            },
            PHOTO_METHOD_01: {
                title: "Strategic Foundation",
                description: "Every project begins with deep strategic analysis and planning",
                fullContent: "Strategy is the foundation upon which all great digital experiences are built. Our strategic process involves comprehensive market research, user analysis, competitor evaluation, and business goal alignment. We don't just create beautiful designs—we create solutions that drive real business results.",
                image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
            },
            PHOTO_METHOD_02: {
                title: "Creative Mastery",
                description: "Beautiful, functional design that tells your story",
                fullContent: "Our creative process balances artistic vision with user-centered design principles. We craft visual narratives that not only capture attention but also guide users toward meaningful interactions. Every color, typography choice, and layout decision is made with intention and purpose.",
                image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop"
            },
            PHOTO_METHOD_03: {
                title: "Technical Excellence",
                description: "Cutting-edge development and seamless AI integration",
                fullContent: "Technical excellence is non-negotiable in our development process. We leverage the latest technologies, frameworks, and AI tools to build solutions that are not only visually stunning but also performant, scalable, and secure. Our code is clean, our architecture is robust, and our integrations are seamless.",
                image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop"
            },
            PHOTO_WORK_01: {
                title: "Web Development",
                description: "Modern, responsive websites that drive results",
                fullContent: "Our web development services encompass everything from simple landing pages to complex web applications. We specialize in creating responsive, fast-loading, and SEO-optimized websites that provide exceptional user experiences across all devices and browsers.",
                image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop"
            },
            PHOTO_WORK_02: {
                title: "Brand Identity",
                description: "Distinctive branding that sets you apart",
                fullContent: "Brand identity goes beyond just a logo—it's the complete visual and emotional expression of your company's values, personality, and promise. We create comprehensive brand systems that ensure consistency and recognition across all touchpoints.",
                image: "assets/yapay-zeka-0704.jpg"
            },
            PHOTO_WORK_03: {
                title: "Digital Growth",
                description: "AI-powered solutions for sustainable business growth",
                fullContent: "Our digital growth strategies combine traditional marketing wisdom with cutting-edge AI technologies. We help businesses scale efficiently through data-driven decision making, automated processes, and intelligent optimization techniques.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
            }
        };

        // BLOG CONTENT DATABASE
        const blogContent = {
            BLOG_POST_01: {
                category: "Design Trends",
                date: "January 25, 2025",
                title: "The Future of Digital Design: Aurora-Inspired Aesthetics",
                excerpt: "Discover how natural phenomena like the Northern Lights are inspiring a new wave of digital design that combines organic beauty with technological precision.",
                content: "The Northern Lights have captivated humanity for millennia, their ethereal dance across the polar skies representing nature's most spectacular light show. Today, forward-thinking designers are drawing inspiration from these celestial phenomena to create digital experiences that feel both otherworldly and deeply human. Aurora-inspired design represents more than just a visual trend—it's a philosophy that embraces fluidity, dynamism, and the seamless blend of natural beauty with technological innovation. This approach to design prioritizes organic movement, gradient transitions, and luminous effects that mirror the aurora's mystical qualities while serving modern usability requirements.",
                author: "AuroraNova Design Team",
                readTime: "5 min read",
                tags: ["Design", "Trends", "Aurora", "Digital Art"]
            },
            BLOG_POST_02: {
                category: "AI Innovation",
                date: "January 20, 2025",
                title: "AI-Powered Creativity: Enhancing Human Design",
                excerpt: "How artificial intelligence is revolutionizing the creative process while preserving the essential human touch that makes design truly meaningful.",
                content: "The relationship between artificial intelligence and human creativity is not one of replacement, but of enhancement and collaboration. At AuroraNova, we've witnessed firsthand how AI tools can amplify human creativity, providing designers with new capabilities while preserving the intuition, empathy, and cultural understanding that only humans can bring to the creative process. AI excels at pattern recognition, rapid iteration, and handling repetitive tasks, freeing human designers to focus on strategic thinking, emotional resonance, and innovative problem-solving. This symbiotic relationship is creating a new era of design where technology serves as an intelligent partner rather than a replacement for human creativity.",
                author: "Tech Innovation Team",
                readTime: "7 min read",
                tags: ["AI", "Creativity", "Innovation", "Design Process"]
            },
            BLOG_POST_03: {
                category: "Web Development",
                date: "January 15, 2025",
                title: "Building Immersive Web Experiences",
                excerpt: "The technical and creative considerations behind crafting websites that captivate users and drive meaningful engagement in 2025.",
                content: "Creating immersive web experiences in 2025 requires a delicate balance of cutting-edge technology and user-centered design principles. Modern web browsers now support advanced features like WebGL, WebXR, and sophisticated CSS animations that enable developers to create experiences that were once impossible on the web. However, the key to successful immersive design lies not in using every available technology, but in carefully selecting the right tools to enhance the user's journey. Performance optimization, accessibility considerations, and progressive enhancement ensure that these immersive experiences are inclusive and functional across diverse devices and connection speeds.",
                author: "Development Team",
                readTime: "6 min read",
                tags: ["Web Development", "UX", "Performance", "Technology"]
            },
            BLOG_POST_04: {
                category: "Brand Strategy",
                date: "January 10, 2025",
                title: "European Design Philosophy in Digital Branding",
                excerpt: "How centuries of European design tradition inform modern digital branding strategies that resonate across cultures and generations.",
                content: "European design philosophy has shaped aesthetic sensibilities for centuries, from the mathematical precision of classical architecture to the functional beauty of Bauhaus principles. In the digital age, these time-tested design philosophies provide a foundation for creating brand identities that feel both timeless and contemporary. The European approach to design emphasizes craftsmanship, attention to detail, and the belief that good design should be both beautiful and functional. When applied to digital branding, these principles result in visual identities that possess depth, sophistication, and enduring appeal across diverse global markets.",
                author: "Brand Strategy Team",
                readTime: "8 min read",
                tags: ["Branding", "European Design", "Philosophy", "Strategy"]
            }
        };

        // CONTACT INFORMATION
        const contactInfo = {
            email: "inanc.eser@auroranovaai.com",
            location: "Izmir, Turkey",
            phone: "+90 XXX XXX XXXX",
            linkedin: "https://linkedin.com/company/auroranova",
            calendly: "https://calendly.com/auroranova"
        };

        // =================================================================
        // INTERACTION FUNCTIONS
        // =================================================================

        // Photo Modal Function
        function openPhotoModal(photoId) {
            const photo = photoContent[photoId];
            if (!photo) {
                console.log(`Photo ${photoId} not found`);
                return;
            }

            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                    padding: 20px;
                " onclick="this.parentElement.remove()">
                    <div style="
                        background: var(--glass-bg);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 800px;
                        max-height: 90vh;
                        overflow-y: auto;
                        color: white;
                        text-align: center;
                    " onclick="event.stopPropagation()">
                        <img src="${photo.image}" style="
                            width: 100%;
                            max-width: 600px;
                            height: auto;
                            border-radius: 15px;
                            margin-bottom: 20px;
                        ">
                        <h2 style="color: var(--secondary-blue); margin-bottom: 15px;">${photo.title}</h2>
                        <p style="margin-bottom: 20px; color: var(--text-secondary); font-size: 1.1rem;">${photo.description}</p>
                        <p style="color: var(--text-muted); line-height: 1.6; text-align: left;">${photo.fullContent}</p>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 500;
                            margin-top: 20px;
                        ">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Blog Post Function
        function openBlogPost(blogId) {
            const blog = blogContent[blogId];
            if (!blog) {
                console.log(`Blog post ${blogId} not found`);
                return;
            }

            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                    padding: 20px;
                " onclick="this.parentElement.remove()">
                    <div style="
                        background: var(--glass-bg);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 900px;
                        max-height: 90vh;
                        overflow-y: auto;
                        color: white;
                        text-align: left;
                    " onclick="event.stopPropagation()">
                        <div style="margin-bottom: 20px;">
                            <span style="
                                background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                                color: white;
                                padding: 6px 15px;
                                border-radius: 20px;
                                font-size: 0.9rem;
                                margin-right: 15px;
                            ">${blog.category}</span>
                            <span style="color: var(--text-muted);">${blog.date}</span>
                            <span style="color: var(--text-muted); margin-left: 15px;">${blog.readTime}</span>
                        </div>
                        <h2 style="color: var(--secondary-blue); margin-bottom: 20px; line-height: 1.3;">${blog.title}</h2>
                        <p style="margin-bottom: 25px; color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6;">${blog.excerpt}</p>
                        <div style="color: var(--text-primary); line-height: 1.8; margin-bottom: 30px;">${blog.content}</div>
                        <div style="margin-bottom: 20px;">
                            <span style="color: var(--text-muted); font-size: 0.9rem;">By ${blog.author}</span>
                        </div>
                        <div style="text-align: center;">
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" style="
                                background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                                color: white;
                                border: none;
                                padding: 12px 25px;
                                border-radius: 25px;
                                cursor: pointer;
                                font-weight: 500;
                            ">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Contact Functions
        function initiateContact(type) {
            if (type === 'email') {
                window.location.href = `mailto:${contactInfo.email}?subject=AuroraNova Collaboration Inquiry`;
            }
        }

        function contactService(serviceKey) {
            const t = translations[currentLang];
            const serviceTitle = t.services[serviceKey] ? t.services[serviceKey].title : serviceKey;
            const subject = encodeURIComponent(serviceTitle + ' - Hizmet Talebi');
            const body = encodeURIComponent('Merhaba AuroraNova,\n\n' + serviceTitle + ' hizmetiniz hakkında bilgi almak istiyorum.\n\nAdım:\nFirmam:\nTelefon:');
            window.location.href = `mailto:${contactInfo.email}?subject=${subject}&body=${body}`;
        }

        function viewLocation() {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                " onclick="this.parentElement.remove()">
                    <div style="
                        background: var(--glass-bg);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        padding: 40px;
                        color: white;
                        text-align: center;
                        max-width: 500px;
                    " onclick="event.stopPropagation()">
                        <h2 style="color: var(--secondary-blue); margin-bottom: 20px;">Our Location</h2>
                        <p style="margin-bottom: 15px; color: var(--text-secondary); font-size: 1.1rem;">${contactInfo.location}</p>
                        <p style="color: var(--text-muted); margin-bottom: 25px;">Where European design heritage meets innovative digital solutions</p>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        function scheduleMeeting() {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                " onclick="this.parentElement.remove()">
                    <div style="
                        background: var(--glass-bg);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        padding: 40px;
                        color: white;
                        text-align: center;
                        max-width: 500px;
                    " onclick="event.stopPropagation()">
                        <h2 style="color: var(--secondary-blue); margin-bottom: 20px;">Schedule a Consultation</h2>
                        <p style="margin-bottom: 20px; color: var(--text-secondary);">Ready to discuss your project? Let's set up a time to talk.</p>
                        <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 0.9rem;">
                            Email us at: <br>
                            <a href="mailto:${contactInfo.email}" style="color: var(--secondary-blue); text-decoration: none;">${contactInfo.email}</a>
                        </p>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // =================================================================
        // ANIMATION AND SCROLL SYSTEM
        // =================================================================

        // Enhanced Scroll Animations - Repeating
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section, .blog-section').forEach(section => {
            sectionObserver.observe(section);
        });

        // Service Star Interactions
        const stars = document.querySelectorAll('.service-star');
        const serviceInfos = document.querySelectorAll('.service-info');

        stars.forEach(star => {
            let activeInfo = null;
            let hoverTimeout = null;

            star.addEventListener('mouseenter', (e) => {
                clearTimeout(hoverTimeout);
                const service = e.target.dataset.service;
                const info = document.getElementById(service + '-info');

                if (info) {
                    const rect = e.target.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    let left = rect.left + 40;
                    let top = rect.top - 10;

                    if (left + 320 > viewportWidth) {
                        left = rect.left - 340;
                    }
                    if (top + 150 > viewportHeight) {
                        top = rect.top - 160;
                    }

                    info.style.left = Math.max(20, left) + 'px';
                    info.style.top = Math.max(20, top) + 'px';

                    info.classList.add('show');
                    activeInfo = info;
                }
            });

            star.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    if (activeInfo) {
                        activeInfo.classList.remove('show');
                        activeInfo = null;
                    }
                }, 300);
            });

            star.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

                const notification = document.createElement('div');
                notification.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: var(--glass-bg);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        padding: 30px;
                        color: white;
                        text-align: center;
                        z-index: 10000;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                        animation: fadeInScale 0.3s ease-out;
                    ">
                        <h3 style="color: var(--secondary-blue); margin-bottom: 15px;">${serviceName} Services</h3>
                        <p style="margin-bottom: 20px; color: var(--text-secondary);">Our ${serviceName.toLowerCase()} services page is currently under development. We're crafting something extraordinary!</p>
                        <button onclick="this.parentElement.parentElement.remove()" style="
                            background: linear-gradient(45deg, var(--primary-purple), var(--secondary-blue));
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Got it</button>
                    </div>
                `;
                document.body.appendChild(notification);

                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 5000);
            });
        });

        // Smooth Navigation
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Enhanced mouse magnet effect for stars
        document.addEventListener('mousemove', (e) => {
            stars.forEach(star => {
                const rect = star.getBoundingClientRect();
                const starX = rect.left + rect.width / 2;
                const starY = rect.top + rect.height / 2;

                const distance = Math.sqrt(
                    Math.pow(e.clientX - starX, 2) + Math.pow(e.clientY - starY, 2)
                );

                if (distance < 150) {
                    const intensity = (150 - distance) / 150;
                    const deltaX = (e.clientX - starX) * intensity * 0.1;
                    const deltaY = (e.clientY - starY) * intensity * 0.1;

                    star.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${1 + intensity * 0.2})`;
                } else {
                    star.style.transform = 'translate(0px, 0px) scale(1)';
                }
            });
        });

        // Video optimization
        document.addEventListener('DOMContentLoaded', function() {
            const video = document.querySelector('.video-background');

            if (video && window.innerWidth > 768) {
                video.addEventListener('error', () => {
                    console.log('Video failed to load, using gradient background');
                    document.querySelector('.hero').style.background = 'linear-gradient(135deg, #001122, #003344, #001122)';
                });
            }
        });

        // Add CSS animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInScale {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        // =================================================================
        // LANGUAGE SYSTEM
        // =================================================================

        let currentLang = localStorage.getItem('auroranova_lang') || 'tr';

        function setLanguage(lang) {
            currentLang = lang;
            localStorage.setItem('auroranova_lang', lang);
            const t = translations[lang];

            document.documentElement.lang = lang;

            // Nav links
            const navLinks = document.querySelectorAll('.nav a[data-i18n]');
            navLinks.forEach(link => {
                const key = link.getAttribute('data-i18n');
                if (t.nav[key]) link.textContent = t.nav[key];
            });

            // Services button
            const servicesBtn = document.querySelector('.services-btn');
            if (servicesBtn) servicesBtn.textContent = t.nav.services;

            // Services menu items
            document.querySelectorAll('.services-menu a[data-i18n-service]').forEach(item => {
                const key = item.getAttribute('data-i18n-service');
                if (t.services[key]) item.textContent = t.services[key].title;
            });

            // Hero
            const heroSubtitle = document.querySelector('.hero .subtitle');
            const heroTagline = document.querySelector('.hero .tagline');
            if (heroSubtitle) heroSubtitle.textContent = t.hero.subtitle;
            if (heroTagline) heroTagline.textContent = t.hero.tagline;

            // Service info popups
            const serviceMap = ['branding', 'web', 'seo', 'marketing', 'ai'];
            serviceMap.forEach(key => {
                const el = document.getElementById(key + '-info');
                if (el && t.services[key]) {
                    el.querySelector('h3').textContent = t.services[key].title;
                    el.querySelector('p').textContent = t.services[key].desc;
                }
            });

            // Sections: heading + description + photo overlays
            const sections = ['story', 'method', 'work', 'contact'];
            sections.forEach(sec => {
                const el = document.getElementById(sec);
                if (!el || !t[sec]) return;
                const h2 = el.querySelector('h2');
                const p = el.querySelector('.section-content > p');
                if (h2) h2.textContent = t[sec].heading;
                if (p) p.textContent = t[sec].desc;
                const cards = el.querySelectorAll('.photo-card');
                cards.forEach((card, i) => {
                    const n = i + 1;
                    const h4 = card.querySelector('.photo-overlay h4');
                    const cp = card.querySelector('.photo-overlay p');
                    if (h4 && t[sec]['photo' + n + '_title']) h4.textContent = t[sec]['photo' + n + '_title'];
                    if (cp && t[sec]['photo' + n + '_desc']) cp.textContent = t[sec]['photo' + n + '_desc'];
                });
            });

            // Blog section
            const blogEl = document.getElementById('blog');
            if (blogEl && t.blog) {
                const h2 = blogEl.querySelector('h2');
                const p = blogEl.querySelector('.section-content > p');
                if (h2) h2.textContent = t.blog.heading;
                if (p) p.textContent = t.blog.desc;
                const posts = ['post1', 'post2', 'post3', 'post4', 'post5', 'post6', 'post7', 'post8', 'post9', 'post10', 'post11', 'post12', 'post13', 'post14', 'post15', 'post16'];
                const cards = blogEl.querySelectorAll('.blog-card');
                cards.forEach((card, i) => {
                    const key = posts[i];
                    if (!key) return;
                    const cat = card.querySelector('.blog-category');
                    const dateSpan = card.querySelector('.blog-meta span:not(.blog-category)');
                    const h3 = card.querySelector('h3');
                    const excerpt = card.querySelector('p');
                    const readMore = card.querySelector('.read-more');
                    if (cat && t.blog[key + '_cat']) cat.textContent = t.blog[key + '_cat'];
                    if (dateSpan && t.blog[key + '_date']) dateSpan.textContent = t.blog[key + '_date'];
                    if (h3 && t.blog[key + '_title']) h3.textContent = t.blog[key + '_title'];
                    if (excerpt && t.blog[key + '_excerpt']) excerpt.textContent = t.blog[key + '_excerpt'];
                    if (readMore) readMore.textContent = t.blog.readMore;
                });
            }

            // Language switcher buttons active state
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('lang-btn--active', btn.getAttribute('data-lang') === lang);
            });

            // Swap photo/blog content databases for modals
            if (lang === 'tr') {
                Object.assign(photoContent, photoContentTR);
                Object.assign(blogContent, blogContentTR);
            } else {
                Object.assign(photoContent, {
                    PHOTO_STORY_01: { title: "Collaborative Excellence", description: "Building innovative solutions through seamless teamwork and shared vision", fullContent: "At AuroraNova, collaboration isn't just a buzzword—it's the cornerstone of our creative process. Our multidisciplinary team brings together designers, developers, strategists, and innovators who work in perfect harmony to transform your vision into digital reality. We believe that the best solutions emerge when diverse minds come together with a shared purpose.", image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop" },
                    PHOTO_STORY_02: { title: "European Design Heritage", description: "Timeless design principles meet contemporary digital innovation", fullContent: "Our design philosophy is deeply rooted in centuries of European aesthetic excellence, from the clean lines of Scandinavian minimalism to the sophisticated elegance of Italian craftsmanship. We blend these timeless principles with cutting-edge digital innovation to create experiences that are both beautiful and functional.", image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop" },
                    PHOTO_STORY_03: { title: "Innovation at Core", description: "Where creative vision meets technological excellence", fullContent: "Innovation drives everything we do at AuroraNova. We're constantly exploring new technologies, design methodologies, and creative approaches to stay ahead of the curve. Our commitment to innovation ensures that your digital presence isn't just current—it's future-ready.", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop" },
                    PHOTO_METHOD_01: { title: "Strategic Foundation", description: "Every project begins with deep strategic analysis and planning", fullContent: "Strategy is the foundation upon which all great digital experiences are built. Our strategic process involves comprehensive market research, user analysis, competitor evaluation, and business goal alignment. We don't just create beautiful designs—we create solutions that drive real business results.", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop" },
                    PHOTO_METHOD_02: { title: "Creative Mastery", description: "Beautiful, functional design that tells your story", fullContent: "Our creative process balances artistic vision with user-centered design principles. We craft visual narratives that not only capture attention but also guide users toward meaningful interactions. Every color, typography choice, and layout decision is made with intention and purpose.", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop" },
                    PHOTO_METHOD_03: { title: "Technical Excellence", description: "Cutting-edge development and seamless AI integration", fullContent: "Technical excellence is non-negotiable in our development process. We leverage the latest technologies, frameworks, and AI tools to build solutions that are not only visually stunning but also performant, scalable, and secure. Our code is clean, our architecture is robust, and our integrations are seamless.", image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop" },
                    PHOTO_WORK_01: { title: "Web Development", description: "Modern, responsive websites that drive results", fullContent: "Our web development services encompass everything from simple landing pages to complex web applications. We specialize in creating responsive, fast-loading, and SEO-optimized websites that provide exceptional user experiences across all devices and browsers.", image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop" },
                    PHOTO_WORK_02: { title: "Brand Identity", description: "Distinctive branding that sets you apart", fullContent: "Brand identity goes beyond just a logo—it's the complete visual and emotional expression of your company's values, personality, and promise. We create comprehensive brand systems that ensure consistency and recognition across all touchpoints.", image: "assets/yapay-zeka-0704.jpg" },
                    PHOTO_WORK_03: { title: "Digital Growth", description: "AI-powered solutions for sustainable business growth", fullContent: "Our digital growth strategies combine traditional marketing wisdom with cutting-edge AI technologies. We help businesses scale efficiently through data-driven decision making, automated processes, and intelligent optimization techniques.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop" }
                });
                Object.assign(blogContent, {
                    BLOG_POST_01: { category: "Design Trends", date: "January 25, 2025", title: "The Future of Digital Design: Aurora-Inspired Aesthetics", excerpt: "Discover how natural phenomena like the Northern Lights are inspiring a new wave of digital design that combines organic beauty with technological precision.", content: "The Northern Lights have captivated humanity for millennia, their ethereal dance across the polar skies representing nature's most spectacular light show. Today, forward-thinking designers are drawing inspiration from these celestial phenomena to create digital experiences that feel both otherworldly and deeply human.", author: "AuroraNova Design Team", readTime: "5 min read", tags: ["Design", "Trends", "Aurora", "Digital Art"] },
                    BLOG_POST_02: { category: "AI Innovation", date: "January 20, 2025", title: "AI-Powered Creativity: Enhancing Human Design", excerpt: "How artificial intelligence is revolutionizing the creative process while preserving the essential human touch that makes design truly meaningful.", content: "The relationship between artificial intelligence and human creativity is not one of replacement, but of enhancement and collaboration. At AuroraNova, we've witnessed firsthand how AI tools can amplify human creativity, providing designers with new capabilities while preserving the intuition, empathy, and cultural understanding that only humans can bring to the creative process.", author: "Tech Innovation Team", readTime: "7 min read", tags: ["AI", "Creativity", "Innovation", "Design Process"] },
                    BLOG_POST_03: { category: "Web Development", date: "January 15, 2025", title: "Building Immersive Web Experiences", excerpt: "The technical and creative considerations behind crafting websites that captivate users and drive meaningful engagement in 2025.", content: "Creating immersive web experiences in 2025 requires a delicate balance of cutting-edge technology and user-centered design principles. Modern web browsers now support advanced features like WebGL, WebXR, and sophisticated CSS animations that enable developers to create experiences that were once impossible on the web.", author: "Development Team", readTime: "6 min read", tags: ["Web Development", "UX", "Performance", "Technology"] },
                    BLOG_POST_04: { category: "Brand Strategy", date: "January 10, 2025", title: "European Design Philosophy in Digital Branding", excerpt: "How centuries of European design tradition inform modern digital branding strategies that resonate across cultures and generations.", content: "European design philosophy has shaped aesthetic sensibilities for centuries, from the mathematical precision of classical architecture to the functional beauty of Bauhaus principles. In the digital age, these time-tested design philosophies provide a foundation for creating brand identities that feel both timeless and contemporary.", author: "Brand Strategy Team", readTime: "8 min read", tags: ["Branding", "European Design", "Philosophy", "Strategy"] }
                });
                Object.assign(blogContent, blogContentEN_new);
            }
        }

        // Language button click handler
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
        });

        // Services dropdown: mobile touch support
        const servicesDropdown = document.querySelector('.services-dropdown');
        const servicesBtnEl = document.querySelector('.services-btn');
        if (servicesDropdown && servicesBtnEl) {
            servicesBtnEl.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.stopPropagation();
                    servicesDropdown.classList.toggle('open');
                }
            });
            document.addEventListener('click', () => {
                servicesDropdown.classList.remove('open');
            });
        }

        // Hamburger menu
        const hamburger = document.getElementById('navHamburger');
        const navLinks = document.getElementById('navLinks');
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = navLinks.classList.toggle('open');
                hamburger.classList.toggle('open', isOpen);
                hamburger.setAttribute('aria-expanded', isOpen);
            });

            // Nav linkine tıklayınca menüyü kapat
            navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('open');
                    hamburger.classList.remove('open');
                    hamburger.setAttribute('aria-expanded', 'false');
                });
            });

            // Dışarı tıklayınca kapat
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav')) {
                    navLinks.classList.remove('open');
                    hamburger.classList.remove('open');
                    hamburger.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Service stars: touch desteği (mobilde hover yok)
        stars.forEach(star => {
            star.addEventListener('touchstart', (e) => {
                if (window.innerWidth > 768) return;
                e.preventDefault();
                const service = star.dataset.service;
                const info = document.getElementById(service + '-info');
                if (!info) return;

                // Diğer açık info'ları kapat
                serviceInfos.forEach(si => si.classList.remove('show'));
                stars.forEach(s => s.classList.remove('touch-active'));

                info.classList.add('show');
                star.classList.add('touch-active');

                // 3 saniye sonra kapat
                setTimeout(() => {
                    info.classList.remove('show');
                    star.classList.remove('touch-active');
                }, 3000);
            }, { passive: false });
        });

        // Modallarda mobile padding düzeltmesi
        function applyMobileModalFix(container) {
            if (window.innerWidth <= 768) {
                const inner = container.querySelector('[onclick="event.stopPropagation()"]');
                if (inner) {
                    inner.style.padding = '20px';
                    inner.style.maxWidth = '92vw';
                    inner.style.width = '92vw';
                    inner.style.borderRadius = '16px';
                }
            }
        }

        // MutationObserver ile dinamik modal'lara mobile fix uygula
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        applyMobileModalFix(node);
                    }
                });
            });
        });
        modalObserver.observe(document.body, { childList: true });

        // Initialize language on page load
        setLanguage(currentLang);
