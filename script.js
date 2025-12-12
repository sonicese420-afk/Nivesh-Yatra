/* -------------------------------------------------------------------------
   Nivesh Yatra — script.js
   Responsibilities:
   - Populate lists (stocks & funds)
   - Tab switching and bottom pill navigation
   - Detail overlay with chart canvas that resizes correctly
   - Buy/Sell/SIP simulated operations with localStorage
   - Defensive checks and utility helpers
   ------------------------------------------------------------------------- */

'use strict';

/* ---------------------------
   Mock data (replace with real API later)
   --------------------------- */
const STOCKS = [
  { id: 'RELI', ticker: 'RELIANCE', short: 'RE', name: 'Reliance Industries Ltd', price: 1398.07 },
  { id: 'TATM', ticker: 'TATAMOTORS', short: 'TM', name: 'Tata Motors', price: 1006.98 },
  { id: 'ADGN', ticker: 'ADANIGREEN', short: 'AG', name: 'Adani Green', price: 1181.45 },
  { id: 'WIPR', ticker: 'WIPRO', short: 'W', name: 'Wipro', price: 1485.01 }
];

const FUNDS = [
  { id: 'EDEL', code: 'EDEL', name: 'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', price: 232.4 },
  { id: 'HDFM', code: 'HDFCMID', name: 'HDFC Mid Cap Fund', price: 132.76 },
  { id: 'HDFSC', code: 'HDFCSM', name: 'HDFC Small Cap Fund', price: 276.12 },
  { id: 'NIPL', code: 'NIPPL', name: 'Nippon India Large Cap Fund', price: 219.33 },
  { id: 'SBIL', code: 'SBIL', name: 'SBI Large Cap Fund', price: 189.44 },
  { id: 'NIPM', code: 'NIPPM', name: 'Nippon India Mid Cap Fund', price: 160.55 },
  { id: 'NIPS', code: 'NIPPS', name: 'Nippon India Small Cap Fund', price: 102.97 },
  { id: 'HDFLC', code: 'HDFLC', name: 'HDFC Large Cap Fund', price: 321.21 }
];

/* ---------------------------
   Local storage & holdings
   --------------------------- */
const STORAGE_KEY = 'ny_holdings_v1';

/**
 * holdings structure:
 * { stocks: { RE: { qty: 2, avg: 100 } }, funds: { EDEL: { units: x, avg: y } } }
 */
function loadHoldings(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return { stocks: {}, funds: {} };
    return JSON.parse(raw);
  }catch(e){
    console.error('Could not parse holdings', e);
    return { stocks: {}, funds: {} };
  }
}
function saveHoldings(h){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  }catch(e){
    console.error('Could not save holdings', e);
  }
}
let holdings = loadHoldings();

/* ---------------------------
   DOM helpers
   --------------------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function formatINR(n){
  if(typeof n !== 'number') n = Number(n) || 0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

/* ---------------------------
   Renderers
   --------------------------- */
function renderStocks(){
  const root = $('#stocksList');
  root.innerHTML = '';
  STOCKS.forEach(stock => {
    const el = document.createElement('div');
    el.className = 'item';
    const owned = holdings.stocks[stock.short];
    let ownedHtml = '';
    if(owned){
      const change = computeMockPLPercent(stock.price, owned.avg);
      const arrow = change >= 0 ? '▲' : '▼';
      const color = change >= 0 ? 'var(--accent)' : '#ff5b5b';
      ownedHtml = `<div class="owned-pill" style="background:rgba(0,0,0,0.05);color:${color}">${arrow} ${Math.abs(change).toFixed(2)}%</div>`;
    }

    el.innerHTML = `
      <div class="left">
        <div class="avatar">${stock.short}</div>
        <div class="meta">
          <div class="name">${stock.name}</div>
          <div class="sub">Stock | ${stock.ticker}</div>
          ${owned ? ownedHtml : ''}
        </div>
      </div>
      <div class="price">${formatINR(stock.price)} ${owned ? '<small>owned: ' + holdings.stocks[stock.short].qty + '</small>' : ''}</div>
    `;
    el.addEventListener('click', () => openDetail('stock', stock.id));
    root.appendChild(el);
  });
}

function renderFunds(){
  const root = $('#fundsList');
  root.innerHTML = '';
  FUNDS.forEach(fund => {
    const el = document.createElement('div');
    el.className = 'item';
    const owned = holdings.funds[fund.code];
    el.innerHTML = `
      <div class="left">
        <div class="avatar">${fund.code.substring(0,2)}</div>
        <div class="meta">
          <div class="name">${fund.name}</div>
          <div class="sub">Fund | ${fund.code}</div>
          ${owned ? `<div class="owned-pill" style="background:rgba(0,0,0,0.05);">units: ${owned.units}</div>` : ''}
        </div>
      </div>
      <div class="price">${formatINR(fund.price)}</div>
    `;
    el.addEventListener('click', () => openDetail('fund', fund.id));
    root.appendChild(el);
  });
}

function renderPortfolio(){
  const root = $('#portfolioList');
  root.innerHTML = '';
  const stocksKeys = Object.keys(holdings.stocks || {});
  const fundsKeys = Object.keys(holdings.funds || {});
  if(stocksKeys.length === 0 && fundsKeys.length === 0){
    root.innerHTML = `<div class="empty">You don't own anything yet. Buy stocks or funds to populate your portfolio.</div>`;
    return;
  }
  // list stocks first
  stocksKeys.forEach(sym => {
    const h = holdings.stocks[sym];
    // find source stock data
    const s = STOCKS.find(x => x.short === sym);
    if(!s) return;
    const el = document.createElement('div');
    el.className = 'item';
    const plPercent = computeMockPLPercent(s.price, h.avg);
    const arrow = plPercent >= 0 ? '▲' : '▼';
    const color = plPercent >= 0 ? 'var(--accent)' : '#ff5b5b';
    el.innerHTML = `
      <div class="left">
        <div class="avatar">${s.short}</div>
        <div class="meta">
          <div class="name">${s.name}</div>
          <div class="sub">Stock | ${s.ticker}</div>
          <div style="margin-top:8px;color:var(--muted);font-weight:700">Qty: ${h.qty} @ ${formatINR(h.avg)}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="price">${formatINR(s.price)}</div>
        <div style="margin-top:8px;color:${color};font-weight:800">${arrow} ${Math.abs(plPercent).toFixed(2)}%</div>
      </div>
    `;
    el.addEventListener('click', () => openDetail('stock', s.id));
    root.appendChild(el);
  });

  // list funds next
  fundsKeys.forEach(code => {
    const fHolding = holdings.funds[code];
    const fund = FUNDS.find(x => x.code === code);
    if(!fund) return;
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="left">
        <div class="avatar">${fund.code.substring(0,2)}</div>
        <div class="meta">
          <div class="name">${fund.name}</div>
          <div class="sub">Fund | ${fund.code}</div>
          <div style="margin-top:8px;color:var(--muted);font-weight:700">Units: ${fHolding.units} @ ${formatINR(fHolding.avg)}</div>
        </div>
      </div>
      <div class="price">${formatINR(fund.price)}</div>
    `;
    el.addEventListener('click', () => openDetail('fund', fund.id));
    root.appendChild(el);
  });
}

/* ---------------------------
   Simple mock P/L calculator
   (for demo only)
   --------------------------- */
function computeMockPLPercent(current, avg){
  if(!avg || avg === 0) return 0;
  return ((current - avg) / avg) * 100;
}

/* ---------------------------
   Tab plumbing
   --------------------------- */
function setActiveTab(tabName){
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  $$('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  $('#stocksSection').hidden = tabName !== 'stocks';
  $('#fundsSection').hidden = tabName !== 'funds';
  $('#portfolioSection').hidden = tabName !== 'portfolio';
}

/* attach tab events */
$$('.tab').forEach(b => b.addEventListener('click', e => {
  setActiveTab(b.dataset.tab);
}));

$$('.pill-btn').forEach(b => b.addEventListener('click', e => {
  setActiveTab(b.dataset.tab);
}));

/* ---------------------------
   Detail overlay + chart
   --------------------------- */

const detailOverlay = $('#detailOverlay');
const detailChartCanvas = $('#detailChart');
const detail = {
  type: null,   // 'stock' or 'fund'
  id: null,
  dataCache: {}
};
let chartInstance = null;

/**
 * Opens the detail overlay for given type/id
 */
function openDetail(type, id){
  detail.type = type;
  detail.id = id;
  populateDetailHeader(type, id);
  detailOverlay.hidden = false;
  // draw the chart for default range 1d
  drawDetailChart('1d');
}

/**
 * Closes detail overlay
 */
$('#closeDetail').addEventListener('click', () => {
  detailOverlay.hidden = true;
  // clear canvas
  clearCanvas(detailChartCanvas);
});

/* populate header details in overlay */
function populateDetailHeader(type, id){
  let item = null;
  if(type === 'stock') item = STOCKS.find(s => s.id === id);
  else if(type === 'fund') item = FUNDS.find(f => f.id === id);
  if(!item) return;
  $('#detailAvatar').textContent = (item.short || item.code || 'ND').substring(0,2);
  $('#detailName').textContent = item.name;
  $('#detailSub').textContent = (type === 'stock' ? 'Stock | ' + item.ticker : 'Fund | ' + (item.code||''));
  $('#detailPrice').textContent = formatINR(item.price);
  // show / hide owned change badge only if owned
  if(type === 'stock'){
    const owned = holdings.stocks[item.short];
    if(owned){
      const change = computeMockPLPercent(item.price, owned.avg);
      const arrow = change >= 0 ? '▲' : '▼';
      $('#detailChangeBadge').hidden = false;
      $('#detailChangeBadge').textContent = `${arrow} ${Math.abs(change).toFixed(2)}%`;
      $('#detailChangeBadge').style.color = change >= 0 ? 'var(--accent)' : '#ff5b5b';
    }else{
      $('#detailChangeBadge').hidden = true;
    }
  } else {
    $('#detailChangeBadge').hidden = true;
  }
}

/* Chart drawing: small, robust canvas-based line chart */

/* ensure canvas is properly sized for devicePixelRatio to avoid blurring and stretching */
function fitCanvasToContainer(canvas){
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }
}

/* clear canvas helper */
function clearCanvas(canvas){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width, canvas.height);
}

/* draw grid lines on canvas */
function drawGrid(ctx, w, h, gridCount=5){
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for(let i=0;i<=gridCount;i++){
    const y = (h / gridCount) * i + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

/* draw a simple smoothed line (polyline with quadratic smoothing) */
function drawLine(ctx, pts, w, h, strokeColor='rgba(47,213,159,1)'){
  if(pts.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w,h) * 0.008));
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for(let i=1;i<pts.length-1;i++){
    const xc = (pts[i].x + pts[i+1].x) / 2;
    const yc = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.stroke();
  ctx.restore();
}

/* generate mock data for chart ranges -- returns array of numbers */
function generateMockSeries(basePrice, points=100, volatility=0.02){
  // start at basePrice +/- small random
  const arr = [];
  let p = basePrice * (1 + (Math.random()-0.5)*0.01);
  for(let i=0;i<points;i++){
    const change = (Math.random()-0.5) * volatility * basePrice;
    p = Math.max(1, p + change);
    arr.push(parseFloat(p.toFixed(2)));
  }
  return arr;
}

/* map numeric series to canvas points */
function seriesToPoints(series, w, h, padding=24){
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = (max - min) || 1;
  const pts = [];
  const innerW = w - padding*2;
  const innerH = h - padding*2;
  for(let i=0;i<series.length;i++){
    const x = padding + (i / (series.length-1)) * innerW;
    const y = padding + innerH - ((series[i] - min) / span) * innerH;
    pts.push({ x, y, value: series[i] });
  }
  return pts;
}

/* main draw function for the detail chart */
function drawDetailChart(rangeKey='1d'){
  // choose the base price from selected item
  let basePrice = 1000;
  let item = null;
  if(detail.type === 'stock'){
    item = STOCKS.find(s => s.id === detail.id);
    basePrice = item ? item.price : 1000;
  } else if(detail.type === 'fund'){
    item = FUNDS.find(f => f.id === detail.id);
    basePrice = item ? item.price : 200;
  }

  // select points by range
  let points = 100;
  if(rangeKey === '1d') points = 100;
  if(rangeKey === '1w') points = 200;
  if(rangeKey === '1m') points = 300;
  if(rangeKey === '6m') points = 400;
  if(rangeKey === '1y') points = 500;

  // cache key
  const cacheKey = detail.type + ':' + detail.id + ':' + rangeKey;
  let series = detail.dataCache[cacheKey];
  if(!series){
    series = generateMockSeries(basePrice, points, rangeKey === '1d' ? 0.02 : 0.06);
    detail.dataCache[cacheKey] = series;
  }

  // fit canvas appropriately
  const canvas = detailChartCanvas;
  fitCanvasToContainer(canvas);
  const ctx = canvas.getContext('2d');
  // high DPI transform
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  ctx.setTransform(1,0,0,1,0,0); // reset
  clearCanvas(canvas);

  const w = canvas.width;
  const h = canvas.height;

  // draw background grid
  drawGrid(ctx, w, h, 6);

  // convert series to points and draw line
  const pts = seriesToPoints(series, w, h, Math.round(Math.max(22, w * 0.03)));
  drawLine(ctx, pts, w, h, 'rgba(47,213,159,1)');

  // draw right-side labels (max and min)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.font = (12 * dpr) + 'px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('' + pts[0].value.toFixed(2), w - 12 * dpr, pts[0].y - 6 * dpr);
  const last = pts[pts.length-1];
  ctx.fillText('' + last.value.toFixed(2), w - 12 * dpr, last.y - 6 * dpr);
  ctx.restore();
}

/* Chart controls */
$$('.chart-btn').forEach(b => {
  b.addEventListener('click', () => {
    $$('.chart-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    drawDetailChart(b.dataset.range);
  });
});

/* Resize observer to redraw chart on size change (fixes stretching bug) */
(function attachResizeWatcher(){
  if(!detailChartCanvas) return;
  // ensure the canvas container has an explicit size before resizing
  const ro = new ResizeObserver(entries => {
    for(const e of entries){
      // only redraw if overlay is visible
      if(!detailOverlay.hidden){
        // redraw current range (find active control)
        const active = document.querySelector('.chart-btn.active');
        drawDetailChart(active ? active.dataset.range : '1d');
      }
    }
  });
  ro.observe(detailChartCanvas);
})();

/* ---------------------------
   Buy / Sell / SIP logic
   --------------------------- */
$('#buyBtn').addEventListener('click', () => {
  const qty = Math.max(1, parseInt($('#qtyInput').value || '1', 10));
  if(detail.type === 'stock'){
    const s = STOCKS.find(x => x.id === detail.id);
    if(!s) return;
    const sym = s.short;
    const existing = holdings.stocks[sym] || { qty: 0, avg: 0 };
    // new avg = (existing.avg*existing.qty + price*qty)/newQty
    const newQty = existing.qty + qty;
    const newAvg = ((existing.avg * existing.qty) + (s.price * qty)) / newQty;
    holdings.stocks[sym] = { qty: newQty, avg: parseFloat(newAvg.toFixed(2)) };
    saveHoldings(holdings);
    renderAll();
    // update badge
    populateDetailHeader('stock', detail.id);
  }else{
    // funds buy -> units
    const f = FUNDS.find(x => x.id === detail.id);
    if(!f) return;
    const code = f.code;
    const existing = holdings.funds[code] || { units: 0, avg: 0 };
    const newUnits = existing.units + qty; // treat qty as units
    const newAvg = ((existing.avg * existing.units) + (f.price * qty)) / newUnits;
    holdings.funds[code] = { units: newUnits, avg: parseFloat(newAvg.toFixed(2)) };
    saveHoldings(holdings);
    renderAll();
  }
});

$('#sellBtn').addEventListener('click', () => {
  const qty = Math.max(1, parseInt($('#qtyInput').value || '1', 10));
  if(detail.type === 'stock'){
    const s = STOCKS.find(x => x.id === detail.id);
    if(!s) return;
    const sym = s.short;
    const existing = holdings.stocks[sym];
    if(!existing || existing.qty < qty){
      alert('Not enough quantity to sell');
      return;
    }
    const remaining = existing.qty - qty;
    if(remaining === 0) delete holdings.stocks[sym];
    else holdings.stocks[sym].qty = remaining;
    saveHoldings(holdings);
    renderAll();
    populateDetailHeader('stock', detail.id);
  }else{
    const f = FUNDS.find(x => x.id === detail.id);
    if(!f) return;
    const code = f.code;
    const existing = holdings.funds[code];
    if(!existing || existing.units < qty){
      alert('Not enough units to redeem');
      return;
    }
    const remaining = existing.units - qty;
    if(remaining === 0) delete holdings.funds[code];
    else holdings.funds[code].units = remaining;
    saveHoldings(holdings);
    renderAll();
  }
});

$('#sipBtn').addEventListener('click', () => {
  // simple SIP simulation — just buy 1 unit each click
  if(detail.type === 'fund'){
    $('#qtyInput').value = Math.max(1, parseInt($('#qtyInput').value || '1', 10));
    $('#buyBtn').click();
    alert('SIP simulated: bought units');
  }else{
    alert('SIP currently works for funds only (simulated).');
  }
});

/* ---------------------------
   Utility - update assets card values
   --------------------------- */
function updateAssetsCard(){
  // compute total portfolio value - for demo use current price * qty
  let total = 0;
  let holdingsCount = 0;
  Object.keys(holdings.stocks).forEach(sym => {
    const h = holdings.stocks[sym];
    const s = STOCKS.find(x => x.short === sym);
    if(!s) return;
    total += s.price * h.qty;
    holdingsCount += h.qty;
  });
  Object.keys(holdings.funds).forEach(code => {
    const h = holdings.funds[code];
    const f = FUNDS.find(x => x.code === code);
    if(!f) return;
    total += f.price * h.units;
    holdingsCount += h.units;
  });
  $('#assetsValue').textContent = formatINR(total);
  $('#assetsHoldings').textContent = 'Holdings: ' + holdingsCount;
  // compute change mock (random for demo)
  const change = parseFloat(((Math.random()-0.5)*200).toFixed(2));
  $('#assetsChange').textContent = (change>=0?'+':'') + formatINR(change) + ' (' + (change>=0?'+':'') + ( (change/Math.max(1,total))*100 ).toFixed(2) + '%)';
}

/* ---------------------------
   Render everything
   --------------------------- */
function renderAll(){
  renderStocks();
  renderFunds();
  renderPortfolio();
  updateAssetsCard();
}

/* ---------------------------
   Init
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  // top toggle eye (show/hide assets)
  $('#toggleEye').addEventListener('click', () => {
    const visible = $('#assetsValue').style.visibility !== 'hidden';
    $('#assetsValue').style.visibility = visible ? 'hidden' : 'visible';
    $('#assetsHoldings').style.visibility = visible ? 'hidden' : 'visible';
  });

  // ensure detail overlay closes on backdrop click (optional)
  detailOverlay.addEventListener('click', (ev) => {
    if(ev.target === detailOverlay) detailOverlay.hidden = true;
  });

  // make initial tab stocks
  setActiveTab('stocks');
});

/* ---------------------------
   Extra utility: keyboard close (escape)
   --------------------------- */
window.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !detailOverlay.
