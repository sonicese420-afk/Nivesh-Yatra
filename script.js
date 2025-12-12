/* =======================================================================
   script.js
   Purpose: UI logic for stocks/funds/portfolio, drawer interactions, chart
   Storage: uses localStorage key 'nv_portfolio'
   ======================================================================= */

/* --------------------------
   Demo data (stocks + funds)
   -------------------------- */
const STOCKS = [
  { id:'RE', name:'Reliance Industries Ltd', sym:'RELIANCE', price: 1398.07 },
  { id:'TM', name:'Tata Motors', sym:'TATAMOTORS', price: 1006.98 },
  { id:'AG', name:'Adani Green', sym:'ADANIGREEN', price: 1181.45 },
  { id:'WI', name:'Wipro', sym:'WIPRO', price: 574.44 },
  { id:'MR', name:'MRF', sym:'MRF', price: 1898.78 },
  { id:'HD', name:'HDFC', sym:'HDFC', price: 1846.28 },
  { id:'AF', name:'Affle 3i Ltd', sym:'AFFLE', price: 410.22 }
];

const FUNDS = [
  { id:'ED', name:'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', sym:'EDEL', price: 232.4 },
  { id:'HM', name:'HDFC Mid Cap Fund', sym:'HDFC_MID', price: 132.76 },
  { id:'HS', name:'HDFC Small Cap Fund', sym:'HDFC_SM', price: 276.12 },
  { id:'NL', name:'Nippon India Large Cap Fund', sym:'NIPPON_L', price: 98.34 },
  { id:'SB', name:'SBI Large Cap Fund', sym:'SBI_L', price: 110.45 },
  { id:'NM', name:'Nippon India Mid Cap Fund', sym:'NIPPON_M', price: 145.22 },
  { id:'NS', name:'Nippon India Small Cap Fund', sym:'NIPPON_S', price: 63.15 },
  { id:'HL', name:'HDFC Large Cap Fund', sym:'HDFC_L', price: 121.88 }
];

/* --------------------------
   Local storage portfolio
   -------------------------- */
const STORAGE_KEY = 'nv_portfolio_v2';
let portfolio = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

/* --------------------------
   DOM refs
   -------------------------- */
const cardsContainer = document.getElementById('cardsContainer');
const sectionTitle = document.getElementById('sectionTitle');
const totalAssetsEl = document.getElementById('totalAssets');
const holdingsCountEl = document.getElementById('holdingsCount');
const totalChangeEl = document.getElementById('totalChange');

const tabStocks = document.getElementById('tabStocks');
const tabFunds = document.getElementById('tabFunds');
const tabPortfolio = document.getElementById('tabPortfolio');

const detailDrawer = document.getElementById('detailDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const closeDrawer = document.getElementById('closeDrawer');

const detailName = document.getElementById('detailName');
const detailType = document.getElementById('detailType');
const detailPriceLarge = document.getElementById('detailPriceLarge');
const detailChangeLarge = document.getElementById('detailChangeLarge');
const detailAvatar = document.getElementById('detailAvatar');
const tradeQtyInput = document.getElementById('tradeQty');

const buyAction = document.getElementById('buyAction');
const sellAction = document.getElementById('sellAction');
const sipAction = document.getElementById('sipAction');

const rangeButtons = Array.from(document.querySelectorAll('.range-btn'));

let activeContext = 'stocks'; // stocks | funds | portfolio
let activeDetail = null; // currently opened company/fund object
let detailChart = null;

/* --------------------------
   Helpers
   -------------------------- */
function savePortfolio(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function fmtMoney(n){
  if(typeof n !== 'number') n = Number(n) || 0;
  return '₹' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/* --------------------------
   Render functions
   -------------------------- */
function renderStocks(){
  sectionTitle.textContent = 'Buy Stocks';
  cardsContainer.innerHTML = '';
  STOCKS.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = 'stock';
    card.dataset.id = s.id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = s.id.slice(0,2);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = s.name;
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = `Stock | ${s.sym}`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const right = document.createElement('div');
    right.className = 'right';
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = fmtMoney(s.price);

    right.appendChild(price);

    // If owned, show arrow & percent small badge on the right
    if(portfolio[s.id] && portfolio[s.id].qty > 0){
      const badge = document.createElement('div');
      badge.className = 'pct';
      const change = ((Math.random()*2) - 0.5).toFixed(2);
      badge.textContent = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change) + '%';
      badge.style.color = change >= 0 ? 'var(--accent)' : 'var(--danger)';
      right.appendChild(badge);
    }

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(right);

    card.addEventListener('click', ()=>openDetail('stock', s));
    cardsContainer.appendChild(card);
  });
  updateSummary();
}

function renderFunds(){
  sectionTitle.textContent = 'Mutual Funds';
  cardsContainer.innerHTML = '';
  FUNDS.forEach(f=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = 'fund';
    card.dataset.id = f.id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = f.id.slice(0,2);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = f.name;
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = `Fund | ${f.sym}`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const right = document.createElement('div');
    right.className = 'right';
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = fmtMoney(f.price);

    right.appendChild(price);

    // If owned fund we show badge
    if(portfolio[f.id] && portfolio[f.id].qty > 0){
      const badge = document.createElement('div');
      badge.className = 'pct';
      const change = ((Math.random()*2) - 0.5).toFixed(2);
      badge.textContent = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change) + '%';
      badge.style.color = change >= 0 ? 'var(--accent)' : 'var(--danger)';
      right.appendChild(badge);
    }

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(right);

    card.addEventListener('click', ()=>openDetail('fund', f));
    cardsContainer.appendChild(card);
  });
  updateSummary();
}

function renderPortfolio(){
  sectionTitle.textContent = 'Your Portfolio';
  cardsContainer.innerHTML = '';

  let any = false;
  // Merge stocks and funds arrays for lookup
  const all = [...STOCKS, ...FUNDS];

  for(const id in portfolio){
    const pos = portfolio[id];
    const info = all.find(x=>x.id === id);
    if(!info) continue;
    any = true;
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = (STOCKS.find(s=>s.id===id) ? 'stock' : 'fund');
    card.dataset.id = id;

    const avatar = document.createElement('div'); avatar.className='avatar'; avatar.textContent = id.slice(0,2);

    const meta = document.createElement('div'); meta.className='meta';
    const title = document.createElement('div'); title.className='title'; title.textContent=info.name;
    const sub = document.createElement('div'); sub.className='sub'; sub.textContent = `You own ${pos.qty} @ avg ${fmtMoney(pos.avg)}`;
    meta.appendChild(title); meta.appendChild(sub);

    const right = document.createElement('div'); right.className='right';
    const value = (info.price * pos.qty);
    const price = document.createElement('div'); price.className='price'; price.textContent = fmtMoney(value);
    const pct = document.createElement('div'); pct.className='pct';

    // derive P/L percent fictitiously
    const pl = ((((info.price - pos.avg) / pos.avg) * 100)).toFixed(2);
    pct.textContent = (pl >= 0 ? '▲ ' : '▼ ') + Math.abs(pl) + '%';
    pct.style.color = pl >= 0 ? 'var(--accent)' : 'var(--danger)';

    right.appendChild(price); right.appendChild(pct);

    card.appendChild(avatar); card.appendChild(meta); card.appendChild(right);

    card.addEventListener('click', ()=>openDetail(card.dataset.type, info));
    cardsContainer.appendChild(card);
  }

  if(!any){
    const el = document.createElement('div');
    el.style.padding = '18px';
    el.style.color = 'var(--muted)';
    el.textContent = 'No holdings yet — buy some stocks or funds to see them here.';
    cardsContainer.appendChild(el);
  }
  updateSummary();
}

/* --------------------------
   Summary calculation
   -------------------------- */
function updateSummary(){
  // compute total assets & holdings
  let total = 0;
  let holdings = 0;

  const all = [...STOCKS, ...FUNDS];
  for(const id in portfolio){
    const pos = portfolio[id];
    const info = all.find(x=>x.id === id);
    if(!info) continue;
    total += info.price * pos.qty;
    holdings += pos.qty;
  }

  totalAssetsEl.textContent = fmtMoney(total);
  holdingsCountEl.textContent = 'Holdings: ' + holdings;
  // change pill is demo
  totalChangeEl.textContent = (total === 0 ? '+₹0 (0.00%)' : `+₹${(total*0.02).toFixed(2)} (2.00%)`);
}

/* --------------------------
   Drawer (detail) logic
   -------------------------- */
function openDetail(type, item){
  activeDetail = { type, item };
  detailDrawer.classList.remove('hidden');
  detailDrawer.setAttribute('aria-hidden','false');
  detailName.textContent = item.name;
  detailType.textContent = `${type === 'stock' ? 'Stock' : 'Fund'} | ${item.sym}`;
  detailPriceLarge.textContent = fmtMoney(item.price);
  detailAvatar.textContent = item.id.slice(0,2);

  // show change only if owned
  const pos = portfolio[item.id];
  if(pos && pos.qty > 0){
    const change = ((Math.random()*3)-1.0).toFixed(2);
    detailChangeLarge.textContent = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change) + '%';
    detailChangeLarge.style.color = change >= 0 ? 'var(--accent)' : 'var(--danger)';
  } else {
    detailChangeLarge.textContent = '';
  }

  // default range active
  rangeButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector('.range-btn[data-range="1D"]').classList.add('active');

  // draw chart (random placeholder)
  drawDetailChart(item.price, '1D');

  // reset qty input
  tradeQtyInput.value = 1;
}

function closeDetail(){
  detailDrawer.classList.add('hidden');
  detailDrawer.setAttribute('aria-hidden','true');
  activeDetail = null;
  if(detailChart) {
    try{ detailChart.destroy(); }catch(e){}
    detailChart = null;
  }
}

/* --------------------------
   Trade actions
   -------------------------- */
function buyActive(){
  if(!activeDetail) return;
  const qty = Math.max(1, Number(tradeQtyInput.value) || 1);
  const id = activeDetail.item.id;
  const price = activeDetail.item.price;

  if(!portfolio[id]) portfolio[id] = { qty: 0, avg: price };
  const current = portfolio[id];
  const newAvg = ((current.avg * current.qty) + (price * qty)) / (current.qty + qty);
  current.avg = newAvg;
  current.qty += qty;
  savePortfolio();
  renderCurrent();
  closeDetail();
}

function sellActive(){
  if(!activeDetail) return;
  const qty = Math.max(1, Number(tradeQtyInput.value) || 1);
  const id = activeDetail.item.id;
  if(!portfolio[id]) return;
  portfolio[id].qty = Math.max(0, portfolio[id].qty - qty);
  if(portfolio[id].qty === 0) delete portfolio[id];
  savePortfolio();
  renderCurrent();
  closeDetail();
}

function sipActive(){
  if(!activeDetail) return;
  const id = activeDetail.item.id;
  const price = activeDetail.item.price;
  if(!portfolio[id]) portfolio[id] = { qty: 0, avg: price };
  const current = portfolio[id];
  // SIP adds 1 unit at current price
  current.avg = ((current.avg * current.qty) + price) / (current.qty + 1);
  current.qty += 1;
  savePortfolio();
  renderCurrent();
  closeDetail();
}

/* --------------------------
   Chart drawing (placeholder random data)
   -------------------------- */
function drawDetailChart(basePrice, range){
  const ctx = document.getElementById('detailChart').getContext('2d');
  const count = range === '1D' ? 60 : range === '1W' ? 40 : range === '1M' ? 50 : range === '6M' ? 80 : 100;
  const labels = Array.from({length:count}, (_,i)=> '');
  const data = [];
  let v = basePrice;
  for(let i=0;i<count;i++){
    v += (Math.random() - 0.5) * (basePrice * 0.01);
    data.push(Math.max(10, Number(v.toFixed(2))));
  }
  if(detailChart) try{ detailChart.destroy(); }catch(e){}
  detailChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#2fd59f',
        backgroundColor: 'rgba(47,213,159,0.06)',
        pointRadius: 0,
        tension: 0.3,
      }]
    },
    options: {
      animation: { duration: 200 },
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          display: true,
          ticks: { color: 'rgba(255,255,255,0.65)' },
          grid: { color: 'rgba(255,255,255,0.03)' }
        }
      }
    }
  });
}

/* --------------------------
   Event wiring
   -------------------------- */
tabStocks.addEventListener('click', ()=>{
  setActiveTab('stocks'); renderStocks();
});
tabFunds.addEventListener('click', ()=>{
  setActiveTab('funds'); renderFunds();
});
tabPortfolio.addEventListener('click', ()=>{
  setActiveTab('portfolio'); renderPortfolio();
});

drawerBackdrop.addEventListener('click', closeDetail);
closeDrawer.addEventListener('click', closeDetail);

buyAction.addEventListener('click', buyActive);
sellAction.addEventListener('click', sellActive);
sipAction.addEventListener('click', sipActive);

rangeButtons.forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    rangeButtons.forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    // draw chart with new range
    if(activeDetail && activeDetail.item) drawDetailChart(activeDetail.item.price, btn.dataset.range);
  });
});

/* --------------------------
   Tab state helper
   -------------------------- */
function setActiveTab(tab){
  activeContext = tab;
  document.querySelectorAll('.bottom-nav .tab').forEach(t=>t.classList.remove('active'));
  if(tab === 'stocks') tabStocks.classList.add('active');
  if(tab === 'funds') tabFunds.classList.add('active');
  if(tab === 'portfolio') tabPortfolio.classList.add('active');
  renderCurrent();
}

/* --------------------------
   Render current view based on activeContext
   -------------------------- */
function renderCurrent(){
  if(activeContext === 'stocks') renderStocks();
  else if(activeContext === 'funds') renderFunds();
  else if(activeContext === 'portfolio') renderPortfolio();
}

/* --------------------------
   Initialize app
   -------------------------- */
(function init(){
  // ensure there is an object for each portfolio entry
  try{
    if(!portfolio || typeof portfolio !== 'object') portfolio = {};
  }catch(e){
    portfolio = {};
  }

  renderCurrent();
  updateSummary();
})();

/* --------------------------
   Expose small debug helpers to console
   -------------------------- */
window._nv = {
  stocks: STOCKS,
  funds: FUNDS,
  portfolio,
  save: savePortfolio,
  render: renderCurrent
};
