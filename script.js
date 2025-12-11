// script.js - interactive logic (works with style.css & index.html)
// localStorage key: nv_portfolio_v5
(function(){
  // ---------- demo price data ----------
  const stocks = {
    "Tata Motors": rnd(600,950),
    "Adani Green": rnd(820,1500),
    "Wipro": rnd(220,360),
    "MRF": rnd(90000,150000),
    "Reliance": rnd(1400,1800),
    "HDFC": rnd(1100,1600),
    "Affle 3i Ltd": rnd(100,220)
  };
  const funds = {
    "Edelweiss Nifty Midcap150 Momentum 50 Index Fund": rnd(80,160),
    "HDFC Mid Cap Fund": rnd(100,250),
    "HDFC Small Cap Fund": rnd(90,200),
    "Nippon India Large Cap Fund": rnd(90,180),
    "SBI Large Cap Fund": rnd(85,175),
    "Nippon India Growth Mid Cap Fund": rnd(100,210),
    "Nippon India Small Cap Fund": rnd(80,160),
    "HDFC Large Cap Fund": rnd(90,170)
  };

  // ---------- local storage ----------
  const KEY = 'nv_portfolio_v5';
  let portfolio = JSON.parse(localStorage.getItem(KEY) || '{"stocks":{},"funds":{},"cash":0}');
  function save(){ localStorage.setItem(KEY, JSON.stringify(portfolio)); }

  // ---------- elements ----------
  const stockList = qs('#stockList'), fundList = qs('#fundList'), portfolioList = qs('#portfolioList');
  const portfolioSummary = qs('#portfolioSummary'), detailArea = qs('#detailArea');
  const totalAmountEl = qs('#totalAmount'), oneDayChangeEl = qs('#oneDayChange'), holdingsCountEl = qs('#holdingsCount');
  const toastEl = qs('#toast');

  // nav
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(b => b.addEventListener('click', navClick));
  function navClick(e){
    navBtns.forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const target = e.currentTarget.dataset.target;
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
    if(target==='portfolioPanel') renderPortfolio();
  }

  // theme toggle
  qs('#themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem('nv_theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
  if(localStorage.getItem('nv_theme') === 'light') document.documentElement.classList.add('light');

  // delegation events
  stockList.addEventListener('click', onStockClick);
  fundList.addEventListener('click', onFundClick);
  portfolioList.addEventListener('click', onPortfolioClick);

  // render lists
  function renderStocks(){
    stockList.innerHTML = '';
    Object.keys(stocks).forEach(name=>{
      const price = stocks[name];
      const row = el('div','card row');
      row.innerHTML = `
        <div>
          <div class="title">${name}</div>
          <div class="price">₹${num(price)}</div>
        </div>
        <div class="controls">
          <input class="qty" type="number" min="1" value="1" />
          <button class="btn primary buy" data-name="${escape(name)}">Buy</button>
        </div>`;
      stockList.appendChild(row);
    });
  }
  function renderFunds(){
    fundList.innerHTML = '';
    Object.keys(funds).forEach(name=>{
      const price = funds[name];
      const row = el('div','card row');
      row.innerHTML = `
        <div style="max-width:68%">
          <div class="title">${name}</div>
          <div class="price">₹${num(price)}</div>
        </div>
        <div class="controls">
          <input class="qty" type="number" min="1" value="1" />
          <button class="btn primary addfund" data-name="${escape(name)}">Add</button>
        </div>`;
      fundList.appendChild(row);
    });
  }

  // events
  function onStockClick(e){
    const btn = e.target.closest('.buy'); if(!btn) return;
    const name = unescape(btn.dataset.name), qtyEl = btn.parentElement.querySelector('.qty');
    const qty = Math.max(1, parseInt(qtyEl.value||1,10)); buyStock(name,qty);
  }
  function onFundClick(e){
    const btn = e.target.closest('.addfund'); if(!btn) return;
    const name = unescape(btn.dataset.name), qtyEl = btn.parentElement.querySelector('.qty');
    const qty = Math.max(1, parseInt(qtyEl.value||1,10)); buyFund(name,qty);
  }
  function onPortfolioClick(e){
    const sellBtn = e.target.closest('.sell'), redeemBtn = e.target.closest('.redeem'), detailsBtn = e.target.closest('.details');
    if(sellBtn){ sellStock(unescape(sellBtn.dataset.name)); }
    else if(redeemBtn){ redeemFund(unescape(redeemBtn.dataset.name)); }
    else if(detailsBtn){ showDetailsAndChart(unescape(detailsBtn.dataset.name)); }
  }

  // buy/sell
  function buyStock(name, qty){
    const price = stocks[name] || 0, prev = portfolio.stocks[name] || {qty:0, avg:0};
    const newQty = prev.qty + qty;
    const newAvg = newQty ? ((prev.qty*prev.avg) + qty*price)/newQty : price;
    portfolio.stocks[name] = { qty: newQty, avg: +newAvg.toFixed(2) };
    save(); renderPortfolio(); showToast(`Bought ${qty} × ${name}`);
  }
  function buyFund(name, units){
    const price = funds[name] || 0, prev = portfolio.funds[name] || {units:0, avg:0};
    const newUnits = prev.units + units;
    const newAvg = newUnits ? ((prev.units*prev.avg) + units*price)/newUnits : price;
    portfolio.funds[name] = { units: newUnits, avg: +newAvg.toFixed(2) };
    save(); renderPortfolio(); showToast(`Added ${units} unit(s) of ${name}`);
  }
  function sellStock(name){
    if(!portfolio.stocks[name]) return;
    portfolio.stocks[name].qty = Math.max(0, portfolio.stocks[name].qty - 1);
    if(portfolio.stocks[name].qty === 0) delete portfolio.stocks[name];
    save(); renderPortfolio(); showToast('Sold 1 × ' + name);
  }
  function redeemFund(name){
    if(!portfolio.funds[name]) return;
    portfolio.funds[name].units = Math.max(0, portfolio.funds[name].units - 1);
    if(portfolio.funds[name].units === 0) delete portfolio.funds[name];
    save(); renderPortfolio(); showToast('Redeemed 1 unit of ' + name);
  }

  // portfolio render & chart
  let chartInstance = null;
  function renderPortfolio(){
    portfolioList.innerHTML = ''; detailArea.innerHTML = '';
    let invested = 0, currentVal = 0, unitsCount = 0;
    Object.keys(portfolio.stocks).forEach(s=>{ const e = portfolio.stocks[s]; unitsCount += e.qty; invested += e.qty*e.avg; currentVal += e.qty*(stocks[s]||0); });
    Object.keys(portfolio.funds).forEach(f=>{ const e = portfolio.funds[f]; unitsCount += e.units; invested += e.units*e.avg; currentVal += e.units*(funds[f]||0); });
    const cash = portfolio.cash||0, total = currentVal + cash;
    totalAmountEl.textContent = '₹' + num(total);
    oneDayChangeEl.textContent = '1 Day Change: ₹' + (Math.random()*20-10).toFixed(2);
    holdingsCountEl.textContent = 'Holdings: ' + (Object.keys(portfolio.stocks).length + Object.keys(portfolio.funds).length) + ' items • ' + unitsCount + ' units';

    portfolioSummary.innerHTML = `
      <div style="font-weight:800">Total: ₹${num(total)}</div>
      <div class="muted" style="margin-top:6px">Invested: ₹${num(invested)} • Cash: ₹${num(cash)}</div>
      <div style="margin-top:8px"><button id="showPortfolioChart" class="btn ghost">Show 6-Month Portfolio Chart</button>
      <button id="seedBtn" class="btn ghost" style="margin-left:8px">Seed demo</button>
      <button id="resetBtn" class="btn ghost" style="margin-left:8px">Reset</button></div>`;
    qs('#showPortfolioChart').addEventListener('click', renderPortfolioChart);
    qs('#seedBtn').addEventListener('click', seedDemo);
    qs('#resetBtn').addEventListener('click', resetDemo);

    if(Object.keys(portfolio.stocks).length===0 && Object.keys(portfolio.funds).length===0){
      portfolioList.innerHTML = '<div class="card">No holdings yet. Buy some stocks or add fund units to see details here.</div>'; return;
    }

    Object.keys(portfolio.stocks).forEach(s=>{
      const {qty,avg} = portfolio.stocks[s]; const cur = stocks[s]||0;
      const investedAmt = qty*avg; const curVal = qty*cur; const pl = curVal-investedAmt; const plPct = investedAmt? (pl/investedAmt*100).toFixed(2) : '0.00';
      const row = el('div','card row');
      row.innerHTML = `
        <div style="max-width:66%">
          <div class="title">${s}</div>
          <div class="muted">Qty: ${qty} • Avg: ₹${num(avg)} • Cur: ₹${num(cur)}</div>
          <div style="margin-top:6px">Invested ₹${num(investedAmt)} • Value ₹${num(curVal)} • <strong>${pl>=0? '▲':'▼'} ₹${num(Math.abs(pl))} (${plPct}%)</strong></div>
        </div>
        <div class="controls">
          <button class="btn ghost sell" data-name="${escape(s)}">Sell 1</button>
          <button class="btn ghost details" data-name="${escape(s)}">Details</button>
        </div>`;
      portfolioList.appendChild(row);
    });

    Object.keys(portfolio.funds).forEach(f=>{
      const {units,avg} = portfolio.funds[f]; const cur = funds[f]||0;
      const investedAmt = units*avg; const curVal = units*cur; const pl = curVal-investedAmt; const plPct = investedAmt? (pl/investedAmt*100).toFixed(2) : '0.00';
      const row = el('div','card row');
      row.innerHTML = `
        <div style="max-width:66%">
          <div class="title">${f}</div>
          <div class="muted">Units: ${units} • Avg: ₹${num(avg)} • NAV: ₹${num(cur)}</div>
          <div style="margin-top:6px">Invested ₹${num(investedAmt)} • Value ₹${num(curVal)} • <strong>${pl>=0? '▲':'▼'} ₹${num(Math.abs(pl))} (${plPct}%)</strong></div>
        </div>
        <div class="controls">
          <button class="btn ghost redeem" data-name="${escape(f)}">Redeem 1</button>
          <button class="btn ghost details" data-name="${escape(f)}">Details</button>
        </div>`;
      portfolioList.appendChild(row);
    });
  }

  // charts
  function renderPortfolioChart(){
    detailArea.innerHTML = '';
    const wrapper = el('div','card');
    wrapper.innerHTML = '<h4 style="margin:0 0 8px">Portfolio — Last 6 months</h4><canvas id="historyChart"></canvas>';
    detailArea.appendChild(wrapper);
    const ctx = qs('#historyChart').getContext('2d');
    const holdings = buildSeries(); const labels = labelsLast6();
    const datasets = []; let idx=0;
    const palette = ['#16a085','#2f7ecf','#e76f51','#8d99ae','#f4a261','#7b2cbf','#06d6a0','#00b4d8'];
    const total = Array(6).fill(0);
    for(const k in holdings){
      const data = holdings[k].map(v=>+v.toFixed(2));
      data.forEach((v,i)=> total[i]+=v);
      datasets.push({label:k,data,borderColor:palette[idx%palette.length],backgroundColor:'transparent',tension:0.35,borderWidth:1.5,pointRadius:2});
      idx++;
    }
    datasets.push({label:'Total',data:total.map(v=>+v.toFixed(2)),borderColor:'#ffffff',backgroundColor:'transparent',borderWidth:3.5,tension:0.3,pointRadius:3});
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx,{type:'line',data:{labels,datasets},options:{maintainAspectRatio:false,responsive:true,plugins:{legend:{position:'bottom',labels:{boxWidth:10}}},scales:{y:{ticks:{callback:v=>'₹'+Number(v).toLocaleString()}}},interaction:{mode:'index',intersect:false}}});
  }

  function showDetailsAndChart(name){
    detailArea.innerHTML = '';
    const wrapper = el('div','card');
    wrapper.innerHTML = '<h4 style="margin:0 0 8px">'+name+' — Last 6 months</h4><canvas id="historyChart"></canvas>';
    detailArea.appendChild(wrapper);
    const ctx = qs('#historyChart').getContext('2d');
    const curPrice = (stocks[name]||funds[name]||0);
    let qty = 0; if(portfolio.stocks[name]) qty = portfolio.stocks[name].qty||0; if(portfolio.funds[name]) qty = portfolio.funds[name].units||0;
    const priceSeries = genHistory(curPrice); const valueSeries = priceSeries.map(p => +(p*qty).toFixed(2));
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx,{type:'line',data:{labels:labelsLast6(),datasets:[{label:name+' value',data:valueSeries,borderColor:'#16a085',backgroundColor:'transparent',tension:0.3,borderWidth:2.5}]},options:{maintainAspectRatio:false,responsive:true,scales:{y:{ticks:{callback:v=>'₹'+Number(v).toLocaleString()}}}}});
  }

  function buildSeries(){
    const out = {}; Object.keys(portfolio.stocks).forEach(s=>{ const qty = portfolio.stocks[s].qty||0; const cur = stocks[s]||0; const series = genHistory(cur); out[s] = series.map(p => p * qty); });
    Object.keys(portfolio.funds).forEach(f=>{ const units = portfolio.funds[f].units||0; const cur = funds[f]||0; const series = genHistory(cur); out[f] = series.map(p => p * units); });
    return out;
  }

  function genHistory(current){ const arr = []; let v = current; for(let i=5;i>=0;i--){ const change = (Math.random()*10 - 5)/100; v = +(v / (1 + change)); arr.unshift(+v.toFixed(2)); } arr[arr.length-1] = +current.toFixed(2); return arr; }
  function labelsLast6(){ const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const now = new Date(); const labels = []; for(let i=5;i>=0;i--){ const d = new Date(now.getFullYear(), now.getMonth()-i, 1); labels.push(months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2)); } return labels; }

  // seed and reset helpers (UI visible)
  function seedDemo(){
    portfolio = {
      stocks: {
        "Tata Motors": {qty:3, avg:820.00},
        "Reliance": {qty:2, avg:1450.00},
        "Wipro": {qty:5, avg:300.00}
      },
      funds: {
        "HDFC Mid Cap Fund": {units:10, avg:120.00},
        "Edelweiss Nifty Midcap150 Momentum 50 Index Fund": {units:8, avg:95.00}
      },
      cash: 5000
    }; save(); renderPortfolio(); showToast('Demo portfolio seeded');
  }
  function resetDemo(){ localStorage.removeItem(KEY); portfolio = {stocks:{},funds:{},cash:0}; renderPortfolio(); showToast('Portfolio reset'); }

  // utilities
  function rnd(a,b){ return +(Math.random()*(b-a)+a).toFixed(2) }
  function num(x){ return Number(x).toLocaleString(undefined,{maximumFractionDigits:2}) }
  function el(tag,c){ const e=document.createElement(tag); if(c) e.className=c; return e }
  function qs(sel){ return document.querySelector(sel) }
  function escape(s){ return (s||'').replace(/"/g,'&quot;') }
  function unescape(s){ return (s||'').replace(/&quot;/g,'"') }
  function showToast(txt){ toastEl.textContent = txt; toastEl.classList.remove('hidden'); clearTimeout(toastEl._t); toastEl._t = setTimeout(()=>toastEl.classList.add('hidden'),1200); }

  // init
  renderStocks(); renderFunds(); renderPortfolio();

  // expose quick console helpers (optional)
  window.NV = {portfolio, save, seedDemo, resetDemo, stocks, funds};
})();
