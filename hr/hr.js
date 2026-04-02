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
// HR_FB_CONFIG index.html'de tanımlanıyor
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
  const db = _hrInitDb();
  if (!db) { _hrSyncBadge('⚠ Bağlantı hatası', '#e8637a'); return; }
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
    }
    _hrSyncBadge('✓ Senkronize', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2500);
  } catch(e) {
    console.error('HR: Firestore load failed', e);
    _hrSyncBadge('⚠ Yükleme hatası', '#e8637a');
  }
}

function renderDocCalendar() {
  initCalendar();
  const gridWrap = document.getElementById('doc-cal-grid-wrap');
  const titleEl  = document.getElementById('doc-cal-title');
  if (!gridWrap) return;

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                      'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  if (titleEl) titleEl.textContent = monthNames[calMonth] + ' ' + calYear;

  const todayStr = today();

  const eventMap = {};
  const addDocEvent = (dateStr, label, type, personId) => {
    if (!dateStr) return;
    const [y, m] = dateStr.split('-').map(Number);
    if (y !== calYear || m !== calMonth + 1) return;
    if (!eventMap[dateStr]) eventMap[dateStr] = [];
    const isOverdue = dateStr < todayStr;
    const isSoon = !isOverdue && dateStr <= addDays(todayStr, 30);
    eventMap[dateStr].push({ label, type, personId, isOverdue, isSoon });
  };

  hrState.personnel.forEach(p => {
    if (p.status === 'passive') return;
    if (p.permitExpiry)   addDocEvent(p.permitExpiry,   p.name + ': Çalışma İzni', 'permit',   p.id);
    if (p.passportExpiry) addDocEvent(p.passportExpiry, p.name + ': Pasaport',      'passport', p.id);
  });

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const startDay    = (firstDay + 6) % 7;

  let html = '<div class="cal-grid">';

  ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach(d =>
    html += `<div class="cal-day-header">${d}</div>`);

  for (let i = 0; i < startDay; i++)
    html += `<div class="cal-cell other-month"><div class="cal-date">${daysInPrev - startDay + 1 + i}</div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const events  = eventMap[dateStr] || [];
    html += `<div class="cal-cell${isToday ? ' today' : ''}">
      <div class="cal-date">${isToday ? `<span>${d}</span>` : d}</div>` +
      events.map(ev => {
        const bg = ev.type === 'permit'
          ? (ev.isOverdue ? '#ef4444' : '#f59e0b')
          : (ev.isOverdue ? '#ef4444' : '#8b5cf6');
        const icon = ev.isOverdue ? '⚠ ' : (ev.isSoon ? '⏰ ' : '');
        return `<span class="cal-event cal-event-clickable" style="background:${bg}22;color:${bg};cursor:pointer"
          onclick="hrDocEventClick('${ev.personId}','${ev.type}')" title="${ev.label}">${icon}${ev.label}</span>`;
      }).join('') +
    `</div>`;
  }

  const remainder = (startDay + daysInMonth) % 7;
  if (remainder !== 0)
    for (let d = 1; d <= 7 - remainder; d++)
      html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;

  html += '</div>';
  gridWrap.innerHTML = html;
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
      id: hrGenId() + '_t' + i,
      name: t.name,
      assignees: t.assignees || [],
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
  clearTimeout(_hrSaveTimer);
  _hrSaveTimer = setTimeout(async () => {
    const db = _hrInitDb();
    if (!db) { _hrSyncBadge('⚠ Bağlantı hatası', '#e8637a'); return; }
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
      console.error('HR: Firestore save failed', e);
      _hrSyncBadge('⚠ Kayıt hatası', '#e8637a');
    }
  }, 1500);
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
  templates: 'Şablonlar',
  vehicles: 'Taşıtlar',
  'vehicles-dashboard': 'Taşıtlar · Dashboard',
  'vehicles-calendar': 'Taşıtlar · Takvim',
  'vehicles-processes': 'Taşıtlar · Süreçler',
  'vehicles-detail': 'Taşıt Detayı',
  settings: 'Ayarlar',
};

function hrNavigate(page) {
  /* İzin kontrolü */
  const pagePermMap = {
    personnel: 'hr.personnel', processes: 'hr.processes',
    templates: 'hr.templates', calendar: 'hr.calendar',
    vehicles: 'hr.vehicles', 'vehicles-dashboard': 'hr.vehicles',
    'vehicles-calendar': 'hr.vehicles', 'vehicles-processes': 'hr.vehicles',
    'vehicles-detail': 'hr.vehicles',
    settings: 'hr.settings'
  };
  const perm = pagePermMap[page];
  if (perm && !canView(perm)) return;

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
    personnel: canEdit('hr.personnel') ? '<button class="btn btn-primary" onclick="hrOpenModal(\'modal-person\')">+ Personel Ekle</button>' : '',
    processes: canEdit('hr.processes') ? '<button class="btn btn-primary" onclick="openProcessModal()">+ Süreç Başlat</button>' : '',
    calendar: '',
    templates: canEdit('hr.templates') ? '<button class="btn btn-primary" onclick="openTemplateModal()">+ Yeni Şablon</button>' : '',
    vehicles: '<button class="btn btn-ghost btn-sm" onclick="vehLoadAndRenderList()" title="Yenile">↻</button>' + (canEdit('hr.vehicles') ? '<button class="btn btn-primary" onclick="vehOpenAddVehicle()">+ Araç Ekle</button>' : ''),
    'vehicles-dashboard': '',
    'vehicles-calendar': '',
    'vehicles-processes': canEdit('hr.vehicles') ? '<button class="btn btn-primary" onclick="vehOpenStartFromTemplate(null)">+ Süreç Başlat</button>' : '',
    'vehicles-detail': '',
    settings: '',
  };
  const actionsEl = document.getElementById('topbar-actions');
  if (actionsEl) actionsEl.innerHTML = actions[page] || '';

  /* Render page content */
  if (page === 'dashboard') renderDashboard();
  if (page === 'personnel') renderPersonnel();
  if (page === 'processes') renderProcesses();
  if (page === 'calendar') { initCalendar(); hrSwitchCalTab(hrState._calTab || 'tasks'); }
  if (page === 'templates') renderTemplates();
  if (page === 'vehicles') { if (_vehVehicles.length) vehRenderList(); else vehLoadAndRenderList(); }
  if (page === 'vehicles-dashboard') { vehEnsureLoaded().then(vehRenderDashboard); }
  if (page === 'vehicles-calendar')  { vehEnsureLoaded().then(vehRenderCalendar); }
  if (page === 'vehicles-processes') { vehEnsureLoaded().then(vehRenderProcessesPage); }
  if (page === 'settings') renderSettings();
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
    sicilNo: document.getElementById('p-sicil').value.trim(),
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
  document.getElementById('p-sicil').value = person.sicilNo || '';
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
  hrState.processes = hrState.processes.filter(p => p.personId !== id);
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
      <th>Ad Soyad</th><th>Sicil No</th><th>Pozisyon</th><th>Uyruk</th><th>E-posta</th>
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
      <td>${p.sicilNo || '-'}</td>
      <td>${p.position || '-'}</td>
      <td>${p.nationality || '-'}</td>
      <td>${p.email || '-'}</td>
      <td>${p.startDate || '-'}</td>
      <td>${hrExpiryCell(p.permitExpiry)}</td>
      <td>${hrExpiryCell(p.passportExpiry)}</td>
      <td><span class="badge ${sBadge}">${sLabel}</span></td>
      <td><div class="td-actions">
        ${canEdit('hr.personnel') ? `<button class="btn btn-ghost btn-sm" onclick="editPerson('${p.id}')">Düzenle</button>` : ''}
        ${canAdmin('hr.personnel') ? `<button class="btn btn-danger btn-sm" onclick="deletePerson('${p.id}')">Sil</button>` : ''}
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
let _settingsUsers = []; // Firestore users cache — şablon editörü için

async function openTemplateModal(id) {
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

  // Kullanıcıları çek (önbellekte yoksa)
  if (!_settingsUsers.length) {
    try {
      const snap = await _hrInitDb().collection('users').get();
      _settingsUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    } catch(e) { _settingsUsers = []; }
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
  const userOpts = _settingsUsers.length
    ? _settingsUsers.map(u => ({ uid: u.uid, name: u.name || u.email || u.uid }))
    : [];

  wrap.innerHTML = _taskRows.map((t, i) => {
    const assignees = t.assignees || [];
    const checkboxes = userOpts.length
      ? userOpts.map(u => `
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;white-space:nowrap">
            <input type="checkbox" value="${u.uid}" ${assignees.includes(u.uid)?'checked':''}
              onchange="taskToggleAssignee(${i},'${u.uid}',this.checked)">
            ${u.name}
          </label>`).join('')
      : '<span style="font-size:12px;color:var(--hr-text3)">Kullanıcı yok</span>';
    return `<div class="task-row" style="flex-wrap:wrap;gap:6px;align-items:flex-start">
      <input type="text" value="${t.name || ''}" placeholder="Görev adı" style="flex:1;min-width:120px"
        oninput="_taskRows[${i}].name=this.value">
      <input type="number" value="${t.days || 0}" min="0" style="width:64px"
        oninput="_taskRows[${i}].days=+this.value" title="Gün sayısı">
      <button class="btn btn-danger btn-sm btn-icon" onclick="removeTaskRow(${i})" title="Kaldır">✕</button>
      <div style="width:100%;display:flex;flex-wrap:wrap;gap:8px;padding:4px 0 2px">
        <span style="font-size:11px;color:var(--hr-text3);align-self:center">Atanan kullanıcılar:</span>
        ${checkboxes}
      </div>
    </div>`;
  }).join('');
}

function addTaskRow() {
  const nameEl = document.getElementById('new-task-name');
  const daysEl = document.getElementById('new-task-days');
  const name = nameEl?.value.trim();
  if (!name) return;
  _taskRows.push({
    name,
    assignees: [],
    days: +(daysEl?.value || 0)
  });
  if (nameEl) nameEl.value = '';
  if (daysEl) daysEl.value = '';
  renderTaskEditorList();
}

function taskToggleAssignee(rowIdx, uid, checked) {
  if (!_taskRows[rowIdx]) return;
  if (!_taskRows[rowIdx].assignees) _taskRows[rowIdx].assignees = [];
  if (checked) {
    if (!_taskRows[rowIdx].assignees.includes(uid)) _taskRows[rowIdx].assignees.push(uid);
  } else {
    _taskRows[rowIdx].assignees = _taskRows[rowIdx].assignees.filter(u => u !== uid);
  }
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
    'diger': 'Diğer',
    'arac-bakim': 'Araç Bakım',
    'arac-muayene': 'Muayene / Sigorta',
    'arac-diger': 'Araç Diğer'
  };

  const vehTypes = new Set(['arac-bakim', 'arac-muayene', 'arac-diger']);
  const hrTmpls  = hrState.templates.filter(t => !vehTypes.has(t.type));
  const vehTmpls = hrState.templates.filter(t =>  vehTypes.has(t.type));

  function tmplCard(t) {
    const isVeh = vehTypes.has(t.type);
    return `<div class="template-card">
      <div class="tc-head">
        <div>
          <div class="tc-title">${t.name}</div>
          <div class="tc-type">${typeLabel[t.type] || t.type || '-'}</div>
        </div>
        <span class="badge badge-accent">${(t.tasks||[]).length} görev</span>
      </div>
      ${t.desc ? `<p class="text-sm text-muted mb-3">${t.desc}</p>` : ''}
      <div class="tc-actions">
        ${canEdit('hr.templates') ? `<button class="btn btn-secondary btn-sm" onclick="openTemplateModal('${t.id}')">Düzenle</button>` : ''}
        ${!isVeh && canEdit('hr.processes') ? `<button class="btn btn-primary btn-sm" onclick="openProcessModalFor('${t.id}')">Süreç Başlat</button>` : ''}
        ${canAdmin('hr.templates') ? `<button class="btn btn-danger btn-sm" onclick="deleteTemplate('${t.id}')">Sil</button>` : ''}
      </div>
    </div>`;
  }

  let html = '';
  if (hrTmpls.length) {
    html += `<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--hr-text2);letter-spacing:0.5px;margin-bottom:12px;text-transform:uppercase">İK Süreç Şablonları</div>`;
    html += '<div class="template-grid">' + hrTmpls.map(tmplCard).join('') + '</div>';
  }
  if (vehTmpls.length) {
    html += `<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--hr-text2);letter-spacing:0.5px;margin:${hrTmpls.length ? '28px' : '0'} 0 12px;text-transform:uppercase">Araç Görev Şablonları</div>`;
    html += '<div class="template-grid">' + vehTmpls.map(tmplCard).join('') + '</div>';
  }
  wrap.innerHTML = html;
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
      id: hrGenId() + '_t' + i,
      name: t.name,
      assignees: t.assignees || [],
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
            ${canAdmin('hr.processes') ? `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProcess('${proc.id}')">Sil</button>` : ''}
          </div>
        </div>
        <div class="${bodyClass}">
          ${proc.notes ? `<div style="font-size:12px;color:var(--hr-text3);font-style:italic;padding:8px 16px 0">${proc.notes}</div>` : ''}
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
            const assigneeLabel = { ik:'IK', personel:'Personel', yonetim:'Yönetim' };
            const assigneeBadge = t.assignee ? `<span class="badge badge-info" style="font-size:10px;margin-left:4px">${assigneeLabel[t.assignee]||t.assignee}</span>` : '';
            return `<div class="${doneClass}">
              <div class="task-check" ${canEdit('hr.processes') ? `onclick="toggleTask('${proc.id}','${t.id}')"` : 'style="opacity:.4;cursor:default"'}>${checkContent}</div>
              <div class="task-info">
                <div class="task-name">${t.name}${assigneeBadge}</div>
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
  const openProcs = activeProcs.filter(p => !p.tasks.length || !p.tasks.every(t => t.done));
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
      <div class="dkc-value">${openProcs.length}</div>
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

  // ══ TAŞIT UYARILARI (araçlar arka planda yüklenirse güncellenir) ══
  vehRenderDashboardWidget();

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

async function hrExportAll() {
  if (!window.XLSX) { alert('SheetJS yüklenemedi.'); return; }
  await vehEnsureLoaded();

  const wb = XLSX.utils.book_new();
  const date = new Date().toISOString().slice(0,10);

  // ── Sheet 1: Personel ──
  const pHeaders = [
    'Ad Soyad','Sicil No','Uyruk','TC/Pasaport No','Pozisyon','Bölüm',
    'İşe Başlama','Çalışma İzni Bitiş','Pasaport No','Pasaport Bitiş',
    'E-posta','Telefon','Durum','Not'
  ];
  const pRows = hrState.personnel.map(p => [
    p.name, p.sicilNo||'', p.nationality, p.idNo||'', p.position||'', p.department||'',
    p.startDate||'', p.permitExpiry||'', p.passportNo||'', p.passportExpiry||'',
    p.email||'', p.phone||'',
    p.status==='active'?'Aktif':p.status==='passive'?'Pasif':'İzinde',
    p.note||''
  ]);
  const wsP = XLSX.utils.aoa_to_sheet([pHeaders, ...pRows]);
  wsP['!cols'] = [{wch:22},{wch:12},{wch:10},{wch:18},{wch:16},{wch:14},{wch:14},{wch:18},{wch:16},{wch:18},{wch:24},{wch:18},{wch:10},{wch:24}];
  _hrXlBoldHeader(wsP, pHeaders.length);
  XLSX.utils.book_append_sheet(wb, wsP, 'Personel');

  // ── Sheet 2: Süreçler & Görevler ──
  const tHeaders = [
    'Personel','Süreç Şablonu','Başlangıç Tarihi',
    'Görev No','Görev Adı','Sorumlu','Son Tarih','Tamamlandı','Tamamlanma Tarihi'
  ];
  const tRows = [];
  hrState.processes.forEach(proc => {
    proc.tasks.forEach((t, i) => {
      tRows.push([
        proc.personName, proc.templateName, proc.startDate,
        i+1, t.name, t.assignee||'',
        t.dueDate||'',
        t.done ? 'Evet' : 'Hayır',
        t.doneAt ? t.doneAt.slice(0,10) : ''
      ]);
    });
    if (!proc.tasks.length) {
      tRows.push([proc.personName, proc.templateName, proc.startDate, '', '', '', '', '', '']);
    }
  });
  const wsT = XLSX.utils.aoa_to_sheet([tHeaders, ...tRows]);
  wsT['!cols'] = [{wch:22},{wch:22},{wch:14},{wch:8},{wch:28},{wch:12},{wch:14},{wch:12},{wch:16}];
  _hrXlBoldHeader(wsT, tHeaders.length);
  XLSX.utils.book_append_sheet(wb, wsT, 'Süreçler ve Görevler');

  // ── Sheet 3: Şablonlar ──
  const sHeaders = ['Şablon Adı','Tür','Görev Sırası','Görev Adı','Gün Offseti','Sorumlu'];
  const sRows = [];
  hrState.templates.forEach(tmpl => {
    (tmpl.tasks||[]).forEach((t, i) => {
      sRows.push([tmpl.name, tmpl.type||'', i+1, t.name, t.days||0, t.assignee||'']);
    });
    if (!(tmpl.tasks||[]).length) sRows.push([tmpl.name, tmpl.type||'', '', '', '', '']);
  });
  const wsS = XLSX.utils.aoa_to_sheet([sHeaders, ...sRows]);
  wsS['!cols'] = [{wch:24},{wch:16},{wch:10},{wch:28},{wch:12},{wch:12}];
  _hrXlBoldHeader(wsS, sHeaders.length);
  XLSX.utils.book_append_sheet(wb, wsS, 'Şablonlar');

  // ── Sheet 4: Araçlar ──
  if (_vehVehicles.length) {
    const vHeaders = [
      'Plaka','Sahip','Cins','Marka','Model','Yıl','Şasi No','GPS',
      'Zimmet','Sigorta Bitiş','Seyrüsefer Bitiş','Muayene Bitiş',
      'GKRY İzni Bitiş','Rum Sigorta Bitiş','B İzni Bitiş','Güncel Km'
    ];
    const vRows = _vehVehicles.map(v => [
      v.plate||'', v.owner||'', v.type||'', v.brand||'', v.model||'', v.year||'',
      v.chassis||'', v.gps==='var'?'Var':'Yok',
      v.assigneeName||'Boşta',
      v.insurance||'', v.seyrusefer||'', v.muayene||'',
      v.gkry||'', v.rumSigorta||'', v.bIzni||'',
      v.currentKm||''
    ]);
    const wsV = XLSX.utils.aoa_to_sheet([vHeaders, ...vRows]);
    wsV['!cols'] = [{wch:12},{wch:18},{wch:12},{wch:12},{wch:12},{wch:6},{wch:20},{wch:5},
                   {wch:18},{wch:14},{wch:14},{wch:14},{wch:16},{wch:16},{wch:14},{wch:10}];
    _hrXlBoldHeader(wsV, vHeaders.length);
    XLSX.utils.book_append_sheet(wb, wsV, 'Araçlar');
  }

  if (!wb.SheetNames.length) { alert('Dışa aktarılacak veri yok.'); return; }

  XLSX.writeFile(wb, `AuroraNova_HR_${date}.xlsx`);
}

function _hrXlBoldHeader(ws, colCount) {
  for (let C = 0; C < colCount; C++) {
    const addr = XLSX.utils.encode_cell({r:0, c:C});
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'EDF2FF' } } };
  }
}

// ── Initialise: auth callback'ten tetikleniyor (index.html) ──

/* ============================================================
   TAŞIT YÖNETİMİ
   Firestore collections: vehicles, vehicle_documents,
   vehicle_services, vehicle_payments, vehicle_tasks
   ============================================================ */

let _vehVehicles = [];
let _vehCurrentVehicleId = null;
let _vehCalYear = new Date().getFullYear();
let _vehCalMonth = new Date().getMonth();
let _vehDocType = 'other';
let _vehEditServiceId = null;

/* ── HR Dashboard taşıt widget'ı ── */
async function vehRenderDashboardWidget() {
  const el = document.getElementById('dash-vehicles-body');
  if (!el) return;
  await vehEnsureLoaded();
  if (!_vehVehicles.length) {
    el.innerHTML = '<div class="dash-empty">Henüz araç eklenmedi</div>';
    return;
  }
  const todayMs = new Date().setHours(0,0,0,0);
  const in30Ms  = todayMs + 30 * 86400000;
  const alerts  = [];
  const fields  = [
    {key:'insurance',label:'Sigorta'},{key:'seyrusefer',label:'Seyrüsefer'},
    {key:'muayene',label:'Muayene'},{key:'gkry',label:'GKRY İzni'},
    {key:'rumSigorta',label:'Rum Sigorta'},{key:'bIzni',label:'B İzni'},
  ];
  _vehVehicles.forEach(v => {
    fields.forEach(f => {
      if (!v[f.key]) return;
      const ms = new Date(v[f.key]).getTime();
      if (ms <= in30Ms) alerts.push({ plate: v.plate, label: f.label, date: v[f.key], expired: ms < todayMs });
    });
  });
  alerts.sort((a,b) => new Date(a.date) - new Date(b.date));
  if (!alerts.length) {
    el.innerHTML = '<div class="dash-empty">✅ 30 gün içinde kritik tarih yok</div>';
    return;
  }
  el.innerHTML = alerts.slice(0,5).map(a => `
    <div class="dash-task-row">
      <div class="dtr-dot ${a.expired ? 'dtr-red' : 'dtr-amber'}"></div>
      <div class="dtr-info">
        <div class="dtr-name">${a.plate}</div>
        <div class="dtr-meta">${a.label}</div>
      </div>
      <div class="dtr-right">
        <span class="dtr-date ${a.expired ? 'dtr-date-red' : 'dtr-date-amber'}">${a.expired ? '⚠' : '⏰'} ${vehFmtDate(a.date)}</span>
      </div>
    </div>`).join('') +
    (alerts.length > 5 ? `<div class="dash-more" onclick="hrNavigate('vehicles-dashboard')">+${alerts.length - 5} uyarı daha →</div>` : '');
}

/* ── Araçlar yüklü değilse yükle (liste render etmeden) ── */
async function vehEnsureLoaded() {
  if (_vehVehicles.length) return;
  const db = _hrInitDb();
  if (!db) return;
  _hrSyncBadge('Yükleniyor…');
  try {
    const snap = await db.collection('vehicles').get();
    _vehVehicles = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    _hrSyncBadge('✓ Senkronize', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2500);
  } catch(e) {
    console.error('VEH: load failed', e);
    _hrSyncBadge('⚠ Yükleme hatası', '#e8637a');
  }
}

/* ── Firebase Storage (aynı HR app'i kullan) ── */
function _vehStorage() {
  try {
    const app = firebase.apps.find(a => a.name === 'hr');
    return app ? firebase.storage(app) : null;
  } catch(e) { return null; }
}

/* ── Yardımcılar ── */
function vehFmtDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function vehExpiryClass(dateStr) {
  if (!dateStr) return 'empty';
  const todayMs = new Date().setHours(0,0,0,0);
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((d - todayMs) / 86400000);
  if (diff < 0)  return 'red';
  if (diff <= 30) return 'yellow';
  return 'green';
}

/* ── Araçları yükle ve listele ── */
async function vehLoadAndRenderList() {
  const db = _hrInitDb();
  if (!db) return;
  _hrSyncBadge('Yükleniyor…');
  try {
    const snap = await db.collection('vehicles').get();
    _vehVehicles = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    _hrSyncBadge('✓ Senkronize', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2500);
  } catch(e) {
    console.error('VEH: load failed', e);
    _hrSyncBadge('⚠ Yükleme hatası', '#e8637a');
  }
  vehRenderList();
}

function vehFilterList() { vehRenderList(); }

function vehRenderList() {
  const wrap = document.getElementById('veh-list-wrap');
  if (!wrap) return;
  const search = (document.getElementById('veh-search')?.value || '').toLowerCase();
  const statusF = document.getElementById('veh-filter-status')?.value || '';

  let list = _vehVehicles.filter(v => {
    if (search && !v.plate?.toLowerCase().includes(search) &&
        !v.brand?.toLowerCase().includes(search) &&
        !v.model?.toLowerCase().includes(search)) return false;
    if (statusF === 'bosta'    && v.assigneeId) return false;
    if (statusF === 'zimmetli' && !v.assigneeId) return false;
    return true;
  });

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚗</div><p>Henüz araç eklenmedi.</p></div>';
    return;
  }
  wrap.innerHTML = '<div class="veh-list-grid">' + list.map(vehCardHtml).join('') + '</div>';
}

function vehCardHtml(v) {
  const assigneeName = v.assigneeId
    ? (hrState.personnel.find(p => p.id === v.assigneeId)?.name || v.assigneeName || 'Zimmetli')
    : 'Boşta';
  const zimmetBadge = v.assigneeId
    ? `<span class="badge badge-warning">${assigneeName}</span>`
    : `<span class="badge badge-success">Boşta</span>`;
  const gpsBadge = v.gps === 'var'
    ? `<span class="badge" style="background:#e8f0fe;color:#3557c7">GPS ✓</span>`
    : `<span class="badge badge-neutral">GPS ✗</span>`;

  const dateFields = [
    { label: 'Sigorta',      val: v.insurance },
    { label: 'Seyrüsefer',   val: v.seyrusefer },
    { label: 'Muayene',      val: v.muayene },
    { label: 'GKRY İzni',    val: v.gkry },
    { label: 'Rum Sigorta',  val: v.rumSigorta },
    { label: 'B İzni',       val: v.bIzni },
  ];
  const dateRows = dateFields.map(f => {
    const cls = vehExpiryClass(f.val);
    const dot = cls === 'red' ? '🔴' : cls === 'yellow' ? '🟡' : cls === 'green' ? '🟢' : '';
    return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">
      <span style="color:var(--hr-text3)">${f.label}</span>
      <span style="font-weight:500;color:${cls==='red'?'var(--hr-danger)':cls==='yellow'?'var(--hr-warning)':cls==='green'?'var(--hr-success)':'var(--hr-text3)'}">${dot} ${f.val ? vehFmtDate(f.val) : '—'}</span>
    </div>`;
  }).join('');

  return `<div class="veh-card" onclick="vehOpenDetail('${v.id}')">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:1px">${v.plate || '—'}</div>
        <div style="font-size:12px;color:var(--hr-text2);margin-top:2px">${[v.brand,v.model,v.year].filter(Boolean).join(' · ')}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${zimmetBadge}${gpsBadge}</div>
    </div>
    <div style="margin-bottom:10px">${dateRows}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--hr-border)">
      <span style="font-size:12px;color:var(--hr-text3)">${v.type||''} · ${v.owner||''}</span>
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        ${canEdit('hr.vehicles') ? `<button class="btn btn-ghost btn-sm" onclick="vehOpenEditVehicle('${v.id}')">Düzenle</button>` : ''}
        ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeleteVehicle('${v.id}')">Sil</button>` : ''}
      </div>
    </div>
  </div>`;
}

/* ── Araç Ekle/Düzenle ── */
function vehOpenAddVehicle() {
  document.getElementById('veh-form-vehicle').reset();
  delete document.getElementById('veh-form-vehicle').dataset.editId;
  document.getElementById('veh-modal-vehicle-title').textContent = 'Araç Ekle';
  vehPopulateAssigneeDropdown('');
  hrOpenModal('veh-modal-vehicle');
}

function vehOpenEditVehicle(id) {
  const v = _vehVehicles.find(x => x.id === id);
  if (!v) return;
  const form = document.getElementById('veh-form-vehicle');
  form.dataset.editId = id;
  document.getElementById('veh-modal-vehicle-title').textContent = 'Araç Düzenle';
  document.getElementById('vv-plate').value       = v.plate || '';
  document.getElementById('vv-owner').value       = v.owner || '';
  document.getElementById('vv-type').value        = v.type || 'otomobil';
  document.getElementById('vv-brand').value       = v.brand || '';
  document.getElementById('vv-model').value       = v.model || '';
  document.getElementById('vv-year').value        = v.year || '';
  document.getElementById('vv-chassis').value     = v.chassis || '';
  document.getElementById('vv-gps').value         = v.gps || 'yok';
  document.getElementById('vv-insurance').value   = v.insurance || '';
  document.getElementById('vv-seyrusefer').value  = v.seyrusefer || '';
  document.getElementById('vv-muayene').value     = v.muayene || '';
  document.getElementById('vv-gkry').value        = v.gkry || '';
  document.getElementById('vv-rum-sigorta').value = v.rumSigorta || '';
  document.getElementById('vv-b-izni').value      = v.bIzni || '';
  vehPopulateAssigneeDropdown(v.assigneeId || '');
  hrOpenModal('veh-modal-vehicle');
}

function vehPopulateAssigneeDropdown(selectedId) {
  const sel = document.getElementById('vv-assignee');
  sel.innerHTML = '<option value="">Boşta</option>';
  hrState.personnel.filter(p => p.status === 'active').forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name + (p.position ? ` (${p.position})` : '');
    if (p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function vehSaveVehicle(e) {
  e.preventDefault();
  const form = document.getElementById('veh-form-vehicle');
  const isEdit = !!form.dataset.editId;
  const id = isEdit ? form.dataset.editId : ('veh_' + Date.now().toString(36));

  const assigneeId   = document.getElementById('vv-assignee').value;
  const assigneeName = assigneeId
    ? (hrState.personnel.find(p => p.id === assigneeId)?.name || '')
    : '';

  const data = {
    plate:       document.getElementById('vv-plate').value.trim().toUpperCase(),
    owner:       document.getElementById('vv-owner').value.trim(),
    type:        document.getElementById('vv-type').value,
    brand:       document.getElementById('vv-brand').value.trim(),
    model:       document.getElementById('vv-model').value.trim(),
    year:        document.getElementById('vv-year').value,
    chassis:     document.getElementById('vv-chassis').value.trim(),
    gps:         document.getElementById('vv-gps').value,
    assigneeId,
    assigneeName,
    insurance:   document.getElementById('vv-insurance').value,
    seyrusefer:  document.getElementById('vv-seyrusefer').value,
    muayene:     document.getElementById('vv-muayene').value,
    gkry:        document.getElementById('vv-gkry').value,
    rumSigorta:  document.getElementById('vv-rum-sigorta').value,
    bIzni:       document.getElementById('vv-b-izni').value,
    updatedAt:   new Date().toISOString(),
  };
  if (!isEdit) data.createdAt = new Date().toISOString();

  const db = _hrInitDb();
  if (!db) { alert('Veritabanı bağlantısı yok.'); return; }

  _hrSyncBadge('Kaydediliyor…');
  try {
    await db.collection('vehicles').doc(id).set(data, { merge: true });
    if (isEdit) {
      const idx = _vehVehicles.findIndex(x => x.id === id);
      if (idx !== -1) _vehVehicles[idx] = { id, ...data };
    } else {
      _vehVehicles.unshift({ id, ...data });
    }
    _hrSyncBadge('✓ Kaydedildi', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2500);
    hrCloseModal('veh-modal-vehicle');
    vehRenderList();
    vehRenderDashboardWidget();
  } catch(err) {
    _hrSyncBadge('⚠ Kayıt hatası', '#e8637a');
    alert('Kayıt hatası: ' + err.message);
  }
}

async function vehDeleteVehicle(id) {
  if (!confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;
  const db = _hrInitDb();
  _hrSyncBadge('Siliniyor…');
  try {
    // İlişkili dökümanları sil (Storage dahil)
    const docsSnap = await db.collection('vehicle_documents').where('vehicleId','==',id).get();
    for (const d of docsSnap.docs) {
      const sp = d.data().storagePath;
      if (sp) { try { await _vehStorage()?.ref(sp).delete(); } catch(e) {} }
      await d.ref.delete();
    }
    // İlişkili servis, ödeme, görev ve süreçleri sil
    const [svcSnap, paySnap, taskSnap, procSnap] = await Promise.all([
      db.collection('vehicle_services').where('vehicleId','==',id).get(),
      db.collection('vehicle_payments').where('vehicleId','==',id).get(),
      db.collection('vehicle_tasks').where('vehicleId','==',id).get(),
      db.collection('vehicle_processes').where('vehicleId','==',id).get()
    ]);
    const delAll = [...svcSnap.docs, ...paySnap.docs, ...taskSnap.docs, ...procSnap.docs];
    await Promise.all(delAll.map(d => d.ref.delete()));
    // Aracı sil
    await db.collection('vehicles').doc(id).delete();
    _vehVehicles = _vehVehicles.filter(x => x.id !== id);
    _hrSyncBadge('✓ Silindi', '#2ea06e');
    setTimeout(() => _hrSyncBadge(''), 2000);
    vehRenderList();
    vehRenderDashboardWidget();
  } catch(err) {
    _hrSyncBadge('⚠ Hata', '#e8637a');
    alert('Silme hatası: ' + err.message);
  }
}

/* ── Araç Detay ── */
async function vehOpenDetail(vehicleId) {
  _vehCurrentVehicleId = vehicleId;
  const v = _vehVehicles.find(x => x.id === vehicleId);
  if (!v) return;
  document.getElementById('veh-detail-plate').textContent = v.plate;
  document.getElementById('topbar-title').textContent = v.plate + ' · Detay';

  document.querySelectorAll('.hr-app .nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.hr-app .page-section').forEach(el => el.classList.remove('active'));
  document.getElementById('page-vehicles-detail').classList.add('active');

  const actionsEl = document.getElementById('topbar-actions');
  if (actionsEl) actionsEl.innerHTML = '';

  vehDetailTab('info');
}

function vehDetailTab(tab) {
  document.querySelectorAll('.veh-detail-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.querySelectorAll('.veh-detail-pane').forEach(el => el.classList.remove('active'));
  document.getElementById('veh-detail-' + tab).classList.add('active');

  if (tab === 'info')         vehRenderDetailInfo();
  else if (tab === 'docs')      vehRenderDetailDocs();
  else if (tab === 'service')   vehRenderDetailService();
  else if (tab === 'processes') vehRenderDetailProcesses();
  else if (tab === 'tasks')     vehRenderDetailTasks();
}

function vehRenderDetailInfo() {
  const v = _vehVehicles.find(x => x.id === _vehCurrentVehicleId);
  if (!v) return;
  const pane = document.getElementById('veh-detail-info');
  const assigneeName = v.assigneeId
    ? (hrState.personnel.find(p => p.id === v.assigneeId)?.name || v.assigneeName || 'Zimmetli')
    : 'Boşta';

  const infoFields = [
    { label: 'Plaka',       value: v.plate || '—' },
    { label: 'Araç Sahibi', value: v.owner || '—' },
    { label: 'Cinsi',       value: v.type  || '—' },
    { label: 'Marka',       value: v.brand || '—' },
    { label: 'Model',       value: v.model || '—' },
    { label: 'Model Yılı',  value: v.year  || '—' },
    { label: 'Şasi No',     value: v.chassis || '—' },
    { label: 'GPS',         value: v.gps === 'var' ? '✓ Var' : '✗ Yok' },
    { label: 'Zimmet',      value: assigneeName },
  ];
  const expiryFields = [
    { label: 'Sigorta Bitiş',            val: v.insurance },
    { label: 'Seyrüsefer Bitiş',         val: v.seyrusefer },
    { label: 'Muayene Bitiş',            val: v.muayene },
    { label: 'GKRY Araç Kullanım İzni',  val: v.gkry },
    { label: 'Rum Sigorta Bitiş',        val: v.rumSigorta },
    { label: 'B İzni Bitiş',             val: v.bIzni },
  ];

  pane.innerHTML = `
    <div class="veh-section-header">
      <span class="veh-section-title">Araç Bilgileri</span>
      <button class="btn btn-ghost btn-sm" onclick="vehOpenEditVehicle('${v.id}')">Düzenle</button>
    </div>
    <div class="veh-info-grid">
      ${infoFields.map(f => `<div class="veh-info-item"><div class="veh-info-label">${f.label}</div><div class="veh-info-value">${f.value}</div></div>`).join('')}
    </div>
    <div class="veh-section-header" style="margin-top:20px"><span class="veh-section-title">Tarih Takibi</span></div>
    <div class="veh-expiry-grid">
      ${expiryFields.map(f => {
        const cls = vehExpiryClass(f.val);
        const color = cls==='red'?'var(--hr-danger)':cls==='yellow'?'var(--hr-warning)':cls==='green'?'var(--hr-success)':'var(--hr-text3)';
        return `<div class="veh-expiry-item ${cls}">
          <div class="veh-expiry-label">${f.label}</div>
          <div class="veh-expiry-date" style="color:${color}">${f.val ? vehFmtDate(f.val) : '—'}</div>
        </div>`;
      }).join('')}
    </div>`;
}

async function vehRenderDetailDocs() {
  const pane = document.getElementById('veh-detail-docs');
  pane.innerHTML = '<p style="color:var(--hr-text3);font-size:13px">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  try {
    const snap = await db.collection('vehicle_documents')
      .where('vehicleId','==',_vehCurrentVehicleId).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    const kochan = docs.find(d => d.docType === 'kochan');
    const others = docs.filter(d => d.docType !== 'kochan');

    pane.innerHTML = `
      <div class="veh-section-header"><span class="veh-section-title">Koçan (Ruhsat)</span></div>
      ${kochan
        ? `<div class="veh-doc-list">${vehDocItemHtml(kochan)}</div>`
        : `<div style="margin-bottom:12px">${canEdit('hr.vehicles') ? `<button class="btn btn-secondary btn-sm" onclick="vehOpenDocModal('kochan')">📄 Koçan Yükle</button>` : ''}</div>`}
      <div class="veh-section-header" style="margin-top:20px">
        <span class="veh-section-title">Diğer Evraklar</span>
        ${canEdit('hr.vehicles') ? `<button class="btn btn-primary btn-sm" onclick="vehOpenDocModal('other')">+ Evrak Ekle</button>` : ''}
      </div>
      <div class="veh-doc-list">
        ${others.length ? others.map(d => vehDocItemHtml(d)).join('') : '<p style="color:var(--hr-text3);font-size:13px;padding:8px 0">Henüz evrak yüklenmedi.</p>'}
      </div>`;
  } catch(e) {
    pane.innerHTML = '<p style="color:var(--hr-danger);font-size:13px">Evraklar yüklenemedi.</p>';
  }
}

function vehDocItemHtml(doc) {
  const icon = doc.fileType?.includes('image') ? '🖼' : '📄';
  return `<div class="veh-doc-item">
    <span style="font-size:20px;flex-shrink:0">${icon}</span>
    <span style="flex:1;font-size:13px;font-weight:500">${doc.name}</span>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <a href="${doc.url}" target="_blank" class="btn btn-ghost btn-sm">Görüntüle</a>
      ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeleteDoc('${doc.id}','${doc.storagePath||''}')">Sil</button>` : ''}
    </div>
  </div>`;
}

function vehOpenDocModal(type) {
  _vehDocType = type;
  document.getElementById('veh-form-doc').reset();
  document.getElementById('veh-modal-doc-title').textContent = type === 'kochan' ? 'Koçan Yükle' : 'Evrak Yükle';
  document.getElementById('vd-name').value    = type === 'kochan' ? 'Koçan' : '';
  document.getElementById('vd-name').readOnly = type === 'kochan';
  hrOpenModal('veh-modal-doc');
}

async function vehSaveDoc(e) {
  e.preventDefault();
  const name = document.getElementById('vd-name').value.trim();
  const file = document.getElementById('vd-file').files[0];
  if (!file) return;
  const saveBtn = document.getElementById('veh-doc-save-btn');
  saveBtn.disabled = true; saveBtn.textContent = 'Yükleniyor…';
  try {
    const storage = _vehStorage();
    if (!storage) throw new Error('Storage bağlantısı yok');
    const folder = _vehDocType === 'kochan' ? 'kochan' : 'documents';
    const path = `vehicles/${_vehCurrentVehicleId}/${folder}/${Date.now()}_${file.name}`;
    const ref = storage.ref(path);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    await _hrInitDb().collection('vehicle_documents').add({
      vehicleId: _vehCurrentVehicleId, docType: _vehDocType,
      name, url, storagePath: path, fileType: file.type,
      createdAt: new Date().toISOString(),
    });
    hrCloseModal('veh-modal-doc');
    vehRenderDetailDocs();
  } catch(err) { alert('Yükleme hatası: ' + err.message); }
  finally { saveBtn.disabled = false; saveBtn.textContent = 'Yükle'; }
}

async function vehDeleteDoc(docId, storagePath) {
  if (!confirm('Bu evrakı silmek istediğinizden emin misiniz?')) return;
  await _hrInitDb().collection('vehicle_documents').doc(docId).delete();
  if (storagePath) {
    try { await _vehStorage()?.ref(storagePath).delete(); } catch(e) {}
  }
  vehRenderDetailDocs();
}

async function vehRenderDetailService() {
  const pane = document.getElementById('veh-detail-service');
  pane.innerHTML = '<p style="color:var(--hr-text3);font-size:13px">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  try {
    const [sSnap, pSnap] = await Promise.all([
      db.collection('vehicle_services').where('vehicleId','==',_vehCurrentVehicleId).get(),
      db.collection('vehicle_payments').where('vehicleId','==',_vehCurrentVehicleId).get(),
    ]);
    const services = sSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.date||'') > (a.date||'') ? 1 : -1);
    const payments = pSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.date||'') > (a.date||'') ? 1 : -1);
    const v = _vehVehicles.find(x => x.id === _vehCurrentVehicleId);
    const typeLabel  = { bakim:'Bakım', servis:'Servis', ariza:'Arıza' };
    const typeBadge  = { bakim:'badge-info', servis:'badge-success', ariza:'badge-danger' };

    pane.innerHTML = `
      <div class="veh-section-header">
        <span class="veh-section-title">Km Takibi</span>
        <button class="btn btn-ghost btn-sm" onclick="vehOpenKmModal()">Km Güncelle</button>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;background:var(--hr-surface2);border-radius:var(--hr-radius-sm);padding:12px 16px">
        <span style="font-size:12px;color:var(--hr-text3)">Güncel Km</span>
        <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800">${v?.currentKm ? Number(v.currentKm).toLocaleString('tr-TR') + ' km' : '—'}</span>
      </div>
      <div class="veh-section-header">
        <span class="veh-section-title">Servis & Bakım Kayıtları</span>
        ${canEdit('hr.vehicles') ? `<button class="btn btn-primary btn-sm" onclick="vehOpenServiceModal()">+ Servis Ekle</button>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
        ${services.length ? services.map(s => `
          <div style="background:var(--hr-surface);border:1px solid var(--hr-border);border-radius:var(--hr-radius-sm);padding:12px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="badge ${typeBadge[s.type]||'badge-neutral'}">${typeLabel[s.type]||s.type}</span>
                <span style="font-size:12px;color:var(--hr-text3)">${vehFmtDate(s.date)}</span>
                ${s.km ? `<span style="font-size:11px;color:var(--hr-text3)">${Number(s.km).toLocaleString('tr-TR')} km</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                ${s.cost ? `<span style="font-size:13px;font-weight:600">₺${Number(s.cost).toLocaleString('tr-TR')}</span>` : ''}
                ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeleteService('${s.id}')">Sil</button>` : ''}
              </div>
            </div>
            <div style="font-size:13px;font-weight:500">${s.desc}</div>
            ${s.parts    ? `<div style="font-size:12px;color:var(--hr-text2);margin-top:4px">Parçalar: ${s.parts}</div>` : ''}
            ${s.location ? `<div style="font-size:12px;color:var(--hr-text2);margin-top:2px">Servis: ${s.location}</div>` : ''}
          </div>`).join('')
          : '<p style="color:var(--hr-text3);font-size:13px;padding:8px 0">Henüz servis kaydı yok.</p>'}
      </div>
      <div class="veh-section-header">
        <span class="veh-section-title">Ödemeler</span>
        ${canEdit('hr.vehicles') ? `<button class="btn btn-primary btn-sm" onclick="vehOpenPaymentModal()">+ Ödeme Ekle</button>` : ''}
      </div>
      ${payments.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Tarih</th><th>Açıklama</th><th>Tutar</th><th></th></tr></thead>
        <tbody>${payments.map(p => `<tr>
          <td>${vehFmtDate(p.date)}</td><td>${p.desc}</td>
          <td style="font-weight:600">₺${Number(p.amount).toLocaleString('tr-TR')}</td>
          <td>${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeletePayment('${p.id}')">Sil</button>` : ''}</td>
        </tr>`).join('')}</tbody>
      </table></div>`
      : '<p style="color:var(--hr-text3);font-size:13px;padding:8px 0">Henüz ödeme kaydı yok.</p>'}`;
  } catch(e) {
    pane.innerHTML = '<p style="color:var(--hr-danger);font-size:13px">Servis bilgileri yüklenemedi.</p>';
  }
}

function vehOpenServiceModal() {
  _vehEditServiceId = null;
  document.getElementById('veh-form-service').reset();
  document.getElementById('veh-modal-service-title').textContent = 'Servis Kaydı Ekle';
  document.getElementById('vs-date').value = new Date().toISOString().slice(0,10);
  hrOpenModal('veh-modal-service');
}

async function vehSaveService(e) {
  e.preventDefault();
  const db = _hrInitDb();
  const data = {
    vehicleId: _vehCurrentVehicleId,
    date:     document.getElementById('vs-date').value,
    type:     document.getElementById('vs-type').value,
    desc:     document.getElementById('vs-desc').value.trim(),
    parts:    document.getElementById('vs-parts').value.trim(),
    cost:     document.getElementById('vs-cost').value || '',
    location: document.getElementById('vs-location').value.trim(),
    km:       document.getElementById('vs-km').value || '',
    createdAt: new Date().toISOString(),
  };
  try {
    await db.collection('vehicle_services').add(data);
    if (data.km) {
      const v = _vehVehicles.find(x => x.id === _vehCurrentVehicleId);
      if (!v?.currentKm || Number(data.km) > Number(v.currentKm)) {
        await db.collection('vehicles').doc(_vehCurrentVehicleId).update({ currentKm: data.km });
        if (v) v.currentKm = data.km;
      }
    }
    hrCloseModal('veh-modal-service');
    vehRenderDetailService();
  } catch(err) { alert('Kayıt hatası: ' + err.message); }
}

async function vehDeleteService(id) {
  if (!confirm('Servis kaydını silmek istiyor musunuz?')) return;
  await _hrInitDb().collection('vehicle_services').doc(id).delete();
  vehRenderDetailService();
}

function vehOpenPaymentModal() {
  document.getElementById('veh-form-payment').reset();
  document.getElementById('vp-date').value = new Date().toISOString().slice(0,10);
  hrOpenModal('veh-modal-payment');
}

async function vehSavePayment(e) {
  e.preventDefault();
  await _hrInitDb().collection('vehicle_payments').add({
    vehicleId: _vehCurrentVehicleId,
    date:   document.getElementById('vp-date').value,
    amount: document.getElementById('vp-amount').value,
    desc:   document.getElementById('vp-desc').value.trim(),
    createdAt: new Date().toISOString(),
  });
  hrCloseModal('veh-modal-payment');
  vehRenderDetailService();
}

async function vehDeletePayment(id) {
  if (!confirm('Ödeme kaydını silmek istiyor musunuz?')) return;
  await _hrInitDb().collection('vehicle_payments').doc(id).delete();
  vehRenderDetailService();
}

function vehOpenKmModal() {
  document.getElementById('veh-form-km').reset();
  document.getElementById('vk-date').value = new Date().toISOString().slice(0,10);
  const v = _vehVehicles.find(x => x.id === _vehCurrentVehicleId);
  if (v?.currentKm) document.getElementById('vk-km').value = v.currentKm;
  hrOpenModal('veh-modal-km');
}

async function vehSaveKm(e) {
  e.preventDefault();
  const km   = document.getElementById('vk-km').value;
  const date = document.getElementById('vk-date').value;
  try {
    await _hrInitDb().collection('vehicles').doc(_vehCurrentVehicleId).update({ currentKm: km, kmUpdatedAt: date });
    const v = _vehVehicles.find(x => x.id === _vehCurrentVehicleId);
    if (v) { v.currentKm = km; v.kmUpdatedAt = date; }
    hrCloseModal('veh-modal-km');
    vehRenderDetailService();
  } catch(err) { alert('Hata: ' + err.message); }
}

async function vehRenderDetailProcesses() {
  const pane = document.getElementById('veh-detail-processes');
  pane.innerHTML = '<p style="color:var(--hr-text3);font-size:13px">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  try {
    const [procSnap, taskSnap] = await Promise.all([
      db.collection('vehicle_processes').where('vehicleId','==',_vehCurrentVehicleId).orderBy('createdAt','desc').get(),
      db.collection('vehicle_tasks').where('vehicleId','==',_vehCurrentVehicleId).where('processId','!=','').get()
    ]);
    const allTasks = taskSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const processes = procSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const header = `<div class="veh-section-header">
      <span class="veh-section-title">Araç Süreçleri</span>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="hrNavigate('vehicles-processes')" style="font-size:12px">Tüm Süreçler →</button>
        ${canEdit('hr.vehicles') ? `<button class="btn btn-primary btn-sm" onclick="vehOpenStartFromTemplate('${_vehCurrentVehicleId}')">+ Süreç Başlat</button>` : ''}
      </div>
    </div>`;

    if (!processes.length) {
      pane.innerHTML = header + '<p style="color:var(--hr-text3);font-size:13px;padding:8px 0">Henüz süreç başlatılmadı.</p>';
      return;
    }

    const rows = processes.map(proc => {
      const procTasks = allTasks.filter(t => t.processId === proc.id);
      const total = procTasks.length;
      const done  = procTasks.filter(t => t.status === 'tamamlandi').length;
      const pct   = total ? Math.round(done / total * 100) : 0;
      const statusColor = pct === 100 ? 'var(--hr-success)' : 'var(--hr-accent)';
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--hr-border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proc.templateName}</div>
          <div style="font-size:11px;color:var(--hr-text3);margin-top:2px">Başlangıç: ${proc.startDate || '—'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <div style="width:60px;height:5px;background:var(--hr-border);border-radius:3px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${statusColor};border-radius:3px"></div>
          </div>
          <span style="font-size:11px;color:${statusColor};font-weight:600">${done}/${total}</span>
          ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeleteProcess('${proc.id}')">Sil</button>` : ''}
        </div>
      </div>`;
    }).join('');

    pane.innerHTML = header + `<div style="background:var(--hr-surface);border:1px solid var(--hr-border);border-radius:var(--hr-radius);overflow:hidden">${rows}</div>`;
  } catch(e) {
    pane.innerHTML = '<p style="color:var(--hr-danger);font-size:13px">Süreçler yüklenemedi: ' + e.message + '</p>';
  }
}

async function vehDeleteProcess(processId) {
  if (!confirm('Bu süreci ve tüm görevlerini silmek istiyor musunuz?')) return;
  const db = _hrInitDb();
  try {
    const taskSnap = await db.collection('vehicle_tasks').where('processId','==',processId).get();
    await Promise.all(taskSnap.docs.map(d => d.ref.delete()));
    await db.collection('vehicle_processes').doc(processId).delete();
    // Önbellekten kaldır
    _vehAllProcesses = _vehAllProcesses.filter(p => p.id !== processId);
    _vehAllProcTasks = _vehAllProcTasks.filter(t => t.processId !== processId);
    if (document.getElementById('veh-processes-wrap')) _vehRenderProcessList();
    if (document.getElementById('veh-detail-processes')?.closest('.active')) vehRenderDetailProcesses();
  } catch(err) {
    alert('Silme hatası: ' + err.message);
  }
}

/* ============================================================
   ARAÇ — SÜREÇLER SAYFASI
   ============================================================ */

let _vehAllProcesses = [];
let _vehAllProcTasks = [];
let _vehProcOpenState = {};

async function vehRenderProcessesPage() {
  const wrap = document.getElementById('veh-processes-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<p style="color:var(--hr-text3);font-size:13px;padding:16px 0">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  try {
    const [procSnap, taskSnap] = await Promise.all([
      db.collection('vehicle_processes').orderBy('createdAt','desc').get(),
      db.collection('vehicle_tasks').get()
    ]);
    _vehAllProcesses = procSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    _vehAllProcTasks = taskSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Araç filtre dropdown'ını doldur
    const vSel = document.getElementById('veh-proc-filter-vehicle');
    if (vSel) {
      const used = [...new Set(_vehAllProcesses.map(p => p.vehicleId))];
      const opts = used.map(vid => {
        const v = _vehVehicles.find(x => x.id === vid);
        return `<option value="${vid}">${v ? v.plate : vid}</option>`;
      });
      vSel.innerHTML = '<option value="">Tüm Araçlar</option>' + opts.join('');
    }

    _vehRenderProcessList();
  } catch(e) {
    wrap.innerHTML = '<p style="color:var(--hr-danger);font-size:13px">Yüklenemedi: ' + e.message + '</p>';
  }
}

function vehFilterProcesses() {
  _vehRenderProcessList();
}

function _vehRenderProcessList() {
  const wrap = document.getElementById('veh-processes-wrap');
  if (!wrap) return;

  const search = (document.getElementById('veh-proc-search')?.value || '').toLowerCase();
  const vehicleFilter = document.getElementById('veh-proc-filter-vehicle')?.value || '';
  const statusFilter = document.getElementById('veh-proc-filter-status')?.value || '';
  const todayStr = today();

  const filtered = _vehAllProcesses.filter(p => {
    if (vehicleFilter && p.vehicleId !== vehicleFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (search) {
      const veh = _vehVehicles.find(x => x.id === p.vehicleId);
      const plate = veh ? veh.plate.toLowerCase() : '';
      const tname = (p.templateName || '').toLowerCase();
      if (!plate.includes(search) && !tname.includes(search)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p>Henüz süreç bulunmuyor.</p></div>';
    return;
  }

  wrap.innerHTML = '<div class="process-list">' +
    filtered.map(proc => {
      const procTasks = _vehAllProcTasks
        .filter(t => t.processId === proc.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const total = procTasks.length;
      const done  = procTasks.filter(t => t.status === 'tamamlandi').length;
      const pct   = total ? Math.round(done / total * 100) : 0;
      const veh   = _vehVehicles.find(x => x.id === proc.vehicleId);
      const plate = veh ? veh.plate : (proc.vehicleId || '?');
      const initials2 = plate.replace(/\s/g,'').slice(0,2).toUpperCase();
      const isOpen = !!_vehProcOpenState[proc.id];

      const hasOverdue = procTasks.some(t => t.status !== 'tamamlandi' && t.due && t.due < todayStr);
      const hasSoon    = procTasks.some(t => t.status !== 'tamamlandi' && t.due && t.due >= todayStr && t.due <= addDays(todayStr, 7));

      const taskRows = procTasks.map(t => {
        const isDone = t.status === 'tamamlandi';
        const isOverdue = !isDone && t.due && t.due < todayStr;
        const isSoon    = !isDone && t.due && !isOverdue && t.due <= addDays(todayStr, 7);
        const doneClass = isDone ? 'task-item done' : (isOverdue ? 'task-item overdue' : (isSoon ? 'task-item soon' : 'task-item'));
        const checkContent = isDone ? '✓' : '';
        const dueLabel = isDone
          ? `<span style="color:#2ea06e;font-size:11px">✓ ${t.completedAt ? t.completedAt.slice(0,10) + ' tamamlandı' : 'Tamamlandı'}</span>`
          : (isOverdue
              ? `<span style="color:#e8637a;font-size:11px;font-weight:600">⚠ Gecikmiş — ${t.due}</span>`
              : (isSoon
                  ? `<span style="color:#e8a24a;font-size:11px">⏰ Yaklaşıyor — ${t.due}</span>`
                  : `<span style="font-size:11px;color:#9da4c8">Teslim: ${t.due || '—'}</span>`));
        const assignees = t.assignees || [];
        const canComplete = !assignees.length || assignees.includes(_currentUserUid);
        const assigneeNames = assignees.length
          ? assignees.map(uid => { const u = _settingsUsers.find(u => u.uid === uid); return u ? (u.name || u.email) : uid; }).join(', ')
          : null;
        return `<div class="${doneClass}">
          <div class="task-check" ${canComplete && canEdit('hr.vehicles') ? `onclick="vehToggleTask('${proc.id}','${t.id}')"` : 'style="opacity:.4;cursor:default"'}>${checkContent}</div>
          <div class="task-info">
            <div class="task-name">${t.name}${assigneeNames ? `<span class="badge badge-info" style="font-size:10px;margin-left:4px">👤 ${assigneeNames}</span>` : ''}</div>
            <div class="task-due">${dueLabel}</div>
          </div>
        </div>`;
      }).join('');

      return `<div class="process-card">
        <div class="process-header" onclick="vehToggleProcessBody('${proc.id}')">
          <div class="ph-left">
            <div class="avatar" style="background:#3557c7;font-size:11px">${initials2}</div>
            <div class="ph-info">
              <div class="ph-title">${plate} — ${proc.templateName || '—'}</div>
              <div class="ph-meta">Başlangıç: ${proc.startDate || '—'}${hasOverdue ? ' <span style="color:#e8637a;font-size:11px;font-weight:600">● Geciken görev var</span>' : (hasSoon ? ' <span style="color:#e8a24a;font-size:11px">● Yaklaşan görev var</span>' : '')}</div>
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
            ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();vehDeleteProcess('${proc.id}')">Sil</button>` : ''}
          </div>
        </div>
        <div class="${isOpen ? 'process-body open' : 'process-body'}">
          <div class="task-list">${taskRows || '<div style="padding:12px 16px;font-size:12px;color:var(--hr-text3)">Görev bulunamadı.</div>'}</div>
        </div>
      </div>`;
    }).join('') +
  '</div>';
}

function vehToggleProcessBody(procId) {
  _vehProcOpenState[procId] = !_vehProcOpenState[procId];
  _vehRenderProcessList();
}

async function vehToggleTask(processId, taskId) {
  const db = _hrInitDb();
  if (!db) return;
  try {
    // Sürecin tüm görevlerini sıralı çek
    const snap = await db.collection('vehicle_tasks')
      .where('processId','==',processId).get();
    const tasks = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const taskIdx = tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;
    const task = tasks[taskIdx];

    // Assignee kontrolü
    const assignees = task.assignees || [];
    if (assignees.length && !assignees.includes(_currentUserUid)) return;

    // Sıralı tamamlama kontrolü — sadece tamamlanmamış görevi tamamlarken
    if (task.status !== 'tamamlandi') {
      const firstPending = tasks.findIndex(t => t.status !== 'tamamlandi');
      if (firstPending !== taskIdx) {
        vehShowOrderWarning(tasks[firstPending], task, tasks);
        return;
      }
    }

    const newStatus = task.status === 'tamamlandi' ? 'bekliyor' : 'tamamlandi';
    await db.collection('vehicle_tasks').doc(taskId).update({
      status: newStatus,
      completedBy:  newStatus === 'tamamlandi' ? _currentUserUid : null,
      completedAt:  newStatus === 'tamamlandi' ? new Date().toISOString() : null,
    });

    // Önbellekteki task'ı güncelle ve listeyi yeniden çiz
    const cached = _vehAllProcTasks.find(t => t.id === taskId);
    if (cached) {
      cached.status      = newStatus;
      cached.completedBy = newStatus === 'tamamlandi' ? _currentUserUid : null;
      cached.completedAt = newStatus === 'tamamlandi' ? new Date().toISOString() : null;
    }
    _vehRenderProcessList();
  } catch(e) {
    alert('Görev güncellenemedi: ' + e.message);
  }
}

function vehShowOrderWarning(blockingTask, targetTask, allTasks) {
  const existing = document.getElementById('veh-order-modal');
  if (existing) existing.remove();
  const blockingIdx = allTasks.findIndex(t => t.id === blockingTask.id);
  const modal = document.createElement('div');
  modal.id = 'veh-order-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18);font-family:'DM Sans',sans-serif">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="width:40px;height:40px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚠️</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#1e2342">Sıralı Tamamlama Zorunlu</div>
          <div style="font-size:12px;color:#9da4c8;margin-top:2px">Araç Süreci</div>
        </div>
      </div>
      <p style="font-size:13px;color:#3d4466;line-height:1.6;margin:0 0 10px">
        <strong style="color:#1e2342">"${targetTask.name}"</strong> görevi tamamlanabilmesi için öncelikle aşağıdaki görevin kapatılması gerekmektedir:
      </p>
      <div style="background:#f5f6fb;border:1px solid #dde1ee;border-radius:8px;padding:12px 14px;margin-bottom:20px">
        <div style="font-size:12px;color:#9da4c8;margin-bottom:4px">Bekleyen Görev (${blockingIdx + 1}/${allTasks.length})</div>
        <div style="font-size:13px;font-weight:600;color:#1e2342">${blockingTask.name}</div>
        ${blockingTask.due ? `<div style="font-size:11px;color:#9da4c8;margin-top:4px">Son Tarih: ${blockingTask.due}</div>` : ''}
      </div>
      <button onclick="document.getElementById('veh-order-modal').remove()" style="width:100%;padding:11px;background:#5b7fe8;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Anladım</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function vehRenderDetailTasks() {
  const pane = document.getElementById('veh-detail-tasks');
  pane.innerHTML = '<p style="color:var(--hr-text3);font-size:13px">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  try {
    const snap = await db.collection('vehicle_tasks')
      .where('vehicleId','==',_vehCurrentVehicleId).get();
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    const sLabel = { bekliyor:'Bekliyor', devam:'Devam Ediyor', tamamlandi:'Tamamlandı' };
    const sBadge = { bekliyor:'badge-warning', devam:'', tamamlandi:'badge-success' };
    const open = tasks.filter(t => t.status !== 'tamamlandi');
    const done = tasks.filter(t => t.status === 'tamamlandi');

    pane.innerHTML = `
      <div class="veh-section-header">
        <span class="veh-section-title">Açık Görevler</span>
        ${canEdit('hr.vehicles') ? `<button class="btn btn-primary btn-sm" onclick="vehOpenTaskModal('${_vehCurrentVehicleId}')">+ Tekil Görev Ekle</button>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${open.length ? open.map(t => vehTaskHtml(t, sLabel, sBadge)).join('')
          : '<p style="color:var(--hr-text3);font-size:13px;padding:8px 0">Açık görev yok.</p>'}
      </div>
      ${done.length ? `
        <div class="veh-section-header" style="margin-top:20px"><span class="veh-section-title">Tamamlanan Görevler</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${done.map(t => vehTaskHtml(t, sLabel, sBadge)).join('')}
        </div>` : ''}`;
  } catch(e) {
    pane.innerHTML = '<p style="color:var(--hr-danger);font-size:13px">Görevler yüklenemedi.</p>';
  }
}

function vehTaskHtml(t, sLabel, sBadge) {
  const assignees = t.assignees || [];
  const canComplete = !assignees.length || assignees.includes(_currentUserUid);
  const assigneeNames = assignees.length
    ? assignees.map(uid => {
        const u = _settingsUsers.find(u => u.uid === uid);
        return u ? (u.name || u.email) : uid;
      }).join(', ')
    : null;
  return `<div style="display:flex;align-items:center;gap:12px;background:var(--hr-surface);border:1px solid var(--hr-border);border-radius:var(--hr-radius-sm);padding:10px 14px;${t.status==='tamamlandi'?'opacity:0.6':''}">
    <div style="flex:1">
      <div style="font-size:13px;font-weight:500;${t.status==='tamamlandi'?'text-decoration:line-through':''}">${t.name}</div>
      ${t.due ? `<div style="font-size:11px;color:var(--hr-text3);margin-top:2px">Son: ${vehFmtDate(t.due)}</div>` : ''}
      ${t.note ? `<div style="font-size:12px;color:var(--hr-text2);margin-top:2px">${t.note}</div>` : ''}
      ${assigneeNames ? `<div style="font-size:11px;color:var(--hr-text3);margin-top:2px">👤 ${assigneeNames}</div>` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
      <span class="badge ${sBadge[t.status]||'badge-neutral'}" style="${t.status==='devam'?'background:#e8f0fe;color:#3557c7':''}">${sLabel[t.status]||t.status}</span>
      ${canComplete ? `<select class="btn btn-ghost btn-sm" style="padding:4px 6px;font-size:11px" onchange="vehUpdateTaskStatus('${t.id}',this.value)">
        <option value="bekliyor" ${t.status==='bekliyor'?'selected':''}>Bekliyor</option>
        <option value="devam"    ${t.status==='devam'?'selected':''}>Devam</option>
        <option value="tamamlandi" ${t.status==='tamamlandi'?'selected':''}>Tamamlandı</option>
      </select>` : `<span style="font-size:11px;color:var(--hr-text3)">Yetki yok</span>`}
      ${canAdmin('hr.vehicles') ? `<button class="btn btn-danger btn-sm" onclick="vehDeleteTask('${t.id}')">Sil</button>` : ''}
    </div>
  </div>`;
}

function vehOpenTaskModal(vehicleId = null) {
  document.getElementById('veh-form-task').reset();
  document.getElementById('veh-modal-task-title').textContent = 'Görev Ekle';
  const sel = document.getElementById('vt-vehicle');
  sel.innerHTML = _vehVehicles.map(v =>
    `<option value="${v.id}">${v.plate}${v.brand ? ' — ' + v.brand + (v.model ? ' ' + v.model : '') : ''}</option>`
  ).join('');
  if (vehicleId) {
    sel.value = vehicleId;
    sel.disabled = true;
  } else {
    sel.disabled = false;
  }
  hrOpenModal('veh-modal-task');
}

async function vehSaveTask(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('vt-vehicle').value;
  await _hrInitDb().collection('vehicle_tasks').add({
    vehicleId,
    name:   document.getElementById('vt-name').value.trim(),
    due:    document.getElementById('vt-due').value,
    status: document.getElementById('vt-status').value,
    note:   document.getElementById('vt-note').value.trim(),
    createdAt: new Date().toISOString(),
  });
  hrCloseModal('veh-modal-task');
  if (vehicleId === _vehCurrentVehicleId) vehRenderDetailTasks();
}

async function vehUpdateTaskStatus(id, status) {
  try {
    await _hrInitDb().collection('vehicle_tasks').doc(id).update({ status });
    vehRenderDetailTasks();
  } catch(err) { alert('Güncelleme hatası: ' + err.message); }
}

async function vehDeleteTask(id) {
  if (!confirm('Görevi silmek istiyor musunuz?')) return;
  await _hrInitDb().collection('vehicle_tasks').doc(id).delete();
  vehRenderDetailTasks();
}

/* ── Dashboard ── */
async function vehRenderDashboard() {
  const total    = _vehVehicles.length;
  const zimmetli = _vehVehicles.filter(v => v.assigneeId).length;
  const bosta    = total - zimmetli;
  const todayMs  = new Date().setHours(0,0,0,0);
  const in30Ms   = todayMs + 30 * 86400000;
  const criticalSet = new Set();
  _vehVehicles.forEach(v => {
    const has = [v.insurance,v.seyrusefer,v.muayene,v.gkry,v.rumSigorta,v.bIzni]
      .some(d => d && new Date(d).getTime() <= in30Ms);
    if (has) criticalSet.add(v.id);
  });
  const critical = criticalSet.size;

  const kpiEl = document.getElementById('veh-dash-kpi');
  if (kpiEl) kpiEl.innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Toplam Araç</div><div class="kpi-value">${total}</div></div>
    <div class="kpi-card"><div class="kpi-label">Zimmetli</div><div class="kpi-value" style="color:var(--hr-warning)">${zimmetli}</div></div>
    <div class="kpi-card"><div class="kpi-label">Boşta</div><div class="kpi-value" style="color:var(--hr-success)">${bosta}</div></div>
    <div class="kpi-card"><div class="kpi-label">Kritik Uyarı</div><div class="kpi-value" style="color:var(--hr-danger)">${critical}</div></div>`;

  // Kritik tarih uyarıları
  const alerts = [];
  const dateFields = [
    {key:'insurance',label:'Sigorta'},{key:'seyrusefer',label:'Seyrüsefer'},
    {key:'muayene',label:'Muayene'},{key:'gkry',label:'GKRY İzni'},
    {key:'rumSigorta',label:'Rum Sigorta'},{key:'bIzni',label:'B İzni'},
  ];
  _vehVehicles.forEach(v => {
    dateFields.forEach(f => {
      if (!v[f.key]) return;
      const ms = new Date(v[f.key]).getTime();
      if (ms <= in30Ms) alerts.push({ plate: v.plate, label: f.label, date: v[f.key], red: ms < todayMs });
    });
  });
  alerts.sort((a,b) => new Date(a.date) - new Date(b.date));
  const expiryEl = document.getElementById('veh-dash-expiry');
  if (expiryEl) expiryEl.innerHTML = alerts.slice(0,8).map(a =>
    `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:6px;${a.red?'background:#fde8ec;border:1px solid #fbd0d7':'background:#fef9e7;border:1px solid #fde8b0'}">
      <span>${a.red?'🔴':'🟡'}</span>
      <span style="font-size:13px"><strong>${a.plate}</strong> · ${a.label}: ${vehFmtDate(a.date)}</span>
    </div>`).join('') || '<p style="color:var(--hr-text3);font-size:13px">Kritik tarih uyarısı yok.</p>';

  // Sağlık skoru
  const healthEl = document.getElementById('veh-dash-health');
  if (healthEl) {
    const scores = _vehVehicles.map(v => {
      let score = 100;
      [v.insurance,v.seyrusefer,v.muayene,v.gkry,v.rumSigorta,v.bIzni].forEach(d => {
        if (!d) { score -= 5; return; }
        const diff = Math.floor((new Date(d).getTime() - todayMs) / 86400000);
        if (diff < 0) score -= 20; else if (diff <= 30) score -= 10;
      });
      return { plate: v.plate, score: Math.max(0, score) };
    }).sort((a,b) => a.score - b.score);
    healthEl.innerHTML = scores.map(s => {
      const color = s.score>=70?'var(--hr-success)':s.score>=40?'var(--hr-warning)':'var(--hr-danger)';
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;min-width:80px">${s.plate}</span>
        <div style="flex:1;background:var(--hr-surface3);border-radius:4px;height:8px;overflow:hidden">
          <div style="width:${s.score}%;height:100%;border-radius:4px;background:${color}"></div>
        </div>
        <span style="font-size:12px;font-weight:600;min-width:36px;text-align:right;color:${color}">${s.score}</span>
      </div>`;
    }).join('') || '<p style="color:var(--hr-text3);font-size:13px">Araç yok.</p>';
  }

  // Hurda adaylar
  const scrapEl = document.getElementById('veh-dash-scrap');
  if (scrapEl) {
    const year = new Date().getFullYear();
    const cands = _vehVehicles.filter(v => v.year && (year - Number(v.year)) >= 15);
    scrapEl.innerHTML = cands.length
      ? cands.map(v => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--hr-border)">
          <span style="font-family:'Syne',sans-serif;font-weight:700">${v.plate}</span>
          <span style="font-size:12px;color:var(--hr-text2)">${v.brand||''} ${v.model||''} · ${v.year}</span>
          <span class="badge badge-danger">${year - Number(v.year)} yıl</span>
        </div>`).join('')
      : '<p style="color:var(--hr-text3);font-size:13px">Hurdaya aday araç yok.</p>';
  }

  // Harcama grafiği
  const chartEl = document.getElementById('veh-dash-chart');
  if (chartEl) {
    const db = _hrInitDb();
    if (db) {
      try {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleString('tr-TR', { month: 'short' }) });
        }
        const snap = await db.collection('vehicle_payments').limit(500).get();
        const payments = snap.docs.map(d => d.data());
        const totals = months.map(mo => ({
          label: mo.label,
          sum: payments.filter(p => { const pd = new Date(p.date); return pd.getFullYear()===mo.y && pd.getMonth()===mo.m; })
                       .reduce((a,p) => a + Number(p.amount||0), 0)
        }));
        const maxSum = Math.max(...totals.map(t => t.sum), 1);
        chartEl.innerHTML = `<div style="overflow-x:auto"><div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:0 4px">
          ${totals.map(t => {
            const h = Math.round((t.sum / maxSum) * 100);
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:40px">
              ${t.sum > 0 ? `<span style="font-size:10px;color:var(--hr-text2);font-weight:600">₺${(t.sum/1000).toFixed(1)}k</span>` : '<span style="font-size:10px"></span>'}
              <div style="width:100%;border-radius:4px 4px 0 0;background:var(--hr-accent);min-height:2px;height:${h}px"></div>
              <span style="font-size:10px;color:var(--hr-text3)">${t.label}</span>
            </div>`;
          }).join('')}
        </div></div>`;
      } catch(e) { chartEl.innerHTML = '<p style="color:var(--hr-text3);font-size:13px">Grafik yüklenemedi.</p>'; }
    }
  }
}

/* ── Takvim ── */
let _vehCalActiveTab = 'dates';

function vehCalTab(tab) {
  _vehCalActiveTab = tab;
  const datesBtn = document.getElementById('veh-cal-tab-dates');
  const procBtn  = document.getElementById('veh-cal-tab-processes');
  const datesWrap = document.getElementById('veh-cal-dates-wrap');
  const procWrap  = document.getElementById('veh-cal-proc-wrap');
  if (!datesBtn || !procBtn) return;
  if (tab === 'dates') {
    datesBtn.style.background = 'var(--hr-accent)'; datesBtn.style.color = '#fff'; datesBtn.className = 'btn btn-sm';
    procBtn.style.background = ''; procBtn.style.color = ''; procBtn.className = 'btn btn-ghost btn-sm';
    datesWrap.style.display = '';
    procWrap.style.display  = 'none';
    vehRenderCalendar();
  } else {
    procBtn.style.background = 'var(--hr-accent)'; procBtn.style.color = '#fff'; procBtn.className = 'btn btn-sm';
    datesBtn.style.background = ''; datesBtn.style.color = ''; datesBtn.className = 'btn btn-ghost btn-sm';
    datesWrap.style.display = 'none';
    procWrap.style.display  = '';
    vehRenderProcessCalendar();
  }
}

function vehCalDayClick(dateStr) {
  if (_vehCalActiveTab === 'processes') {
    vehShowProcCalDayDetail(dateStr);
    return;
  }
  vehOpenStartFromTemplate(null);
  document.getElementById('vst-start').value = dateStr;
}

function vehCalNav(dir) {
  _vehCalMonth += dir;
  if (_vehCalMonth > 11) { _vehCalMonth = 0; _vehCalYear++; }
  if (_vehCalMonth < 0)  { _vehCalMonth = 11; _vehCalYear--; }
  vehRenderCalendar();
}

async function vehRenderCalendar() {
  const titleEl = document.getElementById('veh-cal-title');
  const gridEl  = document.getElementById('veh-cal-grid');
  if (!titleEl || !gridEl) return;

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  titleEl.textContent = `${monthNames[_vehCalMonth]} ${_vehCalYear}`;

  const todayStr = new Date().toISOString().slice(0,10);
  const lastDay  = new Date(_vehCalYear, _vehCalMonth + 1, 0);
  let startDow   = new Date(_vehCalYear, _vehCalMonth, 1).getDay();
  if (startDow === 0) startDow = 7; startDow--;

  const events = {};
  const dateFields = [
    {key:'insurance',label:'Sigorta'},{key:'seyrusefer',label:'Seyrüsefer'},
    {key:'muayene',label:'Muayene'},{key:'gkry',label:'GKRY İzni'},
    {key:'rumSigorta',label:'Rum Sigorta'},{key:'bIzni',label:'B İzni'},
  ];
  _vehVehicles.forEach(v => {
    dateFields.forEach(f => {
      if (!v[f.key]) return;
      // Sadece bu aya ait tarihleri ekle
      const [fy, fm] = v[f.key].split('-').map(Number);
      if (fy !== _vehCalYear || fm !== _vehCalMonth + 1) return;
      if (!events[v[f.key]]) events[v[f.key]] = [];
      events[v[f.key]].push({ label: `${v.plate}: ${f.label}`, type: 'expiry', vehicleId: v.id });
    });
  });

  // Tekil görevler (processId olmayan) — tarih takip takviminde de göster
  const db = _hrInitDb();
  if (db) {
    try {
      const m0 = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-01`;
      const m1 = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`;
      const tSnap = await db.collection('vehicle_tasks')
        .where('due', '>=', m0)
        .where('due', '<=', m1)
        .get();
      tSnap.docs.forEach(d => {
        const t = d.data();
        if (!t.due || t.processId) return; // sadece tekil görevler
        if (!events[t.due]) events[t.due] = [];
        const veh = _vehVehicles.find(x => x.id === t.vehicleId);
        events[t.due].push({ label: `${veh?.plate||'Araç'}: ${t.name}`, type: 'task' });
      });
    } catch(e) {}
  }

  const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  let html = '<div class="cal-grid">';
  html += dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) html += `<div class="cal-cell other-month"><div class="cal-date"></div></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = events[ds] || [];
    const isToday = ds === todayStr;
    html += `<div class="cal-cell${isToday?' today':''}" onclick="vehCalDayClick('${ds}')">
      <div class="cal-date">${isToday ? `<span>${d}</span>` : d}</div>
      ${dayEvents.slice(0,3).map(ev => {
        const bg = ev.type === 'expiry' ? '#e8637a' : '#8b6be8';
        const clickAttr = ev.type === 'expiry' && ev.vehicleId
          ? `onclick="event.stopPropagation();vehOpenDetail('${ev.vehicleId}')"`
          : '';
        return `<span class="cal-event" style="background:${bg}22;color:${bg}" title="${ev.label}" ${clickAttr}>${ev.label}</span>`;
      }).join('')}
      ${dayEvents.length > 3 ? `<div style="font-size:9px;color:var(--hr-text3)">+${dayEvents.length-3} daha</div>` : ''}
    </div>`;
  }

  const rem = (startDow + lastDay.getDate()) % 7;
  if (rem) for (let i = 0; i < 7 - rem; i++) html += `<div class="cal-cell other-month"><div class="cal-date"></div></div>`;

  html += '</div>';
  gridEl.innerHTML = html;
}

async function vehRenderProcessCalendar() {
  const gridEl = document.getElementById('veh-cal-proc-grid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const titleEl = document.getElementById('veh-cal-title');
  if (titleEl) titleEl.textContent = `${monthNames[_vehCalMonth]} ${_vehCalYear}`;

  const todayStr = new Date().toISOString().slice(0,10);
  const lastDay  = new Date(_vehCalYear, _vehCalMonth + 1, 0);
  let startDow   = new Date(_vehCalYear, _vehCalMonth, 1).getDay();
  if (startDow === 0) startDow = 7; startDow--;

  const m0 = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-01`;
  const m1 = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`;

  const events = {};
  const db = _hrInitDb();
  if (db) {
    try {
      const tSnap = await db.collection('vehicle_tasks')
        .where('due', '>=', m0)
        .where('due', '<=', m1)
        .get();
      tSnap.docs.forEach(d => {
        const t = { id: d.id, ...d.data() };
        if (!t.due || !t.processId || t.status === 'tamamlandi') return;
        if (!events[t.due]) events[t.due] = [];
        const veh = _vehVehicles.find(x => x.id === t.vehicleId);
        const isOverdue = t.due < todayStr;
        const isSoon    = !isOverdue && t.due <= addDays(todayStr, 7);
        const bg = isOverdue ? '#e8637a' : (isSoon ? '#f59e0b' : '#5b7fe8');
        events[t.due].push({ label: `${veh?.plate||'Araç'}: ${t.name}`, bg, taskId: t.id, processId: t.processId });
      });
    } catch(e) {}
  }

  const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  let html = '<div class="cal-grid">';
  html += dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) html += `<div class="cal-cell other-month"><div class="cal-date"></div></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${_vehCalYear}-${String(_vehCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = events[ds] || [];
    const isToday = ds === todayStr;
    html += `<div class="cal-cell${isToday?' today':''}" onclick="vehShowProcCalDayDetail('${ds}')">
      <div class="cal-date">${isToday ? `<span>${d}</span>` : d}</div>
      ${dayEvents.slice(0,3).map(ev =>
        `<span class="cal-event" style="background:${ev.bg}22;color:${ev.bg}" title="${ev.label}">${ev.label}</span>`
      ).join('')}
      ${dayEvents.length > 3 ? `<div style="font-size:9px;color:var(--hr-text3)">+${dayEvents.length-3} daha</div>` : ''}
    </div>`;
  }

  const rem = (startDow + lastDay.getDate()) % 7;
  if (rem) for (let i = 0; i < 7 - rem; i++) html += `<div class="cal-cell other-month"><div class="cal-date"></div></div>`;
  html += '</div>';
  gridEl.innerHTML = html;
}

function vehShowProcCalDayDetail(dateStr) {
  if (!dateStr) return;
  const tasks = _vehAllProcTasks.filter(t => t.due === dateStr && t.processId && t.status !== 'tamamlandi');
  if (!tasks.length) return;
  const existing = document.getElementById('veh-proc-day-modal');
  if (existing) existing.remove();
  const todayStr = today();
  const rows = tasks.map(t => {
    const veh = _vehVehicles.find(x => x.id === t.vehicleId);
    const isOverdue = t.due < todayStr;
    const color = isOverdue ? '#e8637a' : '#5b7fe8';
    return `<div style="padding:8px 0;border-bottom:1px solid var(--hr-border)">
      <div style="font-size:13px;font-weight:500;color:var(--hr-text)">${t.name}</div>
      <div style="font-size:11px;color:${color};margin-top:2px">${veh?.plate||''} · ${isOverdue ? '⚠ Gecikmiş' : t.due}</div>
    </div>`;
  }).join('');
  const modal = document.createElement('div');
  modal.id = 'veh-proc-day-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);padding:16px';
  modal.innerHTML = `<div style="background:#fff;border-radius:14px;padding:24px;max-width:380px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,0.15);font-family:'DM Sans',sans-serif">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#1e2342">Süreç Görevleri — ${dateStr}</div>
      <button onclick="document.getElementById('veh-proc-day-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#9da4c8">✕</button>
    </div>
    ${rows}
    <button onclick="document.getElementById('veh-proc-day-modal').remove()" style="margin-top:14px;width:100%;padding:10px;background:#5b7fe8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Kapat</button>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  /* Reset person modal title on close */
  document.getElementById('modal-person')?.addEventListener('click', function(e) {
    if (e.target === this) hrCloseModal('modal-person');
  });
});

/* ============================================================
   ARAÇ — ŞABLONDAN GÖREV BAŞLAT
   ============================================================ */

function vehOpenStartFromTemplate(vehicleId = null) {
  const vehTypes = new Set(['arac-bakim', 'arac-muayene', 'arac-diger']);
  const vehTmpls = hrState.templates.filter(t => vehTypes.has(t.type));
  if (!vehTmpls.length) {
    alert('Henüz araç şablonu oluşturulmadı. Önce Şablonlar sayfasından bir araç şablonu ekleyin.');
    return;
  }

  // Araç dropdown
  const vSel = document.getElementById('vst-vehicle');
  vSel.innerHTML = _vehVehicles.map(v =>
    `<option value="${v.id}">${v.plate}${v.brand ? ' — ' + v.brand + (v.model ? ' ' + v.model : '') : ''}</option>`
  ).join('');
  if (vehicleId) {
    vSel.value = vehicleId;
    vSel.disabled = true;
  } else {
    vSel.disabled = false;
  }

  // Şablon dropdown
  const tSel = document.getElementById('vst-template');
  tSel.innerHTML = '<option value="">— Şablon seçin —</option>' +
    vehTmpls.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  document.getElementById('vst-start').value = today();
  document.getElementById('vst-preview').innerHTML = '';
  hrOpenModal('veh-modal-start-template');
}

function vehPreviewTemplateTask() {
  const tmplId = document.getElementById('vst-template').value;
  const preview = document.getElementById('vst-preview');
  if (!tmplId) { preview.innerHTML = ''; return; }
  const tmpl = hrState.templates.find(t => t.id === tmplId);
  if (!tmpl) { preview.innerHTML = ''; return; }
  preview.innerHTML = `<div style="margin-top:8px;padding:10px;background:var(--hr-surface2);border-radius:var(--hr-radius-sm)">
    <div style="font-size:11px;color:var(--hr-text3);margin-bottom:6px">${tmpl.tasks.length} görev oluşturulacak:</div>
    ${tmpl.tasks.map((t,i) => `<div style="font-size:12px;padding:3px 0;border-bottom:1px solid var(--hr-border)">${i+1}. ${t.name}${t.days ? ` <span style="color:var(--hr-text3)">(+${t.days} gün)</span>` : ''}</div>`).join('')}
  </div>`;
}

async function vehSaveFromTemplate(e) {
  e.preventDefault();
  const tmplId    = document.getElementById('vst-template').value;
  const startDate = document.getElementById('vst-start').value;
  const vehicleId = document.getElementById('vst-vehicle').value;
  const tmpl = hrState.templates.find(t => t.id === tmplId);
  if (!tmpl || !vehicleId || !tmplId) return;
  const db = _hrInitDb();
  try {
    // 1. Süreç dokümanı oluştur
    const procRef = await db.collection('vehicle_processes').add({
      vehicleId,
      templateId: tmplId,
      templateName: tmpl.name,
      startDate,
      status: 'devam',
      createdBy: _currentUserUid || '',
      createdAt: new Date().toISOString(),
    });
    const processId = procRef.id;

    // 2. Her alt görev için vehicle_tasks kaydı
    for (let i = 0; i < tmpl.tasks.length; i++) {
      const t = tmpl.tasks[i];
      await db.collection('vehicle_tasks').add({
        vehicleId,
        processId,
        templateId: tmplId,
        templateName: tmpl.name,
        name: t.name,
        order: i,
        assignees: t.assignees || [],
        due: t.days ? addDays(startDate, t.days) : startDate,
        status: 'bekliyor',
        createdAt: new Date().toISOString(),
      });
    }
    hrCloseModal('veh-modal-start-template');
    if (vehicleId === _vehCurrentVehicleId) vehRenderDetailProcesses();
  } catch(err) {
    alert('Süreç oluşturulamadı: ' + err.message);
  }
}

/* ============================================================
   AYARLAR & KULLANICI YÖNETİMİ
   ============================================================ */

async function renderSettings() {
  const root = document.getElementById('settings-root');
  if (!root) return;
  root.innerHTML = '<p style="color:var(--hr-text3)">Yükleniyor…</p>';
  const db = _hrInitDb();
  if (!db) return;
  let users = [];
  try {
    const snap = await db.collection('users').get();
    users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    _settingsUsers = users; // önbelleğe al
  } catch(e) {
    root.innerHTML = '<p style="color:var(--hr-danger)">Kullanıcılar yüklenemedi: ' + e.message + '</p>';
    return;
  }

  root.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <div class="card-title">Kullanıcı Yönetimi</div>
        <button class="btn btn-primary" onclick="settingsOpenAddUser()">+ Kullanıcı Ekle</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Ad / Email</th><th>Roller</th><th>HR İzinleri</th><th>Fin İzinleri</th><th></th>
          </tr></thead>
          <tbody>
            ${users.map(u => settingsUserRow(u)).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="modal-settings-user" class="modal-backdrop">
      <div class="modal" style="max-width:540px;width:100%">
        <div class="modal-header">
          <div class="modal-title" id="settings-modal-title">Kullanıcı Ekle</div>
          <button class="modal-close" onclick="hrCloseModal('modal-settings-user')">✕</button>
        </div>
        <form onsubmit="settingsSaveUser(event)" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label class="form-label">Email (Google hesabı)</label>
            <input type="email" id="su-email" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Ad Soyad</label>
            <input type="text" id="su-name" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Uygulamalar</label>
            <div style="display:flex;gap:16px;margin-top:4px">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="su-role-hr"> HR
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="su-role-fin"> Finance
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">HR İzinleri</label>
            ${settingsPermRows('hr', ['personnel','processes','templates','calendar','vehicles','export','settings'])}
          </div>
          <div class="form-group">
            <label class="form-label">Fin İzinleri</label>
            ${settingsPermRows('fin', ['entry','history','compare','companies','export','settings'])}
          </div>
          <input type="hidden" id="su-uid">
          <div style="display:flex;gap:8px;padding-top:4px">
            <button type="submit" class="btn btn-primary">Kaydet</button>
            <button type="button" class="btn btn-ghost" onclick="hrCloseModal('modal-settings-user')">İptal</button>
          </div>
        </form>
      </div>
    </div>`;
}

function settingsPermRows(app, modules) {
  const labels = {
    personnel:'Personel', processes:'Süreçler', templates:'Şablonlar',
    calendar:'Takvim', vehicles:'Taşıtlar', export:'Excel/Dışa Aktar',
    settings:'Ayarlar', entry:'Veri Girişi', history:'Geçmiş',
    compare:'Karşılaştırma', companies:'Şirketler'
  };
  return `<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">` +
    modules.map(m => `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:120px;font-size:12px;color:var(--hr-text2)">${labels[m]||m}</span>
      <select id="su-perm-${app}-${m}" style="font-size:12px;padding:3px 8px;border-radius:6px;border:1px solid var(--hr-border);background:var(--hr-surface);color:var(--hr-text)">
        <option value="">— Erişim Yok —</option>
        <option value="view">Görüntüle</option>
        <option value="edit">Düzenle</option>
        <option value="admin">Tam Yetki</option>
      </select>
    </div>`).join('') + `</div>`;
}

function settingsUserRow(u) {
  const roles = (u.roles||[]).join(', ');
  const perms = u.permissions || {};
  const hrPerms = Object.entries(perms).filter(([k])=>k.startsWith('hr.')).map(([k,v])=>`${k.replace('hr.','')}:${v}`).join(', ');
  const finPerms = Object.entries(perms).filter(([k])=>k.startsWith('fin.')).map(([k,v])=>`${k.replace('fin.','')}:${v}`).join(', ');
  return `<tr>
    <td>
      <div style="font-weight:500">${u.name||'—'}</div>
      <div style="font-size:12px;color:var(--hr-text3)">${u.email||u.uid}</div>
    </td>
    <td><span class="badge badge-accent">${roles||'—'}</span></td>
    <td style="font-size:12px;color:var(--hr-text2)">${hrPerms||'—'}</td>
    <td style="font-size:12px;color:var(--hr-text2)">${finPerms||'—'}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-ghost btn-sm" onclick="settingsEditUser('${u.uid}')">Düzenle</button>
      <button class="btn btn-danger btn-sm" onclick="settingsDeleteUser('${u.uid}')">Sil</button>
    </td>
  </tr>`;
}

function settingsOpenAddUser() {
  document.getElementById('settings-modal-title').textContent = 'Kullanıcı Ekle';
  document.getElementById('su-email').value = '';
  document.getElementById('su-name').value = '';
  document.getElementById('su-uid').value = '';
  document.getElementById('su-role-hr').checked = false;
  document.getElementById('su-role-fin').checked = false;
  document.querySelectorAll('[id^="su-perm-"]').forEach(s => s.value = '');
  hrOpenModal('modal-settings-user');
}

async function settingsEditUser(uid) {
  const db = _hrInitDb();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return;
  const u = snap.data();
  document.getElementById('settings-modal-title').textContent = 'Kullanıcıyı Düzenle';
  document.getElementById('su-email').value = u.email || '';
  document.getElementById('su-name').value = u.name || '';
  document.getElementById('su-uid').value = uid;
  document.getElementById('su-role-hr').checked = (u.roles||[]).includes('hr');
  document.getElementById('su-role-fin').checked = (u.roles||[]).includes('fin');
  const perms = u.permissions || {};
  document.querySelectorAll('[id^="su-perm-"]').forEach(s => {
    const key = s.id.replace('su-perm-', '').replace(/-(?=[^-]*$)/, '.');
    s.value = perms[key] || '';
  });
  hrOpenModal('modal-settings-user');
}

async function settingsSaveUser(e) {
  e.preventDefault();
  const db = _hrInitDb();
  const uid = document.getElementById('su-uid').value;
  const email = document.getElementById('su-email').value.trim();
  const name = document.getElementById('su-name').value.trim();
  const roles = [];
  if (document.getElementById('su-role-hr').checked) roles.push('hr');
  if (document.getElementById('su-role-fin').checked) roles.push('fin');
  const permissions = {};
  document.querySelectorAll('[id^="su-perm-"]').forEach(s => {
    if (s.value) {
      const key = s.id.replace('su-perm-', '').replace(/-(?=[^-]*$)/, '.');
      permissions[key] = s.value;
    }
  });
  const data = { email, name, roles, permissions };
  try {
    if (uid) {
      await db.collection('users').doc(uid).update(data);
    } else {
      await db.collection('users').add({ ...data, createdAt: new Date().toISOString() });
    }
    hrCloseModal('modal-settings-user');
    renderSettings();
  } catch(err) {
    alert('Kayıt hatası: ' + err.message);
  }
}

async function settingsDeleteUser(uid) {
  if (!confirm('Bu kullanıcının erişimi kaldırılacak. Emin misiniz?')) return;
  try {
    await _hrInitDb().collection('users').doc(uid).delete();
    renderSettings();
  } catch(err) {
    alert('Silme hatası: ' + err.message);
  }
}
