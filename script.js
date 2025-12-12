// app.js
// Vanilla JS: renders stocks, funds, portfolio, overlay with chart, and implements fitCanvas and localStorage holdings.

'use strict';

/* =======================
   Data arrays (as requested)
   ======================= */
const STOCKS = [
  { id:'RELI', ticker:'RELIANCE', short:'RE', name:'Reliance Industries Ltd', price:1398.07 },
  { id:'TATM', ticker:'TATAMOTORS', short:'TM', name:'Tata Motors', price:1006.98 },
  { id:'ADGN', ticker:'ADANIGREEN', short:'AG', name:'Adani Green', price:1181.45 },
  { id:'WIPR', ticker:'WIPRO', short:'W', name:'Wipro', price:1485.01 },
  { id:'MRF', ticker:'MRF', short:'M', name:'MRF', price:1898.78 },
  { id:'HDFC', ticker:'HDFC', short:'H', name:'HDFC', price:1846.28 },
  { id:'AFFL', ticker:'AFFLE', short:'AF', name:'Affle 3i Ltd', price:410.22 }
];

const FUNDS = [
  { id:'EDEL', code:'EDEL', name:'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', price:232.4 },
  { id:'HDFM', code:'HDFCMID', name:'HDFC Mid Cap Fund', price:132.76 },
  { id:'HDFSC', code:'HDFCSM', name:'HDFC Small Cap Fund', price:276.12 },
  { id:'NIPL', code:'NIPPL', name:'Nippon India Large Cap Fund', price:219.33 },
  { id:'SBIL', code:'SBIL', name:'SBI Large Cap Fund', price:189.44 },
  { id:'NIPM', code:'NIPPM', name:'Nippon India Mid Cap Fund', price:160.55 },
  { id:'NIPS', code:'NIPPS', name:'Nippon India Small Cap Fund', price:102.97 },
  { id:'HDFLC', code:'HDFLC', name:'HDFC Large Cap Fund', price:321.21 }
];

/* =======================
   Local storage helpers
   ======================= */
const STORAGE_KEY = 'ny_holdings_v1';

function getHoldings(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    return JSON.parse(raw) || [];
  }catch(e){
    console.error('holdings parse error', e);
    return [];
  }
}

function saveHoldings(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* Find holding by id/type */
function findHolding(id, type){
  return getHoldings().find(h => h.id === id && h.type === type);
}

/* Add or update holding when buying */
function buyInstrument(id, type, qty, price){
  const holdings = getHoldings();
  const idx = holdings.findIndex(h => h.id === id && h.type === type);
  qty = Math.max(1, Math.floor(qty));
  if(idx >= 0){
    const h = holdings[idx];
    // weighted average
    const totalCost = (h.avgBuy * h.qty) + (price * qty);
    h.qty += qty;
    h.avgBuy = +(totalCost / h.qty).toFixed(2);
    holdings[idx] = h;
  }else{
    holdings.push({ id, type, qty, avgBuy: +(+price).toFixed(2) });
  }
  saveHoldings(holdings);
  renderTopAssets();
}

/* Sell: subtract qty, remove if zero */
function sellInstrument(id, type, qty){
  const holdings = getHoldings();
  const idx = holdings.findIndex(h => h.id === id && h.type === type);
  qty = Math.max(1, Math.floor(qty));
  if(idx >= 0){
    const h = holdings[idx];
    h.qty -= qty;
    if(h.qty <= 0){
      holdings.splice(idx,1);
    } else {
      holdings[idx] = h;
    }
    saveHoldings(holdings);
    renderTopAssets();
  }
}

/* =======================
   Rendering helpers
   ======================= */
const listContainer = document.getElementById('listContainer');
const sectionTitle = document.getElementById('sectionTitle');

function formatCurrency(v){
  return '₹' + Number(v).toLocaleString(undefined, {minimumFractionDigits: v%1 ? 2 : 0, maximumFractionDigits:2});
}

/* compute top totals */
function renderTopAssets(){
  const holdings = getHoldings();
  let total = 0;
  let dayChange = 0;
  holdings.forEach(h=>{
    const catalog = h.type === 'stock' ? STOCKS : FUNDS;
    const item = catalog.find(i => i.id === h.id);
    if(item){
      const current = item.price * h.qty;
      const cost = h.avgBuy * h.qty;
      total += current;
      dayChange += (item.price - (item.price * 0.001)) * h.qty; // simple sample for "change" (demo)
    }
  });
  document.getElementById('assetsValue').textContent = formatCurrency(Math.round(total*100)/100);
  document.getElementById('assetsHoldings').textContent = 'Holdings: ' + holdings.reduce((s,h)=>s+h.qty,0);
  document.getElementById('dayChange').textContent = total ? `+${formatCurrency((total*0.05).toFixed(2))} (25.74%)` : '+₹0 (0.00%)';
}

/* Render list view: stocks or funds or portfolio */
function renderList(tab){
  listContainer.innerHTML = '';
  if(tab === 'stocks'){
    sectionTitle.textContent = 'Buy Stocks';
    STOCKS.forEach(s => {
      const c = makeCard(s, 'stock');
      listContainer.appendChild(c);
    });
  } else if(tab === 'funds'){
    sectionTitle.textContent = 'Mutual Funds';
    FUNDS.forEach(f => {
      const c = makeCard(f, 'fund');
      listContainer.appendChild(c);
    });
  } else {
    sectionTitle.textContent = 'Your Portfolio';
    renderPortfolio();
  }
}

/* create a card element for an instrument */
function makeCard(item, type){
  const card = document.createElement('div');
  card.className = 'card';
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.dataset.id = item.id;
  card.dataset.type = type;

  const left = document.createElement('div');
  left.className = 'card-left';
  const avatar = document.createElement('div');
  avatar.className = 'card-avatar';
  avatar.textContent = (item.short || (item.code || item.ticker||'').slice(0,2)).toUpperCase();
  left.appendChild(avatar);

  const body = document.createElement('div'); body.className = 'card-body';
  const title = document.createElement('div'); title.className = 'card-title';
  title.textContent = item.name;
  const sub = document.createElement('div'); sub.className = 'card-sub';
  sub.textContent = (type === 'stock' ? 'STOCK | ' + item.ticker : 'Fund | ' + (item.code || item.ticker || ''));
  body.appendChild(title); body.appendChild(sub);
  left.appendChild(body);

  const right = document.createElement('div'); right.className = 'card-right';
  const price = document.createElement('div'); price.className = 'card-price';
  price.textContent = formatCurrency(item.price);
  right.appendChild(price);

  // show arrow + percentage only if owned
  const holding = findHolding(item.id, type === 'stock' ? 'stock' : 'fund');
  if(holding){
    const change = document.createElement('div');
    const pct = ((item.price - holding.avgBuy) / holding.avgBuy) * 100;
    const cls = pct >= 0 ? 'card-change up' : 'card-change down';
    change.className = cls;
    change.textContent = (pct >= 0 ? '▲ ' : '▼ ') + Math.abs(pct).toFixed(2) + '%';
    right.appendChild(change);
  }

  card.appendChild(left);
  card.appendChild(right);

  // open overlay on click
  card.addEventListener('click', ()=> openOverlay(item, type));
  card.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openOverlay(item, type); }
  });

  return card;
}

/* Portfolio rendering */
function renderPortfolio(){
  const holdings = getHoldings();
  if(holdings.length === 0){
    const empt = document.createElement('div'); empt.style.color='var(--muted)'; empt.textContent='No holdings yet.';
    listContainer.appendChild(empt);
    return;
  }
  holdings.forEach(h=>{
    const catalog = h.type === 'stock' ? STOCKS : FUNDS;
    const item = catalog.find(i => i.id === h.id);
    if(!item) return;
    const card = document.createElement('div'); card.className = 'card';
    const left = document.createElement('div'); left.className = 'card-left';
    const avatar = document.createElement('div'); avatar.className='card-avatar'; avatar.textContent=(item.short||'--');
    left.appendChild(avatar);
    const body = document.createElement('div'); body.className='card-body';
    const title = document.createElement('div'); title.className='card-title'; title.textContent=item.name;
    const sub = document.createElement('div'); sub.className='card-sub'; sub.textContent = `${h.qty} @ ${formatCurrency(h.avgBuy)}`;
    body.appendChild(title); body.appendChild(sub); left.appendChild(body);
    const right = document.createElement('div'); right.className='card-right';
    const price = document.createElement('div'); price.className='card-price'; price.textContent = formatCurrency(item.price);
    const pl = document.createElement('div'); pl.className = 'card-change'; 
    const pnlVal = (item.price - h.avgBuy) * h.qty;
    pl.textContent = (pnlVal >= 0 ? '▲ ' : '▼ ') + Math.abs(pnlVal).toFixed(2);
    pl.className = (pnlVal >=0) ? 'card-change up' : 'card-change down';
    right.appendChild(price); right.appendChild(pl);
    card.appendChild(left); card.appendChild(right);
    // open overlay on click
    card.addEventListener('click', ()=> openOverlay(item, h.type));
    listContainer.appendChild(card);
  });
}

/* =======================
   Overlay & Chart logic
   ======================= */
const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlayContent');
const closeOverlayBtn = document.getElementById('closeOverlay');
const ovAvatar = document.getElementById('ovAvatar');
const ovName = document.getElementById('ovName');
const ovTicker = document.getElementById('ovTicker');
const ovPrice = document.getElementById('ovPrice');
const qtyInput = document.getElementById('qtyInput');
const buyBtn = document.getElementById('buyBtn');
const sellBtn = document.getElementById('sellBtn');
const sipBtn = document.getElementById('sipBtn');
const rangeButtons = Array.from(document.querySelectorAll('.range-btn'));
const canvas = document.getElementById('instrumentChart');
const chartContainer = document.getElementById('chartArea');

let currentInstrument = null; // {item, type}
let currentRange = '1D';
let chartDataCache = {}; // cache generated datasets per id+range

/* Fit canvas for crispness + prevent stretching (exact function required) */
function fitCanvas(canvasEl, container){
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvasEl.style.width = rect.width + 'px';
  canvasEl.style.height = rect.height + 'px';
  canvasEl.width = Math.round(rect.width * dpr);
  canvasEl.height = Math.round(rect.height * dpr);
  const ctx = canvasEl.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* Basic line chart drawing - clears and draws a stroked line */
function drawChartWithData(canvasEl, container, data){
  // ensure canvas sized first
  const ctx = fitCanvas(canvasEl, container);
  // clear full canvas
  ctx.clearRect(0,0,canvasEl.width,canvasEl.height);

  // chart layout (CSS pixels)
  const cssW = parseFloat(canvasEl.style.width);
  const cssH = parseFloat(canvasEl.style.height);

  if(!cssW || !cssH) return;

  const padding = 28;
  const w = cssW - padding*2;
  const h = cssH - padding*2;

  // compute min/max
  const values = data;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  // grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i=0;i<4;i++){
    const y = padding + (h * i / 4);
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + w, y);
  }
  ctx.stroke();

  // draw line
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#22c17b'; // green line
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  values.forEach((v, idx) => {
    const x = padding + (w * idx / Math.max(1, values.length-1));
    const y = padding + h - ((v - minV) / range) * h;
    if(idx === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // right side small price label
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('₹' + Math.round(values[values.length-1]), padding + w, padding + 12);
}

/* generate pseudo historical data around base price for ranges */
function generateData(id, basePrice, range){
  const key = `${id}_${range}`;
  if(chartDataCache[key]) return chartDataCache[key];

  let points;
  switch(range){
    case '1D': points = 60; break;
    case '1W': points = 50; break;
    case '1M': points = 80; break;
    case '6M': points = 120; break;
    case '1Y': points = 200; break;
    default: points = 60;
  }
  const out = [];
  let cur = basePrice;
  for(let i=0;i<points;i++){
    // small random walk
    const rnd = (Math.random() - 0.45) * (basePrice * 0.01);
    cur = Math.max(1, cur + rnd);
    out.push(+cur.toFixed(2));
  }
  chartDataCache[key] = out;
  return out;
}

/* Open overlay for item */
function openOverlay(item, type){
  currentInstrument = { item, type };
  // populate header
  ovAvatar.textContent = (item.short || (item.code||'--').slice(0,2)).toUpperCase();
  ovName.textContent = item.name;
  ovTicker.textContent = (type === 'stock' ? 'STOCK | ' + (item.ticker || '') : 'Fund | ' + (item.code || ''));
  ovPrice.textContent = formatCurrency(item.price);
  qtyInput.value = 1;
  // default range
  currentRange = '1D';
  updateRangeButtons();

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden','false');

  // ensure canvas sized and draw
  requestAnimationFrame(()=> {
    const data = generateData(item.id, item.price, currentRange);
    drawChartWithData(canvas, chartContainer, data);
  });
}

/* Close overlay */
function closeOverlay(){
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden','true');
  currentInstrument = null;
}

/* update range button active state */
function updateRangeButtons(){
  rangeButtons.forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.range === currentRange);
  });
}

/* hook range changes */
rangeButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    currentRange = btn.dataset.range;
    updateRangeButtons();
    if(!currentInstrument) return;
    const data = generateData(currentInstrument.item.id, currentInstrument.item.price, currentRange);
    drawChartWithData(canvas, chartContainer, data);
  });
});

/* overlay action handlers */
buyBtn.addEventListener('click', ()=>{
  if(!currentInstrument) return;
  const qty = Math.max(1, Number(qtyInput.value) || 1);
  buyInstrument(currentInstrument.item.id, currentInstrument.type === 'stock' ? 'stock' : 'fund', qty, currentInstrument.item.price);
  // redraw list & close overlay (or keep open)
  renderList(getActiveTab());
  renderTopAssets();
});
sellBtn.addEventListener('click', ()=>{
  if(!currentInstrument) return;
  const qty = Math.max(1, Number(qtyInput.value) || 1);
  sellInstrument(currentInstrument.item.id, currentInstrument.type === 'stock' ? 'stock' : 'fund', qty);
  renderList(getActiveTab());
  renderTopAssets();
});
sipBtn.addEventListener('click', ()=>{
  alert('SIP clicked — demo placeholder');
});

/* close overlay */
closeOverlayBtn.addEventListener('click', closeOverlay);
overlay.addEventListener('click', (ev)=>{
  if(ev.target === overlay) closeOverlay();
});

/* keep canvas fit on resize */
window.addEventListener('resize', ()=>{
  if(currentInstrument){
    const data = generateData(currentInstrument.item.id, currentInstrument.item.price, currentRange);
    drawChartWithData(canvas, chartContainer, data);
  }
});

/* =======================
   Tabs wiring
   ======================= */
const tabButtons = Array.from(document.querySelectorAll('.tab'));
const bottomNavBtns = Array.from(document.querySelectorAll('.bnav'));

function setActiveTab(name){
  tabButtons.forEach(t=>t.classList.toggle('active', t.dataset.tab === name));
  bottomNavBtns.forEach(t=>t.classList.toggle('active', t.dataset.tab === name));
  renderList(name);
}
function getActiveTab(){
  const active = tabButtons.find(t=>t.classList.contains('active'));
  return active ? active.dataset.tab : 'stocks';
}
tabButtons.forEach(btn => btn.addEventListener('click', ()=> setActiveTab(btn.dataset.tab)));
bottomNavBtns.forEach(btn => btn.addEventListener('click', ()=> setActiveTab(btn.dataset.tab)));

/* =======================
   Initialization
   ======================= */
function init(){
  // initial top asset render
  renderTopAssets();
  // default tab
  setActiveTab('stocks');
  // draw any cached overlay chart if open later
}
init();

/* Expose for debugging in console */
window.NY = {
  STOCKS, FUNDS, getHoldings, saveHoldings, buyInstrument, sellInstrument, fitCanvas
};
