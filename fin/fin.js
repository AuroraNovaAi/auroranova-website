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

function load() {
  try {
    const raw = localStorage.getItem('auroran_v1');
    if (raw) { const p = JSON.parse(raw); finS.companies = p.companies||{}; finS.data = p.data||{}; }
  } catch(e) { console.warn('Load error',e); }
}
function save() {
  try { localStorage.setItem('auroran_v1', JSON.stringify({companies:finS.companies, data:finS.data})); }
  catch(e) { console.warn('Save error',e); }
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
  document.querySelectorAll('.nav-item')[PAGES.indexOf(p)]?.classList.add('active');
  if (p==='dashboard') renderDash();
  if (p==='history') renderHistory();
  if (p==='entry') { syncEntryCo(); renderCal(); }
  if (p==='companies') renderCoList();
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
  const AP = Math.round((K-Q+L)*100)/100;
  const AQ = AP-AB;
  const AR = N-O;
  const AS = AQ-AR;
  const AT = AS-O;

  const Y = H ? V/H : 0;
  const Z = Mo ? W/Mo : 0;
  const AA = Si ? X/Si : 0;

  return {H,K,L,M,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK,AL,AM,AN,AO,AP,AQ,AR,AS,AT,Y,Z,AA,
    personel:S2, hmm_sarf:U};
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
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();delCo('${c.id}')">Sil</button>
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
  const y = document.getElementById('dash-year').value;
  const cr = curr();
  document.getElementById('dash-title').textContent = co.name;

  const cData = finS.data[finS.activeCo]||{};
  const months = [];
  for (let m=1;m<=12;m++) {
    const k = dkey(y,m);
    if (cData[k]) months.push({m, raw:cData[k], c:finCalc(cData[k])});
  }

  document.getElementById('dash-desc').textContent = months.length
    ? `${y} — ${months.length} aylık veri mevcut`
    : `${y} — veri yok`;

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
  const avgAF = months.reduce((a,{c})=>a+c.AF,0)/months.length;

  const kpis = [
    {l:'Gelirler Toplamı', v:`${cr}${fmt(tot.M)}`, color:'var(--fin-blue)', sub:`${months.length} ay`},
    {l:'Net Satışlar', v:`${cr}${fmt(tot.AP)}`, color:'var(--fin-purple)'},
    {l:'Giderler (Sarf)', v:`${cr}${fmt(tot.AC)}`, color:'var(--fin-amber)'},
    {l:'Dönem Kar/Zarar', v:`${cr}${fmt(tot.AT)}`, color:tot.AT>=0?'var(--fin-green)':'var(--fin-red)'},
    {l:'Ort. Kar Oranı', v:fmtM(avgAF), color:avgAF>=0?'var(--fin-green)':'var(--fin-red)'},
  ];
  document.getElementById('kpi-row').innerHTML = kpis.map(k=>`
    <div class="kpi" style="--kpi-color:${k.color}">
      <div class="kpi-label">${k.l}</div>
      <div class="kpi-value" style="color:${k.color};font-size:19px">${k.v}</div>
      ${k.sub?`<div class="kpi-sub">${k.sub}</div>`:''}
    </div>`).join('');

  const maxV = Math.max(...months.map(({c})=>Math.max(c.M,c.AC)),1);
  document.getElementById('dash-bar').innerHTML = months.map(({m,c})=>`
    <div class="chart-row">
      <div class="chart-label">${MO[m-1]}</div>
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

  document.getElementById('dash-ratio').innerHTML = months.map(({m,c})=>`
    <div class="chart-row">
      <div class="chart-label">${MO[m-1]}</div>
      <div class="chart-bars">
        <div class="chart-track"><div class="chart-fill"
          style="width:${Math.min(Math.abs(c.AF),100)}%;background:${c.AF>=0?'var(--fin-green)':'var(--fin-red)'}"></div></div>
        <div class="chart-track"><div class="chart-fill"
          style="width:${Math.min(c.AJ,100)}%;background:var(--fin-purple)"></div></div>
      </div>
      <div class="chart-val" style="color:${c.AF>=0?'var(--fin-green)':'var(--fin-red)'}">${fmtM(c.AF)}</div>
    </div>`).join('') + `
    <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--fin-text3)">
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--fin-green);border-radius:2px;margin-right:4px;vertical-align:middle"></span>Kar %</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--fin-purple);border-radius:2px;margin-right:4px;vertical-align:middle"></span>Pers/Gel %</span>
    </div>`;

  document.getElementById('sum-head').innerHTML =
    '<th>Kalem</th>' +
    months.map(({m})=>`<th style="text-align:right">${MO[m-1]}</th>`).join('') +
    '<th style="text-align:right">Toplam / Ort.</th>';

  const rows = [
    {l:'Gelirler Toplamı',  fn:c=>c.M,  bold:true},
    {l:'Net Satışlar',      fn:c=>c.AP, bold:false},
    {l:'Giderler (Sarf)',   fn:c=>c.AC, bold:false},
    {l:'Dönem Kar/Zarar',   fn:c=>c.AT, bold:true, signed:true},
    {l:'Kar Oranı (Sarf)', fn:c=>c.AF, bold:false, pct:true},
    {l:'Faaliyet K/Z',      fn:c=>c.AS, bold:false, signed:true},
    {l:'Personel Gid.',     fn:c=>c.personel, bold:false},
    {l:'Hammadde SARF',     fn:c=>c.hmm_sarf, bold:false},
  ];

  document.getElementById('sum-body').innerHTML = rows.map(row=>{
    const vals = months.map(({c})=>row.fn(c));
    const total = vals.reduce((a,v)=>a+v,0);
    const cells = vals.map(v=>{
      if (row.pct) return `<td class="num">${fmtM(v)}</td>`;
      if (row.signed) return `<td class="${v>=0?'pos':'neg'}">${cr}${fmt(v)}</td>`;
      return `<td class="num">${cr}${fmt(v)}</td>`;
    }).join('');
    const totCell = row.pct
      ? `<td class="num" style="font-weight:600">${fmtM(total/months.length)}</td>`
      : row.signed
        ? `<td class="${total>=0?'pos':'neg'}" style="font-weight:600">${cr}${fmt(total)}</td>`
        : `<td class="num" style="font-weight:600">${cr}${fmt(total)}</td>`;
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
          <td><button class="btn btn-ghost btn-sm" onclick="editEntry(${m},'${y}')">✎ Düzenle</button></td>
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
    let a={M:0,AC:0,AD:0,AT:0,AN:0,AP:0,AS:0,AQ:0,personel:0,hmm_sarf:0,AF:0,AH:0,AJ:0,AL:0,n:0};
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
    {l:'Gelirler Toplamı', k:'M'},
    {l:'Net Satışlar', k:'AP'},
    {l:'Giderler (Sarf)', k:'AC'},
    {l:'Giderler (Alım)', k:'AD'},
    {l:'Kar/Zarar (Sarf)', k:'AN', signed:true},
    {l:'Dönem Kar/Zarar', k:'AT', signed:true},
    {l:'Faaliyet K/Z', k:'AS', signed:true},
    {l:'Personel Giderleri', k:'personel'},
    {l:'Hammadde SARF', k:'hmm_sarf'},
    {l:'Ort. Kar Oranı %', k:'AF', pct:true},
    {l:'Hmm/Gelir %', k:'AH', pct:true},
    {l:'Pers/Gelir %', k:'AJ', pct:true},
    {l:'Faal/Gelir %', k:'AL', pct:true},
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

// ── Initialise ──
load();
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
