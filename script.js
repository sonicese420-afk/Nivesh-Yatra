/* ---------- sample data ---------- */
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
  { id: 'NIP_LC', name: 'Nippon India Large Cap Fund', price: 312.55 },
  { id: 'SBI_LC', name: 'SBI Large Cap Fund', price: 425.22 },
  { id: 'NIP_MC', name: 'Nippon India Mid Cap Fund', price: 210.88 },
  { id: 'NIP_SC', name: 'Nippon India Small Cap Fund', price: 180.44 },
  { id: 'HDFC_LC', name: 'HDFC Large Cap Fund', price: 290.12 }
];

function loadPortfolio(){ return JSON.parse(localStorage.getItem('nv_portfolio')||'{}'); }
function savePortfolio(p){ localStorage.setItem('nv_portfolio', JSON.stringify(p)); }

const state = { tab:'stocks', portfolio: loadPortfolio(), hidden:false, currentDetail:null };
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

function fmt(x){ return '₹' + Number(x).toLocaleString(undefined,{maximumFractionDigits:2}); }

function calcTotals(){
  const p = state.portfolio;
  let total=0, invested=0, holdings=0;
  Object.keys(p).forEach(id=>{
    const it = p[id];
    const src = (it.type==='stock')? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
    if(!src) return;
    total += src.price * it.qty;
    invested += it.avgPrice * it.qty;
    holdings += it.qty;
  });
  const dayChange = total - invested; const pct = invested? (dayChange/invested)*100 : 0;
  $('#totalAssets').textContent = state.hidden? '----' : fmt(total);
  $('#holdingCount').textContent = 'Holdings: ' + holdings;
  $('#dayChange').textContent = state.hidden? '+----' : ( (dayChange>=0?'+':'') + '₹' + dayChange.toFixed(2) + ' (' + pct.toFixed(2) + '%)');
}

function makeCard(item,type){
  const id=item.id; const inPort=state.portfolio[id];
  const wrap=document.createElement('div'); wrap.className='card';
  const left=document.createElement('div'); left.className='card-left';
  const av=document.createElement('div'); av.className='avatar'; av.textContent=id.slice(0,2);
  const txt=document.createElement('div');
  const title=document.createElement('div'); title.className='card-title'; title.textContent=item.name;
  const sub=document.createElement('div'); sub.className='card-sub'; sub.textContent=(type==='stock'?'Stock | ':'Fund | ')+id;
  txt.appendChild(title); txt.appendChild(sub);
  left.appendChild(av); left.appendChild(txt);
  const right=document.createElement('div'); right.className='card-right';
  const price=document.createElement('div'); price.className='card-price'; price.textContent = state.hidden? '----' : fmt(item.price);
  right.appendChild(price);
  if(inPort){
    const avg=state.portfolio[id].avgPrice; const pl=(item.price-avg)/avg*100;
    const pct=document.createElement('div'); pct.className='card-pct '+(pl>=0?'pct-up':'pct-down'); pct.textContent=(pl>=0?'▲ ':'▼ ')+Math.abs(pl).toFixed(2)+'%';
    right.appendChild(pct);
  }
  wrap.appendChild(left); wrap.appendChild(right);
  wrap.addEventListener('click', ()=> openDetail(id,type));
  return wrap;
}

function renderStocks(){ $('#sectionTitle').textContent='Buy Stocks'; $('#listContainer').innerHTML=''; stocks.forEach(s=> $('#listContainer').appendChild(makeCard(s,'stock'))); }
function renderFunds(){ $('#sectionTitle').textContent='Mutual Funds'; $('#listContainer').innerHTML=''; funds.forEach(f=> $('#listContainer').appendChild(makeCard(f,'fund'))); }
function renderPortfolio(){
  $('#sectionTitle').textContent='Your Portfolio'; $('#listContainer').innerHTML='';
  const ids=Object.keys(state.portfolio);
  if(ids.length===0){ const empty=document.createElement('div'); empty.className='card'; empty.innerHTML='<div class="card-left"><div class="avatar">—</div><div style="margin-left:10px"><div class="card-title">No holdings yet</div><div class="card-sub">Buy stocks or funds from the list</div></div></div>'; $('#listContainer').appendChild(empty); return; }
  ids.forEach(id=>{
    const it=state.portfolio[id]; const src = (it.type==='stock') ? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
    if(!src) return;
    const wrap=document.createElement('div'); wrap.className='card';
    const left=document.createElement('div'); left.className='card-left';
    const av=document.createElement('div'); av.className='avatar'; av.textContent=id.slice(0,2);
    const txt=document.createElement('div'); const title=document.createElement('div'); title.className='card-title'; title.textContent=src.name;
    const sub=document.createElement('div'); sub.className='card-sub'; sub.textContent=(it.type==='stock'?'Stock | ':'Fund | ')+id;
    txt.appendChild(title); txt.appendChild(sub); left.appendChild(av); left.appendChild(txt);
    const right=document.createElement('div'); right.className='card-right'; const price=document.createElement('div'); price.className='card-price'; price.textContent=fmt(src.price);
    const info=document.createElement('div'); info.className='card-sub'; info.textContent='Qty: '+it.qty+' • Avg: '+fmt(it.avgPrice);
    right.appendChild(price); right.appendChild(info); wrap.appendChild(left); wrap.appendChild(right);
    wrap.addEventListener('click', ()=> openDetail(id,it.type));
    $('#listContainer').appendChild(wrap);
  });
}

let detailChart=null;
function openDetail(id,type){
  state.currentDetail={id,type};
  const src = (type==='stock')? stocks.find(s=>s.id===id) : funds.find(f=>f.id===id);
  if(!src) return;
  $('#detailName').textContent = src.name;
  $('#detailSub').textContent = (type==='stock'?'Stock | ':'Fund | ')+id;
  $('#detailPrice').textContent = fmt(src.price);
  const owned = state.portfolio[id];
  if(owned){ const pl=(src.price - owned.avgPrice)/owned.avgPrice*100; $('#detailPct').textContent=(pl>=0?'▲ ':'▼ ')+Math.abs(pl).toFixed(2)+'%'; $('#detailPct').className='card-sub '+(pl>=0?'pct-up':'pct-down'); }
  else { $('#detailPct').textContent=''; $('#detailPct').className=''; }

  $('#detailModal').classList.remove('hidden'); $('#detailModal').ariaHidden='false';
  const ctx = document.getElementById('detailChart').getContext('2d');
  const labels = Array.from({length:80}).map((_,i)=>'');
  const data = genSeries(labels.length, src.price);
  if(detailChart) detailChart.destroy();
  detailChart = new Chart(ctx, { type:'line', data:{labels, datasets:[{label:src.name,data,borderColor:'#2ecc71',backgroundColor:'rgba(46,204,113,0.05)',tension:0.25,pointRadius:0}]}, options:{responsive:true,maintainAspectRatio:false,scales:{x:{display:false},y:{grid:{color:'rgba(255,255,255,0.03)'}}},plugins:{legend:{display:false}}});
}

function genSeries(n,center){ let v=center; return Array.from({length:n}).map(()=>{ v += (Math.random()-0.48)*(center*0.01); return Math.max(1,Number(v.toFixed(2))); }); }

$$('.range').forEach(b=>b.addEventListener('click', (e)=>{ $$('.range').forEach(x=>x.classList.remove('active')); e.currentTarget.classList.add('active'); if(!detailChart || !state.currentDetail) return; const src = (state.currentDetail.type==='stock')? stocks.find(s=>s.id===state.currentDetail.id) : funds.find(f=>f.id===state.currentDetail.id); const range=e.currentTarget.dataset.range; const len = range==='1D'?60:range==='1W'?80:range==='1M'?120:range==='6M'?220:320; detailChart.data.labels = Array.from({length:len}).map(()=> ''); detailChart.data.datasets[0].data = genSeries(len, src.price); detailChart.update(); }));

$('#closeModal').addEventListener('click', ()=> { $('#detailModal').classList.add('hidden'); $('#detailModal').ariaHidden='true'; });

$('#buyBtn').addEventListener('click', ()=> trade('buy')); $('#sellBtn').addEventListener('click', ()=> trade('sell')); $('#sipBtn').addEventListener('click', ()=> trade('sip'));

function trade(action){
  const qty = Math.max(1, Number($('#tradeQty').value||1));
  const cur = state.currentDetail;
  if(!cur) return alert('Select an item first');
  const src = (cur.type==='stock')? stocks.find(s=>s.id===cur.id) : funds.find(f=>f.id===cur.id);
  let p = state.portfolio;
  if(action==='buy' || action==='sip'){
    if(!p[cur.id]) p[cur.id]={qty:0,avgPrice:0,type:cur.type};
    const it = p[cur.id]; const newQty = it.qty + qty; const newAvg = ((it.avgPrice*it.qty) + (src.price*qty))/newQty;
    p[cur.id] = { qty:newQty, avgPrice:newAvg, type:cur.type };
    savePortfolio(p); state.portfolio=p; calcTotals(); renderCurrentTab(); alert('Bought '+qty+' '+cur.id);
  } else {
    if(!p[cur.id] || p[cur.id].qty < qty) return alert('Not enough holdings to sell');
    p[cur.id].qty -= qty; if(p[cur.id].qty === 0) delete p[cur.id]; savePortfolio(p); state.portfolio=p; calcTotals(); renderCurrentTab(); alert('Sold '+qty+' '+cur.id);
  }
}

function renderCurrentTab(){ if(state.tab==='stocks') renderStocks(); else if(state.tab==='funds') renderFunds(); else renderPortfolio(); }
$$('.tab').forEach(btn=> btn.addEventListener('click', (e)=>{ $$('.tab').forEach(x=>x.classList.remove('active')); e.currentTarget.classList.add('active'); state.tab = e.currentTarget.dataset.tab; renderCurrentTab(); }));

$('#toggleEye').addEventListener('click', ()=>{ state.hidden = !state.hidden; calcTotals(); renderCurrentTab(); });

/* initial */
renderCurrentTab(); calcTotals();

/* expose for console testing */
window.renderCurrentTab = renderCurrentTab;
window.detailChart = () => detailChart;
