/* --------------- Data (random/simulated) ---------------- */
const stocks = {
  "Tata Motors": random(700, 950),
  "Adani Green": random(900, 1500),
  "Wipro": random(220, 380),
  "MRF": random(90000, 130000),
  "Reliance": random(1200, 1700),
  "HDFC": random(1100, 1600),
  "Affle 3i Ltd": random(80, 220)
};

const mutualFunds = [
  "Edelweiss Nifty Midcap150 Momentum 50 Index Fund",
  "HDFC Mid Cap Fund",
  "HDFC Small Cap Fund",
  "Nippon India Large Cap Fund",
  "SBI Large Cap Fund",
  "Nippon India Growth Mid Cap Fund",
  "Nippon India Small Cap Fund",
  "HDFC Large Cap Fund"
];

/* ---------- Utility ---------- */
function random(a,b){ return +(Math.random()*(b-a)+a).toFixed(2) }

/* ---------- Local storage (portfolio) ---------- */
let portfolio = JSON.parse(localStorage.getItem('ny_portfolio')) || { stocks: {}, funds: {} };

/* ---------- DOM elements ---------- */
const stocksList = document.getElementById('stocksList');
const fundsList = document.getElementById('fundsList');
const portfolioList = document.getElementById('portfolioList');
const assetsTotalEl = document.getElementById('assetsTotal');
const assetsPLEl = document.getElementById('assetsPL');
const assetsCountEl = document.getElementById('assetsCount');
const navStocks = document.getElementById('nav_stocks');
const navFunds  = document.getElementById('nav_funds');
const navPort   = document.getElementById('nav_portfolio');
const stocksPanel = document.getElementById('ny_stocks_panel');
const fundsPanel  = document.getElementById('ny_funds_panel');
const portPanel   = document.getElementById('ny_portfolio_panel');
let portfolioChart = null;

/* ---------- Renderers ---------- */
function renderStocks(){
  stocksList.innerHTML = '';
  const list = document.createElement('div'); list.className='card-list';
  for(const [name, price] of Object.entries(stocks)){
    const card = document.createElement('div'); card.className='card';
    const meta = document.createElement('div'); meta.className='meta';
    const title = document.createElement('div'); title.className='title'; title.textContent = name;
    const p = document.createElement('div'); p.className='price'; p.textContent = `₹${price}`;
    meta.appendChild(title); meta.appendChild(p);
    const controls = document.createElement('div'); controls.className='controls';
    const qty = document.createElement('input'); qty.type='number'; qty.min=1; qty.value=1; qty.className='qty';
    const btn = document.createElement('button'); btn.className='btn-buy'; btn.textContent='Buy';
    btn.onclick = ()=> buyStock(name, Number(qty.value), price);
    controls.appendChild(qty); controls.appendChild(btn);
    card.appendChild(meta); card.appendChild(controls);
    list.appendChild(card);
  }
  stocksList.appendChild(list);
}

function renderFunds(){
  fundsList.innerHTML = '';
  const list = document.createElement('div'); list.className='card-list';
  mutualFunds.forEach((f,i)=>{
    const card = document.createElement('div'); card.className='card';
    const meta = document.createElement('div'); meta.className='meta';
    const title = document.createElement('div'); title.className='title'; title.textContent = f;
    const p = document.createElement('div'); p.className='price'; p.textContent = `NAV: ₹${random(50,400)}`;
    meta.appendChild(title); meta.appendChild(p);
    const controls = document.createElement('div'); controls.className='controls';
    const qty = document.createElement('input'); qty.type='number'; qty.min=1; qty.value=1; qty.className='qty';
    const btn = document.createElement('button'); btn.className='btn-add'; btn.textContent='Add Unit';
    btn.onclick = ()=> buyFund(f, Number(qty.value), Number(p.textContent.replace('NAV: ₹','')));
    controls.appendChild(qty); controls.appendChild(btn);
    card.appendChild(meta); card.appendChild(controls);
    list.appendChild(card);
  });
  fundsList.appendChild(list);
}

function renderPortfolio(){
  // build list
  portfolioList.innerHTML = '';
  const rows = document.createElement('div');
  rows.className='card-list';

  let totalValue = 0, totalCost = 0, totalQty=0;
  // stocks
  for(const [name, rec] of Object.entries(portfolio.stocks)){
    const curPrice = stocks[name] ?? random(100,1000);
    const value = +(curPrice * rec.qty);
    const cost = +(rec.price * rec.qty);
    totalValue += value; totalCost += cost; totalQty += rec.qty;
    const row = document.createElement('div'); row.className='port-row';
    const left = document.createElement('div'); left.className='port-left';
    const t = document.createElement('div'); t.textContent = name; t.style.fontWeight=700;
    const sub = document.createElement('div'); sub.className='port-sub'; sub.textContent = `${rec.qty} qty @ ₹${rec.price.toFixed(2)}`;
    left.appendChild(t); left.appendChild(sub);
    const right = document.createElement('div'); right.className='port-right';
    const cur = document.createElement('div'); cur.textContent = `₹${value.toFixed(2)}`;
    const pl = document.createElement('div'); const diff = +(value-cost);
    pl.textContent = `${diff>=0?'+':'-'}₹${Math.abs(diff).toFixed(2)}`;
    pl.style.color = diff>=0? 'var(--success)':'var(--danger)';
    right.appendChild(cur); right.appendChild(pl);
    row.appendChild(left); row.appendChild(right);
    rows.appendChild(row);
  }

  // funds
  for(const [name, rec] of Object.entries(portfolio.funds)){
    const nav = rec.nav ?? random(50,300);
    const value = +(nav * rec.units);
    const cost = +(rec.price * rec.units);
    totalValue += value; totalCost += cost; totalQty += rec.units;
    const row = document.createElement('div'); row.className='port-row';
    const left = document.createElement('div'); left.className='port-left';
    const t = document.createElement('div'); t.textContent = name; t.style.fontWeight=700;
    const sub = document.createElement('div'); sub.className='port-sub'; sub.textContent = `${rec.units} units @ ₹${rec.price.toFixed(2)}`;
    left.appendChild(t); left.appendChild(sub);
    const right = document.createElement('div'); right.className='port-right';
    const cur = document.createElement('div'); cur.textContent = `₹${value.toFixed(2)}`;
    const pl = document.createElement('div'); const diff = +(value-cost);
    pl.textContent = `${diff>=0?'+':'-'}₹${Math.abs(diff).toFixed(2)}`;
    pl.style.color = diff>=0? 'var(--success)':'var(--danger)';
    right.appendChild(cur); right.appendChild(pl);
    row.appendChild(left); row.appendChild(right);
    rows.appendChild(row);
  }

  if(rows.children.length === 0){
    const empty = document.createElement('div'); empty.style.color='var(--muted)'; empty.textContent='No holdings yet — buy stocks or funds to populate your portfolio';
    portfolioList.appendChild(empty);
  } else {
    portfolioList.appendChild(rows);
  }

  // summary update
  const plTotal = totalValue - totalCost;
  assetsTotalEl.textContent = `₹${totalValue.toFixed(2)}`;
  assetsPLEl.textContent = `${plTotal>=0?'+':'-'}₹${Math.abs(plTotal).toFixed(2)}`;
  assetsPLEl.style.background = plTotal>=0? 'rgba(46,204,113,0.12)':'rgba(231,76,60,0.12)';
  assetsCountEl.textContent = `Holdings: ${Object.keys(portfolio.stocks).length + Object.keys(portfolio.funds).length}`;

  // chart
  renderPortfolioChart(totalValue, totalCost);
}

/* ---------- buys ---------- */
function buyStock(name, qty, price){
  if(qty <= 0) return;
  if(!portfolio.stocks[name]) portfolio.stocks[name] = { qty: 0, price: 0 };
  // average price calculation
  const rec = portfolio.stocks[name];
  const totalExisting = rec.qty * rec.price;
  const newQty = rec.qty + qty;
  const newTotal = totalExisting + qty * price;
  rec.qty = newQty;
  rec.price = +(newTotal / newQty).toFixed(2);
  save();
  renderStocks(); renderPortfolio();
  showToast(`${qty} × ${name} bought @ ₹${price}`);
}

function buyFund(name, units, nav){
  if(units <= 0) return;
  if(!portfolio.funds[name]) portfolio.funds[name] = { units: 0, price: 0, nav: nav };
  const rec = portfolio.funds[name];
  const totalExisting = rec.units * rec.price;
  const newUnits = rec.units + units;
  const newTotal = totalExisting + units * nav;
  rec.units = newUnits;
  rec.price = +(newTotal / newUnits).toFixed(2);
  rec.nav = nav;
  save();
  renderFunds(); renderPortfolio();
  showToast(`${units} units of ${name} added @ ₹${nav}`);
}

/* ---------- chart ---------- */
function renderPortfolioChart(totalValue, totalCost){
  // Prepare fake 6-month dataset scaled around totalValue
  const labels = [];
  for(let i=5;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    labels.push(d.toLocaleString('default', { month: 'short' }));
  }

  // simulate values using small random walk around totalValue (or cost if zero)
  let base = totalValue>0? totalValue : (totalCost>0? totalCost : 2000);
  const data = [base];
  for(let i=1;i<labels.length;i++){
    const prev = data[i-1];
    const change = prev * (random(-0.06,0.06));
    data.push(+(prev + change).toFixed(2));
  }

  // create canvas
  const wrap = document.getElementById('portfolioChartWrap');
  wrap.innerHTML = '<canvas id="portfolioChart"></canvas>';
  const ctx = document.getElementById('portfolioChart').getContext('2d');

  if(portfolioChart) portfolioChart.destroy();
  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Portfolio value', data, fill: true, tension:0.3, borderColor: '#2E8B7E', backgroundColor:'rgba(46,139,126,0.12)', pointRadius:3 }]},
    options:{
      maintainAspectRatio:false,
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{display:false}, ticks:{color:'#9fb3b0'}},
        y:{ticks:{color:'#9fb3b0'}}
      }
    }
  });
  // ensure canvas sizing (fix stretching)
  const c = document.getElementById('portfolioChart');
  c.style.width = '100%';
  c.style.height = '260px';
}

/* ---------- persistence ---------- */
function save(){ localStorage.setItem('ny_portfolio', JSON.stringify(portfolio)) }

/* ---------- navigation handlers ---------- */
navStocks.addEventListener('click', ()=>{ activateNav('stocks') });
navFunds.addEventListener('click', ()=>{ activateNav('funds') });
navPort.addEventListener('click', ()=>{ activateNav('portfolio') });

function activateNav(tab){
  navStocks.classList.remove('active'); navFunds.classList.remove('active'); navPort.classList.remove('active');
  stocksPanel.style.display = 'none'; fundsPanel.style.display = 'none'; portPanel.style.display = 'none';
  if(tab==='stocks'){ navStocks.classList.add('active'); stocksPanel.style.display='block' }
  if(tab==='funds'){ navFunds.classList.add('active'); fundsPanel.style.display='block' }
  if(tab==='portfolio'){ navPort.classList.add('active'); portPanel.style.display='block' }
}

/* ---------- small toast helper ---------- */
function showToast(txt){
  const t = document.createElement('div'); t.textContent = txt;
  Object.assign(t.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'100px',background:'rgba(0,0,0,0.7)',padding:'8px 14px',borderRadius:'10px',zIndex:999});
  document.body.appendChild(t);
  setTimeout(()=> t.remove(),1600);
}

/* ---------- init ---------- */
function init(){
  renderStocks(); renderFunds(); renderPortfolio();
  // default tab
  activateNav('stocks');
}
init();
