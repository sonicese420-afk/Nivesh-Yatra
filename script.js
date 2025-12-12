// Basic demo code to render stocks, open details modal, persist buys to localStorage
const stocks = [
  { id: 'RE', name: 'Reliance Industries Ltd', sym: 'RELIANCE', price: random(1200, 2000) },
  { id: 'TM', name: 'Tata Motors', sym: 'TATAMOTORS', price: random(500, 1400) },
  { id: 'AG', name: 'Adani Green', sym: 'ADANIGREEN', price: random(400, 1500) },
  { id: 'WI', name: 'Wipro', sym: 'WIPRO', price: random(200, 600) },
  { id: 'MR', name: 'MRF', sym: 'MRF', price: random(80000, 125000) },
  { id: 'HD', name: 'HDFC', sym: 'HDFC', price: random(850, 2000) },
  { id: 'AF', name: 'Affle 3i Ltd', sym: 'AFFLE', price: random(120, 500) }
];

const storageKey = 'nv_portfolio_v1';
let portfolio = JSON.parse(localStorage.getItem(storageKey) || '{}');

const stocksList = document.getElementById('stocksList');
const totalAssetsEl = document.getElementById('totalAssets');
const holdingsCountEl = document.getElementById('holdingsCount');

function random(a,b){ return Math.round(a + Math.random()*(b-a)); }

function renderCards(){
  stocksList.innerHTML = '';
  stocks.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'card';
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
    price.textContent = `₹${Number(s.price).toLocaleString(undefined,{maximumFractionDigits:2})}`;

    // if owned show arrow pill
    const owned = portfolio[s.id] && portfolio[s.id].qty > 0;
    const pct = document.createElement('div');
    pct.className = 'pct';
    if(owned){
      let change = ((Math.random()-0.45)*2).toFixed(2);
      pct.innerHTML = (change>=0? '▲ ':'▼ ') + Math.abs(change) + '%';
      pct.style.color = change >= 0 ? 'var(--accent)' : '#d14a4a';
    }

    right.appendChild(price);
    if(owned) right.appendChild(pct);

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(right);

    card.addEventListener('click', ()=> openDetail(s));
    stocksList.appendChild(card);
  });

  updateSummary();
}

function updateSummary(){
  let total = 0, holdings=0;
  for(const id in portfolio){
    const p = portfolio[id];
    const stock = stocks.find(s=>s.id===id);
    if(stock && p.qty>0){
      total += stock.price * p.qty;
      holdings += p.qty;
    }
  }
  totalAssetsEl.textContent = `₹${total.toLocaleString(undefined,{maximumFractionDigits:2})}`;
  holdingsCountEl.textContent = `Holdings: ${holdings}`;
}

function openDetail(stock){
  const modal = document.getElementById('detailModal');
  document.getElementById('detailName').textContent = stock.name;
  document.getElementById('detailType').textContent = `Stock | ${stock.sym}`;
  document.getElementById('detailPrice').textContent = `₹${stock.price.toLocaleString()}`;
  // show bought pct if owned
  const owned = portfolio[stock.id] && portfolio[stock.id].qty>0;
  const detailPct = document.getElementById('detailPct');
  if(owned){
    detailPct.textContent = '▲' + (Math.abs((Math.random()*2)).toFixed(2)) + '%';
    detailPct.style.color = 'var(--accent)';
  } else {
    detailPct.textContent = '';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');

  // draw chart with random data (placeholder)
  drawChart(stock);
}

function closeDetail(){
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

document.getElementById('closeModal').addEventListener('click', closeDetail);
document.getElementById('modalBackdrop').addEventListener('click', closeDetail);

// trades: buy/sell
document.getElementById('buyBtn').addEventListener('click', ()=>{
  const qty = Number(document.getElementById('qty').value) || 1;
  const name = document.getElementById('detailName').textContent;
  const stock = stocks.find(s=>s.name===name);
  if(!stock) return;
  portfolio[stock.id] = portfolio[stock.id] || { qty:0, avg:stock.price };
  portfolio[stock.id].avg = ((portfolio[stock.id].avg*portfolio[stock.id].qty) + (stock.price*qty)) / (portfolio[stock.id].qty + qty);
  portfolio[stock.id].qty += qty;
  savePortfolio();
  renderCards();
  closeDetail();
});

document.getElementById('sellBtn').addEventListener('click', ()=>{
  const qty = Number(document.getElementById('qty').value) || 1;
  const name = document.getElementById('detailName').textContent;
  const stock = stocks.find(s=>s.name===name);
  if(!stock) return;
  if(portfolio[stock.id] && portfolio[stock.id].qty>0){
    portfolio[stock.id].qty = Math.max(0, portfolio[stock.id].qty - qty);
    if(portfolio[stock.id].qty === 0) delete portfolio[stock.id];
    savePortfolio();
    renderCards();
  }
  closeDetail();
});

document.getElementById('sipBtn').addEventListener('click', ()=>{
  // very simple SIP demo: increments qty by 1 and keeps avg updated
  const name = document.getElementById('detailName').textContent;
  const stock = stocks.find(s=>s.name===name);
  if(!stock) return;
  portfolio[stock.id] = portfolio[stock.id] || { qty:0, avg:stock.price };
  portfolio[stock.id].avg = ((portfolio[stock.id].avg*portfolio[stock.id].qty) + stock.price) / (portfolio[stock.id].qty + 1);
  portfolio[stock.id].qty += 1;
  savePortfolio();
  renderCards();
  closeDetail();
});

function savePortfolio(){
  localStorage.setItem(storageKey, JSON.stringify(portfolio));
}

// chart drawing
let detailChart = null;
function drawChart(stock){
  const ctx = document.getElementById('detailChart').getContext('2d');
  // generate random walk data
  const base = stock.price;
  const labels = [];
  const data = [];
  for(let i=0;i<40;i++){
    labels.push('');
    const noise = (Math.random()-0.5)*8;
    data.push(Math.max(10, Math.round(base + (Math.sin(i/3)*12) + noise)));
  }
  if(detailChart) detailChart.destroy();
  detailChart = new Chart(ctx, {
    type:'line',
    data: { labels, datasets: [{ data, borderColor:'#2fdf9a', backgroundColor:'rgba(47,223,154,0.06)', tension:0.3, pointRadius:0 }]},
    options:{ maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ display:false }, y:{ beginAtZero:false, grid:{ color:'rgba(255,255,255,0.03)'}, ticks:{ color:'rgba(255,255,255,0.6)' } } } }
  });
}

// init
renderCards();

// bottom tabs switching
document.querySelectorAll('.bottom-nav .tab').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    document.querySelectorAll('.bottom-nav .tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.tab;
    if(t==='stocks'){ document.getElementById('stockHeader').textContent='Buy Stocks'; renderCards(); }
    else if(t==='funds'){ document.getElementById('stockHeader').textContent='Mutual Funds'; showFunds(); }
    else if(t==='portfolio'){ document.getElementById('stockHeader').textContent='Your Portfolio'; showPortfolio(); }
  });
});

function showFunds(){
  stocksList.innerHTML = '';
  const funds = [
    'Edelweiss Nifty Midcap150 Momentum 50 Index Fund',
    'HDFC Mid Cap Fund',
    'HDFC Small Cap Fund',
    'Nippon India Large Cap Fund',
    'SBI Large Cap Fund',
    'Nippon India Growth Mid Cap Fund',
    'Nippon India Small Cap Fund',
    'HDFC Large Cap Fund'
  ];
  funds.forEach((f,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `<div class="avatar">F${i+1}</div><div class="meta"><div class="title">${f}</div><div class="sub">Fund | ${f.split(' ')[0].toUpperCase()}</div></div><div class="right"><div class="price">₹${random(100,400)}</div></div>`;
    stocksList.appendChild(card);
  });
}

function showPortfolio(){
  stocksList.innerHTML = '';
  let found=false;
  for(const id in portfolio){
    const s = stocks.find(x=>x.id===id);
    if(!s) continue;
    found=true;
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `<div class="avatar">${s.id}</div><div class="meta"><div class="title">${s.name}</div><div class="sub">You own ${portfolio[id].qty} @ avg ₹${portfolio[id].avg.toFixed(2)}</div></div><div class="right"><div class="price">₹${(s.price*portfolio[id].qty).toLocaleString()}</div><div class="pct" style="color:var(--accent)">▲${((Math.random()*2).toFixed(2))}%</div></div>`;
    stocksList.appendChild(card);
  }
  if(!found){
    stocksList.innerHTML = '<div style="color:var(--muted); padding:18px">No holdings yet — buy some stocks to see them in Portfolio.</div>';
  }
                                      }
