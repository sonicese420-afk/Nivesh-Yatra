/* app logic for Stocks/Funds/Portfolio demo
   - single-file app logic
   - persistent portfolio via localStorage
   - Chart.js for detail chart, synthetic test data
*/

/* -------------------------
   Data
   -------------------------*/
const stocks = {
  "Reliance Industries Ltd": { symbol: "RELIANCE", seed: 1545 },
  "Tata Motors": { symbol: "TATAMOTORS", seed: 547 },
  "Adani Green": { symbol: "ADANIGREEN", seed: 1191 },
  "Wipro": { symbol: "WIPRO", seed: 339 },
  "MRF": { symbol: "MRF", seed: 129231 },
  "Reliance": { symbol: "RELIANCE", seed: 1648 },
  "HDFC": { symbol: "HDFC", seed: 1382 },
  "Affle 3i Ltd": { symbol: "AFFLE", seed: 110 }
};

const funds = [
  "Edelweiss Nifty Midcap150 Momentum 50 Index Fund",
  "HDFC Mid Cap Fund",
  "HDFC Small Cap Fund",
  "Nippon India Large Cap Fund",
  "SBI Large Cap Fund"
];

/* quick in-memory prices (can be replaced with API) */
const currentPrices = {};
for(const n in stocks) currentPrices[n] = +stocks[n].seed;

/* -------------------------
   Portfolio (localStorage)
   structure: { stocks:{name:{qty,avg}}, funds:{name:{units,avg}} }
   -------------------------*/
let portfolio = JSON.parse(localStorage.getItem('ny_portfolio') || '{}');
if(!portfolio.stocks) portfolio = { stocks:{}, funds:{} };

function save(){
  localStorage.setItem('ny_portfolio', JSON.stringify(portfolio));
  renderSummary();
}

/* -------------------------
   Helpers
   -------------------------*/
function random(a,b){
  return +(Math.random()*(b-a)+a).toFixed(2);
}
function formatINR(x){ return '₹' + Number(x).toLocaleString('en-IN', {maximumFractionDigits:2}); }

/* Render summary */
function renderSummary(){
  const total = Object.entries(portfolio.stocks).reduce((s,[k,v]) => {
    const price = currentPrices[k] || v.avg;
    return s + price * v.qty;
  }, 0) + Object.entries(portfolio.funds || {}).reduce((s,[k,v]) => {
    const price = currentPrices[k] || v.avg || 1;
    return s + price * v.units;
  }, 0);
  document.getElementById('totalAssets').textContent = formatINR(total || 0);
  const holdings = Object.values(portfolio.stocks).reduce((s,r)=>s + (r.qty||0),0) + Object.values(portfolio.funds).reduce((s,r)=>s + (r.units||0),0);
  document.getElementById('holdingsCount').textContent = holdings;
  document.getElementById('oneDayChange').textContent = `+₹0 (0.00%)`;
}

/* -------------------------
   Render lists
   -------------------------*/
const listArea = document.getElementById('listArea');
const pageTitle = document.getElementById('pageTitle');

function renderStocks(){
  pageTitle.textContent = 'Buy Stocks';
  listArea.innerHTML = '';
  Object.keys(stocks).forEach(name => {
    const item = document.createElement('div'); item.className='card';
    item.dataset.name = name; item.dataset.type='stock';
    item.onclick = ()=> openItemDetail(name,'stock');

    const left = document.createElement('div'); left.className='card-left';
    const badge = document.createElement('div'); badge.className='badge-circle';
    // initials
    badge.textContent = name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const info = document.createElement('div'); info.className='item-info';
    const title = document.createElement('div'); title.className='item-title'; title.textContent = name;
    const sub = document.createElement('div'); sub.className='item-sub'; sub.textContent = `Stock | ${stocks[name].symbol || ''}`;

    info.appendChild(title); info.appendChild(sub);
    left.appendChild(badge); left.appendChild(info);

    const right = document.createElement('div'); right.className='card-right';
    const price = document.createElement('div'); price.className='item-price'; price.textContent = formatINR(currentPrices[name] || stocks[name].seed);
    const arrowWrap = document.createElement('div'); arrowWrap.className='item-arrow';
    // show arrow only if owned
    const owned = portfolio.stocks[name];
    if(owned){
      const pl = ((currentPrices[name]||stocks[name].seed) - owned.avg) / owned.avg * 100;
      const sym = pl >= 0 ? '▲' : '▼';
      arrowWrap.textContent = `${sym} ${Math.abs(pl).toFixed(2)}%`;
      arrowWrap.style.color = pl >= 0 ? 'var(--success)' : 'var(--danger)';
    } else {
      arrowWrap.textContent = '';
    }

    right.appendChild(price); right.appendChild(arrowWrap);

    item.appendChild(left); item.appendChild(right);
    listArea.appendChild(item);
  });
}

function renderFunds(){
  pageTitle.textContent = 'Mutual Funds';
  listArea.innerHTML = '';
  funds.forEach(name => {
    const item = document.createElement('div'); item.className='card'; item.dataset.name = name; item.dataset.type='fund';
    item.onclick = ()=> openItemDetail(name,'fund');

    const left = document.createElement('div'); left.className='card-left';
    const badge = document.createElement('div'); badge.className='badge-circle';
    badge.textContent = name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const info = document.createElement('div'); info.className='item-info';
    const title = document.createElement('div'); title.className='item-title'; title.textContent = name;
    const sub = document.createElement('div'); sub.className='item-sub'; sub.textContent = `Fund`;

    info.appendChild(title); info.appendChild(sub);
    left.appendChild(badge); left.appendChild(info);

    const right = document.createElement('div'); right.className='card-right';
    // synthetic units price
    if(!currentPrices[name]) currentPrices[name] = random(80,350);
    const price = document.createElement('div'); price.className='item-price'; price.textContent = formatINR(currentPrices[name]);
    const arrowWrap = document.createElement('div'); arrowWrap.className='item-arrow';
    const owned = portfolio.funds[name];
    if(owned){
      const pl = ((currentPrices[name]) - owned.avg) / owned.avg * 100;
      const sym = pl >= 0 ? '▲' : '▼';
      arrowWrap.textContent = `${sym} ${Math.abs(pl).toFixed(2)}%`;
      arrowWrap.style.color = pl >= 0 ? 'var(--success)' : 'var(--danger)';
    } else { arrowWrap.textContent = ''; }

    right.appendChild(price); right.appendChild(arrowWrap);

    item.appendChild(left); item.appendChild(right);
    listArea.appendChild(item);
  });
}

function renderPortfolio(){
  pageTitle.textContent = 'Your Portfolio';
  listArea.innerHTML = '';
  // stocks first
  const stockKeys = Object.keys(portfolio.stocks || {});
  const fundKeys = Object.keys(portfolio.funds || {});

  if(stockKeys.length === 0 && fundKeys.length === 0){
    const empty = document.createElement('div'); empty.className='card'; empty.style.justifyContent='center';
    empty.textContent = 'You have no holdings yet. Tap a stock or fund to add.';
    listArea.appendChild(empty);
    return;
  }

  stockKeys.forEach(name => {
    const rec = portfolio.stocks[name];
    const item = document.createElement('div'); item.className='card'; item.dataset.name=name; item.dataset.type='stock';
    item.onclick = ()=> openItemDetail(name,'stock');

    const left = document.createElement('div'); left.className='card-left';
    const badge = document.createElement('div'); badge.className='badge-circle'; badge.textContent = name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const info = document.createElement('div'); info.className='item-info';
    const title = document.createElement('div'); title.className='item-title'; title.textContent = name;
    const sub = document.createElement('div'); sub.className='item-sub'; sub.textContent = `${rec.qty} shares • bought @ ${formatINR(rec.avg)}`;

    info.appendChild(title); info.appendChild(sub);
    left.appendChild(badge); left.appendChild(info);

    const right = document.createElement('div'); right.className='card-right';
    const price = document.createElement('div'); price.className='item-price'; price.textContent = formatINR(currentPrices[name] || rec.avg);
    const pl = ((currentPrices[name] || rec.avg) - rec.avg) * rec.qty;
    const pct = (( (currentPrices[name]||rec.avg) - rec.avg) / rec.avg) * 100;
    const arrow = document.createElement('div'); arrow.className='item-arrow';
    arrow.textContent = `${pl>=0? '▲':'▼'} ${Math.abs(pct).toFixed(2)}%`;
    arrow.style.color = pl >= 0 ? 'var(--success)' : 'var(--danger)';

    right.appendChild(price); right.appendChild(arrow);

    item.appendChild(left); item.appendChild(right);
    listArea.appendChild(item);
  });

  // funds
  fundKeys.forEach(name=>{
    const rec = portfolio.funds[name];
    const item = document.createElement('div'); item.className='card'; item.dataset.name=name; item.dataset.type='fund';
    item.onclick = ()=> openItemDetail(name,'fund');

    const left = document.createElement('div'); left.className='card-left';
    const badge = document.createElement('div'); badge.className='badge-circle'; badge.textContent = name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const info = document.createElement('div'); info.className='item-info';
    const title = document.createElement('div'); title.className='item-title'; title.textContent = name;
    const sub = document.createElement('div'); sub.className='item-sub'; sub.textContent = `${rec.units} units • bought @ ${formatINR(rec.avg)}`;

    info.appendChild(title); info.appendChild(sub);
    left.appendChild(badge); left.appendChild(info);

    const right = document.createElement('div'); right.className='card-right';
    const price = document.createElement('div'); price.className='item-price'; price.textContent = formatINR(currentPrices[name]||rec.avg);
    const pl = ((currentPrices[name]||rec.avg) - rec.avg) * rec.units;
    const pct = (((currentPrices[name]||rec.avg) - rec.avg) / rec.avg) * 100;
    const arrow = document.createElement('div'); arrow.className='item-arrow';
    arrow.textContent = `${pl>=0? '▲':'▼'} ${Math.abs(pct).toFixed(2)}%`;
    arrow.style.color = pl >= 0 ? 'var(--success)' : 'var(--danger)';

    right.appendChild(price); right.appendChild(arrow);

    item.appendChild(left); item.appendChild(right);
    listArea.appendChild(item);
  });
}

/* -------------------------
   Navigation
   -------------------------*/
document.getElementById('navStocks').onclick = ()=> switchTab('stocks');
document.getElementById('navFunds').onclick = ()=> switchTab('funds');
document.getElementById('navPortfolio').onclick = ()=> switchTab('portfolio');

function switchTab(tab){
  document.querySelectorAll('.bottom-nav .nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector(`.bottom-nav .nav-item[data-tab="${tab}"]`).classList.add('active');

  if(tab==='stocks') renderStocks();
  if(tab==='funds') renderFunds();
  if(tab==='portfolio') renderPortfolio();
}

/* -------------------------
   Detail modal + chart
   -------------------------*/
let detailChart = null;
function openItemDetail(name, type){
  const modal = document.getElementById('detailModal');
  modal.classList.remove('hidden');
  document.getElementById('detailName').textContent = name;
  document.getElementById('detailSymbol').textContent = (type==='stock' && stocks[name]) ? stocks[name].symbol : 'FUND';
  const priceNow = currentPrices[name] || (type==='stock' && stocks[name] ? stocks[name].seed : random(80,500));
  const pct = +(random(-2,2)).toFixed(2);
  const changeVal = +(priceNow * pct/100).toFixed(2);
  document.getElementById('detailPrice').textContent = formatINR(priceNow);
  const changeEl = document.getElementById('detailChange');
  changeEl.textContent = `${changeVal>=0?'+':'-'}${formatINR(Math.abs(changeVal))} ${changeVal>=0?'▲':'▼'} ${Math.abs(pct)}%`;
  changeEl.style.color = changeVal >= 0 ? 'var(--success)' : 'var(--danger)';

  document.getElementById('statVolume').textContent = Math.floor(random(100000,5000000)).toLocaleString();
  document.getElementById('statMcap').textContent = `₹${Math.floor(random(10000,200000)).toLocaleString()} Cr`;
  document.getElementById('statLow').textContent = formatINR(Math.max(1, (priceNow - random(10,40)).toFixed(2)));
  document.getElementById('statHigh').textContent = formatINR((priceNow + random(10,40)).toFixed(2));

  // timeframe handlers
  document.querySelectorAll('.timebar .tbtn').forEach(btn=>{
    btn.classList.remove('active');
    btn.onclick = ()=> {
      document.querySelectorAll('.timebar .tbtn').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      renderDetailChart(name, type, btn.dataset.range);
    };
  });
  document.querySelector('.timebar .tbtn[data-range="1D"]').classList.add('active');

  renderDetailChart(name, type, '1D');

  // actions
  document.getElementById('actionPurchase').onclick = ()=> {
    if(type==='stock'){
      const qty = +prompt(`Purchase how many shares of ${name}?`, '1');
      if(qty && qty>0) buyStockDirect(name, qty, priceNow);
    } else {
      const units = +prompt(`Purchase how many units of ${name}?`, '1');
      if(units && units>0) buyFundDirect(name, units, priceNow);
    }
    closeDetail();
  };
  document.getElementById('actionSell').onclick = ()=> {
    if(type==='stock'){
      const rec = portfolio.stocks[name]; if(!rec) { alert("You don't own this stock"); return; }
      const qty = +prompt(`Sell how many shares? (max ${rec.qty})`, '1');
      if(qty && qty>0){
        if(qty>=rec.qty) delete portfolio.stocks[name]; else rec.qty -= qty;
        save(); renderPortfolio(); closeDetail();
      }
    } else {
      const rec = portfolio.funds[name]; if(!rec) { alert("You don't own this fund"); return; }
      const units = +prompt(`Redeem how many units? (max ${rec.units})`, '1');
      if(units && units>0){
        if(units>=rec.units) delete portfolio.funds[name]; else rec.units -= units;
        save(); renderPortfolio(); closeDetail();
      }
    }
  };
  document.getElementById('actionSIP').onclick = ()=> {
    alert('SIP flow placeholder — will implement full UI later.');
  };

  document.getElementById('closeDetail').onclick = closeDetail;
  document.getElementById('detailBackdrop').onclick = closeDetail;
}

function closeDetail(){
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
  if(detailChart){ detailChart.destroy(); detailChart=null; }
}

function renderDetailChart(name, type, range){
  const canvas = document.getElementById('detailChart');
  const ctx = canvas.getContext('2d');
  if(detailChart) detailChart.destroy();

  let points = 60;
  switch(range){
    case '1D': points = 50; break;
    case '1W': points = 40; break;
    case '1M': points = 80; break;
    case '3M': points = 100; break;
    case '6M': points = 140; break;
    case '1Y': points = 200; break;
    case '5Y': points = 260; break;
  }

  const start = currentPrices[name] || (stocks[name] ? stocks[name].seed : random(80,500));
  const labels = new Array(points).fill(0).map((_,i)=>i);
  const data = [];
  let val = start;
  for(let i=0;i<points;i++){
    const drift = (range==='1D' ? random(-2,2) : random(-8,8));
    val = Math.max(1, +(val + drift).toFixed(2));
    data.push(val);
  }

  detailChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{
      data,
      borderColor: 'rgba(46,204,113,0.95)',
      backgroundColor: 'rgba(46,204,113,0.06)',
      fill:true, pointRadius:0, tension:0.36
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ display:false },
        y:{ grid:{ color:'rgba(255,255,255,0.02)'}, ticks:{ color: 'var(--muted)' } }
      }
    }
  });
  canvas.style.width='100%'; canvas.style.height='260px';
}

/* -------------------------
   Buy/Sell helpers used by the detail modal
   -------------------------*/
function buyStockDirect(name, qty, price){
  const rec = portfolio.stocks[name];
  if(!rec){ portfolio.stocks[name] = { qty: qty, avg: price }; }
  else {
    const totalCost = rec.avg * rec.qty + price * qty;
    const newQty = rec.qty + qty;
    rec.avg = +(totalCost / newQty).toFixed(2);
    rec.qty = newQty;
  }
  save(); renderPortfolio(); showToast(`Bought ${qty} × ${name}`);
}

function buyFundDirect(name, units, price){
  const rec = portfolio.funds[name];
  if(!rec){ portfolio.funds[name] = { units: units, avg: price }; }
  else {
    const totalCost = rec.avg * rec.units + price * units;
    const newUnits = rec.units + units;
    rec.avg = +(totalCost / newUnits).toFixed(2);
    rec.units = newUnits;
  }
  save(); renderPortfolio(); showToast(`Bought ${units} units of ${name}`);
}

/* tiny toast */
function showToast(msg){
  const t = document.createElement('div'); t.textContent = msg;
  t.style.position='fixed'; t.style.left='50%'; t.style.transform='translateX(-50%)'; t.style.bottom='120px';
  t.style.background='rgba(0,0,0,0.7)'; t.style.color='#fff'; t.style.padding='10px 14px'; t.style.borderRadius='8px'; t.style.zIndex=2000;
  document.body.appendChild(t); setTimeout(()=> t.remove(), 2000);
}

/* -------------------------
   initial setup
   -------------------------*/
renderSummary();
renderStocks(); // default tab

// debug: expose to window for console tinkering
window._ny = { portfolio, stocks, funds, currentPrices, save };
