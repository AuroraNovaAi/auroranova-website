// =================================================================
// AURORANOVA CMS — Firestore içeriğini yükler, hardcode fallback
// =================================================================
(function () {
    'use strict';

    const GALLERY_MAP = {
        story_1: 'PHOTO_STORY_01', story_2: 'PHOTO_STORY_02', story_3: 'PHOTO_STORY_03',
        method_1: 'PHOTO_METHOD_01', method_2: 'PHOTO_METHOD_02', method_3: 'PHOTO_METHOD_03',
        work_1: 'PHOTO_WORK_01', work_2: 'PHOTO_WORK_02', work_3: 'PHOTO_WORK_03'
    };

    function getCmsDb() {
        if (typeof firebase === 'undefined') return null;
        const app = firebase.apps.find(a => a.name === '[DEFAULT]') || firebase.apps[0];
        return app ? firebase.firestore(app) : null;
    }

    async function cmsLoad() {
        const db = getCmsDb();
        if (!db) return;

        const lang = localStorage.getItem('auroranova_lang') || 'tr';
        const isTR = lang === 'tr';

        try {
            await Promise.all([
                cmsLoadSiteContent(db, isTR),
                cmsLoadBlogPosts(db),
                cmsLoadGallery(db, isTR)
            ]);
            if (typeof setLanguage === 'function') setLanguage(lang);
        } catch (e) {
            console.warn('[CMS] Load error:', e);
        }
    }

    async function cmsLoadSiteContent(db, isTR) {
        const sections = ['hero', 'seo', 'story', 'method', 'work', 'blog_section', 'contact', 'footer', 'services'];
        for (const section of sections) {
            try {
                const snap = await db.collection('site_content').doc(section).get();
                if (!snap.exists || typeof translations === 'undefined') continue;
                const d = snap.data();
                const tr = translations.tr;
                const en = translations.en;

                if (section === 'hero') {
                    if (d.subtitleTR) tr.hero.subtitle = d.subtitleTR;
                    if (d.subtitleEN) en.hero.subtitle = d.subtitleEN;
                    if (d.taglineTR) tr.hero.tagline = d.taglineTR;
                    if (d.taglineEN) en.hero.tagline = d.taglineEN;
                }
                if (section === 'seo') {
                    if (!tr.seo) tr.seo = {};
                    if (!en.seo) en.seo = {};
                    if (d.titleTR) tr.seo.title = d.titleTR;
                    if (d.titleEN) en.seo.title = d.titleEN;
                    if (d.descTR) tr.seo.description = d.descTR;
                    if (d.descEN) en.seo.description = d.descEN;
                    if (d.keywordsTR) tr.seo.keywords = d.keywordsTR;
                    if (d.keywordsEN) en.seo.keywords = d.keywordsEN;
                }
                if (section === 'story') {
                    if (d.headingTR) tr.story.heading = d.headingTR;
                    if (d.headingEN) en.story.heading = d.headingEN;
                    if (d.descTR) tr.story.desc = d.descTR;
                    if (d.descEN) en.story.desc = d.descEN;
                }
                if (section === 'method') {
                    if (d.headingTR) tr.method.heading = d.headingTR;
                    if (d.headingEN) en.method.heading = d.headingEN;
                    if (d.descTR) tr.method.desc = d.descTR;
                    if (d.descEN) en.method.desc = d.descEN;
                }
                if (section === 'work') {
                    if (d.headingTR) tr.work.heading = d.headingTR;
                    if (d.headingEN) en.work.heading = d.headingEN;
                    if (d.descTR) tr.work.desc = d.descTR;
                    if (d.descEN) en.work.desc = d.descEN;
                }
                if (section === 'blog_section') {
                    if (d.headingTR) tr.blog.heading = d.headingTR;
                    if (d.headingEN) en.blog.heading = d.headingEN;
                    if (d.descTR) tr.blog.desc = d.descTR;
                    if (d.descEN) en.blog.desc = d.descEN;
                }
                if (section === 'contact') {
                    if (d.headingTR) tr.contact.heading = d.headingTR;
                    if (d.headingEN) en.contact.heading = d.headingEN;
                    if (d.email) { tr.contact.photo1_desc = d.email; en.contact.photo1_desc = d.email; }
                    if (d.locationTR) tr.contact.photo2_desc = d.locationTR;
                    if (d.locationEN) en.contact.photo2_desc = d.locationEN;
                    if (d.meetingLink && typeof contactInfo !== 'undefined') contactInfo.calendly = d.meetingLink;
                    if (d.email && typeof contactInfo !== 'undefined') contactInfo.email = d.email;
                }
                if (section === 'footer') {
                    if (!tr.footer) tr.footer = {};
                    if (!en.footer) en.footer = {};
                    if (d.taglineTR) tr.footer.tagline = d.taglineTR;
                    if (d.taglineEN) en.footer.tagline = d.taglineEN;
                    if (d.copyright) { tr.footer.copyright = d.copyright; en.footer.copyright = d.copyright; }
                }
                if (section === 'services') {
                    const smap = { branding:'branding', web:'web', seo:'seo', marketing:'marketing', software:'software' };
                    Object.entries(smap).forEach(([key]) => {
                        if (d[`${key}TitleTR`]) tr.services[key].title = d[`${key}TitleTR`];
                        if (d[`${key}TitleEN`]) en.services[key].title = d[`${key}TitleEN`];
                        if (d[`${key}DescTR`])  tr.services[key].desc  = d[`${key}DescTR`];
                        if (d[`${key}DescEN`])  en.services[key].desc  = d[`${key}DescEN`];
                    });
                }
            } catch (e) { console.warn(`[CMS] ${section}:`, e); }
        }
    }

    async function cmsLoadBlogPosts(db) {
        try {
            const snap = await db.collection('blog_posts')
                .where('active', '==', true)
                .orderBy('order')
                .get();
            if (snap.empty || typeof translations === 'undefined') return;

            const posts = [];
            snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
            const tr = translations.tr.blog;
            const en = translations.en.blog;

            posts.forEach((p, i) => {
                const n = i + 1;
                tr[`post${n}_cat`]     = p.catTR     || '';
                tr[`post${n}_date`]    = p.date       || '';
                tr[`post${n}_title`]   = p.titleTR    || '';
                tr[`post${n}_excerpt`] = p.excerptTR  || '';
                en[`post${n}_cat`]     = p.catEN      || '';
                en[`post${n}_date`]    = p.date       || '';
                en[`post${n}_title`]   = p.titleEN    || '';
                en[`post${n}_excerpt`] = p.excerptEN  || '';

                const key = `BLOG_POST_${String(n).padStart(2, '0')}`;
                if (typeof blogContentTR !== 'undefined' && p.contentTR) {
                    blogContentTR[key] = { category: p.catTR, date: p.date, title: p.titleTR, excerpt: p.excerptTR, content: p.contentTR, author: p.author || 'AuroraNova', readTime: p.readTime || '5 min read', tags: p.tagsTR || [] };
                }
                if (typeof blogContentEN !== 'undefined' && p.contentEN) {
                    blogContentEN[key] = { category: p.catEN, date: p.date, title: p.titleEN, excerpt: p.excerptEN, content: p.contentEN, author: p.author || 'AuroraNova', readTime: p.readTime || '5 min read', tags: p.tagsEN || [] };
                }
            });
        } catch (e) { console.warn('[CMS] blog_posts:', e); }
    }

    async function cmsLoadGallery(db, isTR) {
        try {
            const snap = await db.collection('gallery_items').get();
            if (snap.empty || typeof photoContent === 'undefined') return;

            snap.forEach(doc => {
                const d = doc.data();
                const photoKey = GALLERY_MAP[doc.id];
                if (!photoKey || !photoContent[photoKey]) return;

                const pc = photoContent[photoKey];
                if (isTR) {
                    if (d.titleTR)       pc.title       = d.titleTR;
                    if (d.descTR)        pc.description = d.descTR;
                    if (d.fullContentTR) pc.fullContent = d.fullContentTR;
                } else {
                    if (d.titleEN)       pc.title       = d.titleEN;
                    if (d.descEN)        pc.description = d.descEN;
                    if (d.fullContentEN) pc.fullContent = d.fullContentEN;
                }
                if (d.imageUrl) pc.image = d.imageUrl;

                if (typeof translations !== 'undefined') {
                    const sKey = d.section;
                    const ord  = d.order;
                    if (sKey && ord) {
                        if (d.titleTR) translations.tr[sKey][`photo${ord}_title`] = d.titleTR;
                        if (d.titleEN) translations.en[sKey][`photo${ord}_title`] = d.titleEN;
                        if (d.descTR)  translations.tr[sKey][`photo${ord}_desc`]  = d.descTR;
                        if (d.descEN)  translations.en[sKey][`photo${ord}_desc`]  = d.descEN;
                    }
                }
            });
        } catch (e) { console.warn('[CMS] gallery_items:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cmsLoad);
    } else {
        cmsLoad();
    }
})();
