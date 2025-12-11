// ------------------- Data -------------------
const stocks = {
  "Tata Motors": random(600, 950),
  "Adani Green": random(820, 1500),
  "Wipro": random(220, 360),
  "MRF": random(90000, 150000),
  "Reliance": random(1400, 1800),
  "HDFC": random(1100, 1600),
  "Affle 3i Ltd": random(100, 220)
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

function random(a,b){ return +(Math.random()*(b-a)+a).toFixed(2) }

// ------------------ Local storage ------------------
let portfolio = JSON.parse(localStorage.getItem('nivesh_portfolio') || '{"stocks":{},"funds":{},"cash":0}');
function save(){ localStorage.setItem('nivesh_portfolio', JSON.stringify(portfolio)); }

// ------------------ Elements ------------------
const stockList = document.getElementById('stockList');
const fundList = document.getElementById('fundList');
const portfolioList = document.getElementById('portfolioList');
const portfolioSummary = document.getElementById('portfolioSummary');
const details = document.getElementById('details');

const totalAmountEl = document.getElementById('totalAmount');
const oneDayChangeEl = document.getElementById('oneDayChange');
const changePctEl = document.getElementById('changePercent');

const tabs = document.querySelectorAll('.tab');
const navItems = document.querySelectorAll('.nav-item');

// ------------------ Theme ------------------
const root = document.documentElement;
const savedTheme = localStorage.getItem('nivesh_theme') || 'dark';
if(savedTheme === 'light') root.classList.add('light');
document.getElementById('themeToggle').addEventListener('click', ()=>{
  root.classList.toggle('light');
  const theme = root.classList.contains('light') ? 'light' : 'dark';
  localStorage.setItem('nivesh_theme', theme);
});

// ------------------ Tab navigation ------------------
tabs.forEach(t=>{
  t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    showPanel(t.dataset.target);
  });
});
navItems.forEach(n=>{
  n.addEventListener('click', ()=> {
    navItems.forEach(x=>x.classList.remove('active'));
    n.classList.add('active');
    if(n.dataset.target) showPanel(n.dataset.target);
  });
});
function showPanel(id){
  document.querySelectorAll('.panel-body').forEach(p=>p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ------------------ Render Stocks ------------------
function renderStocks(){
  stockList.innerHTML='';
  for(let name in stocks){
    const price = stocks[name];
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="meta">
        <div class="title">${name}</div>
        <div class="price">₹${price}</div>
      </div>
      <div class="controls">
        <input class="qty" type="number" min="1" value="1" aria-label="qty ${name}">
        <button class="btn primary buy" data-name="${name}">Buy</button>
      </div>
    `;
    stockList.appendChild(card);
  }
}
renderStocks();

// Buy handler
stockList.addEventListener('click', e=>{
  if(!e.target.classList.contains('buy')) return;
  const name = e.target.dataset.name;
  const qtyEl = e.target.parentElement.querySelector('.qty');
  const qty = Math.max(1, parseInt(qtyEl.value||1,10));
  portfolio.stocks[name] = (portfolio.stocks[name]||0) + qty;
  save();
  toast(`Bought ${qty} × ${name}`);
  updateTotals();
});

// ------------------ Render Funds ------------------
function renderFunds(){
  fundList.innerHTML='';
  mutualFunds.forEach(name=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="meta">
        <div class="title">${name}</div>
      </div>
      <div class="controls">
        <button class="btn ghost add" data-name="${name}">Add Unit</button>
      </div>
    `;
    fundList.appendChild(card);
  });
}
renderFunds();

fundList.addEventListener('click', e=>{
  if(!e.target.classList.contains('add')) return;
  const name = e.target.dataset.name;
  portfolio.funds[name] = (portfolio.funds[name]||0) + 1;
  save();
  toast(`Added 1 unit to ${name}`);
  updateTotals();
});

// ------------------ Portfolio ------------------
function renderPortfolio(){
  portfolioList.innerHTML=''; details.innerHTML='';
  let total=portfolio.cash||0;
  for(let name in portfolio.stocks){
    const qty = portfolio.stocks[name];
    const price = stocks[name]||0;
    total += qty*price;
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="meta">
        <div class="title">${name}</div>
        <div class="price">Qty: ${qty} • ₹${price} each</div>
      </div>
      <div class="controls">
        <button class="btn ghost sell" data-type="stock" data-name="${name}">Sell 1</button>
        <button class="btn ghost chart" data-name="${name}">Chart</button>
      </div>
    `;
    portfolioList.appendChild(card);
  }
  for(let name in portfolio.funds){
    const units = portfolio.funds[name];
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="meta">
        <div class="title">${name}</div>
        <div class="price">Units: ${units}</div>
      </div>
      <div class="controls">
        <button class="btn ghost redeem" data-name="${name}">Redeem</button>
      </div>
    `;
    portfolioList.appendChild(card);
  }
  portfolioSummary.innerHTML = `<div style="font-weight:800">Total value: ₹${total.toFixed(2)}</div><div style="color:var(--muted)">Cash: ₹${(portfolio.cash||0).toFixed(2)}</div>`;
  if(!portfolioList.children.length) portfolioList.innerHTML = '<div class="card">No holdings</div>';
}

portfolioList.addEventListener('click', e=>{
  const name = e.target.dataset.name;
  const type = e.target.dataset.type;
  if(e.target.classList.contains('sell')){
    if(!portfolio.stocks[name]) return;
    portfolio.stocks[name]--;
    if(portfolio.stocks[name]===0) delete portfolio.stocks[name];
    portfolio.cash = (portfolio.cash||0) + (stocks[name]||0);
    save(); renderPortfolio(); updateTotals(); toast(`Sold 1 × ${name}`);
  } else if(e.target.classList.contains('redeem')){
    if(!portfolio.funds[name]) return;
    portfolio.funds[name]--;
    if(portfolio.funds[name]===0) delete portfolio.funds[name];
    save(); renderPortfolio(); updateTotals(); toast(`Redeemed 1 unit`);
  } else if(e.target.classList.contains('chart')){
    showChart(name);
  }
});

// ------------------ Chart ------------------
function showChart(name){
  details.innerHTML = '';
  const box = document.createElement('div'); box.className='card';
  box.innerHTML = `<div style="width:100%"><h4 style="margin:0 0 8px">${name} — 30d</h4><canvas id="chartCanvas"></canvas></div>`;
  details.appendChild(box);
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  const price = stocks[name]||100;
  const labels=[]; const data=[];
  let cur = price;
  for(let i=30;i>=1;i--){ cur += (Math.random()-0.5)*(price*0.02); data.push(+cur.toFixed(2)); labels.push(`${i}d`); }
  if(window._lastChart) window._lastChart.destroy();
  window._lastChart = new Chart(ctx, {
    type:'line',
    data:{labels,datasets:[{label:name,data,borderColor: (data[data.length-1]>=data[0])? '#16c784' : '#ff6b6b',fill:false,tension:0.3}]},
    options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:false}
  });
}

// ------------------ Update totals ------------------
function updateTotals(){
  let total=portfolio.cash||0;
  for(let k in portfolio.stocks){ total += (stocks[k]||0)*portfolio.stocks[k]; }
  totalAmountEl.textContent = `₹${total.toFixed(2)}`;
  const change = +(Math.random()*40-20).toFixed(2);
  oneDayChangeEl.textContent = `1 Day Change: ₹${Math.abs(change)}`;
  const pct = ((Math.abs(change)/Math.max(total,1))*100).toFixed(2);
  changePctEl.textContent = `${change>=0?'▲':'▼'} ${pct}%`;
  changePctEl.className = 'pct ' + (change>=0 ? 'up' : 'down');
  renderPortfolio();
}

// ------------------ Modal (Add Funds) ------------------
const modal = document.getElementById('modal');
const fab = document.getElementById('fab');
const closeModal = document.getElementById('closeModal');
const confirmAdd = document.getElementById('confirmAdd');
const cancelAdd = document.getElementById('cancelAdd');
const addAmount = document.getElementById('addAmount');

fab.addEventListener('click', ()=> openModal());
closeModal.addEventListener('click', ()=> closeModalFn());
cancelAdd.addEventListener('click', ()=> closeModalFn());
confirmAdd.addEventListener('click', ()=>{
  const amt = Math.max(1, +(addAmount.value||0));
  portfolio.cash = (portfolio.cash||0) + amt;
  save(); closeModalFn(); updateTotals(); toast(`Added ₹${amt.toFixed(2)} to cash`);
});
function openModal(){ modal.classList.remove('hidden'); addAmount.focus(); }
function closeModalFn(){ modal.classList.add('hidden'); }

// ------------------ Toast ------------------
function toast(txt){
  const t = document.createElement('div'); t.className='toast'; t.textContent = txt;
  Object.assign(t.style,{background:'rgba(0,0,0,0.7)',color:'white',padding:'8px 12px',borderRadius:'8px',marginTop:'8px'});
  const wrap = document.getElementById('toastWrap'); wrap.appendChild(t);
  setTimeout(()=> { t.style.opacity=0; setTimeout(()=>t.remove(),400); },1600);
}

// ------------------ Small helpers ------------------
function ensureUI(){
  renderStocks(); renderFunds(); renderPortfolio(); updateTotals();
}
ensureUI();

// keyboard escapes for modal
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && !modal.classList.contains('hidden')) closeModalFn();
});

// quick save readme commit trick: call updateTotals after operations to keep display fresh
