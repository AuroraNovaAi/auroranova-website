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

/* ---- Persistence ---- */
function hrLoadState() {
  try {
    const raw = localStorage.getItem(HR_STORAGE_KEY);
    if (raw) hrState = JSON.parse(raw);
  } catch(e) {
    console.warn('HR: could not load state', e);
  }
}

function hrSaveState() {
  try {
    localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(hrState));
  } catch(e) {
    console.warn('HR: could not save state', e);
  }
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
  if (page === 'calendar') { initCalendar(); renderCalendar(); }
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

  const person = {
    id,
    name: document.getElementById('p-name').value.trim(),
    position: document.getElementById('p-position').value.trim(),
    nationality: document.getElementById('p-nationality').value,
    email: document.getElementById('p-email').value.trim(),
    startDate: document.getElementById('p-startdate').value,
    permitExpiry: document.getElementById('p-permit').value,
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
  document.getElementById('p-status').value = person.status || 'active';
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
      <th>Başlangıç</th><th>İzin Bitiş</th><th>Durum</th><th></th>
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
      <td>${p.permitExpiry || '-'}</td>
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
  const task = proc.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  task.doneAt = task.done ? new Date().toISOString() : null;
  hrSaveState();
  renderProcesses();
  renderDashboard();
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
    if (natFilter) {
      const person = hrState.personnel.find(p => p.id === proc.personId);
      if (!person || person.nationality !== natFilter) return;
    }
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
          soon: isSoon
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
        `<span class="cal-event ${ev.cls}" title="${ev.name}">${ev.overdue ? '⚠ ' : (ev.soon ? '⏰ ' : '')}${ev.name}</span>`
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
   DASHBOARD
   ============================================================ */

function renderDashboard() {
  const total   = hrState.personnel.length;
  const active  = hrState.personnel.filter(p => p.status === 'active').length;
  const procs   = hrState.processes.length;

  const todayStr = today();
  const in7 = addDays(todayStr, 7);

  // Compute pending tasks across all processes
  const allPending = [];
  hrState.processes.forEach(proc => {
    proc.tasks.filter(t => !t.done && t.dueDate).forEach(t => {
      allPending.push({ procName: proc.personName, taskName: t.name, dueDate: t.dueDate,
        overdue: t.dueDate < todayStr,
        soon: t.dueDate >= todayStr && t.dueDate <= in7 });
    });
  });
  allPending.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    return a.dueDate > b.dueDate ? 1 : -1;
  });
  const overdueCount = allPending.filter(t => t.overdue).length;
  const soonCount = allPending.filter(t => t.soon).length;

  const statsEl = document.getElementById('dash-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Toplam Personel</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${active}</div>
        <div class="stat-label">Aktif Personel</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📂</div>
        <div class="stat-value">${procs}</div>
        <div class="stat-label">Açık Süreç</div>
      </div>
      <div class="stat-card ${overdueCount > 0 ? 'stat-card-danger' : ''}">
        <div class="stat-icon">⚠</div>
        <div class="stat-value" style="${overdueCount > 0 ? 'color:#e8637a' : ''}">${overdueCount}</div>
        <div class="stat-label">Geciken Görev</div>
      </div>
      <div class="stat-card ${soonCount > 0 ? 'stat-card-warning' : ''}">
        <div class="stat-icon">⏰</div>
        <div class="stat-value" style="${soonCount > 0 ? 'color:#e8a24a' : ''}">${soonCount}</div>
        <div class="stat-label">7 Günde Bitiyor</div>
      </div>`;
  }

  /* Recent personnel */
  const recentEl = document.getElementById('dash-recent-personnel');
  if (recentEl) {
    const recent = [...hrState.personnel].slice(-5).reverse();
    if (!recent.length) {
      recentEl.innerHTML = '<li><span class="text-muted text-sm">Henüz personel yok.</span></li>';
    } else {
      recentEl.innerHTML = recent.map(p => {
        const av = avatarColor(p.name);
        return `<li>
          <div class="flex items-center gap-2">
            <div class="avatar avatar-sm" style="background:${av}">${initials(p.name)}</div>
            <div>
              <div class="rl-name">${p.name}</div>
              <div class="rl-meta">${p.position || '-'}</div>
            </div>
          </div>
          <span class="badge ${p.status==='active'?'badge-success':'badge-neutral'}">${p.status==='active'?'Aktif':'Pasif'}</span>
        </li>`;
      }).join('');
    }
  }

  /* Upcoming + Overdue tasks */
  const upcomingEl = document.getElementById('dash-upcoming');
  if (upcomingEl) {
    const top8 = allPending.slice(0, 8);
    if (!top8.length) {
      upcomingEl.innerHTML = '<li><span class="text-muted text-sm">Bekleyen görev yok.</span></li>';
    } else {
      upcomingEl.innerHTML = top8.map(u => {
        const color = u.overdue ? '#e8637a' : (u.soon ? '#e8a24a' : '#9da4c8');
        const icon = u.overdue ? '⚠' : (u.soon ? '⏰' : '📅');
        return `<li>
          <div>
            <div class="rl-name">${u.taskName}</div>
            <div class="rl-meta">${u.procName}</div>
          </div>
          <span style="font-size:11px;color:${color};font-weight:${u.overdue?'600':'400'};white-space:nowrap">${icon} ${u.dueDate}</span>
        </li>`;
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
  { header: 'Ad Soyad',              key: 'name'       },
  { header: 'Uyruk',                 key: 'nationality' }, // TC | KKTC | 3. Ülke
  { header: 'TC/Pasaport No',        key: 'idNo'       },
  { header: 'Pozisyon',              key: 'position'   },
  { header: 'Bölüm',                 key: 'department' },
  { header: 'İşe Başlama Tarihi',    key: 'startDate'  }, // YYYY-AA-GG
  { header: 'E-posta',               key: 'email'      },
  { header: 'Telefon',               key: 'phone'      },
  { header: 'Not',                   key: 'note'       },
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

        // Tarih formatı kontrolü (YYYY-MM-DD)
        if (r.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.startDate)) {
          // Excel serial date desteği
          const num = parseFloat(r.startDate);
          if (!isNaN(num)) {
            const d = new Date(Math.round((num - 25569) * 86400 * 1000));
            r.startDate = d.toISOString().slice(0,10);
          } else {
            r.startDate = '';
          }
        }

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
      <th>Ad Soyad</th><th>Uyruk</th><th>TC/Pasaport</th>
      <th>Pozisyon</th><th>Bölüm</th><th>İşe Başlama</th>
    </tr></thead>
    <tbody>
      ${preview.map(r => `<tr>
        <td>${r.name}</td>
        <td>${r.nationality}</td>
        <td>${r.idNo || '—'}</td>
        <td>${r.position || '—'}</td>
        <td>${r.department || '—'}</td>
        <td>${r.startDate || '—'}</td>
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
      name:       r.name,
      nationality:r.nationality,
      idNo:       r.idNo       || '',
      position:   r.position   || '',
      department: r.department || '',
      startDate:  r.startDate  || '',
      email:      r.email      || '',
      phone:      r.phone      || '',
      note:       r.note       || '',
      status:     'active',
      createdAt:  new Date().toISOString(),
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
  const examples = [
    ['Ahmet Yılmaz', 'TC',       '12345678901', 'Operatör',    'Üretim',  '2024-01-15', 'ahmet@firma.com', '+90 532 000 00 01', ''],
    ['Mehmet Demir', 'KKTC',     'K12345678',   'Teknisyen',   'Bakım',   '2024-03-01', 'mehmet@firma.com','',                  ''],
    ['Ali Veli',     '3. Ülke',  'P98765432',   'Mühendis',    'Ar-Ge',   '2025-06-01', '',                '',                  'Vize durumu takipte'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  ws['!cols'] = [
    {wch:22},{wch:12},{wch:18},{wch:18},{wch:16},
    {wch:20},{wch:24},{wch:20},{wch:24}
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Personel');

  // Talimatlar için ikinci sheet
  const infoData = [
    ['ALAN', 'AÇIKLAMA', 'ÖRNEK'],
    ['Ad Soyad', 'Zorunlu', 'Ahmet Yılmaz'],
    ['Uyruk', 'TC | KKTC | 3. Ülke (büyük/küçük harf fark etmez)', 'TC'],
    ['TC/Pasaport No', 'Varsa girilmesi önerilir — duplicate kontrolü için', '12345678901'],
    ['Pozisyon', 'Opsiyonel', 'Operatör'],
    ['Bölüm', 'Opsiyonel', 'Üretim'],
    ['İşe Başlama Tarihi', 'YYYY-AA-GG formatında', '2025-01-15'],
    ['E-posta', 'Opsiyonel', 'ad@firma.com'],
    ['Telefon', 'Opsiyonel', '+90 532 000 00 01'],
    ['Not', 'Opsiyonel serbest metin', ''],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(infoData);
  ws2['!cols'] = [{wch:24},{wch:48},{wch:24}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Talimatlar');

  XLSX.writeFile(wb, 'AuroraNova_HR_Personel_Sablon.xlsx');
}

// ── Initialise ──
hrLoadState();
renderDashboard();

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  /* Reset person modal title on close */
  document.getElementById('modal-person')?.addEventListener('click', function(e) {
    if (e.target === this) hrCloseModal('modal-person');
  });
});
