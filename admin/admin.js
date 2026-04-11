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
            const snap = await _admDb.collection('users').doc(user.uid).get();
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
}

// -----------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------
async function admLoadDashboard() {
    try {
        // Total members
        const usersSnap = await _admDb.collection('users').get();
        const totalMembers = usersSnap.size;
        document.getElementById('kpiTotalMembers').textContent = totalMembers;

        // New this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newWeekSnap = await _admDb.collection('users')
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
        const snap = await _admDb.collection('users').orderBy('joinDate', 'desc').get();
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
        const ref = _admDb.collection('users').doc(uid);
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
        if (trel) trel.value = s.announcementTR || '';
        if (enel) enel.value = s.announcementEN || '';
        if (act)  act.checked = s.announcementActive || false;
    } catch (e) {
        console.warn('[admin] Settings load:', e);
    }
}

async function admSaveSettings() {
    const msgEl = document.getElementById('settingsMsg');
    const data = {
        announcementTR:     document.getElementById('settAnnounceTR').value.trim(),
        announcementEN:     document.getElementById('settAnnounceEN').value.trim(),
        announcementActive: document.getElementById('settAnnounceActive').checked,
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
