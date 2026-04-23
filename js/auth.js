// =================================================================
// AURORANOVA AUTH & MEMBER SYSTEM
// Prefix: _an (tüm global değişkenler — fin.js ve main.js ile çakışmaz)
// =================================================================

'use strict';

let _anApp  = null;
let _anAuth = null;
let _anDb   = null;
let _anCurrentUser = null;

// -----------------------------------------------------------------
// Firebase Initialization
// -----------------------------------------------------------------
function _anInitApp() {
    if (_anApp) return _anApp;
    try {
        _anApp  = firebase.apps.find(a => a.name === 'main') ||
                  firebase.initializeApp(AN_FB_CONFIG, 'main');
        _anAuth = firebase.auth(_anApp);
        _anDb   = firebase.firestore(_anApp);
    } catch (e) {
        console.warn('[auth] Firebase init error:', e);
    }
    return _anApp;
}

// -----------------------------------------------------------------
// Auth State Listener
// -----------------------------------------------------------------
function _anStartAuthListener() {
    if (!_anAuth) return;
    _anAuth.onAuthStateChanged(async (user) => {
        _anCurrentUser = user;
        if (user) {
            await _anEnsureUserDoc(user);
            _anUpdateNavSignedIn(user);
        } else {
            _anUpdateNavSignedOut();
        }
    });
}

// -----------------------------------------------------------------
// Nav UI helpers
// -----------------------------------------------------------------
function _anUpdateNavSignedIn(user) {
    const displayName = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0];

    // Top nav auth area
    const topLogin   = document.getElementById('navTopLoginBtn');
    const topProfile = document.getElementById('navTopProfileBtn');
    const topPhoto   = document.getElementById('navTopUserPhoto');
    const topName    = document.getElementById('navTopUserName');
    if (topLogin)   topLogin.style.display   = 'none';
    if (topProfile) { topProfile.style.display = 'flex'; }
    if (topName)    topName.textContent = displayName;
    if (topPhoto) {
        topPhoto.src = user.photoURL || '';
        topPhoto.style.display = user.photoURL ? 'block' : 'none';
    }
}

function _anUpdateNavSignedOut() {
    // Top nav
    const topLogin   = document.getElementById('navTopLoginBtn');
    const topProfile = document.getElementById('navTopProfileBtn');
    if (topLogin)   topLogin.style.display   = 'flex';
    if (topProfile) topProfile.style.display = 'none';
}

// -----------------------------------------------------------------
// Auth Modal
// -----------------------------------------------------------------
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Close hamburger menu
    const navLinks  = document.getElementById('navLinks');
    const hamburger = document.getElementById('navHamburger');
    if (navLinks)  navLinks.classList.remove('open');
    if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
    // Clear previous errors
    const errEl = document.getElementById('auth-error');
    if (errEl) errEl.textContent = '';
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// -----------------------------------------------------------------
// Google Sign-In
// -----------------------------------------------------------------
async function _anGoogleSignIn() {
    if (!_anAuth) { _anInitApp(); }
    const errEl = document.getElementById('auth-error');
    try {
        const provider = new firebase.auth.GoogleAuthProvider(_anApp);
        await _anAuth.signInWithPopup(provider);
        closeAuthModal();
    } catch (e) {
        console.warn('[auth] Google sign-in error:', e);
        const msg = _anGetErrorMsg(e.code);
        if (errEl) errEl.textContent = msg;
    }
}

function _anGetErrorMsg(code) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';
    const msgs = {
        'auth/popup-closed-by-user':    lang === 'tr' ? 'Giriş penceresi kapatıldı.' : 'Sign-in popup was closed.',
        'auth/cancelled-popup-request': lang === 'tr' ? 'Giriş isteği iptal edildi.' : 'Sign-in request cancelled.',
        'auth/network-request-failed':  lang === 'tr' ? 'Ağ hatası. Bağlantınızı kontrol edin.' : 'Network error. Check your connection.',
        'auth/popup-blocked':           lang === 'tr' ? 'Pop-up engellendi. Lütfen pop-up\'lara izin verin.' : 'Popup blocked. Please allow popups.',
    };
    return msgs[code] || (lang === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
}

// -----------------------------------------------------------------
// Sign Out
// -----------------------------------------------------------------
async function anSignOut() {
    if (!_anAuth) return;
    try {
        await _anAuth.signOut();
        closeDashboard();
    } catch (e) {
        console.warn('[auth] Sign-out error:', e);
    }
}

// -----------------------------------------------------------------
// Ensure Firestore User Document
// -----------------------------------------------------------------
async function _anEnsureUserDoc(user) {
    if (!_anDb) return;
    try {
        const ref = _anDb.collection('web_users').doc(user.uid);
        const snap = await ref.get();
        if (!snap.exists) {
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';
            await ref.set({
                uid:         user.uid,
                email:       user.email,
                displayName: user.displayName || '',
                photoURL:    user.photoURL    || '',
                joinDate:    firebase.firestore.FieldValue.serverTimestamp(),
                roles:       ['member'],
                lang:        lang
            });
        }
    } catch (e) {
        console.warn('[auth] Firestore user doc error:', e);
    }
}

// -----------------------------------------------------------------
// Member Dashboard
// -----------------------------------------------------------------
function openDashboard() {
    if (!_anCurrentUser) { openAuthModal(); return; }
    const dash = document.getElementById('member-dashboard');
    if (!dash) return;

    // Populate header
    const photo = document.getElementById('dashUserPhoto');
    const name  = document.getElementById('dashUserName');
    const email = document.getElementById('dashUserEmail');
    if (photo) {
        photo.src = _anCurrentUser.photoURL || '';
        photo.style.display = _anCurrentUser.photoURL ? 'block' : 'none';
    }
    if (name)  name.textContent  = _anCurrentUser.displayName || _anCurrentUser.email.split('@')[0];
    if (email) email.textContent = _anCurrentUser.email;

    dash.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Close hamburger
    const navLinks  = document.getElementById('navLinks');
    const hamburger = document.getElementById('navHamburger');
    if (navLinks)  navLinks.classList.remove('open');
    if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }

    _anLoadUserProducts();
}

function closeDashboard() {
    const dash = document.getElementById('member-dashboard');
    if (!dash) return;
    dash.style.display = 'none';
    document.body.style.overflow = '';
}

// -----------------------------------------------------------------
// Load User Products from Firestore
// -----------------------------------------------------------------
async function _anLoadUserProducts() {
    if (!_anDb || !_anCurrentUser) return;
    const listEl = document.getElementById('dashProductList');
    if (!listEl) return;

    try {
        const snap = await _anDb.collection('userProducts')
            .where('uid', '==', _anCurrentUser.uid)
            .where('status', '==', 'active')
            .get();

        if (snap.empty) {
            _anRenderEmptyProducts(listEl);
            return;
        }

        listEl.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';
            const name = lang === 'tr' ? (data.nameTR || data.nameEN || 'Ürün') : (data.nameEN || data.nameTR || 'Product');
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-icon">&#x1F4BB;</div>
                <div class="product-card-info">
                    <p class="product-card-name">${name}</p>
                    <span class="product-card-status active">&#x2713; ${lang === 'tr' ? 'Aktif' : 'Active'}</span>
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch (e) {
        console.warn('[auth] Load products error:', e);
        _anRenderEmptyProducts(listEl);
    }
}

function _anRenderEmptyProducts(container) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';
    const t = (typeof translations !== 'undefined' && translations[lang] && translations[lang].auth)
        ? translations[lang].auth
        : null;
    const msg = t ? t.noProducts : (lang === 'tr' ? 'Henüz bir ürününüz bulunmuyor.' : "You don't have any products yet.");
    container.innerHTML = `
        <div class="dashboard-empty">
            <span class="dashboard-empty-icon">&#x1F4E6;</span>
            <p>${msg}</p>
        </div>
    `;
}

// -----------------------------------------------------------------
// Page View Tracking
// -----------------------------------------------------------------
function _anTrackPageView() {
    if (!_anDb) return;
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        _anDb.collection('pageViews').doc(today).set(
            { total: firebase.firestore.FieldValue.increment(1) },
            { merge: true }
        );
    } catch (e) {
        // Silently fail — tracking is non-critical
    }
}

// -----------------------------------------------------------------
// Language Change Handler
// (main.js'deki setLanguage() sonunda bu event dispatch edilir)
// -----------------------------------------------------------------
window.addEventListener('languageChanged', (e) => {
    const lang = e.detail;
    if (typeof translations === 'undefined' || !translations[lang] || !translations[lang].auth) return;
    const t = translations[lang].auth;

    // Nav login buttons (hamburger menu + top bar)
    document.querySelectorAll('[data-i18n="navLogin"]').forEach(el => {
        el.textContent = t.navLogin;
    });

    // Auth modal
    const authTitle = document.querySelector('#auth-modal [data-i18n="authTitle"]');
    const authDesc  = document.querySelector('#auth-modal [data-i18n="authDesc"]');
    const googleBtn = document.querySelector('#auth-modal [data-i18n="googleBtn"]');
    const authPriv  = document.querySelector('#auth-modal [data-i18n="authPrivacy"]');
    if (authTitle) authTitle.textContent = t.authTitle;
    if (authDesc)  authDesc.textContent  = t.authDesc;
    if (googleBtn) googleBtn.textContent = t.googleBtn;
    if (authPriv)  authPriv.textContent  = t.authPrivacy;

    // Dashboard
    const signOutBtns = document.querySelectorAll('[data-i18n="signOut"]');
    signOutBtns.forEach(el => { el.textContent = t.signOut; });
    const myProd = document.querySelector('[data-i18n="myProducts"]');
    if (myProd) myProd.textContent = t.myProducts;

    // Re-render empty state if showing
    const listEl = document.getElementById('dashProductList');
    if (listEl && listEl.querySelector('.dashboard-empty')) {
        _anRenderEmptyProducts(listEl);
    }
});

// -----------------------------------------------------------------
// Keyboard: ESC closes modals
// -----------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const authModal = document.getElementById('auth-modal');
        const dashModal = document.getElementById('member-dashboard');
        if (authModal && authModal.style.display !== 'none') closeAuthModal();
        if (dashModal && dashModal.style.display !== 'none') closeDashboard();
    }
});

// -----------------------------------------------------------------
// Init on DOM Ready
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    _anInitApp();
    _anStartAuthListener();
    _anTrackPageView();
});
