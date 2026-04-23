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

async function admFetchModels(selectId, mode = 'text') {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    
    const originalText = selectEl.options[0]?.text || 'Yükleniyor...';
    selectEl.innerHTML = '<option value="">Modeller Aranıyor...</option>';
    selectEl.disabled = true;

    try {
        const apiKey = await getAiApiKey();
        if (!apiKey) {
            throw new Error('API Anahtarı bulunamadı.');
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error('Modeller getirilemedi.');
        
        const data = await response.json();
        
        selectEl.innerHTML = '';
        if (data.models && data.models.length > 0) {
            let addedCount = 0;
            data.models.forEach(model => {
                const modelName = model.name.replace('models/', '');
                const methods = model.supportedGenerationMethods || [];
                
                let isText = methods.includes('generateContent') && !modelName.includes('embedding') && !modelName.includes('aqa') && !modelName.includes('bison') && !modelName.includes('audio');
                let isImage = methods.includes('predict') || modelName.includes('imagen') || modelName.includes('vision') || modelName.includes('image');

                let include = false;
                let emoji = '';

                if (mode === 'text' && isText) { include = true; emoji = '📝 '; }
                // Also allow some gemini models that might do images if they have specific keywords, or just rely on predict.
                if (mode === 'image' && isImage) { include = true; emoji = '🎨 '; }

                if (include) {
                    const opt = document.createElement('option');
                    opt.value = modelName;
                    opt.textContent = `${emoji}${model.displayName || modelName} (${modelName})`;
                    // Select a default good model if found
                    if (modelName === 'gemini-2.5-flash' || modelName === 'gemini-3.0-flash' || modelName.includes('imagen')) {
                        opt.selected = true;
                    }
                    selectEl.appendChild(opt);
                    addedCount++;
                }
            });

            if (addedCount === 0) {
                // Fallback if filter is too strict
                selectEl.innerHTML = '<option value="gemini-2.5-flash">gemini-2.5-flash (Varsayılan)</option>';
            }
        } else {
            selectEl.innerHTML = '<option value="gemini-2.5-flash">Model bulunamadı (Varsayılan eklendi)</option>';
        }

        // Kılavuzu güncelle
        let guideBoxId = mode === 'text' ? 'aiTextGuideBox' : 'aiImageGuideBox';
        admUpdateModelGuide(selectId, guideBoxId);

    } catch (e) {
        console.warn(e);
        alert('Model listesi alınırken hata: ' + e.message);
        selectEl.innerHTML = `<option value="gemini-2.5-flash">${originalText}</option>`;
    } finally {
        selectEl.disabled = false;
    }
}

function admUpdateModelGuide(selectId, guideBoxId) {
    const selectEl = document.getElementById(selectId);
    const guideBox = document.getElementById(guideBoxId);
    if (!selectEl || !guideBox) return;

    const modelName = selectEl.value || '';
    if (!modelName) {
        guideBox.style.display = 'none';
        return;
    }

    let guideHtml = '';
    const isImageTab = guideBoxId === 'aiImageGuideBox';

    if (isImageTab || modelName.includes('imagen')) {
        guideHtml = `
            <strong style="color:#fff;">Açıklama:</strong> Seçtiğiniz bu model görsel üretim (Image Generation) için optimize edilmiştir.<br><br>
            <strong style="color:#fff;">En İyi Sonuç İçin Prompt İpuçları (Resmi Kılavuz):</strong>
            <ul style="margin:8px 0 0 20px; padding:0;">
                <li><strong>Özne (Subject):</strong> Ana objeyi net belirtin (Örn: <em>Siyah bir kedi</em>).</li>
                <li><strong>Ortam (Setting):</strong> Arka planı detaylandırın (Örn: <em>Neon ışıklı, yağmurlu bir sokak</em>).</li>
                <li><strong>Işık & Stil (Style):</strong> Sanat tarzı ve ışık ekleyin (Örn: <em>Sinematik ışık, cyberpunk, 8k çözünürlük, fotogerçekçi</em>).</li>
                <li><strong>İngilizce:</strong> Mümkünse komutları İngilizce verin.</li>
            </ul>
        `;
    } else if (modelName.includes('flash')) {
        guideHtml = `
            <strong style="color:#fff;">Açıklama:</strong> Google'ın hız ve verimlilik odaklı en güncel metin modelidir. Günlük içerikler ve hızlı blog yazıları için mükemmeldir.<br><br>
            <strong style="color:#fff;">En İyi Sonuç İçin Prompt İpuçları (Resmi Kılavuz):</strong>
            <ul style="margin:8px 0 0 20px; padding:0;">
                <li><strong>Rol Atayın:</strong> Cümleye <em>'Sen 10 yıllık uzman bir SEO yazarısın...'</em> diyerek başlayın.</li>
                <li><strong>Hedef Kitle:</strong> Kime hitap ettiğini söyleyin (Örn: <em>Yeni başlayanlar için basit bir dil kullan</em>).</li>
                <li><strong>Format:</strong> Çıktının şeklini belirtin (Örn: <em>3 madde halinde, markdown formatında yaz</em>).</li>
            </ul>
        `;
    } else if (modelName.includes('pro')) {
        guideHtml = `
            <strong style="color:#fff;">Açıklama:</strong> Karmaşık akıl yürütme, kodlama ve detaylı analiz gerektiren zorlu görevler için tasarlanmış profesyonel metin modelidir.<br><br>
            <strong style="color:#fff;">En İyi Sonuç İçin Prompt İpuçları (Resmi Kılavuz):</strong>
            <ul style="margin:8px 0 0 20px; padding:0;">
                <li><strong>Adım Adım:</strong> <em>'Düşünce sürecini adım adım açıkla'</em> diyerek matematik/analiz hatalarını sıfıra indirin.</li>
                <li><strong>Kısıtlamalar:</strong> Ne yapmaması gerektiğini net belirtin (Örn: <em>Teknik terim kullanma, 100 kelimeyi aşma</em>).</li>
                <li><strong>Örnekleme (Few-shot):</strong> İstediğiniz çıktıya benzer 1-2 örnek cümle eklerseniz kusursuz kopyalar.</li>
            </ul>
        `;
    } else {
        guideHtml = `
            <strong style="color:#fff;">Açıklama:</strong> Bu Google AI modeli için özel bir kılavuz bulunmuyor.<br><br>
            <strong style="color:#fff;">Genel Kural:</strong> Ne kadar spesifik, detaylı ve bağlamı net bir komut (prompt) girerseniz, o kadar iyi sonuç alırsınız. İstediğiniz formatı (madde madde, tablo vb.) belirtmeyi unutmayın.
        `;
    }

    guideBox.innerHTML = guideHtml;
    guideBox.style.display = 'block';
}

function admTranslateAiError(statusCode, originalMessage) {
    let trMsg = '';
    
    if (!statusCode && !originalMessage) return 'Bilinmeyen bir hata oluştu.';
    
    // Status code bazlı çeviriler
    if (statusCode === 400) trMsg = 'Geçersiz istek. Girdiğiniz metin veya parametreler hatalı olabilir (Güvenlik filtresine takılmış olabilir).';
    else if (statusCode === 403) trMsg = 'API yetkisiz. Lütfen API anahtarınızın doğru olduğunu ve bu model için izniniz olduğunu kontrol edin.';
    else if (statusCode === 404) trMsg = 'Seçilen model bulunamadı veya bu API anahtarına kapatılmış.';
    else if (statusCode === 429) trMsg = 'API kullanım limitiniz doldu veya çok hızlı istek gönderiyorsunuz. Lütfen biraz bekleyip tekrar deneyin.';
    else if (statusCode === 500) trMsg = 'Google sunucularında bir iç hata oluştu. Lütfen daha sonra tekrar deneyin.';
    else if (statusCode === 503) trMsg = 'Model şu anda aşırı yüklü veya bakıma alınmış. Lütfen başka bir model seçin.';
    
    // Mesaj içeriği bazlı çeviriler (Status Code yoksa veya spesifik hata ise)
    const lowerMsg = (originalMessage || '').toLowerCase();
    if (lowerMsg.includes('safety') || lowerMsg.includes('block')) {
        trMsg = 'İçerik Google güvenlik filtrelerine takıldı (Şiddet, nefret söylemi, müstehcenlik vb. içeremez).';
    } else if (lowerMsg.includes('fetch') || lowerMsg.includes('network')) {
        trMsg = 'Bağlantı koptu veya zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
    } else if (lowerMsg.includes('not supported for predict')) {
        trMsg = 'Bu model görsel üretimi (predict) desteklemiyor. Lütfen menüden başka bir model seçin.';
    }

    if (trMsg) {
        return `Hata: ${trMsg} \n(Detay: ${originalMessage || statusCode})`;
    }
    
    return `Hata: ${originalMessage || 'Beklenmeyen bir hata oluştu (Kodu: ' + statusCode + ')'}`;
}

async function admGenerateText() {
    const promptEl = document.getElementById('aiTextPrompt');
    const resultEl = document.getElementById('aiTextResult');
    const msgEl = document.getElementById('aiTextMsg');
    const btn = document.getElementById('btnGenerateText');
    const modelSelect = document.getElementById('aiTextModelSelect');
    
    const prompt = promptEl.value.trim();
    const selectedModel = modelSelect ? modelSelect.value : 'gemini-2.5-flash';

    if (!prompt) {
        msgEl.textContent = 'Lütfen bir konu veya komut yazın.';
        return;
    }
    if (!selectedModel) {
        msgEl.textContent = 'Lütfen bir model seçin.';
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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(admTranslateAiError(response.status, errorData.error?.message));
        }

        const data = await response.json();
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

// =================================================================
// AI IMAGE STUDIO (Nano Banana / Imagen)
// =================================================================

let _lastGeneratedImageBase64 = null;

async function admGenerateImage() {
    const promptEl = document.getElementById('aiImagePrompt');
    const msgEl = document.getElementById('aiImageMsg');
    const btn = document.getElementById('btnGenerateImage');
    const resultBox = document.getElementById('aiImageResultBox');
    const actionsBox = document.getElementById('aiImageActions');
    const modelSelect = document.getElementById('aiImageModelSelect');
    
    const prompt = promptEl.value.trim();
    const selectedModel = modelSelect ? modelSelect.value : 'gemini-2.5-flash';

    if (!prompt) {
        msgEl.textContent = 'Lütfen İngilizce bir görsel tarifi (prompt) yazın.';
        return;
    }
    if (!selectedModel) {
        msgEl.textContent = 'Lütfen bir model seçin.';
        return;
    }

    msgEl.style.color = '#55efc4';
    msgEl.textContent = 'Görsel üretiliyor, lütfen bekleyin... (Bu işlem 10-20 saniye sürebilir)';
    btn.disabled = true;
    resultBox.innerHTML = '<div class="adm-loading">Üretiliyor...</div>';
    actionsBox.style.display = 'none';
    _lastGeneratedImageBase64 = null;

    try {
        const apiKey = await getAiApiKey();
        if (!apiKey) {
            throw new Error('API Anahtarı bulunamadı! Lütfen Ayarlar sekmesinden kaydedin.');
        }

        let response;
        let base64Image = null;

        // Start a stopwatch so the user knows it's still working
        let secondsElapsed = 0;
        const timerId = setInterval(() => {
            secondsElapsed++;
            msgEl.textContent = `Görsel üretiliyor, lütfen bekleyin... (Geçen süre: ${secondsElapsed} saniye. Yüksek kalite olduğu için uzun sürebilir)`;
            resultBox.innerHTML = `<div class="adm-loading">Üretiliyor... (${secondsElapsed}s)</div>`;
        }, 1000);

        try {
            if (selectedModel.includes('imagen') || selectedModel.includes('image')) {
                if (selectedModel.includes('imagen')) {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:predict?key=${apiKey}`;
                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            instances: [ { prompt: prompt } ],
                            parameters: { sampleCount: 1, aspectRatio: "1:1" }
                        })
                    });
                } else {
                    // Experimental gemini image models using generateContent
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    });
                }

                clearInterval(timerId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(admTranslateAiError(response.status, errorData.error?.message));
                }
                const data = await response.json();
                
                if (selectedModel.includes('imagen')) {
                    if (data.predictions && data.predictions[0]) {
                        base64Image = data.predictions[0].bytesBase64Encoded || data.predictions[0].image?.bytesBase64Encoded;
                    }
                } else {
                    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                        const part = data.candidates[0].content.parts[0];
                        if (part.inlineData && part.inlineData.data) {
                            base64Image = part.inlineData.data;
                        } else if (part.text) {
                            throw new Error("Seçtiğiniz model resim yerine metin döndürdü. Lütfen menüden 'imagen' içeren bir model seçin.");
                        }
                    }
                }
            } else {
                throw new Error("Lütfen listeden görsel üretebilen bir model seçin (örn: imagen-3.0-generate-001).");
            }
        } catch (fetchErr) {
            clearInterval(timerId);
            throw fetchErr;
        }
        
        if (!base64Image) {
            throw new Error('API yanıtından görsel verisi okunamadı. Lütfen model menüsünden bir "Imagen" modeli seçtiğinizden emin olun.');
        }

        _lastGeneratedImageBase64 = base64Image;
        const imgSrc = `data:image/jpeg;base64,${base64Image}`;
        
        resultBox.innerHTML = `<img src="${imgSrc}" style="max-width:100%; max-height:400px; border-radius:4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">`;
        actionsBox.style.display = 'flex';
        msgEl.textContent = `Görsel başarıyla üretildi! (${secondsElapsed} saniye sürdü)`;
        setTimeout(() => { msgEl.textContent = ''; }, 5000);

    } catch (e) {
        msgEl.style.color = '#ff7675';
        msgEl.textContent = e.message;
        resultBox.innerHTML = `<span style="color: rgba(255,255,255,0.3); font-size: 13px;">Üretim başarısız.</span>`;
    } finally {
        btn.disabled = false;
    }
}

function admDownloadImage() {
    if (!_lastGeneratedImageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${_lastGeneratedImageBase64}`;
    link.download = `auroranova-ai-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
}

/* ----------------------------------------------------
    VIDEO EDITOR KISMI (FFmpeg.wasm)
---------------------------------------------------- */
let ffmpegInstance = null;
let currentVideoFile = null;

async function initFFmpeg() {
    if (ffmpegInstance) return ffmpegInstance;
    
    const { FFmpeg } = window.FFmpegWASM;
    const ffmpeg = new FFmpeg();
    
    // İlerleme çubuğunu güncelle
    ffmpeg.on('progress', ({ progress, time }) => {
        const progEl = document.getElementById('videoEditorProgress');
        if (progEl) {
            progEl.textContent = Math.max(0, Math.min(100, Math.round(progress * 100)));
        }
    });

    try {
        const { toBlobURL } = window.FFmpegUtil;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        // Blob URL kullanarak CORS (Cross-Origin Worker) hatalarını aşıyoruz
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        const classWorkerURL = await toBlobURL('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js', 'text/javascript');
        
        await ffmpeg.load({
            coreURL: coreURL,
            wasmURL: wasmURL,
            classWorkerURL: classWorkerURL
        });
        
        ffmpegInstance = ffmpeg;
        return ffmpeg;
    } catch (e) {
        console.error("FFmpeg yükleme hatası:", e);
        alert("Video editörü yüklenirken bir hata oluştu: " + e.message);
        throw e;
    }
}

window.admHandleVideoSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Limit Kontrolü
    const MAX_SIZE_MB = 250;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`HATA: Dosya boyutu çok büyük! Maksimum ${MAX_SIZE_MB}MB büyüklüğünde bir video yükleyebilirsiniz.\n\nSeçtiğiniz dosya boyutu: ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
        event.target.value = ''; // Input'u temizle
        document.getElementById('videoEditorControls').style.display = 'none';
        document.getElementById('videoEditorResult').innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 13px;">Videoyu seçip bir işleme tıkladığınızda sonuç burada belirecek.</span>';
        currentVideoFile = null;
        return;
    }
    
    currentVideoFile = file;
    document.getElementById('videoEditorControls').style.display = 'block';
    
    // Orijinal videoyu önizlet
    const url = URL.createObjectURL(file);
    const resultBox = document.getElementById('videoEditorResult');
    resultBox.innerHTML = `
        <video src="${url}" controls style="max-width:100%; max-height:300px; border-radius:4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>
        <span style="color:#aaa; font-size:12px; margin-top:8px;">Orijinal Video</span>
    `;
};

window.admVideoAction = async function(action) {
    if (!currentVideoFile) return;
    
    const statusBox = document.getElementById('videoEditorStatus');
    const resultBox = document.getElementById('videoEditorResult');
    const progEl = document.getElementById('videoEditorProgress');
    const buttons = document.querySelectorAll('#videoEditorControls button');
    
    buttons.forEach(b => b.disabled = true);
    statusBox.style.display = 'block';
    progEl.textContent = '0';
    
    try {
        const ff = await initFFmpeg();
        const { fetchFile } = window.FFmpegUtil;
        
        const inputName = 'input.mp4';
        const outputName = action === 'gif' ? 'output.gif' : 'output.mp4';
        
        // Videoyu belleğe yaz
        await ff.writeFile(inputName, await fetchFile(currentVideoFile));
        
        let args = [];
        if (action === 'boomerang') {
            // İleri oynat, sonra geriye oynat (Kusursuz döngü). Hata olmaması için sesi siliyoruz.
            args = ['-i', inputName, '-filter_complex', '[0:v]reverse[r];[0:v][r]concat=n=2:v=1[outv]', '-map', '[outv]', '-an', outputName];
        } else if (action === 'reverse') {
            // Görüntüyü ve sesi terse çevir
            args = ['-i', inputName, '-vf', 'reverse', '-af', 'areverse', outputName];
        } else if (action === 'clone2x') {
            // Videoyu ard arda 2 kez oynat
            args = ['-stream_loop', '1', '-i', inputName, '-c', 'copy', outputName];
        } else if (action === 'remove_audio') {
            // Sesi sil (sadece video kalsın)
            args = ['-i', inputName, '-c', 'copy', '-an', outputName];
        } else if (action === 'gif') {
            // Düşük çözünürlüklü FPS=10 GIF yap (boyut büyümesin diye)
            args = ['-i', inputName, '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', outputName];
        }
        
        // FFmpeg komutunu çalıştır
        await ff.exec(args);
        
        // Çıktıyı bellekten oku
        const data = await ff.readFile(outputName);
        const type = action === 'gif' ? 'image/gif' : 'video/mp4';
        const url = URL.createObjectURL(new Blob([data.buffer], { type }));
        
        let mediaTag = action === 'gif' 
            ? `<img src="${url}" style="max-width:100%; max-height:400px; border-radius:4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />` 
            : `<video src="${url}" controls autoplay style="max-width:100%; max-height:400px; border-radius:4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>`;
            
        resultBox.innerHTML = `
            ${mediaTag}
            <a href="${url}" download="${outputName}" class="adm-btn" style="margin-top:16px; text-decoration:none;">Bilgisayara İndir</a>
        `;
        
    } catch (err) {
        console.error(err);
        alert('Video işlenirken hata oluştu: ' + err.message);
    } finally {
        buttons.forEach(b => b.disabled = false);
        statusBox.style.display = 'none';
    }
};
