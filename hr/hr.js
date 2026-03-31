'use strict';
/* ============================================================
   AuroraNova HR Tasks — hr.js
   Renames applied:
     state          → hrState
     STORAGE_KEY    → HR_STORAGE_KEY
     navigate()     → hrNavigate()
     openModal()    → hrOpenModal()
     closeModal()   → hrCloseModal()
     genId()        → hrGenId()
     loadState()    → hrLoadState()
     saveState()    → hrSaveState()
   Calendar bug fix: initCalendar() called at top of renderCalendar()
   ============================================================ */

/* ---- State ---- */
let hrState = {
  personnel: [],
  templates: [],
  processes: [],
  nextId: 1
};

const HR_STORAGE_KEY = 'ik_data_v1';

// ── Firebase Firestore sync ──
const HR_FB_CONFIG = {
  apiKey: "AIzaSyD8fYMMpfVQlykMoKVDBJh0IP2Wc9A9WPY",
  authDomain: "auroranova-website.firebaseapp.com",
  projectId: "auroranova-website",
  storageBucket: "auroranova-website.firebasestorage.app",
  messagingSenderId: "1033362428789",
  appId: "1:1033362428789:web:e0b5e773efca7fcc8a793c"
};
let _hrDb = null;
function _hrInitDb() {
  if (_hrDb) return _hrDb;
  try {
    const app = firebase.apps.find(a => a.name === 'hr') ||
                firebase.initializeApp(HR_FB_CONFIG, 'hr');
    _hrDb = firebase.firestore(app);
  } catch(e) { console.warn('HR: Firebase init failed', e); }
  return _hrDb;
}

function _hrSyncBadge(msg, color) {
  const el = document.getElementById('hr-sync-badge');
  if (el) { el.textContent = msg; el.style.color = color || '#9da4c8'; }
}

let _hrSaveTimer = null;

/* ---- Persistence ---- */
async function hrLoadState() {
  // Önce localStorage'dan yükle (anlık görüntü)
  try {
    const raw = localStorage.getItem(HR_STORAGE_KEY);
    if (raw) hrState = JSON.parse(raw);
  } catch(e) {}
  // Firestore'dan çek (güncel veri)
  const db = _hrInitDb();
  if (!db) return;
  _hrSyncBadge('Yükleniyor…');
  try {
    const doc = await db.collection('hr_data').doc('main').get();
    if (doc.exists) {
      const d = doc.data();
      hrState = {
        personnel: d.personnel || [],
        templates: d.templates || [],
        processes: d.processes || [],
        nextId:    d.nextId    || 1,
        _calTab:   d._calTab   || 'tasks'
      };
      localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(hrState));
    }
    _hrSyncBadge('✓ Senkronize', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2500);
  } catch(e) {
    console.warn('HR: Firestore load failed, using local data', e);
    _hrSyncBadge('⚠ Çevrimdışı mod', '#e8a24a');
  }
}

function renderDocCalendar() {
  initCalendar();
  const pane = document.getElementById('cal-docs-pane');
  if (!pane) return;

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                      'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const todayStr = today();

  // Build event map
  const eventMap = {};
  const addDocEvent = (dateStr, label, type, personId) => {
    if (!dateStr) return;
    const [y, m] = dateStr.split('-').map(Number);
    if (y !== calYear || m !== calMonth + 1) return;
    if (!eventMap[dateStr]) eventMap[dateStr] = [];
    const isOverdue = dateStr < todayStr;
    const isSoon = !isOverdue && dateStr <= addDays(todayStr, 30);
    eventMap[dateStr].push({ label, type, personId, dateStr, isOverdue, isSoon });
  };

  hrState.personnel.forEach(p => {
    if (p.status === 'passive') return;
    if (p.permitExpiry) addDocEvent(p.permitExpiry, p.name + ': Çalışma İzni', 'permit', p.id);
    if (p.passportExpiry) addDocEvent(p.passportExpiry, p.name + ': Pasaport', 'passport', p.id);
  });

  // Grid
  const firstDay   = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const startDay    = (firstDay + 6) % 7;

  let html = `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <button class="btn btn-secondary btn-sm" onclick="docCalNav(-1)">‹</button>
        <span style="font-weight:700;font-size:15px" id="doc-cal-title">${monthNames[calMonth]} ${calYear}</span>
        <button class="btn btn-secondary btn-sm" onclick="docCalNav(1)">›</button>
      </div>
      <div style="display:flex;gap:14px;font-size:11px;color:#9da4c8;margin-bottom:10px">
        <span><span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;margin-right:4px;vertical-align:middle"></span>Çalışma İzni</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:#8b5cf6;border-radius:2px;margin-right:4px;vertical-align:middle"></span>Pasaport</span>
      </div>
      <div class="cal-grid">`;

  ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach(d =>
    html += `<div class="cal-day-header">${d}</div>`);

  for (let i = 0; i < startDay; i++) {
    html += `<div class="cal-cell other-month"><div class="cal-date">${daysInPrev - startDay + 1 + i}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const events  = eventMap[dateStr] || [];
    html += `<div class="cal-cell${isToday ? ' today' : ''}">
      <div class="cal-date">${isToday ? `<span>${d}</span>` : d}</div>` +
      events.map(ev => {
        const bg = ev.type === 'permit'
          ? (ev.isOverdue ? '#ef4444' : (ev.isSoon ? '#f59e0b' : '#f59e0b'))
          : (ev.isOverdue ? '#ef4444' : (ev.isSoon ? '#a78bfa' : '#8b5cf6'));
        const icon = ev.isOverdue ? '⚠ ' : (ev.isSoon ? '⏰ ' : '');
        return `<span class="cal-event cal-event-clickable" style="background:${bg}22;color:${bg};cursor:pointer"
          onclick="hrDocEventClick('${ev.personId}','${ev.type}')" title="${ev.label}">${icon}${ev.label}</span>`;
      }).join('') +
    `</div>`;
  }

  const totalCells = startDay + daysInMonth;
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++)
      html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  html += '</div></div>';
  pane.innerHTML = html;
}

function docCalNav(dir) {
  initCalendar();
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderDocCalendar();
}

function hrDocEventClick(personId, type) {
  const person = hrState.personnel.find(p => p.id === personId);
  if (!person) return;
  const isPermit = type === 'permit';
  const expiry = isPermit ? person.permitExpiry : person.passportExpiry;
  const fileObj = isPermit ? person.permitFile : person.passportFile;
  const label   = isPermit ? 'Çalışma İzni' : 'Pasaport';
  const color   = isPermit ? '#f59e0b' : '#8b5cf6';
  const todayStr = today();
  const isOverdue = expiry && expiry < todayStr;
  const isSoon = expiry && !isOverdue && expiry <= addDays(todayStr, 30);
  const statusLabel = isOverdue ? 'Süresi Dolmuş' : (isSoon ? '30 Gün İçinde Bitiyor' : 'Geçerli');
  const statusColor = isOverdue ? '#ef4444' : (isSoon ? '#f59e0b' : '#22c55e');

  const existing = document.getElementById('hr-doc-event-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'hr-doc-event-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);padding:16px';

  const templates = hrState.templates.filter(t => t.type === 'calisma-izni' || t.type === 'izin-yenileme');
  const templateOpts = templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px;max-width:420px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18);font-family:'DM Sans',sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#1e2342">${person.name}</div>
          <div style="font-size:11px;color:#9da4c8;margin-top:2px">${label} Detayı</div>
        </div>
        <button onclick="document.getElementById('hr-doc-event-modal').remove()" style="background:none;border:none;font-size:18px;color:#9da4c8;cursor:pointer;padding:0">×</button>
      </div>

      <div style="background:#f5f6fb;border-radius:10px;padding:14px 16px;margin-bottom:16px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
          <span style="font-size:11px;padding:3px 8px;border-radius:6px;background:${color}18;color:${color};font-weight:600">${label}</span>
          <span style="font-size:11px;padding:3px 8px;border-radius:6px;background:${statusColor}18;color:${statusColor};font-weight:600">${statusLabel}</span>
        </div>
        <div style="font-size:13px;color:#1e2342"><strong>Bitiş Tarihi:</strong> ${expiry || '-'}</div>
        ${isPermit && person.passportNo ? `<div style="font-size:12px;color:#5b6080;margin-top:4px"><strong>Pasaport No:</strong> ${person.passportNo}</div>` : ''}
      </div>

      ${fileObj ? `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:#1e2342;margin-bottom:8px">Yüklü Belge</div>
        ${fileObj.type && fileObj.type.startsWith('image/')
          ? `<img src="${fileObj.data}" style="max-width:100%;max-height:120px;border-radius:8px;object-fit:contain;border:1px solid #dde1ee">`
          : `<a href="${fileObj.data}" download="${fileObj.name}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#5b7fe8;text-decoration:none;background:#f5f6fb;padding:8px 12px;border-radius:8px;border:1px solid #dde1ee">📄 ${fileObj.name} — İndir</a>`
        }
      </div>` : ''}

      ${templates.length ? `
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:600;color:#1e2342;margin-bottom:8px">Süreç Başlat</div>
        <select id="doc-modal-tmpl" style="width:100%;padding:9px 12px;border:1px solid #dde1ee;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;margin-bottom:8px">
          <option value="">Şablon seçin...</option>
          ${templateOpts}
        </select>
        <input type="date" id="doc-modal-start" style="width:100%;padding:9px 12px;border:1px solid #dde1ee;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;box-sizing:border-box" placeholder="Başlangıç tarihi">
        <button onclick="hrDocStartProcess('${personId}')" style="width:100%;margin-top:8px;padding:11px;background:#5b7fe8;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Süreci Başlat</button>
      </div>` : '<p style="font-size:12px;color:#9da4c8;margin-bottom:14px">Süreç başlatmak için önce Şablonlar bölümünden şablon oluşturun.</p>'}

      <button onclick="document.getElementById('hr-doc-event-modal').remove()" style="width:100%;padding:11px;background:#f5f6fb;color:#5b6080;border:1px solid #dde1ee;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Kapat</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function hrDocStartProcess(personId) {
  const templateId = document.getElementById('doc-modal-tmpl')?.value;
  const startDate  = document.getElementById('doc-modal-start')?.value;
  if (!templateId) { alert('Lütfen bir şablon seçin.'); return; }
  if (!startDate)  { alert('Lütfen başlangıç tarihi girin.'); return; }

  const tmpl   = hrState.templates.find(t => t.id === templateId);
  const person = hrState.personnel.find(p => p.id === personId);
  if (!tmpl || !person) return;

  const process = {
    id: hrGenId(),
    templateId,
    templateName: tmpl.name,
    templateType: tmpl.type,
    personId,
    personName: person.name,
    startDate,
    notes: '',
    open: false,
    tasks: tmpl.tasks.map((t, i) => ({
      id: 'task_' + i,
      name: t.name,
      assignee: t.assignee,
      dueDate: addDays(startDate, t.days),
      done: false
    }))
  };

  hrState.processes.push(process);
  hrSaveState();
  document.getElementById('hr-doc-event-modal')?.remove();
  hrNavigate('processes');
}

function hrSaveState() {
  // Her zaman localStorage'a yaz
  try { localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(hrState)); } catch(e) {}
  // Firestore'a debounce ile yaz (1.5sn)
  clearTimeout(_hrSaveTimer);
  _hrSaveTimer = setTimeout(async () => {
    const db = _hrInitDb();
    if (!db) return;
    _hrSyncBadge('Kaydediliyor…');
    try {
      await db.collection('hr_data').doc('main').set({
        personnel: hrState.personnel || [],
        templates: hrState.templates || [],
        processes: hrState.processes || [],
        nextId:    hrState.nextId    || 1,
        updatedAt: new Date().toISOString()
      });
      _hrSyncBadge('✓ Kaydedildi', '#2ea06e');
      setTimeout(() => _hrSyncBadge(''), 2500);
    } catch(e) {
      console.warn('HR: Firestore save failed', e);
      _hrSyncBadge('⚠ Yerel kayıt', '#e8a24a');
    }
  }, 1500);
  // eski return değeri yoktu, boş bırak
}

/* ---- ID generator ---- */
function hrGenId() {
  return 'id_' + (hrState.nextId++) + '_' + Date.now();
}

/* ---- Helpers ---- */
function hrOpenModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function hrCloseModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const pageTitles = {
  dashboard: 'Gösterge Paneli',
  personnel: 'Personel',
  processes: 'Süreçler',
  calendar: 'Takvim',
  templates: 'Şablonlar'
};

function hrNavigate(page) {
  /* Update nav items */
  document.querySelectorAll('.hr-app .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  /* Update topbar title */
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;

  /* Show correct page section */
  document.querySelectorAll('.hr-app .page-section').forEach(el => {
    el.classList.toggle('active', el.id === 'page-' + page);
  });

  /* Topbar action buttons */
  const actions = {
    dashboard: '',
    personnel: '<button class="btn btn-primary" onclick="hrOpenModal(\'modal-person\')">+ Personel Ekle</button>',
    processes: '<button class="btn btn-primary" onclick="openProcessModal()">+ Süreç Başlat</button>',
    calendar: '',
    templates: '<button class="btn btn-primary" onclick="openTemplateModal()">+ Yeni Şablon</button>'
  };
  const actionsEl = document.getElementById('topbar-actions');
  if (actionsEl) actionsEl.innerHTML = actions[page] || '';

  /* Render page content */
  if (page === 'dashboard') renderDashboard();
  if (page === 'personnel') renderPersonnel();
  if (page === 'processes') renderProcesses();
  if (page === 'calendar') { initCalendar(); hrSwitchCalTab(hrState._calTab || 'tasks'); }
  if (page === 'templates') renderTemplates();
}

/* ============================================================
   PERSONNEL
   ============================================================ */

function savePerson(e) {
  e.preventDefault();
  const form = document.getElementById('form-person');
  const id = form.dataset.editId || hrGenId();
  const isEdit = !!form.dataset.editId;

  // Dosya verileri (base64) — mevcut düzenlemede korunur
  const existingPerson = isEdit ? hrState.personnel.find(p => p.id === id) : null;
  const person = {
    id,
    name: document.getElementById('p-name').value.trim(),
    position: document.getElementById('p-position').value.trim(),
    nationality: document.getElementById('p-nationality').value,
    email: document.getElementById('p-email').value.trim(),
    startDate: document.getElementById('p-startdate').value,
    permitExpiry: document.getElementById('p-permit').value,
    permitFile: window._hrUploadBuffer?.permit ?? existingPerson?.permitFile ?? null,
    passportExpiry: document.getElementById('p-passport-expiry').value,
    passportNo: document.getElementById('p-passport-no').value.trim(),
    passportFile: window._hrUploadBuffer?.passport ?? existingPerson?.passportFile ?? null,
    status: document.getElementById('p-status').value
  };

  if (!person.name) return;

  if (isEdit) {
    const idx = hrState.personnel.findIndex(p => p.id === id);
    if (idx !== -1) hrState.personnel[idx] = person;
  } else {
    hrState.personnel.push(person);
  }
  hrSaveState();
  hrCloseModal('modal-person');
  form.reset();
  delete form.dataset.editId;
  window._hrUploadBuffer = {};
  hrClearFileUpload('permit');
  hrClearFileUpload('passport');
  renderPersonnel();
}

function editPerson(id) {
  const person = hrState.personnel.find(p => p.id === id);
  if (!person) return;
  const form = document.getElementById('form-person');
  form.dataset.editId = id;
  document.getElementById('p-name').value = person.name || '';
  document.getElementById('p-position').value = person.position || '';
  document.getElementById('p-nationality').value = person.nationality || '';
  document.getElementById('p-email').value = person.email || '';
  document.getElementById('p-startdate').value = person.startDate || '';
  document.getElementById('p-permit').value = person.permitExpiry || '';
  document.getElementById('p-passport-expiry').value = person.passportExpiry || '';
  document.getElementById('p-passport-no').value = person.passportNo || '';
  document.getElementById('p-status').value = person.status || 'active';
  // Dosya preview'ları güncelle
  window._hrUploadBuffer = {};
  hrShowExistingFile('permit', person.permitFile);
  hrShowExistingFile('passport', person.passportFile);
  document.getElementById('modal-person-title').textContent = 'Personel Düzenle';
  hrOpenModal('modal-person');
}

function deletePerson(id) {
  if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
  hrState.personnel = hrState.personnel.filter(p => p.id !== id);
  hrSaveState();
  renderPersonnel();
}

function filterPersonnel() {
  renderPersonnel();
}

function hrHandleFileUpload(type, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('Dosya boyutu 5MB\'ı geçemez.');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    if (!window._hrUploadBuffer) window._hrUploadBuffer = {};
    window._hrUploadBuffer[type] = { name: file.name, data: e.target.result, type: file.type };
    const labelEl = document.getElementById(type === 'permit' ? 'permit-file-label' : 'passport-file-label');
    if (labelEl) labelEl.textContent = file.name;
    hrShowFilePreview(type, { name: file.name, data: e.target.result, type: file.type });
  };
  reader.readAsDataURL(file);
}

function hrShowFilePreview(type, fileObj) {
  const previewEl = document.getElementById(type + '-file-preview');
  if (!previewEl || !fileObj) return;
  const isImg = fileObj.type && fileObj.type.startsWith('image/');
  previewEl.style.display = 'flex';
  previewEl.innerHTML = isImg
    ? `<img src="${fileObj.data}" style="max-height:60px;border-radius:6px;object-fit:cover"> <span style="font-size:12px;color:#5b6080;margin-left:8px;align-self:center">${fileObj.name}</span><button type="button" onclick="hrClearFileUpload('${type}')" style="margin-left:auto;background:none;border:none;color:#e8637a;cursor:pointer;font-size:16px">×</button>`
    : `<span style="font-size:20px">📄</span> <span style="font-size:12px;color:#5b6080;margin-left:8px;align-self:center">${fileObj.name}</span><button type="button" onclick="hrClearFileUpload('${type}')" style="margin-left:auto;background:none;border:none;color:#e8637a;cursor:pointer;font-size:16px">×</button>`;
}

function hrShowExistingFile(type, fileObj) {
  if (!fileObj) return;
  const labelEl = document.getElementById(type === 'permit' ? 'permit-file-label' : 'passport-file-label');
  if (labelEl) labelEl.textContent = fileObj.name || 'Mevcut dosya';
  hrShowFilePreview(type, fileObj);
}

function hrClearFileUpload(type) {
  if (window._hrUploadBuffer) delete window._hrUploadBuffer[type];
  const inputEl = document.getElementById('p-' + type + '-file');
  if (inputEl) inputEl.value = '';
  const labelEl = document.getElementById(type === 'permit' ? 'permit-file-label' : 'passport-file-label');
  if (labelEl) labelEl.textContent = 'Dosya seç veya sürükle bırak';
  const previewEl = document.getElementById(type + '-file-preview');
  if (previewEl) { previewEl.style.display = 'none'; previewEl.innerHTML = ''; }
}

function hrExpiryCell(dateStr) {
  if (!dateStr) return '-';
  const todayStr = today();
  const in30 = addDays(todayStr, 30);
  const in90 = addDays(todayStr, 90);
  if (dateStr < todayStr) return `<span style="color:#e8637a;font-weight:600">⚠ ${dateStr}</span>`;
  if (dateStr <= in30) return `<span style="color:#e8762c;font-weight:600">⏰ ${dateStr}</span>`;
  if (dateStr <= in90) return `<span style="color:#d4a800;font-weight:600">${dateStr}</span>`;
  return dateStr;
}

function avatarColor(name) {
  const colors = ['#5b7fe8','#8b6be8','#3bbfa8','#e8637a','#e8a24a','#3dba82','#e8762c','#6670a0'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderPersonnel() {
  const search = (document.getElementById('personnel-search')?.value || '').toLowerCase();
  const natFilter = document.getElementById('personnel-nat')?.value || '';
  const statusFilter = document.getElementById('personnel-status')?.value || '';

  const filtered = hrState.personnel.filter(p => {
    if (search && !p.name.toLowerCase().includes(search) && !p.position?.toLowerCase().includes(search)) return false;
    if (natFilter && p.nationality !== natFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  renderPersonnelTable(filtered);
}

function renderPersonnelTable(list) {
  const wrap = document.getElementById('personnel-table-wrap');
  if (!wrap) return;

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Henüz personel eklenmedi.</p></div>';
    return;
  }

  const statusLabel = { active: 'Aktif', passive: 'Pasif', leave: 'İzinde' };
  const statusBadge = { active: 'badge-success', passive: 'badge-neutral', leave: 'badge-warning' };

  let html = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Ad Soyad</th><th>Pozisyon</th><th>Uyruk</th><th>E-posta</th>
      <th>Başlangıç</th><th>Ç.İzni Bitiş</th><th>Pasaport Bitiş</th><th>Durum</th><th></th>
    </tr></thead><tbody>`;

  list.forEach(p => {
    const color = avatarColor(p.name);
    const ini = initials(p.name);
    const sLabel = statusLabel[p.status] || p.status;
    const sBadge = statusBadge[p.status] || 'badge-neutral';
    html += `<tr>
      <td><div class="flex items-center gap-2">
        <div class="avatar" style="background:${color}">${ini}</div>
        <span style="font-weight:500">${p.name}</span>
      </div></td>
      <td>${p.position || '-'}</td>
      <td>${p.nationality || '-'}</td>
      <td>${p.email || '-'}</td>
      <td>${p.startDate || '-'}</td>
      <td>${hrExpiryCell(p.permitExpiry)}</td>
      <td>${hrExpiryCell(p.passportExpiry)}</td>
      <td><span class="badge ${sBadge}">${sLabel}</span></td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="editPerson('${p.id}')">Düzenle</button>
        <button class="btn btn-danger btn-sm" onclick="deletePerson('${p.id}')">Sil</button>
      </div></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

/* ============================================================
   TEMPLATES
   ============================================================ */

let _editingTemplate = null;
let _taskRows = [];

function openTemplateModal(id) {
  _taskRows = [];
  _editingTemplate = null;
  const form = document.getElementById('form-template');
  if (form) form.reset();
  document.getElementById('modal-template-title').textContent = 'Yeni Şablon';

  if (id) {
    const tmpl = hrState.templates.find(t => t.id === id);
    if (tmpl) {
      _editingTemplate = tmpl.id;
      document.getElementById('t-name').value = tmpl.name || '';
      document.getElementById('t-type').value = tmpl.type || '';
      document.getElementById('t-desc').value = tmpl.desc || '';
      _taskRows = (tmpl.tasks || []).map(t => ({...t}));
      document.getElementById('modal-template-title').textContent = 'Şablonu Düzenle';
    }
  }
  renderTaskEditorList();
  hrOpenModal('modal-template');
}

function renderTaskEditorList() {
  const wrap = document.getElementById('task-editor-list');
  if (!wrap) return;
  if (!_taskRows.length) {
    wrap.innerHTML = '<p class="text-muted text-sm" style="padding:8px 0">Henüz görev yok.</p>';
    return;
  }
  wrap.innerHTML = _taskRows.map((t, i) => `
    <div class="task-row">
      <input type="text" value="${t.name || ''}" placeholder="Görev adı"
        oninput="_taskRows[${i}].name=this.value">
      <select onchange="_taskRows[${i}].assignee=this.value">
        <option value="ik" ${t.assignee==='ik'?'selected':''}>İK</option>
        <option value="personel" ${t.assignee==='personel'?'selected':''}>Personel</option>
        <option value="yonetim" ${t.assignee==='yonetim'?'selected':''}>Yönetim</option>
      </select>
      <input type="number" value="${t.days || 0}" min="0" style="width:64px"
        oninput="_taskRows[${i}].days=+this.value" title="Gün sayısı">
      <button class="btn btn-danger btn-sm btn-icon" onclick="removeTaskRow(${i})" title="Kaldır">✕</button>
    </div>`).join('');
}

function addTaskRow() {
  const nameEl = document.getElementById('new-task-name');
  const assigneeEl = document.getElementById('new-task-assignee');
  const daysEl = document.getElementById('new-task-days');
  const name = nameEl?.value.trim();
  if (!name) return;
  _taskRows.push({
    name,
    assignee: assigneeEl?.value || 'ik',
    days: +(daysEl?.value || 0)
  });
  if (nameEl) nameEl.value = '';
  if (daysEl) daysEl.value = '';
  renderTaskEditorList();
}

function confirmAddTask() {
  addTaskRow();
}

function removeTaskRow(i) {
  _taskRows.splice(i, 1);
  renderTaskEditorList();
}

function saveTemplate(e) {
  e.preventDefault();
  const name = document.getElementById('t-name').value.trim();
  if (!name) return;

  const tmpl = {
    id: _editingTemplate || hrGenId(),
    name,
    type: document.getElementById('t-type').value,
    desc: document.getElementById('t-desc').value.trim(),
    tasks: _taskRows.map(t => ({...t}))
  };

  if (_editingTemplate) {
    const idx = hrState.templates.findIndex(t => t.id === _editingTemplate);
    if (idx !== -1) hrState.templates[idx] = tmpl;
  } else {
    hrState.templates.push(tmpl);
  }
  hrSaveState();
  hrCloseModal('modal-template');
  renderTemplates();
}

function deleteTemplate(id) {
  if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
  hrState.templates = hrState.templates.filter(t => t.id !== id);
  hrSaveState();
  renderTemplates();
}

function renderTemplates() {
  const wrap = document.getElementById('templates-wrap');
  if (!wrap) return;

  if (!hrState.templates.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Henüz şablon oluşturulmadı.</p></div>';
    return;
  }

  const typeLabel = {
    'calisma-izni': 'Çalışma İzni',
    'izin-yenileme': 'İzin Yenileme',
    'kota-basvurusu': 'Kota Başvurusu',
    'diger': 'Diğer'
  };

  wrap.innerHTML = '<div class="template-grid">' +
    hrState.templates.map(t => `
      <div class="template-card">
        <div class="tc-head">
          <div>
            <div class="tc-title">${t.name}</div>
            <div class="tc-type">${typeLabel[t.type] || t.type || '-'}</div>
          </div>
          <span class="badge badge-accent">${(t.tasks||[]).length} görev</span>
        </div>
        ${t.desc ? `<p class="text-sm text-muted mb-3">${t.desc}</p>` : ''}
        <div class="tc-actions">
          <button class="btn btn-secondary btn-sm" onclick="openTemplateModal('${t.id}')">Düzenle</button>
          <button class="btn btn-primary btn-sm" onclick="openProcessModalFor('${t.id}')">Süreç Başlat</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTemplate('${t.id}')">Sil</button>
        </div>
      </div>`).join('') +
  '</div>';
}

/* ============================================================
   PROCESSES
   ============================================================ */

function openProcessModal() {
  const sel = document.getElementById('proc-template-select');
  if (sel) {
    sel.innerHTML = '<option value="">— Şablon seçin —</option>' +
      hrState.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }
  const persEl = document.getElementById('proc-person-select');
  if (persEl) {
    persEl.innerHTML = '<option value="">— Personel seçin —</option>' +
      hrState.personnel.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
  document.getElementById('proc-preview-wrap').innerHTML = '';
  document.getElementById('proc-start-date').value = today();
  hrOpenModal('modal-process');
}

function openProcessModalFor(templateId) {
  openProcessModal();
  const sel = document.getElementById('proc-template-select');
  if (sel) {
    sel.value = templateId;
    previewTemplate();
  }
}

function previewTemplate() {
  const templateId = document.getElementById('proc-template-select')?.value;
  const wrap = document.getElementById('proc-preview-wrap');
  if (!wrap) return;
  if (!templateId) { wrap.innerHTML = ''; return; }

  const tmpl = hrState.templates.find(t => t.id === templateId);
  if (!tmpl) { wrap.innerHTML = ''; return; }

  const assigneeLabel = { ik: 'İK', personel: 'Personel', yonetim: 'Yönetim' };

  wrap.innerHTML = `<p class="text-sm text-muted mt-3 mb-2">${tmpl.tasks.length} görev içeriyor:</p>
    <div class="preview-task-list">` +
    tmpl.tasks.map((t, i) => `
      <div class="preview-task-item">
        <div class="ptask-num">${i+1}</div>
        <div style="flex:1">
          <span style="font-weight:500">${t.name}</span>
          <span class="text-muted text-sm"> — ${assigneeLabel[t.assignee] || t.assignee}</span>
        </div>
        <span class="text-sm text-muted">+${t.days}g</span>
      </div>`).join('') +
  '</div>';
}

function startProcess(e) {
  e.preventDefault();
  const templateId = document.getElementById('proc-template-select')?.value;
  const personId = document.getElementById('proc-person-select')?.value;
  const startDate = document.getElementById('proc-start-date')?.value || today();
  const notes = document.getElementById('proc-notes')?.value.trim() || '';

  if (!templateId) return alert('Lütfen bir şablon seçin.');
  if (!personId) return alert('Lütfen bir personel seçin.');

  const tmpl = hrState.templates.find(t => t.id === templateId);
  const person = hrState.personnel.find(p => p.id === personId);
  if (!tmpl || !person) return;

  const process = {
    id: hrGenId(),
    templateId,
    templateName: tmpl.name,
    templateType: tmpl.type,
    personId,
    personName: person.name,
    startDate,
    notes,
    open: false,
    tasks: tmpl.tasks.map((t, i) => ({
      id: 'task_' + i,
      name: t.name,
      assignee: t.assignee,
      dueDate: addDays(startDate, t.days),
      done: false
    }))
  };

  hrState.processes.push(process);
  hrSaveState();
  hrCloseModal('modal-process');
  hrNavigate('processes');
}

function toggleTask(processId, taskId) {
  const proc = hrState.processes.find(p => p.id === processId);
  if (!proc) return;
  const taskIdx = proc.tasks.findIndex(t => t.id === taskId);
  if (taskIdx === -1) return;
  const task = proc.tasks[taskIdx];

  // Sıralı tamamlama kontrolü: tamamlamak istiyorsa önceki tüm görevler tamamlanmış olmalı
  if (!task.done) {
    const firstPending = proc.tasks.findIndex(t => !t.done);
    if (firstPending !== taskIdx) {
      hrShowOrderWarning(proc, taskIdx);
      return;
    }
  }

  task.done = !task.done;
  task.doneAt = task.done ? new Date().toISOString() : null;
  hrSaveState();
  renderProcesses();
  renderDashboard();
  if (typeof renderCalendar === 'function') renderCalendar();
}

function hrShowOrderWarning(proc, taskIdx) {
  const firstPendingIdx = proc.tasks.findIndex(t => !t.done);
  const blocking = proc.tasks[firstPendingIdx];
  const target   = proc.tasks[taskIdx];
  const existing = document.getElementById('hr-order-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'hr-order-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18);font-family:'DM Sans',sans-serif">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="width:40px;height:40px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚠️</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#1e2342">Sıralı Tamamlama Zorunlu</div>
          <div style="font-size:12px;color:#9da4c8;margin-top:2px">${proc.personName} · ${proc.templateName}</div>
        </div>
      </div>
      <p style="font-size:13px;color:#3d4466;line-height:1.6;margin:0 0 10px">
        <strong style="color:#1e2342">"${target.name}"</strong> görevi tamamlanabilmesi için öncelikle aşağıdaki görevin kapatılması gerekmektedir:
      </p>
      <div style="background:#f5f6fb;border:1px solid #dde1ee;border-radius:8px;padding:12px 14px;margin-bottom:20px">
        <div style="font-size:12px;color:#9da4c8;margin-bottom:4px">Bekleyen Görev (${firstPendingIdx + 1}/${proc.tasks.length})</div>
        <div style="font-size:13px;font-weight:600;color:#1e2342">${blocking.name}</div>
        ${blocking.dueDate ? `<div style="font-size:11px;color:#9da4c8;margin-top:4px">Son Tarih: ${blocking.dueDate}</div>` : ''}
      </div>
      <button onclick="document.getElementById('hr-order-modal').remove()" style="width:100%;padding:11px;background:#5b7fe8;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Anladım</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function filterProcesses() {
  renderProcesses();
}

function deleteProcess(id) {
  if (!confirm('Bu süreci silmek istediğinizden emin misiniz?')) return;
  hrState.processes = hrState.processes.filter(p => p.id !== id);
  hrSaveState();
  renderProcesses();
}

function toggleProcessBody(id) {
  const proc = hrState.processes.find(p => p.id === id);
  if (!proc) return;
  proc.open = !proc.open;
  renderProcesses();
}

function renderProcesses() {
  const wrap = document.getElementById('processes-wrap');
  if (!wrap) return;

  const search = (document.getElementById('proc-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('proc-type-filter')?.value || '';

  const filtered = hrState.processes.filter(p => {
    if (search && !p.personName.toLowerCase().includes(search) && !p.templateName.toLowerCase().includes(search)) return false;
    if (typeFilter && p.templateType !== typeFilter) return false;
    return true;
  });

  if (!filtered.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p>Henüz süreç başlatılmadı.</p></div>';
    return;
  }

  const color = avatarColor;
  const ini = initials;

  wrap.innerHTML = '<div class="process-list">' +
    filtered.map(proc => {
      const total = proc.tasks.length;
      const done = proc.tasks.filter(t => t.done).length;
      const pct = total ? Math.round(done / total * 100) : 0;
      const av = color(proc.personName);
      const bodyClass = proc.open ? 'process-body open' : 'process-body';

      const hasOverdue = proc.tasks.some(t => !t.done && t.dueDate && t.dueDate < today());
      const hasSoon = proc.tasks.some(t => !t.done && t.dueDate && t.dueDate >= today() && t.dueDate <= addDays(today(), 7));

      return `<div class="process-card">
        <div class="process-header" onclick="toggleProcessBody('${proc.id}')">
          <div class="ph-left">
            <div class="avatar" style="background:${av}">${ini(proc.personName)}</div>
            <div class="ph-info">
              <div class="ph-title">${proc.personName} — ${proc.templateName}</div>
              <div class="ph-meta">Başlangıç: ${proc.startDate}${hasOverdue ? ' <span style="color:#e8637a;font-size:11px;font-weight:600">● Geciken görev var</span>' : (hasSoon ? ' <span style="color:#e8a24a;font-size:11px">● Yaklaşan görev var</span>' : '')}</div>
            </div>
          </div>
          <div class="ph-right">
            <div class="ph-progress">
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${pct}%"></div>
              </div>
              <span>${done}/${total}</span>
            </div>
            ${pct === 100 ? '<span class="badge badge-success" style="font-size:11px">✓ Tamamlandı</span>' : ''}
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProcess('${proc.id}')">Sil</button>
          </div>
        </div>
        <div class="${bodyClass}">
          <div class="task-list">` +
          proc.tasks.map(t => {
            const todayStr = today();
            const isOverdue = !t.done && t.dueDate && t.dueDate < todayStr;
            const isSoon = !t.done && t.dueDate && !isOverdue && t.dueDate <= addDays(todayStr, 7);
            const doneClass = t.done ? 'task-item done' : (isOverdue ? 'task-item overdue' : (isSoon ? 'task-item soon' : 'task-item'));
            const checkContent = t.done ? '✓' : '';
            const dueLabel = t.done
              ? `<span style="color:#2ea06e;font-size:11px">✓ ${t.doneAt ? t.doneAt.slice(0,10) + ' tamamlandı' : 'Tamamlandı'}</span>`
              : (isOverdue
                  ? `<span style="color:#e8637a;font-size:11px;font-weight:600">⚠ Gecikmiş — ${t.dueDate}</span>`
                  : (isSoon
                      ? `<span style="color:#e8a24a;font-size:11px">⏰ Yaklaşıyor — ${t.dueDate}</span>`
                      : `<span style="font-size:11px;color:#9da4c8">Teslim: ${t.dueDate || '—'}</span>`));
            return `<div class="${doneClass}">
              <div class="task-check" onclick="toggleTask('${proc.id}','${t.id}')">${checkContent}</div>
              <div class="task-info">
                <div class="task-name">${t.name}</div>
                <div class="task-due">${dueLabel}</div>
              </div>
            </div>`;
          }).join('') +
        `</div>
        </div>
      </div>`;
    }).join('') +
  '</div>';
}

/* ============================================================
   CALENDAR
   Bug fix: initCalendar() is now called at the start of
   renderCalendar() so year/month are always initialized even
   when renderCalendar() is invoked directly from filter
   onchange handlers before hrNavigate('calendar') has run.
   ============================================================ */

let calYear, calMonth;

function initCalendar() {
  if (calYear !== undefined) return;
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
}

function calNav(dir) {
  initCalendar();
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function hrSwitchCalTab(tab) {
  hrState._calTab = tab;
  const tasksPane = document.getElementById('cal-tasks-pane');
  const docsPane  = document.getElementById('cal-docs-pane');
  const tabTasks  = document.getElementById('cal-tab-tasks');
  const tabDocs   = document.getElementById('cal-tab-docs');
  if (!tasksPane) return;
  if (tab === 'tasks') {
    tasksPane.style.display = '';
    docsPane.style.display  = 'none';
    tabTasks?.classList.replace('btn-secondary','btn-primary');
    tabDocs?.classList.replace('btn-primary','btn-secondary');
    renderCalendar();
  } else {
    tasksPane.style.display  = 'none';
    docsPane.style.display   = '';
    tabTasks?.classList.replace('btn-primary','btn-secondary');
    tabDocs?.classList.replace('btn-secondary','btn-primary');
    renderDocCalendar();
  }
}

function renderCalendar() {
  // CALENDAR BUG FIX: ensure year/month are always initialized
  // even when called directly (e.g., from filter onchange) before
  // hrNavigate('calendar') has been invoked.
  initCalendar();

  const natFilter  = document.getElementById('cal-filter-nat')?.value  || '';
  const typeFilter = document.getElementById('cal-filter-type')?.value || '';

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                      'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = monthNames[calMonth] + ' ' + calYear;

  const todayStr = today();

  /* Build event map keyed by date string */
  const typeClass = {
    'calisma-izni': 'permit',
    'izin-yenileme': 'renewal',
    'kota-basvurusu': 'quota'
  };

  const eventMap = {};
  hrState.processes.forEach(proc => {
    const person = hrState.personnel.find(p => p.id === proc.personId);
    if (!person || person.status === 'passive') return;
    if (natFilter && person.nationality !== natFilter) return;
    if (typeFilter && proc.templateType !== typeFilter) return;

    proc.tasks.forEach(task => {
      if (!task.dueDate) return;
      if (task.done) return;
      const [y, m] = task.dueDate.split('-').map(Number);
      if (y === calYear && m === calMonth + 1) {
        if (!eventMap[task.dueDate]) eventMap[task.dueDate] = [];
        const todayStr = today();
        const isOverdue = task.dueDate < todayStr;
        const isSoon = !isOverdue && task.dueDate <= addDays(todayStr, 7);
        eventMap[task.dueDate].push({
          name: proc.personName + ': ' + task.name,
          cls: isOverdue ? 'overdue' : (isSoon ? 'soon' : (typeClass[proc.templateType] || 'other')),
          overdue: isOverdue,
          soon: isSoon,
          processId: proc.id,
          taskId: task.id
        });
      }
    });
  });

  /* Calculate grid boundaries */
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const startDay    = (firstDay + 6) % 7; // Monday-start offset

  let html = '<div class="cal-grid">';

  /* Day headers */
  ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach(d =>
    html += `<div class="cal-day-header">${d}</div>`
  );

  /* Trailing days from previous month */
  for (let i = 0; i < startDay; i++) {
    const d = daysInPrev - startDay + 1 + i;
    html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  /* Days of current month */
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const events  = eventMap[dateStr] || [];

    /* Today cell: cal-date contains <span> so the flex-circle CSS on
       .cal-cell.today .cal-date centres the span correctly.
       Non-today cells: cal-date contains the number directly. */
    const dateContent = isToday ? `<span>${d}</span>` : d;

    html += `<div class="cal-cell${isToday ? ' today' : ''}">
      <div class="cal-date">${dateContent}</div>` +
      events.map(ev =>
        `<span class="cal-event ${ev.cls} cal-event-clickable" title="${ev.name}" onclick="hrCalTaskClick('${ev.processId}','${ev.taskId}')">${ev.overdue ? '⚠ ' : (ev.soon ? '⏰ ' : '')}${ev.name}</span>`
      ).join('') +
    `</div>`;
  }

  /* Leading days of next month to fill last row */
  const totalCells = startDay + daysInMonth;
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
    }
  }

  html += '</div>';

  const gridWrap = document.getElementById('cal-grid-wrap');
  if (gridWrap) gridWrap.innerHTML = html;
}

/* ============================================================
   CALENDAR TASK MODAL
   ============================================================ */

function hrCalTaskClick(processId, taskId) {
  const proc = hrState.processes.find(p => p.id === processId);
  if (!proc) return;
  const taskIdx = proc.tasks.findIndex(t => t.id === taskId);
  if (taskIdx === -1) return;
  const task = proc.tasks[taskIdx];
  const doneCount = proc.tasks.filter(t => t.done).length;
  const total = proc.tasks.length;

  // Sıralı kontrol
  const firstPendingIdx = proc.tasks.findIndex(t => !t.done);
  const isBlocked = firstPendingIdx !== taskIdx;
  const blocking = isBlocked ? proc.tasks[firstPendingIdx] : null;

  const todayStr = today();
  const isOverdue = task.dueDate && task.dueDate < todayStr;
  const isSoon = task.dueDate && !isOverdue && task.dueDate <= addDays(todayStr, 7);
  const statusColor = isOverdue ? '#ef4444' : (isSoon ? '#f59e0b' : '#5b7fe8');
  const statusLabel = isOverdue ? 'Gecikmiş' : (isSoon ? 'Yaklaşıyor' : 'Bekliyor');

  const existing = document.getElementById('hr-cal-task-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'hr-cal-task-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px;max-width:400px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18);font-family:'DM Sans',sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#1e2342">${proc.personName}</div>
          <div style="font-size:11px;color:#9da4c8;margin-top:2px">${proc.templateName} · ${doneCount}/${total} tamamlandı</div>
        </div>
        <button onclick="document.getElementById('hr-cal-task-modal').remove()" style="background:none;border:none;font-size:18px;color:#9da4c8;cursor:pointer;padding:0;line-height:1">×</button>
      </div>

      <div style="background:#f5f6fb;border-radius:10px;padding:14px 16px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;color:#1e2342;margin-bottom:8px">${task.name}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${task.dueDate ? `<span style="font-size:11px;background:#eef0f8;color:#5b6080;padding:3px 8px;border-radius:6px">📅 ${task.dueDate}</span>` : ''}
          <span style="font-size:11px;padding:3px 8px;border-radius:6px;background:${statusColor}18;color:${statusColor};font-weight:600">${statusLabel}</span>
          <span style="font-size:11px;background:#eef0f8;color:#5b6080;padding:3px 8px;border-radius:6px">Adım ${taskIdx + 1}/${total}</span>
        </div>
      </div>

      ${isBlocked ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:9px;padding:12px 14px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">⚠ Önceki Adım Tamamlanmadı</div>
        <div style="font-size:12px;color:#78350f;line-height:1.5">Bu görevi tamamlayabilmek için önce <strong>"${blocking.name}"</strong> görevinin kapatılması gerekmektedir.</div>
      </div>
      <button disabled style="width:100%;padding:11px;background:#e5e7eb;color:#9ca3af;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:not-allowed;font-family:'DM Sans',sans-serif">Tamamla — Önceki Adım Bekliyor</button>
      ` : `
      <button onclick="hrCalConfirmTask('${processId}','${taskId}')" style="width:100%;padding:11px;background:#22c55e;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">✓ Görevi Tamamla</button>
      `}
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function hrCalConfirmTask(processId, taskId) {
  document.getElementById('hr-cal-task-modal')?.remove();
  toggleTask(processId, taskId);
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {
  const todayStr = today();
  const in7  = addDays(todayStr, 7);
  const in30 = addDays(todayStr, 30);

  // ── Personel istatistikleri ──
  const total   = hrState.personnel.length;
  const active  = hrState.personnel.filter(p => p.status === 'active').length;
  const passive = hrState.personnel.filter(p => p.status === 'passive').length;
  const onLeave = hrState.personnel.filter(p => p.status === 'leave').length;

  // ── Süreç istatistikleri ──
  const activeProcs = hrState.processes.filter(proc => {
    const person = hrState.personnel.find(p => p.id === proc.personId);
    return person && person.status !== 'passive';
  });
  const completedProcs = activeProcs.filter(p => p.tasks.length && p.tasks.every(t => t.done));
  const inProgressProcs = activeProcs.filter(p => p.tasks.some(t => t.done) && !p.tasks.every(t => t.done));

  // ── Görev istatistikleri ──
  const allPending = [];
  activeProcs.forEach(proc => {
    proc.tasks.filter(t => !t.done && t.dueDate).forEach(t => {
      allPending.push({
        procId: proc.id, procName: proc.personName, taskId: t.id,
        taskName: t.name, dueDate: t.dueDate,
        overdue: t.dueDate < todayStr,
        soon: t.dueDate >= todayStr && t.dueDate <= in7
      });
    });
  });
  allPending.sort((a,b) => (a.overdue && !b.overdue) ? -1 : (!a.overdue && b.overdue) ? 1 : a.dueDate > b.dueDate ? 1 : -1);
  const overdueCount = allPending.filter(t => t.overdue).length;
  const soonCount    = allPending.filter(t => t.soon).length;

  // ── Belge takibi ──
  const expDocs = [];
  hrState.personnel.filter(p => p.status !== 'passive').forEach(p => {
    if (p.permitExpiry) {
      const isExp = p.permitExpiry < todayStr;
      const isSoon = !isExp && p.permitExpiry <= in30;
      if (isExp || isSoon) expDocs.push({ name: p.name, label: 'Çalışma İzni', expiry: p.permitExpiry, expired: isExp, position: p.position });
    }
    if (p.passportExpiry) {
      const isExp = p.passportExpiry < todayStr;
      const isSoon = !isExp && p.passportExpiry <= in30;
      if (isExp || isSoon) expDocs.push({ name: p.name, label: 'Pasaport', expiry: p.passportExpiry, expired: isExp, position: p.position });
    }
  });
  expDocs.sort((a,b) => a.expired === b.expired ? (a.expiry > b.expiry ? 1 : -1) : (a.expired ? -1 : 1));

  // ══ KPI ROW ══
  const kpiEl = document.getElementById('dash-kpi-row');
  if (kpiEl) kpiEl.innerHTML = `
    <div class="dash-kpi-card dash-kpi-blue" onclick="hrNavigate('personnel')">
      <div class="dkc-top">
        <span class="dkc-icon">👥</span>
        <span class="dkc-delta">${active} aktif</span>
      </div>
      <div class="dkc-value">${total}</div>
      <div class="dkc-label">Toplam Personel</div>
      <div class="dkc-sub">${passive} pasif · ${onLeave} izinde</div>
    </div>
    <div class="dash-kpi-card dash-kpi-green" onclick="hrNavigate('processes')">
      <div class="dkc-top">
        <span class="dkc-icon">📂</span>
        <span class="dkc-delta">${inProgressProcs.length} devam ediyor</span>
      </div>
      <div class="dkc-value">${activeProcs.length}</div>
      <div class="dkc-label">Aktif Süreç</div>
      <div class="dkc-sub">${completedProcs.length} tamamlandı</div>
    </div>
    <div class="dash-kpi-card ${overdueCount > 0 ? 'dash-kpi-red' : 'dash-kpi-neutral'}" onclick="hrNavigate('processes')">
      <div class="dkc-top">
        <span class="dkc-icon">⚠</span>
        <span class="dkc-delta">${soonCount} yaklaşıyor</span>
      </div>
      <div class="dkc-value">${overdueCount}</div>
      <div class="dkc-label">Geciken Görev</div>
      <div class="dkc-sub">7 gün içinde ${soonCount} görev daha</div>
    </div>
    <div class="dash-kpi-card ${expDocs.filter(d=>d.expired).length > 0 ? 'dash-kpi-amber' : 'dash-kpi-neutral'}" onclick="hrNavigate('calendar')">
      <div class="dkc-top">
        <span class="dkc-icon">📄</span>
        <span class="dkc-delta">${expDocs.filter(d=>!d.expired).length} yaklaşıyor</span>
      </div>
      <div class="dkc-value">${expDocs.filter(d=>d.expired).length}</div>
      <div class="dkc-label">Süresi Dolan Belge</div>
      <div class="dkc-sub">30 gün içinde ${expDocs.filter(d=>!d.expired).length} belge daha</div>
    </div>`;

  // ══ GÖREV DURUMU ══
  const tasksBody = document.getElementById('dash-tasks-body');
  const tasksBadge = document.getElementById('dash-tasks-badge');
  if (tasksBadge) {
    tasksBadge.textContent = overdueCount > 0 ? `${overdueCount} gecikmiş` : (soonCount > 0 ? `${soonCount} yaklaşıyor` : 'Güncel');
    tasksBadge.className = `badge ${overdueCount > 0 ? 'badge-danger' : soonCount > 0 ? 'badge-warning' : 'badge-success'}`;
  }
  if (tasksBody) {
    if (!allPending.length) {
      tasksBody.innerHTML = '<div class="dash-empty">✅ Bekleyen görev bulunmuyor</div>';
    } else {
      tasksBody.innerHTML = allPending.slice(0, 7).map(u => `
        <div class="dash-task-row">
          <div class="dtr-dot ${u.overdue ? 'dtr-red' : u.soon ? 'dtr-amber' : 'dtr-blue'}"></div>
          <div class="dtr-info">
            <div class="dtr-name">${u.taskName}</div>
            <div class="dtr-meta">${u.procName}</div>
          </div>
          <div class="dtr-right">
            <span class="dtr-date ${u.overdue ? 'dtr-date-red' : u.soon ? 'dtr-date-amber' : ''}">${u.overdue ? '⚠ ' : u.soon ? '⏰ ' : ''}${u.dueDate}</span>
          </div>
        </div>`).join('') +
        (allPending.length > 7 ? `<div class="dash-more" onclick="hrNavigate('processes')">+${allPending.length - 7} görev daha →</div>` : '');
    }
  }

  // ══ BELGE TAKİBİ ══
  const docsBody = document.getElementById('dash-docs-body');
  if (docsBody) {
    if (!expDocs.length) {
      docsBody.innerHTML = '<div class="dash-empty">✅ 30 gün içinde süresi dolacak belge yok</div>';
    } else {
      docsBody.innerHTML = expDocs.slice(0, 6).map(d => `
        <div class="dash-task-row">
          <div class="dtr-dot ${d.expired ? 'dtr-red' : 'dtr-amber'}"></div>
          <div class="dtr-info">
            <div class="dtr-name">${d.name}</div>
            <div class="dtr-meta">${d.label}${d.position ? ' · ' + d.position : ''}</div>
          </div>
          <div class="dtr-right">
            <span class="dtr-date ${d.expired ? 'dtr-date-red' : 'dtr-date-amber'}">${d.expired ? '⚠ Doldu' : '⏰'} ${d.expiry}</span>
          </div>
        </div>`).join('') +
        (expDocs.length > 6 ? `<div class="dash-more" onclick="hrNavigate('calendar')" >+${expDocs.length - 6} belge daha →</div>` : '');
    }
  }

  // ══ PERSONEL ══
  const personnelBody = document.getElementById('dash-personnel-body');
  if (personnelBody) {
    const list = [...hrState.personnel].reverse().slice(0, 6);
    if (!list.length) {
      personnelBody.innerHTML = '<div class="dash-empty">Henüz personel eklenmedi</div>';
    } else {
      personnelBody.innerHTML = list.map(p => {
        const statusLabel = { active: 'Aktif', passive: 'Pasif', leave: 'İzinde' };
        const statusCls   = { active: 'badge-success', passive: 'badge-neutral', leave: 'badge-warning' };
        const permitWarn  = p.permitExpiry && p.permitExpiry <= in30;
        const passWarn    = p.passportExpiry && p.passportExpiry <= in30;
        return `<div class="dash-person-row">
          <div class="avatar avatar-sm" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
          <div class="dpr-info">
            <div class="dpr-name">${p.name}${permitWarn ? ' <span style="color:#e8a24a;font-size:10px">● İzin</span>' : ''}${passWarn ? ' <span style="color:#8b5cf6;font-size:10px">● Pasaport</span>' : ''}</div>
            <div class="dpr-meta">${p.position || '—'} · ${p.nationality || ''}</div>
          </div>
          <span class="badge ${statusCls[p.status] || 'badge-neutral'}" style="font-size:10px">${statusLabel[p.status] || p.status}</span>
        </div>`;
      }).join('');
    }
  }

  // ══ AKTİF SÜREÇLER ══
  const processesBody = document.getElementById('dash-processes-body');
  if (processesBody) {
    const top5 = activeProcs.slice(-5).reverse();
    if (!top5.length) {
      processesBody.innerHTML = '<div class="dash-empty">Henüz süreç oluşturulmadı</div>';
    } else {
      processesBody.innerHTML = top5.map(proc => {
        const done  = proc.tasks.filter(t => t.done).length;
        const total = proc.tasks.length;
        const pct   = total ? Math.round(done / total * 100) : 0;
        const hasOverdue = proc.tasks.some(t => !t.done && t.dueDate && t.dueDate < todayStr);
        return `<div class="dash-proc-row" onclick="hrNavigate('processes')" style="cursor:pointer">
          <div class="dpr-info" style="flex:1;min-width:0">
            <div class="dpr-name">${proc.personName}${hasOverdue ? ' <span style="color:#e8637a;font-size:10px">● Gecikmiş</span>' : ''}</div>
            <div class="dpr-meta">${proc.templateName}</div>
          </div>
          <div class="dash-proc-progress">
            <div class="dpp-bar"><div class="dpp-fill" style="width:${pct}%;background:${pct===100?'#2ea06e':'#5b7fe8'}"></div></div>
            <span class="dpp-label">${done}/${total}</span>
          </div>
        </div>`;
      }).join('');
    }
  }
}

/* ============================================================
   FILE UPLOAD
   ============================================================ */

let _uploadFiles = [];

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', png:'🖼', jpg:'🖼', jpeg:'🖼', zip:'🗜', rar:'🗜' };
  return icons[ext] || '📁';
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}

function openFileUpload() {
  _uploadFiles = [];
  renderUploadList();
  hrOpenModal('modal-upload');
}

function handleFileSelect(e) {
  processFiles(e.target.files);
}

function processFiles(fileList) {
  Array.from(fileList).forEach(f => {
    if (!_uploadFiles.find(u => u.name === f.name && u.size === f.size)) {
      _uploadFiles.push(f);
    }
  });
  renderUploadList();
}

function renderUploadList() {
  const wrap = document.getElementById('upload-list');
  if (!wrap) return;
  if (!_uploadFiles.length) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = _uploadFiles.map((f, i) => `
    <div class="upload-item">
      <span class="ui-icon">${fileIcon(f.name)}</span>
      <div class="ui-info">
        <div class="ui-name">${f.name}</div>
        <div class="ui-size">${formatBytes(f.size)}</div>
      </div>
      <button class="ui-remove" onclick="removeFile(${i})">✕</button>
    </div>`).join('');
}

function removeFile(i) {
  _uploadFiles.splice(i, 1);
  renderUploadList();
}

function removeFileFromModal() {
  _uploadFiles = [];
  renderUploadList();
}

/* ---- Drag and drop ---- */
function setupUploadZone() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
  });
  zone.addEventListener('click', () => document.getElementById('file-input')?.click());
}

/* ============================================================
   INIT
   ============================================================ */

// ══════════════════════════════════════════════════════
// EXCEL IMPORT / EXPORT  (Personel)
// ══════════════════════════════════════════════════════

const HR_XL_COLS = [
  { header: 'Ad Soyad',                    key: 'name'          },
  { header: 'Uyruk',                       key: 'nationality'   }, // TC | KKTC | 3. Ülke
  { header: 'TC/Pasaport No',              key: 'idNo'          },
  { header: 'Pozisyon',                    key: 'position'      },
  { header: 'Bölüm',                       key: 'department'    },
  { header: 'İşe Başlama Tarihi',          key: 'startDate'     }, // YYYY-MM-DD
  { header: 'Çalışma İzni Bitiş Tarihi',   key: 'permitExpiry'  }, // YYYY-MM-DD
  { header: 'Pasaport No',                 key: 'passportNo'    },
  { header: 'Pasaport Geçerlilik Tarihi',  key: 'passportExpiry'}, // YYYY-MM-DD
  { header: 'E-posta',                     key: 'email'         },
  { header: 'Telefon',                     key: 'phone'         },
  { header: 'Not',                         key: 'note'          },
];

let _hrXlRows = null;

function hrOpenXlImport() {
  _hrXlRows = null;
  document.getElementById('hr-drop-zone').classList.remove('drag-over');
  const prev = document.getElementById('hr-xl-preview');
  prev.style.display = 'none'; prev.innerHTML = '';
  const res = document.getElementById('hr-xl-result');
  res.className = 'xl-result'; res.textContent = '';
  document.getElementById('hr-xl-import-btn').style.display = 'none';
  document.getElementById('hr-xl-file-input').value = '';
  document.getElementById('hr-xl-modal').classList.add('open');
}

function hrCloseXlImport() {
  document.getElementById('hr-xl-modal').classList.remove('open');
}

function hrXlHandleDrop(e) {
  e.preventDefault();
  document.getElementById('hr-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) hrXlHandleFile(file);
}

function hrXlHandleFile(file) {
  if (!file) return;
  if (!window.XLSX) { hrXlShowResult('SheetJS kütüphanesi yüklenemedi.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length) { hrXlShowResult('Dosyada veri bulunamadı.', 'error'); return; }

      const headerMap = {};
      HR_XL_COLS.forEach(c => { headerMap[c.header.toLowerCase()] = c.key; });

      const parsed = [];
      const errors = [];
      const VALID_NAT = ['tc', 'kktc', '3. ülke', '3. ulke', 'üçüncü ülke'];

      rows.forEach((row, i) => {
        const r = {};
        Object.keys(row).forEach(k => {
          const mapped = headerMap[k.trim().toLowerCase()];
          if (mapped) r[mapped] = String(row[k]).trim();
        });

        if (!r.name) { errors.push(`Satır ${i+2}: Ad Soyad eksik.`); return; }

        // Uyruk normalize
        const natRaw = (r.nationality || '').toLowerCase();
        if (natRaw === 'tc') r.nationality = 'TC';
        else if (natRaw === 'kktc') r.nationality = 'KKTC';
        else r.nationality = '3. Ülke';

        // Tarih formatı normalize (YYYY-MM-DD) — Excel serial date desteği dahil
        ['startDate','permitExpiry','passportExpiry'].forEach(field => {
          if (!r[field]) return;
          if (/^\d{4}-\d{2}-\d{2}$/.test(r[field])) return;
          const num = parseFloat(r[field]);
          if (!isNaN(num)) {
            const d = new Date(Math.round((num - 25569) * 86400 * 1000));
            r[field] = d.toISOString().slice(0,10);
          } else {
            r[field] = '';
          }
        });

        parsed.push(r);
      });

      if (!parsed.length) {
        hrXlShowResult('Geçerli satır bulunamadı.\n' + errors.join('\n'), 'error');
        return;
      }

      _hrXlRows = parsed;
      hrXlShowPreview(parsed);
      let msg = `${parsed.length} personel hazır.`;
      if (errors.length) msg += ` (${errors.length} satır atlandı)`;
      hrXlShowResult(msg, 'success');
      document.getElementById('hr-xl-import-btn').style.display = 'inline-flex';

    } catch(err) {
      hrXlShowResult('Dosya okunamadı: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function hrXlShowPreview(rows) {
  const wrap = document.getElementById('hr-xl-preview');
  const preview = rows.slice(0, 6);
  wrap.style.display = 'block';
  wrap.innerHTML = `<table>
    <thead><tr>
      <th>Ad Soyad</th><th>Uyruk</th><th>TC/Pasaport No</th>
      <th>Pozisyon</th><th>İşe Başlama</th><th>İzin Bitiş</th>
      <th>Pasaport No</th><th>Pasaport Bitiş</th>
    </tr></thead>
    <tbody>
      ${preview.map(r => `<tr>
        <td>${r.name}</td>
        <td>${r.nationality}</td>
        <td>${r.idNo || '—'}</td>
        <td>${r.position || '—'}</td>
        <td>${r.startDate || '—'}</td>
        <td>${r.permitExpiry || '—'}</td>
        <td>${r.passportNo || '—'}</td>
        <td>${r.passportExpiry || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${rows.length > 6 ? `<div style="padding:6px 10px;font-size:11px;color:var(--hr-text3)">...ve ${rows.length-6} kişi daha</div>` : ''}`;
}

function hrXlConfirmImport() {
  if (!_hrXlRows || !_hrXlRows.length) return;

  let added = 0, skipped = 0;

  _hrXlRows.forEach(r => {
    // Aynı TC/Pasaport no varsa atla
    if (r.idNo) {
      const exists = hrState.personnel.find(p => p.idNo && p.idNo === r.idNo);
      if (exists) { skipped++; return; }
    }

    hrState.personnel.push({
      id: hrGenId(),
      name:          r.name,
      nationality:   r.nationality,
      idNo:          r.idNo          || '',
      position:      r.position      || '',
      department:    r.department    || '',
      startDate:     r.startDate     || '',
      permitExpiry:  r.permitExpiry  || '',
      passportNo:    r.passportNo    || '',
      passportExpiry:r.passportExpiry|| '',
      email:         r.email         || '',
      phone:         r.phone         || '',
      note:          r.note          || '',
      status:        'active',
      createdAt:     new Date().toISOString(),
    });
    added++;
  });

  hrSaveState();
  renderDashboard();

  hrXlShowResult(
    `✓ İçe aktarım tamamlandı!\n• ${added} yeni personel eklendi${skipped ? `\n• ${skipped} kayıt atlandı (TC/Pasaport no zaten mevcut)` : ''}`,
    'success'
  );
  document.getElementById('hr-xl-import-btn').style.display = 'none';
  _hrXlRows = null;
}

function hrXlShowResult(msg, type) {
  const el = document.getElementById('hr-xl-result');
  el.textContent = msg;
  el.className = `xl-result show ${type}`;
}

function hrDownloadXlTemplate() {
  if (!window.XLSX) { alert('SheetJS yüklenemedi.'); return; }

  const headers = HR_XL_COLS.map(c => c.header);
  //                name         nat      idNo           pos          dept       start        permitExp    passNo       passExp      email              phone              note
  const examples = [
    ['Ahmet Yılmaz', 'TC',      '12345678901', 'Operatör',  'Üretim', '2024-01-15', '2026-03-31', '',            '',            'ahmet@firma.com',  '+90 532 000 00 01', ''],
    ['Mehmet Demir', 'KKTC',    'K12345678',   'Teknisyen', 'Bakım',  '2024-03-01', '2025-12-31', 'K12345678',   '2027-06-15',  'mehmet@firma.com', '',                  ''],
    ['Ali Veli',     '3. Ülke', 'P98765432',   'Mühendis',  'Ar-Ge',  '2025-06-01', '',            'P98765432',   '2026-09-20',  '',                 '',                  'Vize durumu takipte'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  ws['!cols'] = [
    {wch:22},{wch:10},{wch:18},{wch:16},{wch:14},
    {wch:18},{wch:24},{wch:18},{wch:24},{wch:26},{wch:22},{wch:24}
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Personel');

  // Talimatlar için ikinci sheet
  const infoData = [
    ['ALAN', 'AÇIKLAMA', 'ÖRNEK'],
    ['Ad Soyad',                   'Zorunlu',                                                      'Ahmet Yılmaz'],
    ['Uyruk',                      'TC | KKTC | 3. Ülke (büyük/küçük harf fark etmez)',            'TC'],
    ['TC/Pasaport No',             'Varsa girilmesi önerilir — duplicate kontrolü için',            '12345678901'],
    ['Pozisyon',                   'Opsiyonel',                                                     'Operatör'],
    ['Bölüm',                      'Opsiyonel',                                                     'Üretim'],
    ['İşe Başlama Tarihi',         'YYYY-AA-GG formatında',                                         '2025-01-15'],
    ['Çalışma İzni Bitiş Tarihi',  'YYYY-AA-GG formatında — boş bırakılabilir',                    '2026-03-31'],
    ['Pasaport No',                'Opsiyonel',                                                     'P98765432'],
    ['Pasaport Geçerlilik Tarihi', 'YYYY-AA-GG formatında — boş bırakılabilir',                    '2027-06-15'],
    ['E-posta',                    'Opsiyonel',                                                     'ad@firma.com'],
    ['Telefon',                    'Opsiyonel',                                                     '+90 532 000 00 01'],
    ['Not',                        'Opsiyonel serbest metin',                                       ''],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(infoData);
  ws2['!cols'] = [{wch:24},{wch:48},{wch:24}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Talimatlar');

  XLSX.writeFile(wb, 'AuroraNova_HR_Personel_Sablon.xlsx');
}

// ── Initialise ──
(async () => {
  await hrLoadState();
  renderDashboard();
})();

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  /* Reset person modal title on close */
  document.getElementById('modal-person')?.addEventListener('click', function(e) {
    if (e.target === this) hrCloseModal('modal-person');
  });
});
