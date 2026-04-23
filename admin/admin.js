// =================================================================
// AURORANOVA ADMIN PANEL JS
// Prefix: adm_ (tüm global fonksiyonlar)
// =================================================================

'use strict';

const ADM_FB_CONFIG = {
    apiKey: "AIzaSyD8fYMMpfVQlykMoKVDBJh0IP2Wc9A9WPY",
    authDomain: "auroranova-website.firebaseapp.com",
    projectId: "auroranova-website",
    storageBucket: "auroranova-website.firebasestorage.app",
    messagingSenderId: "1033362428789",
    appId: "1:1033362428789:web:22837743ca9efd728a793c"
};

let _admApp  = null;
let _admAuth = null;
let _admDb   = null;
let _admUser = null;
let _admAllMembers = []; // cache for client-side filtering

// -----------------------------------------------------------------
// Init
// -----------------------------------------------------------------
(function admInit() {
    _admApp  = firebase.apps.find(a => a.name === 'admin') ||
               firebase.initializeApp(ADM_FB_CONFIG, 'admin');
    _admAuth = firebase.auth(_admApp);
    _admDb   = firebase.firestore(_admApp);

    _admAuth.onAuthStateChanged(async (user) => {
        if (!user) {
            admShowLogin();
            return;
        }
        // Check admin role
        try {
            const snap = await _admDb.collection('web_users').doc(user.uid).get();
            if (!snap.exists || !snap.data().roles || !snap.data().roles.includes('admin')) {
                document.getElementById('adm-login-error').textContent =
                    'Erişim reddedildi. Bu hesabın yönetici yetkisi yok.';
                await _admAuth.signOut();
                return;
            }
        } catch (e) {
            document.getElementById('adm-login-error').textContent = 'Yetki kontrolü başarısız: ' + e.message;
            await _admAuth.signOut();
            return;
        }
        _admUser = user;
        admShowApp();
        admLoadDashboard();
        admLoadMembers();
        admLoadProducts();
        admLoadSubmissions();
        admLoadSettings();
        admLoadContent();
        admLoadBlog();
        admLoadGallery();
    });
})();

// -----------------------------------------------------------------
// Auth
// -----------------------------------------------------------------
function admShowLogin() {
    document.getElementById('admin-login-screen').style.display = 'flex';
    document.getElementById('adminApp').classList.remove('visible');
}

function admShowApp() {
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('adminApp').classList.add('visible');
    const el = document.getElementById('admTopbarUser');
    if (el) el.textContent = _admUser.displayName || _admUser.email;
}

async function admGoogleSignIn() {
    const errEl = document.getElementById('adm-login-error');
    errEl.textContent = '';
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await _admAuth.signInWithPopup(provider);
    } catch (e) {
        errEl.textContent = 'Giriş hatası: ' + e.message;
    }
}

async function admSignOut() {
    await _admAuth.signOut();
    _admUser = null;
}

// -----------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------
function admShowPage(pageId, btn) {
    document.querySelectorAll('.adm-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    if (btn)  btn.classList.add('active');
    if (pageId === 'blog'    && !_admBlogLoaded)    { _admBlogLoaded    = true; admLoadBlog(); }
    if (pageId === 'gallery' && !_admGalleryLoaded) { _admGalleryLoaded = true; admLoadGallery(); }
    if (pageId === 'content' && !_admContentLoaded) { _admContentLoaded = true; admLoadContent(); }
}

// -----------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------
async function admLoadDashboard() {
    try {
        // Total members
        const usersSnap = await _admDb.collection('web_users').get();
        const totalMembers = usersSnap.size;
        document.getElementById('kpiTotalMembers').textContent = totalMembers;

        // New this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newWeekSnap = await _admDb.collection('web_users')
            .where('joinDate', '>=', oneWeekAgo)
            .get();
        document.getElementById('kpiNewWeek').textContent = newWeekSnap.size;

        // Today's views
        const today = new Date().toISOString().split('T')[0];
        const viewSnap = await _admDb.collection('pageViews').doc(today).get();
        document.getElementById('kpiTodayViews').textContent =
            viewSnap.exists ? (viewSnap.data().total || 0) : 0;

        // Unread submissions
        const unreadSnap = await _admDb.collection('contactSubmissions')
            .where('read', '==', false).get();
        document.getElementById('kpiUnreadSubs').textContent = unreadSnap.size;

        // Chart: last 14 days
        await admLoadChart();
    } catch (e) {
        console.warn('[admin] Dashboard load error:', e);
    }
}

async function admLoadChart() {
    const container = document.getElementById('admChartBars');
    if (!container) return;

    const dates = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const values = [];
    for (const date of dates) {
        try {
            const snap = await _admDb.collection('pageViews').doc(date).get();
            values.push(snap.exists ? (snap.data().total || 0) : 0);
        } catch { values.push(0); }
    }

    const maxVal = Math.max(...values, 1);
    container.innerHTML = '';

    dates.forEach((date, i) => {
        const heightPct = Math.max(2, Math.round((values[i] / maxVal) * 100));
        const label = date.slice(5); // MM-DD
        const wrap = document.createElement('div');
        wrap.className = 'adm-bar-wrap';
        wrap.title = `${date}: ${values[i]} görüntüleme`;
        wrap.innerHTML = `
            <div class="adm-bar" style="height:${heightPct}%"></div>
            <div class="adm-bar-label">${label}</div>
        `;
        container.appendChild(wrap);
    });
}

// -----------------------------------------------------------------
// Members
// -----------------------------------------------------------------
async function admLoadMembers() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    try {
        const snap = await _admDb.collection('web_users').orderBy('joinDate', 'desc').get();
        _admAllMembers = [];
        snap.forEach(doc => _admAllMembers.push({ id: doc.id, ...doc.data() }));
        admRenderMembers(_admAllMembers);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:#ff7675;padding:16px;">Yükleme hatası: ${e.message}</td></tr>`;
    }
}

function admRenderMembers(list) {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="adm-loading">Üye bulunamadı.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(m => {
        const joinDate = m.joinDate ? new Date(m.joinDate.toDate()).toLocaleDateString('tr-TR') : '—';
        const roles = (m.roles || []).map(r => `<span class="adm-badge ${r}">${r}</span>`).join(' ');
        const isAdmin = (m.roles || []).includes('admin');
        return `<tr>
            <td>${m.displayName || '—'}</td>
            <td>${m.email || '—'}</td>
            <td>${joinDate}</td>
            <td>${roles}</td>
            <td>
                <button class="adm-action-btn" onclick="admToggleAdmin('${m.id}', ${isAdmin})">
                    ${isAdmin ? 'Admin\'den Çıkar' : 'Admin Yap'}
                </button>
            </td>
        </tr>`;
    }).join('');
}

function admFilterMembers() {
    const q = document.getElementById('memberSearch').value.toLowerCase();
    if (!q) { admRenderMembers(_admAllMembers); return; }
    const filtered = _admAllMembers.filter(m =>
        (m.email || '').toLowerCase().includes(q) ||
        (m.displayName || '').toLowerCase().includes(q)
    );
    admRenderMembers(filtered);
}

async function admToggleAdmin(uid, currentlyAdmin) {
    if (!confirm(currentlyAdmin ? 'Admin yetkisini kaldırmak istediğinizden emin misiniz?' : 'Bu kullanıcıya admin yetkisi vermek istediğinizden emin misiniz?')) return;
    try {
        const ref = _admDb.collection('web_users').doc(uid);
        const snap = await ref.get();
        if (!snap.exists) return;
        let roles = [...(snap.data().roles || [])];
        if (currentlyAdmin) {
            roles = roles.filter(r => r !== 'admin');
        } else {
            if (!roles.includes('admin')) roles.push('admin');
        }
        await ref.update({ roles });
        await admLoadMembers();
    } catch (e) {
        alert('Hata: ' + e.message);
    }
}

// -----------------------------------------------------------------
// Products
// -----------------------------------------------------------------
let _admEditingProductId = null;

async function admLoadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    try {
        const snap = await _admDb.collection('products').orderBy('nameTR').get();
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="adm-empty"><span class="adm-empty-icon">&#x1F4E6;</span><p>Henüz ürün eklenmemiş.</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            const licenseLabels = { monthly: 'Aylık', yearly: 'Yıllık', lifetime: 'Tek Seferlik' };
            return `<tr>
                <td>${p.nameTR || '—'} <small style="color:rgba(255,255,255,0.3);font-size:11px;">/ ${p.nameEN || ''}</small></td>
                <td>₺${p.price || 0}</td>
                <td>${licenseLabels[p.licenseType] || p.licenseType || '—'}</td>
                <td><span class="adm-badge ${p.active ? 'read' : 'unread'}">${p.active ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="adm-action-btn" onclick="admEditProduct('${doc.id}')">Düzenle</button>
                    <button class="adm-action-btn danger" onclick="admDeleteProduct('${doc.id}')">Sil</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:#ff7675;padding:16px;">Hata: ${e.message}</td></tr>`;
    }
}

function admToggleProductForm(clear = true) {
    const panel = document.getElementById('productFormPanel');
    panel.classList.toggle('open');
    if (clear) {
        _admEditingProductId = null;
        ['pNameTR','pNameEN','pDescTR','pDescEN','pPrice'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('pActive').checked = true;
        document.getElementById('pLicense').value = 'monthly';
        document.getElementById('productFormMsg').textContent = '';
    }
}

async function admEditProduct(productId) {
    try {
        const snap = await _admDb.collection('products').doc(productId).get();
        if (!snap.exists) return;
        const p = snap.data();
        _admEditingProductId = productId;
        document.getElementById('pNameTR').value   = p.nameTR || '';
        document.getElementById('pNameEN').value   = p.nameEN || '';
        document.getElementById('pDescTR').value   = p.descriptionTR || '';
        document.getElementById('pDescEN').value   = p.descriptionEN || '';
        document.getElementById('pPrice').value    = p.price || 0;
        document.getElementById('pLicense').value  = p.licenseType || 'monthly';
        document.getElementById('pActive').checked = p.active !== false;
        document.getElementById('productFormPanel').classList.add('open');
        document.getElementById('productFormPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        alert('Hata: ' + e.message);
    }
}

async function admSaveProduct() {
    const msgEl = document.getElementById('productFormMsg');
    const data = {
        nameTR:        document.getElementById('pNameTR').value.trim(),
        nameEN:        document.getElementById('pNameEN').value.trim(),
        descriptionTR: document.getElementById('pDescTR').value.trim(),
        descriptionEN: document.getElementById('pDescEN').value.trim(),
        price:         parseFloat(document.getElementById('pPrice').value) || 0,
        licenseType:   document.getElementById('pLicense').value,
        active:        document.getElementById('pActive').checked
    };
    if (!data.nameTR && !data.nameEN) { msgEl.style.color = '#ff7675'; msgEl.textContent = 'Ürün adı boş olamaz.'; return; }
    try {
        if (_admEditingProductId) {
            await _admDb.collection('products').doc(_admEditingProductId).update(data);
        } else {
            await _admDb.collection('products').add(data);
        }
        msgEl.style.color = '#55efc4';
        msgEl.textContent = 'Kaydedildi.';
        await admLoadProducts();
        setTimeout(() => admToggleProductForm(true), 1000);
    } catch (e) {
        msgEl.style.color = '#ff7675';
        msgEl.textContent = 'Hata: ' + e.message;
    }
}

async function admDeleteProduct(productId) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
        await _admDb.collection('products').doc(productId).delete();
        await admLoadProducts();
    } catch (e) {
        alert('Hata: ' + e.message);
    }
}

// -----------------------------------------------------------------
// Contact Submissions
// -----------------------------------------------------------------
async function admLoadSubmissions() {
    const tbody = document.getElementById('submissionsTableBody');
    if (!tbody) return;
    try {
        const snap = await _admDb.collection('contactSubmissions')
            .orderBy('timestamp', 'desc').limit(100).get();
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="adm-empty"><span class="adm-empty-icon">&#x1F4E8;</span><p>Henüz başvuru yok.</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = '';
        snap.forEach(doc => {
            const s = doc.data();
            const date = s.timestamp ? new Date(s.timestamp.toDate()).toLocaleDateString('tr-TR') : '—';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.name || '—'}</td>
                <td>${s.email || '—'}</td>
                <td>${s.service || '—'}</td>
                <td>${date}</td>
                <td><span class="adm-badge ${s.read ? 'read' : 'unread'}">${s.read ? 'Okundu' : 'Yeni'}</span></td>
                <td>
                    <button class="adm-action-btn" onclick="admToggleSubmissionDetail('${doc.id}', this)">Göster</button>
                    ${!s.read ? `<button class="adm-action-btn" onclick="admMarkRead('${doc.id}', this)">Okundu</button>` : ''}
                </td>
            `;
            row.setAttribute('data-id', doc.id);
            tbody.appendChild(row);

            // Detail row
            const detailRow = document.createElement('tr');
            detailRow.className = 'adm-detail-row';
            detailRow.id = 'detail-' + doc.id;
            detailRow.innerHTML = `<td colspan="6"><div class="adm-detail-msg">${s.message || '(Mesaj yok)'}</div></td>`;
            tbody.appendChild(detailRow);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#ff7675;padding:16px;">Hata: ${e.message}</td></tr>`;
    }
}

function admToggleSubmissionDetail(id, btn) {
    const row = document.getElementById('detail-' + id);
    if (!row) return;
    const isOpen = row.classList.toggle('open');
    btn.textContent = isOpen ? 'Gizle' : 'Göster';
}

async function admMarkRead(id, btn) {
    try {
        await _admDb.collection('contactSubmissions').doc(id).update({ read: true });
        btn.remove();
        const badgeCell = document.querySelector(`[data-id="${id}"] .adm-badge`);
        if (badgeCell) { badgeCell.className = 'adm-badge read'; badgeCell.textContent = 'Okundu'; }
        // Update KPI
        const kpi = document.getElementById('kpiUnreadSubs');
        if (kpi) kpi.textContent = Math.max(0, parseInt(kpi.textContent || '0') - 1);
    } catch (e) {
        alert('Hata: ' + e.message);
    }
}

// -----------------------------------------------------------------
// Settings
// -----------------------------------------------------------------
async function admLoadSettings() {
    try {
        const snap = await _admDb.collection('siteSettings').doc('main').get();
        if (!snap.exists) return;
        const s = snap.data();
        const trel = document.getElementById('settAnnounceTR');
        const enel = document.getElementById('settAnnounceEN');
        const act  = document.getElementById('settAnnounceActive');
        const api  = document.getElementById('settApiKey');
        if (trel) trel.value = s.announcementTR || '';
        if (enel) enel.value = s.announcementEN || '';
        if (act)  act.checked = s.announcementActive || false;
        if (api)  api.value = s.googleAiApiKey || '';
    } catch (e) {
        console.warn('[admin] Settings load:', e);
    }
}

// =================================================================
// BLOG MANAGEMENT
// =================================================================
let _admEditingBlogId = null;
let _admBlogLoaded = false;

async function admLoadBlog() {
    const tbody = document.getElementById('blogTableBody');
    if (!tbody) return;
    try {
        const snap = await _admDb.collection('blog_posts').orderBy('order').get();
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="adm-empty"><span class="adm-empty-icon">&#x1F4DD;</span><p>Henüz blog yazısı eklenmedi. Şu an içerikler hardcode\'dan geliyor.</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            return `<tr>
                <td>${p.order || '—'}</td>
                <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.titleTR || p.titleEN || '—'}</td>
                <td><span class="adm-badge">${p.catTR || p.catEN || '—'}</span></td>
                <td>${p.date || '—'}</td>
                <td><span class="adm-badge ${p.active !== false ? 'read' : 'unread'}">${p.active !== false ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="adm-action-btn" onclick="admEditBlog('${doc.id}')">Düzenle</button>
                    <button class="adm-action-btn danger" onclick="admDeleteBlog('${doc.id}')">Sil</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#ff7675;padding:16px;">Hata: ${e.message}</td></tr>`;
    }
}

function admToggleBlogForm(clear = true) {
    const panel = document.getElementById('blogFormPanel');
    panel.classList.toggle('open');
    if (clear) {
        _admEditingBlogId = null;
        ['bCatTR','bCatEN','bTitleTR','bTitleEN','bExcerptTR','bExcerptEN','bContentTR','bContentEN','bTagsTR','bTagsEN','bDate'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        document.getElementById('bAuthor').value   = 'AuroraNova Team';
        document.getElementById('bReadTime').value = '5 min read';
        document.getElementById('bOrder').value    = '1';
        document.getElementById('bActive').checked = true;
        document.getElementById('blogFormMsg').textContent = '';
        admSwitchLangTab('TR', document.querySelector('#blogFormPanel .adm-lang-tab'));
    }
}

async function admEditBlog(blogId) {
    try {
        const snap = await _admDb.collection('blog_posts').doc(blogId).get();
        if (!snap.exists) return;
        const p = snap.data();
        _admEditingBlogId = blogId;
        document.getElementById('bCatTR').value      = p.catTR     || '';
        document.getElementById('bCatEN').value      = p.catEN     || '';
        document.getElementById('bDate').value       = p.date      || '';
        document.getElementById('bTitleTR').value    = p.titleTR   || '';
        document.getElementById('bTitleEN').value    = p.titleEN   || '';
        document.getElementById('bExcerptTR').value  = p.excerptTR || '';
        document.getElementById('bExcerptEN').value  = p.excerptEN || '';
        document.getElementById('bContentTR').value  = p.contentTR || '';
        document.getElementById('bContentEN').value  = p.contentEN || '';
        document.getElementById('bTagsTR').value     = (p.tagsTR || []).join(', ');
        document.getElementById('bTagsEN').value     = (p.tagsEN || []).join(', ');
        document.getElementById('bAuthor').value     = p.author    || '';
        document.getElementById('bReadTime').value   = p.readTime  || '';
        document.getElementById('bOrder').value      = p.order     || 1;
        document.getElementById('bActive').checked   = p.active !== false;
        document.getElementById('blogFormPanel').classList.add('open');
        document.getElementById('blogFormPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert('Hata: ' + e.message); }
}

async function admSaveBlog() {
    const msgEl = document.getElementById('blogFormMsg');
    const data = {
        order:     parseInt(document.getElementById('bOrder').value)    || 1,
        active:    document.getElementById('bActive').checked,
        catTR:     document.getElementById('bCatTR').value.trim(),
        catEN:     document.getElementById('bCatEN').value.trim(),
        date:      document.getElementById('bDate').value.trim(),
        titleTR:   document.getElementById('bTitleTR').value.trim(),
        titleEN:   document.getElementById('bTitleEN').value.trim(),
        excerptTR: document.getElementById('bExcerptTR').value.trim(),
        excerptEN: document.getElementById('bExcerptEN').value.trim(),
        contentTR: document.getElementById('bContentTR').value.trim(),
        contentEN: document.getElementById('bContentEN').value.trim(),
        tagsTR:    document.getElementById('bTagsTR').value.split(',').map(t=>t.trim()).filter(Boolean),
        tagsEN:    document.getElementById('bTagsEN').value.split(',').map(t=>t.trim()).filter(Boolean),
        author:    document.getElementById('bAuthor').value.trim(),
        readTime:  document.getElementById('bReadTime').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!data.titleTR && !data.titleEN) {
        msgEl.style.color = '#ff7675'; msgEl.textContent = 'En az bir dilde başlık gerekli.'; return;
    }
    try {
        if (_admEditingBlogId) {
            await _admDb.collection('blog_posts').doc(_admEditingBlogId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await _admDb.collection('blog_posts').add(data);
        }
        msgEl.style.color = '#55efc4'; msgEl.textContent = 'Kaydedildi.';
        await admLoadBlog();
        setTimeout(() => admToggleBlogForm(true), 1200);
    } catch (e) {
        msgEl.style.color = '#ff7675'; msgEl.textContent = 'Hata: ' + e.message;
    }
}

async function admDeleteBlog(blogId) {
    if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;
    try {
        await _admDb.collection('blog_posts').doc(blogId).delete();
        await admLoadBlog();
    } catch (e) { alert('Hata: ' + e.message); }
}

function admSwitchLangTab(lang, btn) {
    document.getElementById('blogFieldsTR').style.display = lang === 'TR' ? '' : 'none';
    document.getElementById('blogFieldsEN').style.display = lang === 'EN' ? '' : 'none';
    if (btn) {
        const tabs = btn.closest('.adm-lang-tabs');
        if (tabs) { tabs.querySelectorAll('.adm-lang-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
    }
}

// =================================================================
// GALLERY MANAGEMENT
// =================================================================
let _admGalleryLoaded = false;
const _GALLERY_SECTIONS = [
    { key: 'story',  label: 'Story',  count: 3 },
    { key: 'method', label: 'Method', count: 3 },
    { key: 'work',   label: 'Work',   count: 3 }
];

async function admLoadGallery() {
    const container = document.getElementById('galleryContent');
    if (!container) return;
    container.innerHTML = '<div class="adm-loading">Yükleniyor...</div>';

    const allDocs = {};
    try {
        const snap = await _admDb.collection('gallery_items').get();
        snap.forEach(doc => { allDocs[doc.id] = { id: doc.id, ...doc.data() }; });
    } catch (e) { console.warn('Gallery load:', e); }

    container.innerHTML = '';
    _GALLERY_SECTIONS.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'adm-gallery-section';
        sectionDiv.innerHTML = `<div class="adm-gallery-section-title">${section.label} Kartları</div><div class="adm-gallery-cards" id="gcards-${section.key}"></div>`;
        container.appendChild(sectionDiv);
        const grid = sectionDiv.querySelector('.adm-gallery-cards');

        for (let i = 1; i <= section.count; i++) {
            const docId = `${section.key}_${i}`;
            const d = allDocs[docId] || {};
            const card = document.createElement('div');
            card.className = 'adm-gallery-card';
            card.id = `gcard-${docId}`;
            card.innerHTML = `
                ${d.imageUrl ? `<img class="adm-gallery-card-img" src="${d.imageUrl}" alt="" onerror="this.style.display='none'">` : '<div class="adm-gallery-card-img"></div>'}
                <div class="adm-gallery-card-title">${d.titleTR || `${section.label} ${i}`}</div>
                <button class="adm-action-btn" onclick="admToggleGalleryEdit('${docId}')">Düzenle / Edit</button>
                <div class="adm-gallery-edit-panel" id="gedit-${docId}">
                    <div class="adm-form-grid">
                        <div class="adm-form-group full"><label class="adm-label">Görsel URL</label><input class="adm-input" id="g_img_${docId}" type="url" value="${d.imageUrl||''}" placeholder="https://..."></div>
                        <div class="adm-form-group"><label class="adm-label">Başlık (TR)</label><input class="adm-input" id="g_ttR_${docId}" type="text" value="${d.titleTR||''}"></div>
                        <div class="adm-form-group"><label class="adm-label">Title (EN)</label><input class="adm-input" id="g_ttE_${docId}" type="text" value="${d.titleEN||''}"></div>
                        <div class="adm-form-group"><label class="adm-label">Açıklama (TR)</label><input class="adm-input" id="g_dsR_${docId}" type="text" value="${d.descTR||''}"></div>
                        <div class="adm-form-group"><label class="adm-label">Description (EN)</label><input class="adm-input" id="g_dsE_${docId}" type="text" value="${d.descEN||''}"></div>
                        <div class="adm-form-group full"><label class="adm-label">Tam İçerik (TR) — Modal'da görünür</label><textarea class="adm-textarea" id="g_fcR_${docId}" rows="5">${d.fullContentTR||''}</textarea></div>
                        <div class="adm-form-group full"><label class="adm-label">Full Content (EN) — Shown in modal</label><textarea class="adm-textarea" id="g_fcE_${docId}" rows="5">${d.fullContentEN||''}</textarea></div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        <button class="adm-btn" onclick="admSaveGalleryItem('${docId}','${section.key}',${i})">Kaydet</button>
                        <button class="adm-btn secondary" onclick="admToggleGalleryEdit('${docId}')">İptal</button>
                    </div>
                    <div id="gmsg-${docId}" class="adm-form-msg"></div>
                </div>`;
            grid.appendChild(card);
        }
    });
}

function admToggleGalleryEdit(docId) {
    const panel = document.getElementById('gedit-' + docId);
    if (panel) panel.classList.toggle('open');
}

async function admSaveGalleryItem(docId, section, order) {
    const msgEl = document.getElementById('gmsg-' + docId);
    const data = {
        section, order,
        imageUrl:      document.getElementById(`g_img_${docId}`).value.trim(),
        titleTR:       document.getElementById(`g_ttR_${docId}`).value.trim(),
        titleEN:       document.getElementById(`g_ttE_${docId}`).value.trim(),
        descTR:        document.getElementById(`g_dsR_${docId}`).value.trim(),
        descEN:        document.getElementById(`g_dsE_${docId}`).value.trim(),
        fullContentTR: document.getElementById(`g_fcR_${docId}`).value.trim(),
        fullContentEN: document.getElementById(`g_fcE_${docId}`).value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        await _admDb.collection('gallery_items').doc(docId).set(data, { merge: true });
        if (msgEl) { msgEl.style.color = '#55efc4'; msgEl.textContent = 'Kaydedildi.'; }
        const titleEl = document.querySelector(`#gcard-${docId} .adm-gallery-card-title`);
        if (titleEl) titleEl.textContent = data.titleTR || docId;
        const imgEl = document.querySelector(`#gcard-${docId} .adm-gallery-card-img`);
        if (imgEl && data.imageUrl) { imgEl.src = data.imageUrl; imgEl.style.display = ''; }
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
    } catch (e) {
        if (msgEl) { msgEl.style.color = '#ff7675'; msgEl.textContent = 'Hata: ' + e.message; }
    }
}

// =================================================================
// SITE CONTENT MANAGEMENT
// =================================================================
let _admContentLoaded = false;

const _CONTENT_FIELDS = {
    hero:         { subtitleTR:'heroSubtitleTR', subtitleEN:'heroSubtitleEN', taglineTR:'heroTaglineTR', taglineEN:'heroTaglineEN' },
    story:        { headingTR:'storyHeadingTR', headingEN:'storyHeadingEN', descTR:'storyDescTR', descEN:'storyDescEN' },
    method:       { headingTR:'methodHeadingTR', headingEN:'methodHeadingEN', descTR:'methodDescTR', descEN:'methodDescEN' },
    work:         { headingTR:'workHeadingTR', headingEN:'workHeadingEN', descTR:'workDescTR', descEN:'workDescEN' },
    blog_section: { headingTR:'blogSecHeadingTR', headingEN:'blogSecHeadingEN', descTR:'blogSecDescTR', descEN:'blogSecDescEN' },
    contact:      { headingTR:'contactHeadingTR', headingEN:'contactHeadingEN', email:'contactEmail', meetingLink:'contactMeetingLink', locationTR:'contactLocationTR', locationEN:'contactLocationEN' },
    footer:       { taglineTR:'footerTaglineTR', taglineEN:'footerTaglineEN', copyright:'footerCopyright', privacyLink:'footerPrivacyLink' },
    services:     { brandingTitleTR:'svcBrandingTitleTR', brandingTitleEN:'svcBrandingTitleEN', brandingDescTR:'svcBrandingDescTR', brandingDescEN:'svcBrandingDescEN', webTitleTR:'svcWebTitleTR', webTitleEN:'svcWebTitleEN', webDescTR:'svcWebDescTR', webDescEN:'svcWebDescEN', seoTitleTR:'svcSeoTitleTR', seoTitleEN:'svcSeoTitleEN', marketingTitleTR:'svcMarketingTitleTR', marketingTitleEN:'svcMarketingTitleEN', softwareTitleTR:'svcSoftwareTitleTR', softwareTitleEN:'svcSoftwareTitleEN' }
};

async function admLoadContent() {
    try {
        for (const [section, fields] of Object.entries(_CONTENT_FIELDS)) {
            const snap = await _admDb.collection('site_content').doc(section).get();
            if (!snap.exists) continue;
            const data = snap.data();
            Object.entries(fields).forEach(([key, elId]) => {
                const el = document.getElementById(elId);
                if (el && data[key] !== undefined) el.value = data[key];
            });
        }
    } catch (e) { console.warn('Content load:', e); }
}

async function admSaveContent(section) {
    const msgEl = document.getElementById('contentMsg-' + section);
    const fields = _CONTENT_FIELDS[section];
    if (!fields) return;
    const data = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    Object.entries(fields).forEach(([key, elId]) => {
        const el = document.getElementById(elId);
        if (el) data[key] = el.value.trim();
    });
    try {
        await _admDb.collection('site_content').doc(section).set(data, { merge: true });
        if (msgEl) { msgEl.style.color = '#55efc4'; msgEl.textContent = 'Kaydedildi.'; }
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
    } catch (e) {
        if (msgEl) { msgEl.style.color = '#ff7675'; msgEl.textContent = 'Hata: ' + e.message; }
    }
}

function admShowContentTab(tabId, btn) {
    document.querySelectorAll('.adm-ctab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.adm-ctab').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('ctab-' + tabId);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

// =================================================================
// SETTINGS
// =================================================================
async function admSaveSettings() {
    const msgEl = document.getElementById('settingsMsg');
    const data = {
        announcementTR:     document.getElementById('settAnnounceTR').value.trim(),
        announcementEN:     document.getElementById('settAnnounceEN').value.trim(),
        announcementActive: document.getElementById('settAnnounceActive').checked,
        googleAiApiKey:     document.getElementById('settApiKey') ? document.getElementById('settApiKey').value.trim() : '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        await _admDb.collection('siteSettings').doc('main').set(data, { merge: true });
        msgEl.style.color = '#55efc4';
        msgEl.textContent = 'Ayarlar kaydedildi.';
        setTimeout(() => { msgEl.textContent = ''; }, 3000);
    } catch (e) {
        msgEl.style.color = '#ff7675';
        msgEl.textContent = 'Hata: ' + e.message;
    }
}

// =================================================================
// AI TEXT ASSISTANT
// =================================================================

async function getAiApiKey() {
    const snap = await _admDb.collection('siteSettings').doc('main').get();
    if (snap.exists && snap.data().googleAiApiKey) {
        return snap.data().googleAiApiKey;
    }
    return null;
}

async function admGenerateText() {
    const promptEl = document.getElementById('aiTextPrompt');
    const resultEl = document.getElementById('aiTextResult');
    const msgEl = document.getElementById('aiTextMsg');
    const btn = document.getElementById('btnGenerateText');
    const prompt = promptEl.value.trim();

    if (!prompt) {
        msgEl.textContent = 'Lütfen bir konu veya komut yazın.';
        return;
    }

    msgEl.style.color = '#55efc4';
    msgEl.textContent = 'Üretiliyor, lütfen bekleyin... (Bu işlem birkaç saniye sürebilir)';
    btn.disabled = true;
    resultEl.value = '';

    try {
        const apiKey = await getAiApiKey();
        if (!apiKey) {
            throw new Error('API Anahtarı bulunamadı! Lütfen Ayarlar sekmesinden Google AI Studio API anahtarınızı kaydedin.');
        }

        let data;
        let response;
        const modelsToTry = ['gemini-2.5-flash', 'gemini-3.0-flash', 'gemini-pro'];
        let lastError = null;

        for (const model of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (response.ok) {
                data = await response.json();
                lastError = null;
                break;
            } else {
                const errorData = await response.json();
                lastError = new Error(errorData.error?.message || `Gemini API Hatası (${model})`);
                // If it's a 404 (model not found), continue loop. Otherwise break.
                if (response.status !== 404) break; 
            }
        }

        if (lastError) throw lastError;
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        resultEl.value = textResponse;
        msgEl.textContent = 'Başarıyla üretildi!';
        setTimeout(() => { msgEl.textContent = ''; }, 3000);

    } catch (e) {
        msgEl.style.color = '#ff7675';
        msgEl.textContent = e.message;
    } finally {
        btn.disabled = false;
    }
}

function admCopyText(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    navigator.clipboard.writeText(el.value).then(() => {
        alert('Metin kopyalandı!');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
    });
}
