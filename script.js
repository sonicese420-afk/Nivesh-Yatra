// ---------- Demo data ----------
const stocks = [
  { id: 'RELIANCE', name: 'Reliance Industries Ltd', price: 1545 },
  { id: 'TATAMOTORS', name: 'Tata Motors', price: 547 },
  { id: 'ADANIGREEN', name: 'Adani Green', price: 646 },
  { id: 'WIPRO', name: 'Wipro', price: 574 },
  { id: 'MRF', name: 'MRF', price: 41000 },
  { id: 'HDFC', name: 'HDFC', price: 1174 },
];

const funds = [
  { id: 'EDEL', name: 'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', price: 182 },
  { id: 'HDFC_MC', name: 'HDFC Mid Cap Fund', price: 230 },
  { id: 'SBI_LC', name: 'SBI Large Cap Fund', price: 430 },
];

// ---------- local storage (simple portfolio) ----------
function loadPortfolio() {
  try { return JSON.parse(localStorage.getItem('ny_portfolio') || '[]') } catch (e) { return [] }
}
function savePortfolio(p) { localStorage.setItem('ny_portfolio', JSON.stringify(p)) }
let portfolio = loadPortfolio(); // each item: {id, type:'stock'|'fund', qty, avgPrice}

// ---------- utilities ----------
function formatRs(n) {
  const x = Math.round(n * 100) / 100;
  return '₹' + x.toLocaleString('en-IN');
}
function pct(change, base) {
  if (base === 0) return '0.00%';
  return ((change / base) * 100).toFixed(2) + '%';
}

// ---------- DOM references ----------
const listEl = document.getElementById('list');
const totalValueEl = document.getElementById('totalValue');
const holdingsCountEl = document.getElementById('holdingsCount');
const dayChangeEl = document.getElementById('dayChange');

const modal = document.getElementById('detailModal');
const closeModalBtn = document.getElementById('closeModal');
const detailName = document.getElementById('detailName');
const detailType = document.getElementById('detailType');
const detailPrice = document.getElementById('detailPrice');
const detailChange = document.getElementById('detailChange');
const detailSymbol = document.getElementById('detailSymbol');
const rangeBtns = document.querySelectorAll('.range-btn');
const actionBuy = document.getElementById('actionBuy');
const actionSell = document.getElementById('actionSell');
const actionSip = document.getElementById('actionSip');

let currentDetail = null; // {id,type,meta}

// ---------- simple dynamic price generator ----------
function livePrice(base) {
  // small random walk based on base
  const noise = (Math.random() - 0.5) * Math.max(1, base * 0.02);
  return Math.max(1, Math.round((base + noise) * 100) / 100);
}

// ---------- render list for a given tab ----------
let currentTab = 'stocks';
function renderList() {
  listEl.innerHTML = '';
  const dataset = currentTab === 'stocks' ? stocks : funds;
  dataset.forEach(item => {
    const isOwned = portfolio.some(p => p.id === item.id);
    const current = livePrice(item.price);
    const changePct = (Math.random() * 2 - 1).toFixed(2); // placeholder
    const changeClass = changePct >= 0 ? 'success' : 'danger';

    const card = document.createElement('div');
    card.className = 'item';
    card.innerHTML = `
      <div class="item-left">
        <div class="avatar">${item.id.slice(0,2)}</div>
        <div class="meta">
          <div class="name">${item.name}</div>
          <div class="sub">Stock | ${item.id}</div>
        </div>
      </div>

      <div class="price-area">
        <div class="controls">
          <input class="qty" value="1" type="number" min="1" />
          ${isOwned ? '' : ''} <!-- buy button removed - click card opens modal -->
        </div>
        <div class="price">${formatRs(current)}</div>
        <div class="change ${isOwned ? '' : 'muted'}">
          ${isOwned ? (Math.random() > 0.5 ? '▲' : '▼') + ' ' + Math.abs(changePct) + '%' : ''}
        </div>
      </div>
    `;

    // clicking on whole card opens detail modal
    card.addEventListener('click', (e) => {
      // avoid clicking input causing modal (if clicking qty)
      if (e.target.tagName.toLowerCase() === 'input') return;
      openDetail(item, currentTab, current);
    });

    listEl.appendChild(card);
  });
  updateSummary();
}

// ---------- update top summary ----------
function updateSummary() {
  let total = 0;
  let dayChange = 0;
  portfolio.forEach(h => {
    // find base price from data arrays
    const meta = (h.type === 'stock' ? stocks : funds).find(s => s.id === h.id);
    if (!meta) return;
    const current = livePrice(meta.price);
    total += current * h.qty;
    // simple change from avg:
    dayChange += (current - h.avgPrice) * h.qty;
  });
  totalValueEl.textContent = formatRs(total);
  holdingsCountEl.textContent = `Holdings: ${portfolio.reduce((s,p)=>s+p.qty,0)}`;
  const pctStr = total === 0 ? '(0.00%)' : `(${pct(dayChange, total)})`;
  dayChangeEl.textContent = (dayChange >= 0 ? '＋' : '−') + formatRs(Math.abs(dayChange)) + ' ' + pctStr;
  dayChangeEl.style.color = dayChange >= 0 ? 'var(--success)' : 'var(--danger)';
}

// ---------- modal logic & chart ----------
let chart = null;
function openDetail(item, typeTab, currentPrice) {
  currentDetail = {id:item.id, type: typeTab === 'stocks' ? 'stock' : 'fund', meta: item};
  detailName.textContent = item.name;
  detailType.textContent = (typeTab === 'stocks' ? 'Stock' : 'Fund') + ' | ' + item.id;
  detailSymbol.textContent = item.id.slice(0,3);
  detailPrice.textContent = formatRs(currentPrice);

  // is owned?
  const owned = portfolio.find(p => p.id === item.id);
  if (owned) {
    const avg = owned.avgPrice;
    const diff = currentPrice - avg;
    detailChange.textContent = `${diff >= 0 ? '▲' : '▼'} ${pct(Math.abs(diff), avg)}`;
    detailChange.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
  } else {
    detailChange.textContent = '';
  }

  // draw chart with sample data according to default 1D
  drawChart(generateSeries(item.price, '1D'));

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

// close modal
closeModalBtn.addEventListener('click', ()=> {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentDetail = null;
});

// range buttons
rangeBtns.forEach(b=>{
  b.addEventListener('click', ()=> {
    rangeBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    if (!currentDetail) return;
    const rng = b.dataset.range;
    drawChart(generateSeries(currentDetail.meta.price, rng));
  });
});

// generate mock series for chart (simple random-walk)
function generateSeries(base, range) {
  // number of points
  const points = { '1D':48, '1W':28, '1M':30, '3M':45, '6M':60 }[range] || 30;
  let vals = [];
  let v = base;
  for(let i=0;i<points;i++){
    const step = (Math.random()-0.5) * Math.max(1, base * 0.02);
    v = Math.max(1, v + step);
    vals.push(Math.round(v*100)/100);
  }
  return vals;
}

function drawChart(data) {
  const ctx = document.getElementById('historyChart').getContext('2d');
  if (chart) chart.destroy();
  const labels = data.map((_,i) => i);
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price',
        data,
        borderColor: '#2ecc71',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display:false },
        y: { 
          ticks: { color: 'rgba(255,255,255,0.7)' }
        }
      },
      plugins: {
        legend: { display:false }
      }
    }
  });
  // enforce canvas height so it doesn't stretch
  document.getElementById('historyChart').style.height = '260px';
}

// ---------- actions: Buy / Sell / SIP (simple flows) ----------
actionBuy.addEventListener('click', ()=> {
  if (!currentDetail) return;
  const qty = prompt('How many units to BUY?', '1');
  const q = Math.max(1, parseInt(qty||'0')||1);
  const meta = currentDetail.meta;
  const priceNow = livePrice(meta.price);
  // update portfolio
  let entry = portfolio.find(p=>p.id===meta.id);
  if (!entry) {
    portfolio.push({ id: meta.id, type: currentDetail.type, qty: q, avgPrice: priceNow });
  } else {
    // new average price
    const totalCost = entry.avgPrice * entry.qty + priceNow * q;
    const newQty = entry.qty + q;
    entry.avgPrice = Math.round((totalCost / newQty) * 100) / 100;
    entry.qty = newQty;
  }
  savePortfolio(portfolio);
  renderList();
  updateSummary();
  closeModalBtn.click();
});
actionSell.addEventListener('click', ()=> {
  if (!currentDetail) return;
  const meta = currentDetail.meta;
  const entry = portfolio.find(p=>p.id===meta.id);
  if (!entry) { alert('You do not own this asset'); return }
  const qty = parseInt(prompt(`How many units to SELL? (You own ${entry.qty})`, '1')||'0') || 0;
  if (qty <= 0) return;
  if (qty >= entry.qty) {
    // remove
    portfolio = portfolio.filter(p=>p.id!==meta.id);
  } else {
    entry.qty -= qty;
  }
  savePortfolio(portfolio);
  renderList();
  updateSummary();
  closeModalBtn.click();
});
actionSip.addEventListener('click', ()=> {
  alert('SIP feature placeholder — will implement scheduled purchases (future).');
});

// ---------- tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    // change page title
    document.querySelector('.page-title').textContent = currentTab === 'stocks' ? 'Buy Stocks' :
                                                       currentTab === 'funds' ? 'Buy Funds' : 'Your Portfolio';
    // render content
    if (currentTab === 'portfolio') {
      renderPortfolioView();
    } else {
      renderList();
    }
  });
});

// ---------- portfolio view ----------
function renderPortfolioView(){
  listEl.innerHTML = '';
  if (portfolio.length === 0) {
    listEl.innerHTML = '<div class="muted" style="padding:30px 10px">No holdings yet — buy any stock or fund to see it here.</div>';
    return;
  }
  portfolio.forEach(h => {
    const meta = (h.type === 'stock' ? stocks : funds).find(x => x.id === h.id);
    const cur = livePrice(meta.price);
    const pnl = Math.round((cur - h.avgPrice) * h.qty * 100) / 100;
    const pctMove = pct(cur - h.avgPrice, h.avgPrice);
    const card = document.createElement('div');
    card.className = 'item';
    card.innerHTML = `
      <div class="item-left">
        <div class="avatar">${meta.id.slice(0,2)}</div>
        <div class="meta">
          <div class="name">${meta.name}</div>
          <div class="sub">${h.type === 'stock' ? 'Stock' : 'Fund'} | ${meta.id}</div>
          <div class="sub">Qty: ${h.qty} • Avg: ${formatRs(h.avgPrice)}</div>
        </div>
      </div>
      <div class="price-area">
        <div class="price">${formatRs(cur)}</div>
        <div class="change" style="color:${pnl>=0 ? 'var(--success)' : 'var(--danger)'}">
          ${pnl>=0 ? '▲' : '▼'} ${Math.abs(pctMove)}
        </div>
      </div>
    `;
    card.addEventListener('click', ()=> openDetail(meta, h.type === 'stock' ? 'stocks' : 'funds', cur));
    listEl.appendChild(card);
  });
}

// ---------- initial render ----------
renderList();
updateSummary();

// periodically update (simulate live)
setInterval(()=>{
  renderList();
  updateSummary();
}, 6000);
