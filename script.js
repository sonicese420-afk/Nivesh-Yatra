// ---------------- data ----------------
const stocks = {
  "Tata Motors": +(Math.random()*(950-600)+600).toFixed(2),
  "Adani Green": +(Math.random()*(1500-820)+820).toFixed(2),
  "Wipro": +(Math.random()*(360-220)+220).toFixed(2),
  "MRF": +(Math.random()*(150000-90000)+90000).toFixed(2),
  "Reliance": +(Math.random()*(1800-1400)+1400).toFixed(2),
  "HDFC": +(Math.random()*(1600-1100)+1100).toFixed(2),
  "Affle 3i Ltd": +(Math.random()*(220-100)+100).toFixed(2)
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

// ---------------- storage ----------------
let portfolio = JSON.parse(localStorage.getItem('nv_portfolio') || '{"stocks":{},"funds":{},"cash":0}');
function save(){ localStorage.setItem('nv_portfolio', JSON.stringify(portfolio)); }

// ---------------- elements ----------------
const stockList = document.getElementById('stockList');
const fundList = document.getElementById('fundList');
const portfolioList = document.getElementById('portfolioList');
const portfolioSummary = document.getElementById('portfolioSummary');
const detailArea = document.getElementById('detailArea');

const totalAmountEl = document.getElementById('totalAmount');
const oneDayChangeEl = document.getElementById('oneDayChange');
const pctEl = document.getElementById('pctChange');

const modal = document.getElementById('modal');
const fab = document.getElementById('fab');
const addAmount = document.getElementById('addAmount');
const addConfirm = document.getElementById('addConfirm');
const addCancel = document.getElementById('addCancel');
const closeModal = document.getElementById('closeModal');

const navBtns = document.querySelectorAll('.nav-btn');

// ---------------- theme ----------------
const root = document.documentElement;
if(localStorage.getItem('nv_theme') === 'light') root.classList.add('light');
document.getElementById('themeToggle').addEventListener('click', ()=>{
  root.classList.toggle('light');
  localStorage.setItem('nv_theme', root.classList.contains('light') ? 'light' : 'dark');
});

// ---------------- nav behavior ----------------
navBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    navBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const target = b.dataset.target;
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
  });
});
// default show stocks
document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
document.getElementById('stocksPanel').classList.remove('hidden');

// ---------------- render functions ----------------
function renderStocks(){
  stockList.innerHTML = '';
  for(const name in stocks){
    const price = stocks[name];
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div>
        <div class="title">${name}</div>
        <div class="price">₹${price}</div>
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
  mutualFunds.forEach(name=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div><div class="title">${name}</div></div>
      <div class="controls">
        <button class="btn ghost add" data-name="${name}">Add Unit</button>
      </div>
    `;
    fundList.appendChild(card);
  });
}
function renderPortfolio(){
  portfolioList && (portfolioList.innerHTML = '');
  detailArea && (detailArea.innerHTML = '');
  let total = portfolio.cash || 0;
  for(const k in portfolio.stocks){
    total += (stocks[k]||0)*portfolio.stocks[k];
  }
  // funds: treat each unit as random small value (~100)
  for(const f in portfolio.funds){
    total += (portfolio.funds[f]||0) * 100;
  }
  totalAmountEl.textContent = `₹${total.toFixed(2)}`;
  oneDayChangeEl.textContent = `1 Day Change: ₹${(Math.random()*20-10).toFixed(2)}`;
  pctEl.textContent = `▲ ${(Math.random()*1).toFixed(2)}%`;
  portfolioSummary && (portfolioSummary.innerHTML = `<div style="font-weight:800">Total: ₹${total.toFixed(2)}</div><div style="color:var(--muted)">Cash: ₹${(portfolio.cash||0).toFixed(2)}</div>`);
  // holdings list
  const list = portfolioList;
  if(list){
    if(Object.keys(portfolio.stocks).length===0 && Object.keys(portfolio.funds).length===0){
      list.innerHTML = `<div class="card">No holdings yet.</div>`;
    } else {
      for(const s in portfolio.stocks){
        const qty = portfolio.stocks[s];
        const price = stocks[s]||0;
        const card = document.createElement('div'); card.className='card';
        card.innerHTML = `<div><div class="title">${s}</div><div class="price">Qty: ${qty} • ₹${price}</div></div>
        <div class="controls">
          <button class="btn ghost sell" data-name="${s}">Sell 1</button>
          <button class="btn ghost chart" data-name="${s}">Chart</button>
        </div>`;
        list.appendChild(card);
      }
      for(const f in portfolio.funds){
        const units = portfolio.funds[f];
        const card = document.createElement('div'); card.className='card';
        card.innerHTML = `<div><div class="title">${f}</div><div class="price">Units: ${units}</div></div>
        <div class="controls"><button class="btn ghost redeem" data-name="${f}">Redeem</button></div>`;
        list.appendChild(card);
      }
    }
  }
}

// ---------------- events ----------------
stockList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('buy')){
    const name = e.target.dataset.name;
    const qtyEl = e.target.parentElement.querySelector('.qty');
    const q = Math.max(1, parseInt(qtyEl.value||1,10));
    portfolio.stocks[name] = (portfolio.stocks[name]||0) + q;
    save(); renderPortfolio(); showToast(`Bought ${q} × ${name}`);
  }
});

fundList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('add')){
    const name = e.target.dataset.name;
    portfolio.funds[name] = (portfolio.funds[name]||0) + 1;
    save(); renderPortfolio(); showToast(`Added 1 unit to ${name}`);
  }
});

portfolioList && portfolioList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('sell')){
    const name = e.target.dataset.name;
    if(!portfolio.stocks[name]) return;
    portfolio.stocks[name]--;
    if(portfolio.stocks[name]===0) delete portfolio.stocks[name];
    portfolio.cash = (portfolio.cash||0) + (stocks[name]||0);
    save(); renderPortfolio(); showToast(`Sold 1 × ${name}`);
  } else if(e.target.classList.contains('redeem')){
    const name = e.target.dataset.name;
    if(!portfolio.funds[name]) return;
    portfolio.funds[name]--;
    if(portfolio.funds[name]===0) delete portfolio.funds[name];
    save(); renderPortfolio(); showToast(`Redeemed 1 unit`);
  } else if(e.target.classList.contains('chart')){
    const name = e.target.dataset.name;
    showMiniChart(name);
  }
});

// FAB & modal
fab.addEventListener('click', ()=>{ modal.classList.remove('hidden'); addAmount.focus(); });
closeModal && closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));
addCancel && addCancel.addEventListener('click', ()=> modal.classList.add('hidden'));
addConfirm && addConfirm.addEventListener('click', ()=>{
  const amt = Math.max(1, +(addAmount.value||0));
  portfolio.cash = (portfolio.cash||0) + amt;
  save(); modal.classList.add('hidden'); renderPortfolio(); showToast(`Added ₹${amt}`);
});

// chart generation
function showMiniChart(name){
  detailArea.innerHTML = '';
  const wrapper = document.createElement('div'); wrapper.className = 'card';
  wrapper.innerHTML = `<div style="width:100%"><h4 style="margin:0 0 8px">${name} — 30d</h4><canvas id="miniChart" style="height:150px"></canvas></div>`;
  detailArea.appendChild(wrapper);

  const ctx = document.getElementById('miniChart').getContext('2d');
  const labels=[]; const data=[];
  let base = stocks[name]||100;
  for(let i=30;i>0;i--){ base += (Math.random()-0.5)*(base*0.015); data.push(+base.toFixed(2)); labels.push(i); }
  if(window._chart) window._chart.destroy();
  window._chart = new Chart(ctx, {type:'line',data:{labels,data,datasets:[{data,borderColor:'#16c784',fill:false,tension:0.3}]},options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:false}});
}

// ---------------- toasts ----------------
const toastEl = document.getElementById('toast');
function showToast(txt){
  if(!toastEl) return;
  toastEl.textContent = txt; toastEl.classList.remove('hidden');
  setTimeout(()=> toastEl.classList.add('hidden'),1500);
}

// ---------------- init ----------------
renderStocks(); renderFunds(); renderPortfolio();
