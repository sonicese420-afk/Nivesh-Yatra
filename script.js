// script.js - full app logic (stocks, funds, portfolio, modal, chart)
// Save this file as script.js in repo root.

(() => {
  // --------- Demo data -------------
  const stocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors' },
    { symbol: 'WIPRO', name: 'Wipro' },
    { symbol: 'MRF', name: 'MRF' },
    { symbol: 'HDFC', name: 'HDFC' },
    { symbol: 'AFFLE', name: 'Affle 3i Ltd' }
  ];

  // helper: random current price
  function randPrice(min, max) {
    return +(Math.random() * (max-min) + min).toFixed(2);
  }

  // generate pseudo-live price for each stock
  function getLivePrices(){
    const p = {};
    stocks.forEach(s => {
      // different ranges per company for variety
      const min = 100 + Math.random()*200;
      const max = min + (2000 * Math.random());
      p[s.symbol] = randPrice(min, max);
    });
    return p;
  }

  // ---------- localStorage helpers ----------
  const LS_KEY = 'nv_portfolio_v1';
  function loadPortfolio(){
    try{
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    }catch(e){ return {};}
  }
  function savePortfolio(data){
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  // ---------- UI refs ----------
  const listEl = document.getElementById('list');
  const totalAmountEl = document.getElementById('totalAmount');
  const holdingsCountEl = document.getElementById('holdingsCount');
  const dayChangeEl = document.getElementById('dayChange');
  const pageTitle = document.getElementById('pageTitle');

  const tabStocks = document.getElementById('tab-stocks');
  const tabFunds = document.getElementById('tab-funds');
  const tabPortfolio = document.getElementById('tab-portfolio');
  const tabs = [tabStocks, tabFunds, tabPortfolio];

  // modal elements
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const detailName = document.getElementById('detailName');
  const detailSub = document.getElementById('detailSub');
  const detailPrice = document.getElementById('detailPrice');
  const detailPL = document.getElementById('detailPL');
  const detailArea = document.getElementById('detailArea');
  const tradeQty = document.getElementById('tradeQty');
  const btnBuy = document.getElementById('btnBuy');
  const btnSell = document.getElementById('btnSell');
  const btnSip = document.getElementById('btnSip');
  const timesBtns = document.querySelectorAll('.time');

  // Chart
  let chart = null;

  // ---------------- state ----------------
  let livePrices = getLivePrices();
  let portfolio = loadPortfolio(); // { SYMBOL: { qty, avgPrice } }
  let currentStock = null;
  let currentRange = '1d';

  // ---------- util format ----------
  function fmtRs(n){ return '₹' + (Math.round(n*100)/100).toLocaleString('en-IN'); }
  function fmtPerc(p){ return (Math.round(p*100)/100).toFixed(2) + '%'; }

  // ---------- render list for Stocks tab ----------
  function renderStocksList(){
    pageTitle.textContent = 'Buy Stocks';
    listEl.innerHTML = '';
    stocks.forEach(s => {
      const card = document.createElement('div');
      card.className = 'stock-card card';

      const left = document.createElement('div');
      left.className = 'left';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = s.symbol.slice(0,2);

      const info = document.createElement('div');
      info.className = 'stock-info';
      info.innerHTML = `<div class="name">${s.name}</div>
                        <div class="sub">Stock | ${s.symbol}</div>`;

      left.appendChild(avatar);
      left.appendChild(info);

      const right = document.createElement('div');
      right.className = 'right';

      const priceEl = document.createElement('div');
      priceEl.className = 'price';
      const price = livePrices[s.symbol] || randPrice(100, 1000);
      priceEl.textContent = fmtRs(price);

      // owned pill (only for owned stocks)
      const owned = portfolio[s.symbol];
      if (owned && owned.qty > 0) {
        const changePill = document.createElement('div');
        // compute percent change vs avg price
        const plPerc = ((price - owned.avgPrice) / owned.avgPrice) * 100;
        changePill.className = 'owned-pill';
        changePill.textContent = (plPerc >= 0 ? '▲ ' : '▼ ') + Math.abs(plPerc).toFixed(2) + '%';
        right.appendChild(changePill);
      }

      // clicking card opens modal (trade UI)
      card.addEventListener('click', () => openDetail(s.symbol));

      right.appendChild(priceEl);
      card.appendChild(left);
      card.appendChild(right);

      listEl.appendChild(card);
    });
  }

  // ---------- render funds list ----------
  function renderFundsList(){
    pageTitle.textContent = 'Mutual Funds';
    listEl.innerHTML = '';
    // demo funds
    const funds = [
      { id:'EDEL', name:'Edelweiss Nifty Midcap150 Momentum 50 Index Fund' },
      { id:'HDFC_MID', name:'HDFC Mid Cap Fund' },
      { id:'HDFC_SM', name:'HDFC Small Cap Fund' }
    ];
    funds.forEach(f => {
      const card = document.createElement('div');
      card.className = 'stock-card card';
      card.innerHTML = `
        <div class="left">
          <div class="avatar">${f.id.slice(0,2)}</div>
          <div class="stock-info">
            <div class="name">${f.name}</div>
            <div class="sub">Fund | ${f.id}</div>
          </div>
        </div>
        <div class="right">
          <div class="price">${fmtRs(randPrice(80,200))}</div>
        </div>
      `;
      // clicking opens a simple modal (reuse stock modal for now)
      card.addEventListener('click', () => openFund(f.id, f.name));
      listEl.appendChild(card);
    });
  }

  // ---------- render portfolio ----------
  function renderPortfolio(){
    pageTitle.textContent = 'Your Portfolio';
    listEl.innerHTML = '';
    // compute totals
    let total = 0, holdings = 0, dayChange = 0;
    for (const sym in portfolio){
      const it = portfolio[sym];
      if (!it || it.qty <= 0) continue;
      holdings += it.qty;
      const price = livePrices[sym] || randPrice(100, 1000);
      total += price * it.qty;
      // day change pseudo (small random)
      dayChange += (price - it.avgPrice) * it.qty;
    }
    totalAmountEl.textContent = fmtRs(total);
    holdingsCountEl.textContent = 'Holdings: ' + holdings;
    dayChangeEl.textContent = (dayChange>=0? '＋':'') + fmtRs(dayChange) + ` (${total? fmtPerc((dayChange/Math.max(total,1))*100): '0.00%'})`;

    // show each holding card
    Object.keys(portfolio).forEach(sym => {
      const it = portfolio[sym];
      if (!it || it.qty <= 0) return;
      const price = livePrices[sym] || randPrice(100,1000);
      const card = document.createElement('div');
      card.className = 'stock-card card';
      card.innerHTML = `
        <div class="left">
          <div class="avatar">${sym.slice(0,2)}</div>
          <div class="stock-info">
            <div class="name">${stocks.find(s=>s.symbol===sym)?.name || sym}</div>
            <div class="sub">Owned • ${it.qty} @ ${fmtRs(it.avgPrice)}</div>
          </div>
        </div>
        <div class="right">
          <div class="price">${fmtRs(price)}</div>
          <div class="owned-pill">${((price - it.avgPrice)/it.avgPrice*100).toFixed(2)}%</div>
        </div>
      `;
      card.addEventListener('click', ()=>openDetail(sym));
      listEl.appendChild(card);
    });

    if (Object.keys(portfolio).filter(s=>portfolio[s].qty>0).length === 0){
      const info = document.createElement('div');
      info.className = 'card';
      info.style.margin = '12px';
      info.textContent = 'You have no holdings yet. Buy from stocks or funds.';
      listEl.appendChild(info);
    }
  }

  // ---------------- modal logic ----------------
  function openDetail(symbol){
    currentStock = symbol;
    // fill header
    const sObj = stocks.find(s=>s.symbol === symbol) || { name: symbol, symbol };
    detailName.textContent = sObj.name;
    detailSub.textContent = `Stock | ${symbol}`;
    const price = livePrices[symbol] || randPrice(100,1000);
    detailPrice.textContent = fmtRs(price);
    // show P/L if owned
    const owned = portfolio[symbol];
    if (owned && owned.qty > 0){
      const plPerc = ((price - owned.avgPrice) / owned.avgPrice) * 100;
      detailPL.textContent = (plPerc>=0 ? '▲ ': '▼ ') + Math.abs(plPerc).toFixed(2) + '%';
      detailPL.style.color = plPerc>=0 ? 'var(--success)' : 'var(--danger)';
    } else {
      detailPL.textContent = '';
      detailPL.style.color = '';
    }

    // show modal
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');

    // create chart for currentRange
    buildChart(symbol, currentRange);
  }
  function closeModal(){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    if (chart) { chart.destroy(); chart = null; }
  }
  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ---------- generate historical data for chart ----------
  function genSeries(range){
    // return array of {x,label} points
    const pts = [];
    let count;
    let stepMinutes = 15;
    if (range === '1d'){ count = 24*60/stepMinutes; }
    else if (range === '1w'){ count = 7*24; stepMinutes = 60; } // hourly approx
    else if (range === '1m'){ count = 30; stepMinutes = 60*24; } // daily
    else if (range === '6m'){ count = 180; stepMinutes = 60*24; } // daily
    else { count = 24; }

    // start price random baseline
    let base = randPrice(300, 2500);
    for (let i=0;i<count;i++){
      // small random walk
      const drift = (Math.random()-0.5) * (base * 0.01);
      base = Math.max(1, base + drift);
      pts.push(+base.toFixed(2));
    }
    return pts;
  }

  // ---------- build Chart.js chart ----------
  function buildChart(symbol, range){
    const ctx = document.getElementById('historyChart').getContext('2d');
    const data = genSeries(range);
    if (chart) { chart.destroy(); chart = null; }
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_,i)=>i),
        datasets: [{
          data,
          tension: 0.25,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46,204,113,0.03)',
          pointRadius: 0,
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend:{display:false} },
        scales: {
          x: { display:false },
          y: { ticks:{color:'rgba(255,255,255,0.7)'}, grid:{color:'rgba(255,255,255,0.03)'} }
        }
      }
    });
  }

  // time buttons
  timesBtns.forEach(btn => {
    btn.addEventListener('click', ()=>{
      timesBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      if (currentStock) buildChart(currentStock, currentRange);
    });
  });

  // ---------- trade actions ----------
  btnBuy.addEventListener('click', ()=> {
    const qty = Math.max(1, Number(tradeQty.value || 1));
    const price = livePrices[currentStock] || randPrice(100,1000);
    const prev = portfolio[currentStock] || { qty:0, avgPrice:0 };
    const newQty = prev.qty + qty;
    const newAvg = ((prev.avgPrice * prev.qty) + price * qty) / newQty;
    portfolio[currentStock] = { qty: newQty, avgPrice: +newAvg.toFixed(2) };
    savePortfolio(portfolio);
    refreshAll();
    alert(`Bought ${qty} ${currentStock} @ ${fmtRs(price)}`);
  });

  btnSell.addEventListener('click', ()=> {
    const qty = Math.max(1, Number(tradeQty.value || 1));
    const prev = portfolio[currentStock] || { qty:0, avgPrice:0 };
    if (prev.qty < qty) { alert('Not enough quantity to sell'); return; }
    const price = livePrices[currentStock] || randPrice(100,1000);
    const remaining = prev.qty - qty;
    if (remaining === 0) delete portfolio[currentStock];
    else portfolio[currentStock] = { qty: remaining, avgPrice: prev.avgPrice };
    savePortfolio(portfolio);
    refreshAll();
    alert(`Sold ${qty} ${currentStock} @ ${fmtRs(price)}`);
  });

  btnSip.addEventListener('click', ()=> {
    alert('SIP: placeholder (you can implement recurring purchases later)');
  });

  // ---------- tabs ----------
  function activateTab(tabName){
    tabs.forEach(t=>t.classList.remove('active'));
    if(tabName==='stocks') tabStocks.classList.add('active');
    else if(tabName==='funds') tabFunds.classList.add('active');
    else if(tabName==='portfolio') tabPortfolio.classList.add('active');

    if (tabName === 'stocks') renderStocksList();
    else if (tabName === 'funds') renderFundsList();
    else renderPortfolio();
  }
  tabStocks.addEventListener('click', ()=> activateTab('stocks'));
  tabFunds.addEventListener('click', ()=> activateTab('funds'));
  tabPortfolio.addEventListener('click', ()=> activateTab('portfolio'));

  // ---------- open fund (simple) ----------
  function openFund(id, name){
    // reuse modal but set content appropriately
    currentStock = id;
    detailName.textContent = name;
    detailSub.textContent = `Fund | ${id}`;
    detailPrice.textContent = fmtRs(randPrice(50,300));
    detailPL.textContent = '';
    modal.classList.remove('hidden');
    buildChart(id, currentRange);
  }

  // ---------- refresh totals and lists ----------
  function refreshAll(){
    // refresh live prices occasionally
    livePrices = getLivePrices();
    // recalc totals for summary when portfolio tab active
    let total=0,holdings=0,day=0;
    for (const sym in portfolio){
      const it = portfolio[sym];
      if (!it) continue;
      holdings += it.qty;
      const price = livePrices[sym] || randPrice(100,1000);
      total += price * it.qty;
      day += (price - it.avgPrice)*it.qty;
    }
    totalAmountEl.textContent = fmtRs(total);
    holdingsCountEl.textContent = 'Holdings: ' + holdings;
    dayChangeEl.textContent = (day>=0? '＋':'') + fmtRs(day) + ` (${ total ? fmtPerc((day/Math.max(total,1))*100) : '0.00%'})`;

    // re-render current tab
    const active = document.querySelector('.tab.active')?.dataset?.tab || 'stocks';
    activateTab(active);
  }

  // hide/show toggle
  const toggleVisibilityBtn = document.getElementById('toggle-visibility');
  let hidden = false;
  toggleVisibilityBtn.addEventListener('click', ()=>{
    hidden = !hidden;
    if (hidden) {
      totalAmountEl.textContent = '****';
      dayChangeEl.textContent = '****';
    } else {
      refreshAll();
    }
  });

  // build initial
  function init(){
    // initial live prices
    livePrices = getLivePrices();
    // initial render
    renderStocksList();
    refreshAll();
    // refresh some data every 20s to simulate live update
    setInterval(()=> {
      livePrices = getLivePrices();
      // only refresh UI if modal not open (if open, user may be viewing chart)
      if (modal.classList.contains('hidden')) refreshAll();
    }, 20000);
    console.log('Nivesh Yatra app initialized');
  }

  init();

})();
