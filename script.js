// ------------------- data (simulated current prices) -------------------
const stocks = {
  "Tata Motors": +(Math.random()*(950-600)+600).toFixed(2),
  "Adani Green": +(Math.random()*(1500-820)+820).toFixed(2),
  "Wipro": +(Math.random()*(360-220)+220).toFixed(2),
  "MRF": +(Math.random()*(150000-90000)+90000).toFixed(2),
  "Reliance": +(Math.random()*(1800-1400)+1400).toFixed(2),
  "HDFC": +(Math.random()*(1600-1100)+1100).toFixed(2),
  "Affle 3i Ltd": +(Math.random()*(220-100)+100).toFixed(2)
};

const funds = {
  "Edelweiss Nifty Midcap150 Momentum 50 Index Fund": +(Math.random()*(160-80)+80).toFixed(2),
  "HDFC Mid Cap Fund": +(Math.random()*(250-100)+100).toFixed(2),
  "HDFC Small Cap Fund": +(Math.random()*(200-90)+90).toFixed(2),
  "Nippon India Large Cap Fund": +(Math.random()*(180-90)+90).toFixed(2),
  "SBI Large Cap Fund": +(Math.random()*(175-85)+85).toFixed(2),
  "Nippon India Growth Mid Cap Fund": +(Math.random()*(210-100)+100).toFixed(2),
  "Nippon India Small Cap Fund": +(Math.random()*(160-80)+80).toFixed(2),
  "HDFC Large Cap Fund": +(Math.random()*(170-90)+90).toFixed(2)
};

// ------------------- local storage (portfolio) -------------------
// structure:
// { stocks: { "name": { qty: number, avg: number } }, funds: { "name": { units, avg } }, cash: number }
let portfolio = JSON.parse(localStorage.getItem('nv_portfolio_v2') || '{"stocks":{},"funds":{},"cash":0}');
function save(){ localStorage.setItem('nv_portfolio_v2', JSON.stringify(portfolio)); }

// ------------------- elements -------------------
const stockList = document.getElementById('stockList');
const fundList = document.getElementById('fundList');
const portfolioList = document.getElementById('portfolioList');
const portfolioSummary = document.getElementById('portfolioSummary');
const detailArea = document.getElementById('detailArea');

const totalAmountEl = document.getElementById('totalAmount');
const oneDayChangeEl = document.getElementById('oneDayChange');
const pctEl = document.getElementById('pctChange');

const navBtns = document.querySelectorAll('.nav-btn');

// ------------------- theme -------------------
const root = document.documentElement;
if(localStorage.getItem('nv_theme') === 'light') root.classList.add('light');
document.getElementById('themeToggle').addEventListener('click', ()=>{
  root.classList.toggle('light');
  localStorage.setItem('nv_theme', root.classList.contains('light') ? 'light' : 'dark');
});

// ------------------- navigation -------------------
navBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    navBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const target = b.dataset.target;
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
    // re-render portfolio when switched
    if(target === 'portfolioPanel') renderPortfolio();
  });
});

// default
document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
document.getElementById('stocksPanel').classList.remove('hidden');

// ------------------- render -------------------
function renderStocks(){
  stockList.innerHTML = '';
  for(const name in stocks){
    const price = +stocks[name];
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="title">${name}</div>
        <div class="price">₹${price.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
      </div>
      <div class="controls">
        <input class="qty" type="number" min="1" value="1" />
        <button class="btn primary buy" data-name="${name}">Buy</button>
      </div>
    `;
    stockList.appendChild(card);
  }
}

function renderFunds(){
  fundList.innerHTML = '';
  Object.keys(funds).forEach(name=>{
    const price = +funds[name];
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="title">${name}</div>
        <div class="price">₹${price.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
      </div>
      <div class="controls">
        <input class="qty" type="number" min="1" value="1" />
        <button class="btn primary addfund" data-name="${name}">Add</button>
      </div>
    `;
    fundList.appendChild(card);
  });
}

function formatPL(val){
  const sign = val>0 ? '+' : (val<0 ? '−' : '');
  const abs = Math.abs(val);
  return `${sign}₹${abs.toLocaleString(undefined,{maximumFractionDigits:2})}`;
}

function renderPortfolio(){
  portfolioList.innerHTML = '';
  detailArea.innerHTML = '';

  // compute totals
  let holdingsValue = 0;
  let invested = 0;
  // stocks
  for(const s in portfolio.stocks){
    const {qty, avg} = portfolio.stocks[s];
    const cur = +(stocks[s]||0);
    holdingsValue += cur*qty;
    invested += avg*qty;
  }
  // funds
  for(const f in portfolio.funds){
    const {units, avg} = portfolio.funds[f];
    const cur = +(funds[f]||0);
    holdingsValue += cur*units;
    invested += avg*units;
  }
  const cash = +(portfolio.cash||0);
  const total = holdingsValue + cash;
  const plAmount = holdingsValue - invested;
  const plPct = invested? (plAmount/invested*100) : 0;

  totalAmountEl.textContent = `₹${total.toLocaleString(undefined,{maximumFractionDigits:2})}`;
  oneDayChangeEl.textContent = `1 Day Change: ₹${(Math.random()*50-25).toFixed(2)}`;
  pctEl.textContent = `${plAmount>=0? '▲':'▼'} ${Math.abs(plPct).toFixed(2)}%`;
  pctEl.className = plAmount>=0 ? 'pct up' : 'pct down';

  portfolioSummary.innerHTML = `
    <div style="font-weight:800">Total: ₹${total.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
    <div style="color:var(--muted)">Invested: ₹${invested.toLocaleString(undefined,{maximumFractionDigits:2})} • Cash: ₹${cash.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
    <div style="margin-top:8px">${formatPL(plAmount)} • ${plPct>=0?'+':''}${plPct.toFixed(2)}%</div>
  `;

  // list holdings
  if(Object.keys(portfolio.stocks).length === 0 && Object.keys(portfolio.funds).length === 0){
    portfolioList.innerHTML = `<div class="card">No holdings yet.</div>`;
  } else {
    for(const s in portfolio.stocks){
      const {qty, avg} = portfolio.stocks[s];
      const cur = +(stocks[s]||0);
      const pl = (cur - avg) * qty;
      const plPctLocal = avg? ((cur-avg)/avg*100):0;

      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div>
          <div class="title">${s}</div>
          <div class="price">Qty: ${qty} • Cur: ₹${cur.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          <div style="color:var(--muted);font-size:12px">Avg: ₹${avg.toLocaleString(undefined,{maximumFractionDigits:2})} • ${plPctLocal>=0?'+':''}${plPctLocal.toFixed(2)}%</div>
        </div>
        <div class="controls">
          <button class="btn ghost sell" data-name="${s}">Sell 1</button>
          <button class="btn ghost details" data-name="${s}">Details</button>
        </div>
      `;
      portfolioList.appendChild(card);
    }

    for(const f in portfolio.funds){
      const {units, avg} = portfolio.funds[f];
      const cur = +(funds[f]||0);
      const pl = (cur - avg) * units;
      const plPctLocal = avg? ((cur-avg)/avg*100):0;

      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div>
          <div class="title">${f}</div>
          <div class="price">Units: ${units} • Cur NAV: ₹${cur.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          <div style="color:var(--muted);font-size:12px">Avg: ₹${avg.toLocaleString(undefined,{maximumFractionDigits:2})} • ${plPctLocal>=0?'+':''}${plPctLocal.toFixed(2)}%</div>
        </div>
        <div class="controls">
          <button class="btn ghost redeem" data-name="${f}">Redeem 1</button>
          <button class="btn ghost details" data-name="${f}">Details</button>
        </div>
      `;
      portfolioList.appendChild(card);
    }
  }
}

// ------------------- buy / add / sell handlers -------------------
stockList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('buy')){
    const name = e.target.dataset.name;
    const qtyEl = e.target.parentElement.querySelector('.qty');
    const q = Math.max(1, parseInt(qtyEl.value||1,10));
    const price = +(stocks[name]||0);

    // update avg price: newAvg = (oldQty*oldAvg + q*price) / (oldQty+q)
    const prev = portfolio.stocks[name] || {qty:0, avg:0};
    const newQty = prev.qty + q;
    const newAvg = newQty ? ((prev.qty*prev.avg) + q*price)/newQty : price;

    portfolio.stocks[name] = { qty: newQty, avg: +newAvg.toFixed(2) };
    save(); renderPortfolio(); showToast(`Bought ${q} × ${name}`);
  }
});

fundList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('addfund')){
    const name = e.target.dataset.name;
    const qtyEl = e.target.parentElement.querySelector('.qty');
    const q = Math.max(1, parseInt(qtyEl.value||1,10));
    const price = +(funds[name]||0);

    const prev = portfolio.funds[name] || {units:0, avg:0};
    const newUnits = prev.units + q;
    const newAvg = newUnits ? ((prev.units*prev.avg) + q*price)/newUnits : price;

    portfolio.funds[name] = { units: newUnits, avg: +newAvg.toFixed(2) };
    save(); renderPortfolio(); showToast(`Added ${q} unit(s) of fund`);
  }
});

// portfolio actions
portfolioList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('sell')){
    const name = e.target.dataset.name;
    if(!portfolio.stocks[name]) return;
    portfolio.stocks[name].qty--;
    if(portfolio.stocks[name].qty <= 0) delete portfolio.stocks[name];
    save(); renderPortfolio(); showToast(`Sold 1 × ${name}`);
  } else if(e.target.classList.contains('redeem')){
    const name = e.target.dataset.name;
    if(!portfolio.funds[name]) return;
    portfolio.funds[name].units--;
    if(portfolio.funds[name].units <= 0) delete portfolio.funds[name];
    save(); renderPortfolio(); showToast(`Redeemed 1 unit`);
  } else if(e.target.classList.contains('details')){
    const name = e.target.dataset.name;
    showDetails(name);
  }
});

// show details chart / history (simple simulated)
function showDetails(name){
  detailArea.innerHTML = '';
  const card = document.createElement('div'); card.className='card';
  card.innerHTML = `<div style="width:100%"><h4 style="margin:0 0 8px">${name} — 30d</h4><canvas id="miniChart" style="height:150px"></canvas></div>`;
  detailArea.appendChild(card);

  const ctx = document.getElementById('miniChart').getContext('2d');
  const labels=[]; const data=[];
  let base = +(stocks[name] || funds[name] || 100);
  for(let i=30;i>0;i--){ base += (Math.random()-0.5)*(base*0.02); data.push(+base.toFixed(2)); labels.push(i); }
  if(window._chart) window._chart.destroy();
  window._chart = new Chart(ctx, {type:'line',data:{labels,data,datasets:[{data,borderColor:'#16c784',fill:false,tension:0.3}]},options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:false}});
}

// ------------------- small utilities -------------------
const toastEl = document.getElementById('toast');
function showToast(txt){
  toastEl.textContent = txt; toastEl.classList.remove('hidden');
  setTimeout(()=> toastEl.classList.add('hidden'),1300);
}

// ------------------- init -------------------
renderStocks(); renderFunds(); renderPortfolio();
