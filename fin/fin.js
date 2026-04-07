/* AuroraNova Finance — fin.js
   All globals prefixed to avoid collision with main site scripts
   ---------------------------------------------------------------- */

const MO = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MO_F = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const FIELDS = ['baslik','baza','cekyat','metal','oturma','sandalye','mobilya','silte',
  'alis_iade','faaliyet','finansman','hmm_alim','satis_iade','insaat',
  'personel','vergi','hmm_sarf','dos_maas','mob_maas','slt_maas'];
const PALETTES = [
  {bg:'#EFF6FF',text:'#1D4ED8'},{bg:'#F0FDF4',text:'#15803D'},
  {bg:'#FFF7ED',text:'#C2410C'},{bg:'#FDF4FF',text:'#7E22CE'},
  {bg:'#FFFBEB',text:'#B45309'},{bg:'#FFF1F2',text:'#BE123C'}
];

let finS = { companies:{}, data:{}, activeCo:null };

// ── Firebase Firestore sync ──
// FIN_FB_CONFIG index.html'de tanımlanıyor
let _finDb = null;
function _finInitDb() {
  if (_finDb) return _finDb;
  try {
    const app = firebase.apps.find(a => a.name === 'fin') ||
                firebase.initializeApp(FIN_FB_CONFIG, 'fin');
    _finDb = firebase.firestore(app);
  } catch(e) { console.warn('Fin: Firebase init failed', e); }
  return _finDb;
}

function _finSyncBadge(msg, color) {
  const el = document.getElementById('fin-sync-badge');
  if (el) { el.textContent = msg; el.style.color = color || 'var(--fin-text3)'; }
}

let _finSaveTimer = null;
function save() {
  clearTimeout(_finSaveTimer);
  _finSaveTimer = setTimeout(async () => {
    const db = _finInitDb();
    if (!db) { _finSyncBadge('⚠ Bağlantı hatası', '#f87171'); return; }
    _finSyncBadge('Kaydediliyor…');
    try {
      await db.collection('fin_data').doc('main').set({
        companies: finS.companies,
        data: finS.data,
        updatedAt: new Date().toISOString()
      });
      _finSyncBadge('✓ Kaydedildi', '#6ee7b7');
      setTimeout(() => _finSyncBadge(''), 2500);
    } catch(e) {
      console.error('Fin: Firestore save failed', e);
      _finSyncBadge('⚠ Kayıt hatası', '#f87171');
    }
  }, 1500);
}

async function load() {
  const db = _finInitDb();
  if (!db) { _finSyncBadge('⚠ Bağlantı hatası', '#f87171'); return; }
  _finSyncBadge('Yükleniyor…');
  try {
    const doc = await db.collection('fin_data').doc('main').get();
    if (doc.exists) {
      const d = doc.data();
      finS.companies = d.companies || {};
      finS.data      = d.data      || {};
    }
    _finSyncBadge('✓ Senkronize', '#6ee7b7');
    setTimeout(() => _finSyncBadge(''), 2500);
  } catch(e) {
    console.error('Fin: Firestore load failed', e);
    _finSyncBadge('⚠ Yükleme hatası', '#f87171');
  }
}

function fmt(n, dec=0) {
  if (n===null||n===undefined||n===''||isNaN(+n)) return '—';
  return (+n).toLocaleString('tr-TR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
}
function fmtM(n) { return isNaN(+n) ? '—' : (+n).toFixed(2)+'%'; }
function curr(coId) {
  const c = finS.companies[coId||finS.activeCo];
  if (!c) return '₺';
  return c.currency==='USD'?'$':c.currency==='EUR'?'€':'₺';
}
function dkey(y,m) { return `${y}-${String(m).padStart(2,'0')}`; }

function toast(msg, type='success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(()=>el.classList.remove('show'), 2800);
}

const PAGES = ['dashboard','entry','history','compare','companies'];
function finGo(p) {
  document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  document.getElementById('p-'+p)?.classList.add('active');
  if (PAGES.indexOf(p) >= 0) document.querySelectorAll('.nav-item')[PAGES.indexOf(p)]?.classList.add('active');
  if (p==='dashboard') renderDash();
  if (p==='history') renderHistory();
  if (p==='entry') { syncEntryCo(); renderCal(); }
  if (p==='companies') renderCoList();
  if (p==='settings') renderFinSettings();
}

function finCalc(d) {
  const v = k => parseFloat(d[k])||0;
  const B=v('baslik'), Bz=v('baza'), Ck=v('cekyat'), Me=v('metal'),
        Ot=v('oturma'), Sa=v('sandalye'), Mo=v('mobilya'), Si=v('silte');
  const N=v('faaliyet'), O=v('finansman'), P=v('hmm_alim'), Q=v('satis_iade'),
        R=v('insaat'), S2=v('personel'), T=v('vergi'), U=v('hmm_sarf');
  const V=v('dos_maas'), W=v('mob_maas'), X=v('slt_maas');

  const H = B+Bz+Ck+Me+Ot+Sa;
  const K = Math.round((H+Mo+Si)*100)/100;
  const L = v('alis_iade');
  const M = Math.round((K+L)*100)/100;

  const AB = U+S2;
  const AC = N+Q+S2+U;
  const AD = N+P+Q+S2;
  const AE = N+P+Q+S2+T;

  const AF = M ? ((M-AC)/M)*100 : 0;
  const AG = M ? ((M-AD)/M)*100 : 0;
  const AH = K ? (U/K)*100 : 0;
  const AI = AC ? (U/AC)*100 : 0;
  const AJ = M ? (S2/M)*100 : 0;
  const AK = AC ? (S2/AC)*100 : 0;
  const AL = K ? (N/K)*100 : 0;
  const AM = AC ? (N/AC)*100 : 0;

  const AN = M-AC;
  const AO = K;
  const AP = Math.round((K-Q+L)*100)/100; // Net Satışlar
  const AQ = AP-AB;                        // Brüt K/Z = Net Satışlar - SMM
  const AS = AQ-N;                         // Faaliyet K/Z = Brüt K/Z - Faaliyet Giderleri
  const AT = AS-O;                         // Dönem K/Z = Faaliyet K/Z - Finansman Giderleri

  const AQ_pct = AP ? (AQ/AP)*100 : 0;    // Brüt K/Z oranı (Net Satışlara göre)
  const AS_pct = AP ? (AS/AP)*100 : 0;    // Faaliyet K/Z oranı
  const AT_pct = AP ? (AT/AP)*100 : 0;    // Dönem K/Z oranı

  const Y = H ? V/H : 0;
  const Z = Mo ? W/Mo : 0;
  const AA = Si ? X/Si : 0;

  return {H,K,L,M,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK,AL,AM,AN,AO,AP,AQ,AS,AT,
    AQ_pct, AS_pct, AT_pct, Y,Z,AA,
    personel:S2, hmm_sarf:U, finansman:O, faaliyet:N};
}

function toggleAddForm() {
  const f = document.getElementById('add-form');
  f.style.display = f.style.display==='none' ? 'block' : 'none';
}
function saveCo() {
  const name = document.getElementById('nc-name').value.trim();
  if (!name) { toast('Şirket adı zorunludur.','error'); return; }
  const id = 'c'+Date.now();
  const idx = Object.keys(finS.companies).length % PALETTES.length;
  const pal = PALETTES[idx];
  const initials = name.split(' ').map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2);
  finS.companies[id] = {
    id, name, initials,
    sector: document.getElementById('nc-sector').value,
    contact: document.getElementById('nc-contact').value.trim(),
    currency: document.getElementById('nc-curr').value,
    bg: pal.bg, fg: pal.text,
    created: Date.now()
  };
  save();
  document.getElementById('nc-name').value='';
  document.getElementById('nc-contact').value='';
  document.getElementById('add-form').style.display='none';
  renderCoList(); updateSelects();
  selectCo(id);
  toast(`"${name}" eklendi.`);
}
function delCo(id) {
  const name = finS.companies[id]?.name;
  if (!confirm(`"${name}" şirketini ve tüm verilerini silmek istediğinize emin misiniz?`)) return;
  delete finS.companies[id];
  delete finS.data[id];
  if (finS.activeCo===id) { finS.activeCo=null; updateActivePill(); }
  save(); renderCoList(); updateSelects();
  toast(`"${name}" silindi.`,'error');
}
function renderCoList() {
  const el = document.getElementById('co-list');
  const list = Object.values(finS.companies);
  if (!list.length) {
    el.innerHTML = `<div style="grid-column:1/-1"><div class="empty">
      <div class="empty-icon">🏢</div><h3>Henüz Şirket yok</h3>
      <p>Üstteki "Yeni Şirket" butonundan ekleyin.</p></div></div>`;
    return;
  }
  el.innerHTML = list.map(c => {
    const n = Object.keys(finS.data[c.id]||{}).length;
    const isActive = finS.activeCo===c.id;
    return `<div class="company-card${isActive?' selected':''}" onclick="selectCo('${c.id}')">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div class="avatar" style="background:${c.bg};color:${c.fg}">${c.initials}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div>
          <div style="font-size:12px;color:var(--fin-text3);margin-top:2px">${c.sector||'Sektör belirtilmemiş'}</div>
        </div>
        ${isActive?'<span class="badge badge-blue">Aktif</span>':''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--fin-text3);border-top:1px solid var(--fin-border);padding-top:12px">
        <span>${n} aylık kayıt · ${c.currency}</span>
        ${c.contact?`<span>${c.contact}</span>`:''}
      </div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-sm" style="flex:1" onclick="event.stopPropagation();selectCoAndEntry('${c.id}')">Veri Gir</button>
        ${(typeof canAdmin === 'function' && canAdmin('fin.companies')) ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();delCo('${c.id}')">Sil</button>` : ''}
      </div>
    </div>`;
  }).join('');
}
function selectCoAndEntry(id) { selectCo(id); finGo('entry'); }
function updateSelects() {
  const opts = '<option value="">Şirket seçin...</option>' +
    Object.values(finS.companies).map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('company-select').innerHTML = opts;
  document.getElementById('entry-co').innerHTML = opts;
  if (finS.activeCo) {
    document.getElementById('company-select').value = finS.activeCo;
    document.getElementById('entry-co').value = finS.activeCo;
  }
}
function updateActivePill() {
  const pill = document.getElementById('company-pill');
  const co = finS.companies[finS.activeCo];
  if (co) { pill.textContent=co.name; pill.style.display='inline-block'; }
  else pill.style.display='none';
}
function selectCo(id) {
  finS.activeCo = id||null;
  updateSelects(); updateActivePill();
  renderDash(); renderCoList();
}
function switchEntryCo(id) {
  selectCo(id); syncEntryCo(); renderCal();
}
function syncEntryCo() {
  const hasC = finS.activeCo && finS.companies[finS.activeCo];
  document.getElementById('entry-no-co').style.display = hasC?'none':'block';
  document.getElementById('entry-wrap').style.display = hasC?'block':'none';
  if (document.getElementById('entry-co')) {
    document.getElementById('entry-co').value = finS.activeCo||'';
  }
}

function renderCal() {
  if (!finS.activeCo) return;
  const y = document.getElementById('ey').value;
  const selM = document.getElementById('em').value;
  const cData = finS.data[finS.activeCo]||{};
  let html = '';
  for (let m=1;m<=12;m++) {
    const has = !!cData[dkey(y,m)];
    const sel = String(selM)===String(m);
    html += `<div class="cal-cell${has?' has-data':''}${sel?' selected':''}"
      onclick="pickMonth(${m})">${MO[m-1]}</div>`;
  }
  document.getElementById('cal').innerHTML = html;
}

function pickMonth(m) {
  document.getElementById('em').value = m;
  loadForm(); renderCal();
}

function loadForm() {
  const m = document.getElementById('em').value;
  const y = document.getElementById('ey').value;
  if (!m || !finS.activeCo) {
    document.getElementById('entry-form').style.display='none'; return;
  }
  document.getElementById('entry-form').style.display='block';
  document.getElementById('form-title').textContent = `${MO_F[m-1]} ${y}`;
  const key = dkey(y,m);
  const ex = (finS.data[finS.activeCo]||{})[key];
  document.getElementById('edit-ind').innerHTML = ex ?
    '<span class="badge badge-amber">Düzenleme modu — kayıtlı veri mevcut</span>' : '';
  document.getElementById('del-btn').style.display = ex ? 'inline-flex' : 'none';
  FIELDS.forEach(f => {
    const el = document.getElementById('f_'+f);
    if (el) el.value = ex ? (ex[f]||'') : '';
  });
  liveCalc();
}

function liveCalc() {
  const d = {};
  FIELDS.forEach(f => { const el=document.getElementById('f_'+f); d[f]=el?parseFloat(el.value)||0:0; });
  const c = finCalc(d);
  const cr = curr();
  const pos = c.AT>=0;
  document.getElementById('live-panel').innerHTML = `
    <div class="g2" style="gap:10px;margin-bottom:14px">
      <div class="kpi" style="--kpi-color:var(--fin-blue)">
        <div class="kpi-label">Gelirler Toplamı</div>
        <div class="kpi-value" style="font-size:17px">${cr}${fmt(c.M)}</div>
      </div>
      <div class="kpi" style="--kpi-color:${pos?'var(--fin-green)':'var(--fin-red)'}">
        <div class="kpi-label">Dönem Kar/Zarar</div>
        <div class="kpi-value ${pos?'pos':'neg'}" style="font-size:17px">${cr}${fmt(c.AT)}</div>
      </div>
      <div class="kpi" style="--kpi-color:var(--fin-amber)">
        <div class="kpi-label">Giderler (Sarf)</div>
        <div class="kpi-value" style="font-size:17px">${cr}${fmt(c.AC)}</div>
      </div>
      <div class="kpi" style="--kpi-color:${c.AF>=0?'var(--fin-green)':'var(--fin-red)'}">
        <div class="kpi-label">Kar Oranı (Sarf)</div>
        <div class="kpi-value ${c.AF>=0?'pos':'neg'}" style="font-size:17px">${fmtM(c.AF)}</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-radius:var(--fin-r);padding:12px;border:1px solid var(--fin-border)">
      ${[
        ['Net Satışlar', cr+fmt(c.AP)],
        ['Brüt Satış K/Z', cr+fmt(c.AQ)],
        ['Faaliyet K/Z', cr+fmt(c.AS)],
        ['Hmm/Gelir %', fmtM(c.AH)],
        ['Pers/Gelir %', fmtM(c.AJ)],
        ['Faal/Gelir %', fmtM(c.AL)],
      ].map(([l,v])=>`<div class="calc-row"><span class="calc-label">${l}</span>
        <span class="calc-val">${v}</span></div>`).join('')}
    </div>`;
}

function saveEntry() {
  const m = document.getElementById('em').value;
  const y = document.getElementById('ey').value;
  if (!m||!finS.activeCo) { toast('Dönem seçin.','error'); return; }
  const d = {};
  FIELDS.forEach(f => { const el=document.getElementById('f_'+f); d[f]=parseFloat(el?.value)||0; });
  if (!finS.data[finS.activeCo]) finS.data[finS.activeCo]={};
  finS.data[finS.activeCo][dkey(y,m)] = d;
  save(); renderCal();
  document.getElementById('edit-ind').innerHTML = '<span class="badge badge-amber">Düzenleme modu — kayıtlı veri mevcut</span>';
  document.getElementById('del-btn').style.display='inline-flex';
  toast(`${MO_F[m-1]} ${y} kaydedildi ✓`);
}

function delEntry() {
  const m = document.getElementById('em').value;
  const y = document.getElementById('ey').value;
  if (!confirm('Bu ayın verisini silmek istiyor musunuz?')) return;
  if (finS.data[finS.activeCo]) delete finS.data[finS.activeCo][dkey(y,m)];
  save(); clearForm(); renderCal();
  document.getElementById('del-btn').style.display='none';
  document.getElementById('edit-ind').innerHTML='';
  toast('Veri silindi.','error');
}

function clearForm() {
  document.querySelectorAll('#entry-form input[type=number]').forEach(el=>el.value='');
  liveCalc();
}

function renderDash() {
  const hasCo = finS.activeCo && finS.companies[finS.activeCo];
  document.getElementById('dash-empty').style.display = hasCo?'none':'block';
  document.getElementById('dash-main').style.display = hasCo?'block':'none';
  if (!hasCo) return;

  const co = finS.companies[finS.activeCo];
  const sy = +document.getElementById('dash-sy').value;
  const sm = +document.getElementById('dash-sm').value;
  const ey = +document.getElementById('dash-ey').value;
  const em = +document.getElementById('dash-em').value;
  const cr = curr();
  document.getElementById('dash-title').textContent = co.name;

  const cData = finS.data[finS.activeCo]||{};
  const months = [];
  for (let y=sy; y<=ey; y++) {
    const mStart = (y===sy) ? sm : 1;
    const mEnd   = (y===ey) ? em : 12;
    for (let m=mStart; m<=mEnd; m++) {
      const k = dkey(y,m);
      if (cData[k]) months.push({m, y, raw:cData[k], c:finCalc(cData[k])});
    }
  }

  const periodLabel = (sy===ey && sm===1 && em===12)
    ? `${sy}`
    : `${MO[sm-1]} ${sy} – ${MO[em-1]} ${ey}`;
  document.getElementById('dash-desc').textContent = months.length
    ? `${periodLabel} — ${months.length} aylık veri mevcut`
    : `${periodLabel} — veri yok`;

  if (!months.length) {
    document.getElementById('kpi-row').innerHTML = `<div style="grid-column:1/-1">
      <div class="empty"><h3>Bu yıl için veri yok</h3>
      <p>Veri Girişi bölümünden aylık verileri ekleyin.</p>
      <button class="btn btn-primary btn-sm" onclick="finGo('entry')">Veri Gir</button></div></div>`;
    document.getElementById('dash-bar').innerHTML='';
    document.getElementById('dash-ratio').innerHTML='';
    document.getElementById('sum-head').innerHTML='';
    document.getElementById('sum-body').innerHTML='';
    return;
  }

  const tot = months.reduce((a,{c})=>({
    M:a.M+c.M, AC:a.AC+c.AC, AT:a.AT+c.AT, AP:a.AP+c.AP,
    personel:a.personel+c.personel
  }),{M:0,AC:0,AT:0,AP:0,personel:0});
  const periodAF = tot.AP ? (tot.AT / tot.AP) * 100 : 0;

  const kpis = [
    {l:'Gelirler Toplamı', v:`${cr}${fmt(tot.M)}`, color:'var(--fin-blue)', sub:`${months.length} ay`},
    {l:'Net Satışlar', v:`${cr}${fmt(tot.AP)}`, color:'var(--fin-purple)'},
    {l:'Giderler (Sarf)', v:`${cr}${fmt(tot.AC)}`, color:'var(--fin-amber)'},
    {l:'Dönem Kar/Zarar', v:`${cr}${fmt(tot.AT)}`, color:tot.AT>=0?'var(--fin-green)':'var(--fin-red)'},
    {l:'Dönem Kar Oranı', v:fmtM(periodAF), color:periodAF>=0?'var(--fin-green)':'var(--fin-red)'},
  ];
  document.getElementById('kpi-row').innerHTML = kpis.map(k=>`
    <div class="kpi" style="--kpi-color:${k.color}">
      <div class="kpi-label">${k.l}</div>
      <div class="kpi-value" style="color:${k.color};font-size:19px">${k.v}</div>
      ${k.sub?`<div class="kpi-sub">${k.sub}</div>`:''}
    </div>`).join('');

  const multiYear = sy !== ey;
  const mLabel = (m,y) => multiYear ? `${MO[m-1]} ${String(y).slice(2)}` : MO[m-1];

  const maxV = Math.max(...months.map(({c})=>Math.max(c.M,c.AC)),1);
  document.getElementById('dash-bar').innerHTML = months.map(({m,y,c})=>`
    <div class="chart-row">
      <div class="chart-label">${mLabel(m,y)}</div>
      <div class="chart-bars">
        <div class="chart-track"><div class="chart-fill" style="width:${Math.round(c.M/maxV*100)}%;background:var(--fin-blue)"></div></div>
        <div class="chart-track"><div class="chart-fill" style="width:${Math.round(c.AC/maxV*100)}%;background:var(--fin-amber)"></div></div>
      </div>
      <div class="chart-val" style="color:${c.AT>=0?'var(--fin-green)':'var(--fin-red)'}">${cr}${fmt(c.AT)}</div>
    </div>`).join('') + `
    <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--fin-text3)">
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--fin-blue);border-radius:2px;margin-right:4px;vertical-align:middle"></span>Gelir</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--fin-amber);border-radius:2px;margin-right:4px;vertical-align:middle"></span>Gider (Sarf)</span>
    </div>`;

  document.getElementById('dash-ratio').innerHTML = months.map(({m,y,c})=>`
    <div class="chart-row">
      <div class="chart-label">${mLabel(m,y)}</div>
      <div class="chart-bars">
        <div class="chart-track"><div class="chart-fill"
          style="width:${Math.min(Math.abs(c.AT_pct),100)}%;background:${c.AT_pct>=0?'var(--fin-green)':'var(--fin-red)'}"></div></div>
      </div>
      <div class="chart-val" style="color:${c.AT_pct>=0?'var(--fin-green)':'var(--fin-red)'}">${fmtM(c.AT_pct)}</div>
    </div>`).join('') + `
    <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--fin-text3)">
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--fin-green);border-radius:2px;margin-right:4px;vertical-align:middle"></span>Dönem K/Z %</span>
    </div>`;

  document.getElementById('sum-head').innerHTML =
    '<th>Kalem</th>' +
    months.map(({m,y})=>`<th style="text-align:right">${mLabel(m,y)}</th>`).join('') +
    '<th style="text-align:right">Toplam / Ort.</th>';

  const rows = [
    {l:'Net Satışlar',         fn:c=>c.AP,        bold:true},
    {l:'Satılan Malın Maliyeti',fn:c=>c.AB,       bold:false},
    {l:'Brüt K/Z',             fn:c=>c.AQ,        bold:true,  signed:true},
    {l:'Brüt K/Z %',           fn:c=>c.AQ_pct,    bold:false, pct:true, signed:true, numFn:c=>c.AQ, denFn:c=>c.AP},
    {l:'Faaliyet Giderleri',   fn:c=>c.faaliyet,  bold:false},
    {l:'Faaliyet K/Z',         fn:c=>c.AS,        bold:true,  signed:true},
    {l:'Faaliyet K/Z %',       fn:c=>c.AS_pct,    bold:false, pct:true, signed:true, numFn:c=>c.AS, denFn:c=>c.AP},
    {l:'Finansman Giderleri',  fn:c=>c.finansman, bold:false},
    {l:'Dönem K/Z',            fn:c=>c.AT,        bold:true,  signed:true},
    {l:'Dönem K/Z %',          fn:c=>c.AT_pct,    bold:false, pct:true, signed:true, numFn:c=>c.AT, denFn:c=>c.AP},
  ];

  document.getElementById('sum-body').innerHTML = rows.map(row=>{
    const vals = months.map(({c})=>row.fn(c));
    const total = vals.reduce((a,v)=>a+v,0);
    const cells = vals.map(v=>{
      if (row.pct && row.signed) return `<td class="${v>=0?'pos':'neg'}">${fmtM(v)}</td>`;
      if (row.pct) return `<td class="num">${fmtM(v)}</td>`;
      if (row.signed) return `<td class="${v>=0?'pos':'neg'}">${cr}${fmt(v)}</td>`;
      return `<td class="num">${cr}${fmt(v)}</td>`;
    }).join('');
    let totVal;
    if (row.pct && row.numFn && row.denFn) {
      const totNum = months.reduce((a,{c})=>a+row.numFn(c),0);
      const totDen = months.reduce((a,{c})=>a+row.denFn(c),0);
      totVal = totDen ? (totNum/totDen)*100 : 0;
    } else {
      totVal = row.pct ? total/months.length : total;
    }
    const totCell = (row.pct && row.signed)
      ? `<td class="${totVal>=0?'pos':'neg'}" style="font-weight:600">${fmtM(totVal)}</td>`
      : row.pct
        ? `<td class="num" style="font-weight:600">${fmtM(totVal)}</td>`
        : row.signed
          ? `<td class="${totVal>=0?'pos':'neg'}" style="font-weight:600">${cr}${fmt(totVal)}</td>`
          : `<td class="num" style="font-weight:600">${cr}${fmt(totVal)}</td>`;
    return `<tr><td style="font-weight:${row.bold?600:400}">${row.l}</td>${cells}${totCell}</tr>`;
  }).join('');
}

function renderHistory() {
  if (!finS.activeCo) {
    document.getElementById('hist-card').innerHTML='<div class="empty"><p>Şirket seçin.</p></div>';
    return;
  }
  const y = document.getElementById('hist-year').value;
  const cr = curr();
  const cData = finS.data[finS.activeCo]||{};
  const months = [];
  for (let m=1;m<=12;m++) {
    const k = dkey(y,m);
    if (cData[k]) months.push({m,k,raw:cData[k],c:finCalc(cData[k])});
  }
  if (!months.length) {
    document.getElementById('hist-card').innerHTML = `<div class="empty">
      <h3>${y} için kayıt yok</h3>
      <p>Veri Girişi bölümünden aylık verileri ekleyin.</p>
      <button class="btn btn-primary btn-sm" onclick="finGo('entry')">Veri Gir</button></div>`;
    return;
  }
  document.getElementById('hist-card').innerHTML = `
    <div class="table-wrap">
    <table>
      <thead><tr>
        <th>Dönem</th>
        <th style="text-align:right">Gelirler</th>
        <th style="text-align:right">Giderler (Sarf)</th>
        <th style="text-align:right">Giderler (Alım)</th>
        <th style="text-align:right">Kar/Zarar</th>
        <th style="text-align:right">Dönem K/Z</th>
        <th style="text-align:right">Kar %</th>
        <th style="text-align:right">Net Satış</th>
        <th style="text-align:right">Personel</th>
        <th style="text-align:right">Hmm SARF</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${months.map(({m,k,raw,c})=>`<tr>
          <td style="font-weight:600">${MO_F[m-1]} ${y}</td>
          <td class="num">${cr}${fmt(c.M)}</td>
          <td class="num">${cr}${fmt(c.AC)}</td>
          <td class="num">${cr}${fmt(c.AD)}</td>
          <td class="${c.AN>=0?'pos':'neg'}">${cr}${fmt(c.AN)}</td>
          <td class="${c.AT>=0?'pos':'neg'}">${cr}${fmt(c.AT)}</td>
          <td class="${c.AF>=0?'pos':'neg'}">${fmtM(c.AF)}</td>
          <td class="num">${cr}${fmt(c.AP)}</td>
          <td class="num">${cr}${fmt(c.personel)}</td>
          <td class="num">${cr}${fmt(c.hmm_sarf)}</td>
          <td>${(typeof canEdit === 'function' && canEdit('fin.history')) ? `<button class="btn btn-ghost btn-sm" onclick="editEntry(${m},'${y}')">✎ Düzenle</button>` : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}
function editEntry(m,y) {
  finGo('entry');
  document.getElementById('ey').value=y;
  document.getElementById('em').value=m;
  loadForm(); renderCal();
}

function runCompare() {
  if (!finS.activeCo) { toast('Şirket seçin.','error'); return; }
  const c1ys=+document.getElementById('c1ys').value, c1ms=+document.getElementById('c1ms').value;
  const c1ye=+document.getElementById('c1ye').value, c1me=+document.getElementById('c1me').value;
  const c2ys=+document.getElementById('c2ys').value, c2ms=+document.getElementById('c2ms').value;
  const c2ye=+document.getElementById('c2ye').value, c2me=+document.getElementById('c2me').value;
  const cData = finS.data[finS.activeCo]||{};
  const cr = curr();

  function sumP(ys,ms,ye,me) {
    let a={M:0,AC:0,AD:0,AT:0,AN:0,AP:0,AS:0,AQ:0,AB:0,personel:0,hmm_sarf:0,finansman:0,faaliyet:0,AF:0,AH:0,AJ:0,AL:0,n:0};
    for (let y=ys;y<=ye;y++) {
      const mS=(y===ys?ms:1), mE=(y===ye?me:12);
      for (let m=mS;m<=mE;m++) {
        const k=dkey(y,m);
        if (cData[k]) {
          const c=finCalc(cData[k]);
          Object.keys(a).forEach(k2=>{ if(k2!=='n') a[k2]+=c[k2]||0; });
          a.n++;
        }
      }
    }
    if (a.n>0) ['AF','AH','AJ','AL'].forEach(k=>a[k]/=a.n);
    return a;
  }

  const p1 = sumP(c1ys,c1ms,c1ye,c1me);
  const p2 = sumP(c2ys,c2ms,c2ye,c2me);

  const rows = [
    {l:'Net Satışlar',          k:'AP'},
    {l:'Satılan Malın Maliyeti',k:'AB'},
    {l:'Brüt K/Z',              k:'AQ', signed:true},
    {l:'Faaliyet Giderleri',    k:'faaliyet'},
    {l:'Faaliyet K/Z',          k:'AS', signed:true},
    {l:'Finansman Giderleri',   k:'finansman'},
    {l:'Dönem K/Z',             k:'AT', signed:true},
    {l:'Personel Giderleri',    k:'personel'},
    {l:'Hammadde SARF',         k:'hmm_sarf'},
  ];

  const lbl1 = `${MO[c1ms-1]} ${c1ys}${c1ms!==c1me||c1ys!==c1ye?` – ${MO[c1me-1]} ${c1ye}`:''}`;
  const lbl2 = `${MO[c2ms-1]} ${c2ys}${c2ms!==c2me||c2ys!==c2ye?` – ${MO[c2me-1]} ${c2ye}`:''}`;

  document.getElementById('cmp-result').innerHTML = `
    <div class="card">
      <div class="card-title">Karşılaştırma Sonucu</div>
      <div class="table-wrap">
      <div class="cmp-grid">
        <div class="cmp-cell head">Kalem</div>
        <div class="cmp-cell head r" style="color:var(--fin-blue)">${lbl1}</div>
        <div class="cmp-cell head r" style="color:var(--fin-green)">${lbl2}</div>
        <div class="cmp-cell head r" style="color:var(--fin-amber)">Fark (D2→D1)</div>
        <div class="cmp-cell head r" style="color:var(--fin-amber)">Fark %</div>
        ${rows.map((row,i)=>{
          const v1=p1[row.k]||0, v2=p2[row.k]||0;
          const diff=v2-v1;
          const pctD=v1!==0?(diff/Math.abs(v1))*100:0;
          const bg=i%2===0?'background:rgba(255,255,255,0.02)':'';
          const fv = row.pct ? fmtM : (v=>`${cr}${fmt(v)}`);
          const dc = diff>=0?'var(--fin-green)':'var(--fin-red)';
          return `<div class="cmp-cell" style="${bg}">${row.l}</div>
            <div class="cmp-cell r" style="${bg};color:var(--fin-blue)">${fv(v1)}</div>
            <div class="cmp-cell r" style="${bg};color:var(--fin-green)">${fv(v2)}</div>
            <div class="cmp-cell r" style="${bg};color:${dc};font-weight:600">${row.pct?fmtM(diff):cr+fmt(diff)}</div>
            <div class="cmp-cell r" style="${bg};color:${dc};font-weight:600">${fmtM(pctD)}</div>`;
        }).join('')}
      </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// EXCEL IMPORT / EXPORT
// ══════════════════════════════════════════════════════

// Sütun başlıkları <-> FIELDS eşlemesi
const FIN_XL_COLS = [
  { header: 'Şirket Adı',            key: '_company' },
  { header: 'Yıl',                   key: '_year'    },
  { header: 'Ay (1-12)',             key: '_month'   },
  { header: 'Başlık Satışları',      key: 'baslik'   },
  { header: 'Baza Satışları',        key: 'baza'     },
  { header: 'Çekyat Satışları',      key: 'cekyat'   },
  { header: 'Metal Satışları',       key: 'metal'    },
  { header: 'Oturma Grubu Satışları',key: 'oturma'   },
  { header: 'Sandalye Satışları',    key: 'sandalye' },
  { header: 'Mobilyalar Satışları',  key: 'mobilya'  },
  { header: 'Şilteler Satışları',    key: 'silte'    },
  { header: 'Alıştan İadeler',       key: 'alis_iade'},
  { header: 'Faaliyet Giderleri',    key: 'faaliyet' },
  { header: 'Finansman Giderleri',   key: 'finansman'},
  { header: 'Hammadde Satın Alımlar',key: 'hmm_alim' },
  { header: 'Satıştan İadeler',      key: 'satis_iade'},
  { header: 'İnşaat Giderleri',      key: 'insaat'   },
  { header: 'Personel Giderleri',    key: 'personel' },
  { header: 'Vergi ve Tecil Giderleri', key: 'vergi' },
  { header: 'Hammadde SARF',         key: 'hmm_sarf' },
  { header: 'Döşeme Maaş',           key: 'dos_maas' },
  { header: 'Mobilya Maaş',          key: 'mob_maas' },
  { header: 'Şilte Maaş',            key: 'slt_maas' },
];

let _finXlRows = null; // parse edilmiş satırlar, confirm bekleniyor

function finOpenImport() {
  _finXlRows = null;
  document.getElementById('fin-drop-zone').classList.remove('drag-over');
  document.getElementById('fin-import-preview').style.display = 'none';
  document.getElementById('fin-import-preview').innerHTML = '';
  const res = document.getElementById('fin-import-result');
  res.className = 'import-result';
  res.textContent = '';
  document.getElementById('fin-import-btn').style.display = 'none';
  document.getElementById('fin-file-input').value = '';
  document.getElementById('fin-import-modal').classList.add('open');
}

function finCloseImport() {
  document.getElementById('fin-import-modal').classList.remove('open');
}

function finHandleDrop(e) {
  e.preventDefault();
  document.getElementById('fin-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) finHandleFile(file);
}

function finHandleFile(file) {
  if (!file) return;
  if (!window.XLSX) { finShowImportResult('SheetJS kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length) { finShowImportResult('Dosyada veri bulunamadı.', 'error'); return; }

      // Başlık eşlemesi: hem tam ad hem küçük/büyük harf toleransı
      const headerMap = {};
      FIN_XL_COLS.forEach(c => { headerMap[c.header.toLowerCase()] = c.key; });

      const parsed = [];
      const errors = [];

      rows.forEach((row, i) => {
        const r = {};
        Object.keys(row).forEach(k => {
          const mapped = headerMap[k.trim().toLowerCase()];
          if (mapped) r[mapped] = row[k];
        });

        const coName = String(r._company || '').trim();
        const year   = parseInt(r._year);
        const month  = parseInt(r._month);

        if (!coName) { errors.push(`Satır ${i+2}: Şirket adı eksik.`); return; }
        if (!year || year < 2000 || year > 2100) { errors.push(`Satır ${i+2}: Geçersiz yıl.`); return; }
        if (!month || month < 1 || month > 12) { errors.push(`Satır ${i+2}: Geçersiz ay (1-12).`); return; }

        const data = {};
        FIELDS.forEach(f => { data[f] = parseFloat(r[f]) || 0; });
        parsed.push({ coName, year, month, data });
      });

      if (!parsed.length) {
        finShowImportResult('Geçerli satır bulunamadı.\n' + errors.join('\n'), 'error');
        return;
      }

      _finXlRows = parsed;
      finShowPreview(parsed);

      let msg = `${parsed.length} satır hazır.`;
      if (errors.length) msg += ` (${errors.length} satır atlandı: ${errors[0]}${errors.length > 1 ? ' ...' : ''})`;
      finShowImportResult(msg, 'success');
      document.getElementById('fin-import-btn').style.display = 'inline-flex';

    } catch(err) {
      finShowImportResult('Dosya okunamadı: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function finShowPreview(rows) {
  const wrap = document.getElementById('fin-import-preview');
  const preview = rows.slice(0, 5);
  wrap.style.display = 'block';
  wrap.innerHTML = `<table>
    <thead><tr>
      <th>Şirket</th><th>Yıl</th><th>Ay</th>
      <th>Başlık</th><th>Baza</th><th>Mobilya</th><th>Personel</th><th>Hmd.SARF</th>
    </tr></thead>
    <tbody>
      ${preview.map(r => `<tr>
        <td>${r.coName}</td><td>${r.year}</td><td>${MO_F[r.month-1]}</td>
        <td>${fmt(r.data.baslik)}</td><td>${fmt(r.data.baza)}</td>
        <td>${fmt(r.data.mobilya)}</td><td>${fmt(r.data.personel)}</td>
        <td>${fmt(r.data.hmm_sarf)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${rows.length > 5 ? `<div style="padding:6px 12px;font-size:11px;color:var(--fin-text3)">...ve ${rows.length-5} satır daha</div>` : ''}`;
}

function finConfirmImport() {
  if (!_finXlRows || !_finXlRows.length) return;

  let newCo = 0, updatedRows = 0, newRows = 0;

  _finXlRows.forEach(({ coName, year, month, data }) => {
    // Şirketi bul ya da oluştur
    let coId = Object.keys(finS.companies).find(id => finS.companies[id].name.toLowerCase() === coName.toLowerCase());
    if (!coId) {
      coId = 'c' + Date.now() + Math.random().toString(36).slice(2,6);
      const idx = Object.keys(finS.companies).length % PALETTES.length;
      const pal = PALETTES[idx];
      const initials = coName.split(' ').map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2);
      finS.companies[coId] = { id:coId, name:coName, initials, sector:'', contact:'', currency:'TRY', bg:pal.bg, fg:pal.text, created:Date.now() };
      newCo++;
    }

    if (!finS.data[coId]) finS.data[coId] = {};
    const key = dkey(year, month);
    const exists = !!finS.data[coId][key];
    finS.data[coId][key] = data;
    exists ? updatedRows++ : newRows++;
  });

  save();
  updateSelects();
  updateActivePill();
  renderCoList();

  finShowImportResult(
    `✓ İçe aktarım tamamlandı!\n${newCo > 0 ? `• ${newCo} yeni şirket oluşturuldu\n` : ''}• ${newRows} yeni dönem eklendi\n${updatedRows > 0 ? `• ${updatedRows} mevcut dönem güncellendi` : ''}`,
    'success'
  );
  document.getElementById('fin-import-btn').style.display = 'none';
  _finXlRows = null;
  toast(`Excel içe aktarımı tamamlandı (${newRows + updatedRows} dönem)`);
}

function finShowImportResult(msg, type) {
  const el = document.getElementById('fin-import-result');
  el.textContent = msg;
  el.className = `import-result show ${type}`;
}

function finDownloadTemplate() {
  if (!window.XLSX) { toast('SheetJS yüklenemedi.', 'error'); return; }

  const headers = FIN_XL_COLS.map(c => c.header);
  const example = [
    'Örnek Şirket A.Ş.', 2025, 3,
    150000, 80000, 60000, 40000, 90000, 30000,
    50000, 20000, 5000,
    120000, 15000, 200000, 8000, 10000, 180000, 25000, 300000,
    45000, 12000, 8000
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Sütun genişlikleri
  ws['!cols'] = headers.map(() => ({ wch: 22 }));

  // Başlık hücre stili (sadece xlsx destekler)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: '6366F1' } }, alignment: { horizontal: 'center' } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Finansal Veri');
  XLSX.writeFile(wb, 'AuroraNova_Fin_Sablon.xlsx');
}

function finExportAll() {
  if (!window.XLSX) { toast('SheetJS yüklenemedi.', 'error'); return; }

  const companies = Object.values(finS.companies);
  if (!companies.length) { toast('Dışa aktarılacak veri yok.', 'error'); return; }

  const wb = XLSX.utils.book_new();

  companies.forEach(co => {
    const coData = finS.data[co.id] || {};
    const rows = [];

    // Başlık satırı
    rows.push([
      'Yıl', 'Ay',
      'Gelirler Toplamı', 'Net Satışlar', 'SMM (Personel+Sarf)',
      'Brüt K/Z', 'Brüt K/Z %',
      'Faaliyet Giderleri', 'Faaliyet K/Z', 'Faaliyet K/Z %',
      'Finansman Giderleri', 'Dönem K/Z', 'Dönem K/Z %',
      'Personel Giderleri', 'Hammadde SARF',
      'Başlık Satışlar', 'Baza Satışlar', 'Çekyat Satışlar', 'Metal Satışlar',
      'Oturma Satışlar', 'Sandalye Satışlar', 'Mobilya Satışlar', 'Şilte Satışlar',
      'Alıştan İade', 'Satıştan İade',
      'Hammadde Alım', 'İnşaat Giderleri', 'Vergi/Tecil'
    ]);

    // Veri satırları — tüm yıllar ve aylar
    const keys = Object.keys(coData).sort();
    keys.forEach(k => {
      const [y, m] = k.split('-').map(Number);
      const d = coData[k];
      const c = finCalc(d);
      rows.push([
        y, MO_F[m-1],
        c.M, c.AP, c.AB,
        c.AQ, +c.AQ_pct.toFixed(2),
        c.faaliyet, c.AS, +c.AS_pct.toFixed(2),
        c.finansman, c.AT, +c.AT_pct.toFixed(2),
        c.personel, c.hmm_sarf,
        d.baslik||0, d.baza||0, d.cekyat||0, d.metal||0,
        d.oturma||0, d.sandalye||0, d.mobilya||0, d.silte||0,
        d.alis_iade||0, d.satis_iade||0,
        d.hmm_alim||0, d.insaat||0, d.vergi||0
      ]);
    });

    if (rows.length < 2) return; // sadece başlık varsa atla

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:6},{wch:10},{wch:16},{wch:16},{wch:18},
      {wch:14},{wch:12},{wch:18},{wch:14},{wch:14},
      {wch:18},{wch:14},{wch:12},
      {wch:16},{wch:16},
      {wch:14},{wch:14},{wch:14},{wch:14},
      {wch:14},{wch:14},{wch:14},{wch:14},
      {wch:14},{wch:14},{wch:14},{wch:14},{wch:12}
    ];
    // Başlık satırını kalın yap
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({r:0, c:C});
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'EEF2FF' } } };
    }

    // Sheet adı max 31 karakter
    const sheetName = co.name.slice(0, 31).replace(/[\\\/\?\*\[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  if (!wb.SheetNames.length) { toast('Dışa aktarılacak veri yok.', 'error'); return; }

  const date = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `AuroraNova_Finans_${date}.xlsx`);
  toast(`${wb.SheetNames.length} şirket verisi dışa aktarıldı ✓`);
}

function populateYearSelects() {
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const endYear = currentYear + 5;
  const yearIds = ['dash-sy','dash-ey','ey','hist-year','c1ys','c1ye','c2ys','c2ye'];
  // Default selected years per select
  const defaults = { 'dash-sy': currentYear, 'dash-ey': currentYear, 'ey': currentYear, 'hist-year': currentYear,
    'c1ys': currentYear - 1, 'c1ye': currentYear - 1,
    'c2ys': currentYear, 'c2ye': currentYear };
  yearIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value || defaults[id] || currentYear;
    el.innerHTML = '';
    for (let y = startYear; y <= endYear; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y == current || y == defaults[id]) opt.selected = true;
      el.appendChild(opt);
    }
  });
}

// ── Initialise ──
populateYearSelects();
window.finAppStart = async function() {
  await load();
  updateSelects();
  updateActivePill();
  renderCoList();
  if (!Object.keys(finS.companies).length) {
    finGo('companies');
  } else {
    finS.activeCo = finS.activeCo || Object.keys(finS.companies)[0];
    updateSelects(); updateActivePill();
    renderDash();
  }
};

/* ============================================================
   AYARLAR & KULLANICI YÖNETİMİ
   ============================================================ */

async function renderFinSettings() {
  const root = document.getElementById('fin-settings-root');
  if (!root) return;
  root.innerHTML = '<p style="color:var(--fin-text3,#888)">Yükleniyor…</p>';
  const db = typeof _finInitDb === 'function' ? _finInitDb() : null;
  if (!db) return;
  let users = [];
  try {
    const snap = await db.collection('users').get();
    users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch(e) {
    root.innerHTML = '<p style="color:#e55">Kullanıcılar yüklenemedi: ' + e.message + '</p>';
    return;
  }

  const permLabels = {
    personnel:'Personel', processes:'Süreçler', templates:'Şablonlar',
    calendar:'Takvim', vehicles:'Taşıtlar', export:'Excel/Dışa Aktar',
    settings:'Ayarlar', entry:'Veri Girişi', history:'Geçmiş',
    compare:'Karşılaştırma', companies:'Şirketler'
  };

  function permRows(app, modules) {
    return `<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">` +
      modules.map(m => `
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:120px;font-size:12px;opacity:0.7">${permLabels[m]||m}</span>
        <select id="fsu-perm-${app}-${m}" style="font-size:12px;padding:3px 8px;border-radius:6px;border:1px solid var(--fin-border,#333);background:var(--fin-surface2,#1a1a2e);color:inherit">
          <option value="">— Erişim Yok —</option>
          <option value="view">Görüntüle</option>
          <option value="edit">Düzenle</option>
          <option value="admin">Tam Yetki</option>
        </select>
      </div>`).join('') + `</div>`;
  }

  function userRow(u) {
    const roles = (u.roles||[]).join(', ');
    const perms = u.permissions || {};
    const hrP = Object.entries(perms).filter(([k])=>k.startsWith('hr.')).map(([k,v])=>`${k.replace('hr.','')}:${v}`).join(', ');
    const finP = Object.entries(perms).filter(([k])=>k.startsWith('fin.')).map(([k,v])=>`${k.replace('fin.','')}:${v}`).join(', ');
    return `<tr>
      <td><div style="font-weight:500">${u.name||'—'}</div><div style="font-size:12px;opacity:0.5">${u.email||u.uid}</div></td>
      <td>${roles||'—'}</td>
      <td style="font-size:12px">${hrP||'—'}</td>
      <td style="font-size:12px">${finP||'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="finSettingsEdit('${u.uid}')" style="margin-right:4px">Düzenle</button>
        <button class="btn btn-sm" style="color:#e55" onclick="finSettingsDelete('${u.uid}')">Sil</button>
      </td>
    </tr>`;
  }

  root.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="margin:0;font-size:15px">Kullanıcı Yönetimi</h3>
        <button class="btn btn-primary btn-sm" onclick="finSettingsOpenAdd()">+ Kullanıcı Ekle</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:1px solid var(--fin-border,#333)">
            <th style="text-align:left;padding:8px 12px">Ad / Email</th>
            <th style="text-align:left;padding:8px 12px">Roller</th>
            <th style="text-align:left;padding:8px 12px">HR İzinleri</th>
            <th style="text-align:left;padding:8px 12px">Fin İzinleri</th>
            <th></th>
          </tr></thead>
          <tbody>${users.map(userRow).join('')}</tbody>
        </table>
      </div>
    </div>

    <div id="fin-modal-user" style="display:none;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.6);align-items:center;justify-content:center">
      <div class="card" style="width:100%;max-width:520px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 id="fin-modal-user-title" style="margin:0;font-size:15px">Kullanıcı Ekle</h3>
          <button onclick="document.getElementById('fin-modal-user').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:inherit">✕</button>
        </div>
        <form onsubmit="finSettingsSave(event)" style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:12px;opacity:0.7;display:block;margin-bottom:4px">Email (Google hesabı)</label>
            <input type="email" id="fsu-email" required style="width:100%;box-sizing:border-box;padding:8px 12px;border-radius:8px;border:1px solid var(--fin-border,#333);background:var(--fin-surface2,#1a1a2e);color:inherit;font-size:13px">
          </div>
          <div>
            <label style="font-size:12px;opacity:0.7;display:block;margin-bottom:4px">Ad Soyad</label>
            <input type="text" id="fsu-name" style="width:100%;box-sizing:border-box;padding:8px 12px;border-radius:8px;border:1px solid var(--fin-border,#333);background:var(--fin-surface2,#1a1a2e);color:inherit;font-size:13px">
          </div>
          <div>
            <label style="font-size:12px;opacity:0.7;display:block;margin-bottom:6px">Uygulamalar</label>
            <div style="display:flex;gap:16px">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" id="fsu-role-hr"> HR</label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" id="fsu-role-fin"> Finance</label>
            </div>
          </div>
          <div>
            <label style="font-size:12px;opacity:0.7;display:block;margin-bottom:4px">HR İzinleri</label>
            ${permRows('hr', ['personnel','processes','templates','calendar','vehicles','export','settings'])}
          </div>
          <div>
            <label style="font-size:12px;opacity:0.7;display:block;margin-bottom:4px">Fin İzinleri</label>
            ${permRows('fin', ['entry','history','compare','companies','export','settings'])}
          </div>
          <input type="hidden" id="fsu-uid">
          <div style="display:flex;gap:8px;padding-top:4px">
            <button type="submit" class="btn btn-primary btn-sm">Kaydet</button>
            <button type="button" class="btn btn-sm" onclick="document.getElementById('fin-modal-user').style.display='none'">İptal</button>
          </div>
        </form>
      </div>
    </div>`;
}

function finSettingsOpenAdd() {
  document.getElementById('fin-modal-user-title').textContent = 'Kullanıcı Ekle';
  document.getElementById('fsu-email').value = '';
  document.getElementById('fsu-name').value = '';
  document.getElementById('fsu-uid').value = '';
  document.getElementById('fsu-role-hr').checked = false;
  document.getElementById('fsu-role-fin').checked = false;
  document.querySelectorAll('[id^="fsu-perm-"]').forEach(s => s.value = '');
  document.getElementById('fin-modal-user').style.display = 'flex';
}

async function finSettingsEdit(uid) {
  const db = _finInitDb();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return;
  const u = snap.data();
  document.getElementById('fin-modal-user-title').textContent = 'Kullanıcıyı Düzenle';
  document.getElementById('fsu-email').value = u.email || '';
  document.getElementById('fsu-name').value = u.name || '';
  document.getElementById('fsu-uid').value = uid;
  document.getElementById('fsu-role-hr').checked = (u.roles||[]).includes('hr');
  document.getElementById('fsu-role-fin').checked = (u.roles||[]).includes('fin');
  const perms = u.permissions || {};
  document.querySelectorAll('[id^="fsu-perm-"]').forEach(s => {
    const key = s.id.replace('fsu-perm-', '').replace(/-(?=[^-]*$)/, '.');
    s.value = perms[key] || '';
  });
  document.getElementById('fin-modal-user').style.display = 'flex';
}

async function finSettingsSave(e) {
  e.preventDefault();
  const db = _finInitDb();
  const uid = document.getElementById('fsu-uid').value;
  const email = document.getElementById('fsu-email').value.trim();
  const name = document.getElementById('fsu-name').value.trim();
  const roles = [];
  if (document.getElementById('fsu-role-hr').checked) roles.push('hr');
  if (document.getElementById('fsu-role-fin').checked) roles.push('fin');
  const permissions = {};
  document.querySelectorAll('[id^="fsu-perm-"]').forEach(s => {
    if (s.value) {
      const key = s.id.replace('fsu-perm-', '').replace(/-(?=[^-]*$)/, '.');
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
    document.getElementById('fin-modal-user').style.display = 'none';
    renderFinSettings();
  } catch(err) {
    alert('Kayıt hatası: ' + err.message);
  }
}

async function finSettingsDelete(uid) {
  if (!confirm('Bu kullanıcının erişimi kaldırılacak. Emin misiniz?')) return;
  try {
    await _finInitDb().collection('users').doc(uid).delete();
    renderFinSettings();
  } catch(err) {
    alert('Silme hatası: ' + err.message);
  }
}
