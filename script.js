// Data (sample). Replace with real data source if you have one.
const stocks = [
  { id: 'RELIANCE', name: 'Reliance Industries Ltd', price: 1398.07 },
  { id: 'TATAMOTORS', name: 'Tata Motors', price: 1006.98 },
  { id: 'ADANIGREEN', name: 'Adani Green', price: 1181.45 },
  { id: 'WIPRO', name: 'Wipro', price: 1485.01 },
  { id: 'MRF', name: 'MRF', price: 1898.78 },
  { id: 'HDFC', name: 'HDFC', price: 1846.28 },
  { id: 'AFFLE', name: 'Affle 3i Ltd', price: 410.22 }
];

const funds = [
  { id: 'EDEL', name: 'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', price: 232.4 },
  { id: 'HDFC_MID', name: 'HDFC Mid Cap Fund', price: 132.76 },
  { id: 'HDFC_SM', name: 'HDFC Small Cap Fund', price: 276.12 },
  { id: 'NIPPON_LC', name: 'Nippon India Large Cap Fund', price: 312.55 },
  { id: 'SBI_LC', name: 'SBI Large Cap Fund', price: 425.22 },
  { id: 'NIPPON_MC', name: 'Nippon India Mid Cap Fund', price: 210.88 },
  { id: 'NIPPON_SC', name: 'Nippon India Small Cap Fund', price: 180.44 },
  { id: 'HDFC_LC', name: 'HDFC Large Cap Fund', price: 290.12 }
];

// Local storage portfolio structure: { id: { qty, avgPrice, type } }
function loadPortfolio(){ return JSON.parse(localStorage.getItem('nv_portfolio') || '{}'); }
function savePortfolio(p){ localStorage.setItem('nv_portfolio', JSON.stringify(p)); }

const state = {
  tab: 'stocks',
  portfolio: loadPortfolio(),
  hiddenValues: false,
  currentDetail: null, // {id,type}
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- UI helpers ---------- */
function fmt(x){ return '₹' + Number(x).toLocaleString(undefined, {maximumFractionDigits:2}); }
function pctClass(n){ return n >= 0 ? 'pct-up' : 'pct-down'; }
function pctText(n){ return (n>=0? '▲ ':'▼ ') + Math.abs(n).toFixed(2) + '%'; }

function calcTotals(){
  const p = state.portfolio;
  let total = 0, holdings = 0, invested=0;
  for(const id in p){
    const item = p[id];
    const source = (item.type === 'stock') ? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
    if(!source) continue;
    total += source.price * item.qty;
    invested += item.avgPrice * item.qty;
    holdings += item.qty;
  }
  const dayChange = total - invested;
  const pct = invested ? (dayChange / invested) * 100 : 0;
  $('#totalAssets').textContent = state.hiddenValues ? '----' : fmt(total);
  $('#holdingCount').textContent = 'Holdings: ' + holdings;
  $('#dayChange').textContent = (state.hiddenValues ? '+----' : ( (dayChange >=0 ? '+' : '') + '₹' + dayChange.toFixed(2) + ' (' + pct.toFixed(2) + '%)'));
}

function clearList(){ $('#listContainer').innerHTML = ''; }

/* ---------- Render functions ---------- */
function makeCard(item, type){
  const id = item.id;
  const inPortfolio = state.portfolio[id];
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  // left
  const left = document.createElement('div'); left.className='card-left';
  const av = document.createElement('div'); av.className='avatar'; av.textContent = id.slice(0,2);
  const txt = document.createElement('div');
  const title = document.createElement('div'); title.className='card-title'; title.textContent = item.name;
  const sub = document.createElement('div'); sub.className='card-sub'; sub.textContent = (type==='stock' ? 'Stock | ' : 'Fund | ') + id;
  txt.appendChild(title); txt.appendChild(sub);
  left.appendChild(av); left.appendChild(txt);

  // right
  const right = document.createElement('div'); right.className='card-right';
  const price = document.createElement('div'); price.className='card-price'; price.textContent = state.hiddenValues ? '----' : fmt(item.price);
  right.appendChild(price);

  if(inPortfolio){
    // show P/L arrow and percent for owned items
    const qty = state.portfolio[id].qty;
    const avg = state.portfolio[id].avgPrice;
    const pl = (item.price - avg) / avg * 100;
    const pctWrap = document.createElement('div');
    pctWrap.className = 'card-pct ' + (pl>=0 ? 'pct-up' : 'pct-down');
    pctWrap.textContent = (pl>=0 ? '▲ ' : '▼ ') + Math.abs(pl).toFixed(2) + '%';
    right.appendChild(pctWrap);
  }

  wrapper.appendChild(left);
  wrapper.appendChild(right);

  // clicking card opens modal detail (no Buy button on listing)
  wrapper.addEventListener('click', () => openDetail(id, type));

  return wrapper;
}

function renderStocks(){
  $('#sectionTitle').textContent = 'Buy Stocks';
  clearList();
  stocks.forEach(s => $('#listContainer').appendChild(makeCard(s,'stock')));
}

function renderFunds(){
  $('#sectionTitle').textContent = 'Mutual Funds';
  clearList();
  funds.forEach(f => $('#listContainer').appendChild(makeCard(f,'fund')));
}

function renderPortfolio(){
  $('#sectionTitle').textContent = 'Your Portfolio';
  clearList();
  const p = state.portfolio;
  const listIds = Object.keys(p);
  if(listIds.length === 0){
    const empty = document.createElement('div'); empty.className='card';
    empty.innerHTML = '<div class="card-left"><div class="avatar">—</div><div style="margin-left:10px"><div class="card-title">No holdings yet</div><div class="card-sub">Buy stocks or funds from the list</div></div></div>';
    $('#listContainer').appendChild(empty); return;
  }

  listIds.forEach(id=>{
    const itemType = p[id].type;
    const source = itemType === 'stock' ? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
    if(!source) return;
    const wrap = document.createElement('div'); wrap.className='card';
    const left = document.createElement('div'); left.className='card-left';
    const av = document.createElement('div'); av.className='avatar'; av.textContent = id.slice(0,2);
    const txt = document.createElement('div');
    const title = document.createElement('div'); title.className='card-title'; title.textContent = source.name;
    const sub = document.createElement('div'); sub.className='card-sub'; sub.textContent = (itemType==='stock'?'Stock | ':'Fund | ') + id;
    txt.appendChild(title); txt.appendChild(sub);
    left.appendChild(av); left.appendChild(txt);

    const right = document.createElement('div'); right.className='card-right';
    const price = document.createElement('div'); price.className='card-price'; price.textContent = fmt(source.price);
    const info = document.createElement('div'); info.className='card-sub'; info.textContent = `Qty: ${p[id].qty} • Avg: ${fmt(p[id].avgPrice)}`;
    right.appendChild(price); right.appendChild(info);

    wrap.appendChild(left); wrap.appendChild(right);
    wrap.addEventListener('click', ()=> openDetail(id, itemType));
    $('#listContainer').appendChild(wrap);
  });
}

/* ---------- Modal and trading ---------- */
let detailChart = null;
function openDetail(id, type){
  state.currentDetail = {id,type};
  const source = (type==='stock')? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
  if(!source) return;
  $('#detailAvatar').textContent = id.slice(0,2);
  $('#detailName').textContent = source.name;
  $('#detailSub').textContent = (type==='stock'?'Stock | ':'Fund | ') + id;
  $('#detailPrice').textContent = fmt(source.price);
  const owned = state.portfolio[id];
  if(owned){
    const pl = (source.price - owned.avgPrice)/owned.avgPrice*100;
    $('#detailPct').textContent = (pl>=0? '▲ ' : '▼ ') + Math.abs(pl).toFixed(2) + '%';
    $('#detailPct').className = 'detail-pct ' + (pl>=0 ? 'pct-up' : 'pct-down');
  } else {
    $('#detailPct').textContent = '';
    $('#detailPct').className = 'detail-pct';
  }

  // Show modal
  $('#detailModal').classList.remove('hidden');
  $('#detailModal').ariaHidden = "false";

  // build chart with sample data per range
  const ctx = document.getElementById('detailChart').getContext('2d');
  const labels = generateLabels(60);
  const data = generateSeries(labels.length, source.price);
  if(detailChart) detailChart.destroy();
  detailChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets: [{ label: source.name, data, borderColor: '#2ecc71', backgroundColor:'rgba(46,204,113,0.04)', tension:0.25, pointRadius:0 }] },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{ x:{ display:false }, y:{ beginAtZero:false, grid:{color:'rgba(255,255,255,0.03)'} } },
      plugins:{ legend:{ display:false } }
    }
  });
}

// simple sample label generator
function generateLabels(n){ const out=[]; for(let i=0;i<n;i++) out.push(''); return out; }
function generateSeries(n, center){
  const arr=[]; let value=center;
  for(let i=0;i<n;i++){
    value += (Math.random()-0.48) * (center*0.01);
    arr.push(Math.max(1, Number(value.toFixed(2))));
  }
  return arr;
}

$('#closeModal').addEventListener('click', ()=> {
  $('#detailModal').classList.add('hidden');
  $('#detailModal').ariaHidden = "true";
});

/* range buttons */
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('range')){
    $$('.range').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    // regenerate chart with different length
    if(detailChart && state.currentDetail){
      const source = state.currentDetail.type==='stock' ? stocks.find(s=>s.id===state.currentDetail.id) : funds.find(f=>f.id===state.currentDetail.id);
      const range = e.target.dataset.range;
      const len = range === '1D' ? 60 : range === '1W' ? 80 : range === '1M' ? 120 : range === '6M' ? 220 : 320;
      detailChart.data.labels = generateLabels(len);
      detailChart.data.datasets[0].data = generateSeries(len, source.price);
      detailChart.update();
    }
  }
});

/* Trade buttons */
$('#buyBtn').addEventListener('click', ()=> trade('buy'));
$('#sellBtn').addEventListener('click', ()=> trade('sell'));
$('#sipBtn').addEventListener('click', ()=> trade('sip'));

function trade(action){
  const qty = Math.max(1, Number($('#tradeQty').value || 1));
  const {id,type} = state.currentDetail || {};
  if(!id) return alert('No item selected');
  const source = type==='stock' ? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
  let p = state.portfolio;
  if(action === 'buy' || action === 'sip'){
    if(!p[id]) p[id] = { qty:0, avgPrice:0, type };
    const cur = p[id];
    const newTotalUnits = cur.qty + qty;
    const newAvg = ((cur.avgPrice * cur.qty) + (source.price * qty)) / newTotalUnits;
    p[id] = { qty: newTotalUnits, avgPrice: newAvg, type };
    savePortfolio(p);
    state.portfolio = p;
    calcTotals();
    renderCurrentTab();
    alert('Bought ' + qty + ' ' + id);
  } else if(action === 'sell'){
    if(!p[id] || p[id].qty < qty) return alert('Not enough holdings to sell');
    p[id].qty -= qty;
    if(p[id].qty === 0) delete p[id];
    savePortfolio(p);
    state.portfolio = p;
    calcTotals();
    renderCurrentTab();
    alert('Sold ' + qty + ' ' + id);
  }
}

/* ---------- Tab switching and initial render ---------- */
function renderCurrentTab(){
  if(state.tab === 'stocks') renderStocks();
  else if(state.tab === 'funds') renderFunds();
  else renderPortfolio();
}

$$('.tab').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    $$('.tab').forEach(b=>b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    state.tab = e.currentTarget.dataset.tab;
    renderCurrentTab();
  });
});

$('#toggleEye').addEventListener('click', () => {
  state.hiddenValues = !state.hiddenValues;
  calcTotals();
  renderCurrentTab();
});

/* startup */
renderCurrentTab();
calcTotals();
