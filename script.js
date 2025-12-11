// script.js
// Single-file app logic: stocks/funds/portfolio, Chart.js 6-month graph
document.addEventListener('DOMContentLoaded', () => {

  // ---------- demo data (random prices) ----------
  const stocks = {
    "Tata Motors": random(600,950),
    "Adani Green": random(820,1500),
    "Wipro": random(220,360),
    "MRF": random(90000,150000),
    "Reliance": random(1400,1800),
    "HDFC": random(1100,1600),
    "Affle 3i Ltd": random(100,220)
  };

  const funds = {
    "Edelweiss Nifty Midcap150 Momentum 50 Index Fund": random(80,160),
    "HDFC Mid Cap Fund": random(100,250),
    "HDFC Small Cap Fund": random(90,200),
    "Nippon India Large Cap Fund": random(90,180),
    "SBI Large Cap Fund": random(85,175),
    "Nippon India Growth Mid Cap Fund": random(100,210),
    "Nippon India Small Cap Fund": random(80,160),
    "HDFC Large Cap Fund": random(90,170)
  };

  // ---------- local storage portfolio ----------
  let portfolio = JSON.parse(localStorage.getItem('nv_portfolio_v4') || '{"stocks":{},"funds":{},"cash":0}');
  function save() { localStorage.setItem('nv_portfolio_v4', JSON.stringify(portfolio)); }

  // ---------- elements ----------
  const stockList = document.getElementById('stockList');
  const fundList = document.getElementById('fundList');
  const portfolioList = document.getElementById('portfolioList');
  const portfolioSummary = document.getElementById('portfolioSummary');
  const detailArea = document.getElementById('detailArea');
  const totalAmountEl = document.getElementById('totalAmount');
  const oneDayChangeEl = document.getElementById('oneDayChange');

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(b => b.addEventListener('click', onNavClick));
  function onNavClick(e){
    navBtns.forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const target = e.currentTarget.dataset.target;
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
    if(target === 'portfolioPanel') renderPortfolio();
  }
  // show stocks by default
  document.getElementById('stocksPanel').classList.remove('hidden');

  // theme toggle
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    document.documentElement.classList.toggle('light');
    localStorage.setItem('nv_theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
  if(localStorage.getItem('nv_theme') === 'light') document.documentElement.classList.add('light');

  // ---------- render functions ----------
  function renderStocks(){
    stockList.innerHTML = '';
    Object.keys(stocks).forEach(name => {
      const price = stocks[name];
      const card = document.createElement('div'); card.className = 'card row';
      card.innerHTML = `
        <div>
          <div class="title">${name}</div>
          <div class="price">₹${price.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
        </div>
        <div class="controls">
          <input class="qty" type="number" min="1" value="1" />
          <button class="btn primary buy" data-name="${escapeHtml(name)}">Buy</button>
        </div>
      `;
      stockList.appendChild(card);
    });
  }

  function renderFunds(){
    fundList.innerHTML = '';
    Object.keys(funds).forEach(name => {
      const price = funds[name];
      const card = document.createElement('div'); card.className = 'card row';
      card.innerHTML = `
        <div style="max-width:65%">
          <div class="title">${name}</div>
          <div class="price">₹${price.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
        </div>
        <div class="controls">
          <input class="qty" type="number" min="1" value="1" />
          <button class="btn primary addfund" data-name="${escapeHtml(name)}">Add</button>
        </div>
      `;
      fundList.appendChild(card);
    });
  }

  // ---------- events (delegation) ----------
  stockList.addEventListener('click', e => {
    const btn = e.target.closest('.buy');
    if(!btn) return;
    const name = btn.dataset.name;
    const qtyEl = btn.parentElement.querySelector('.qty');
    const qty = Math.max(1, parseInt(qtyEl.value || 1, 10));
    buyStock(name, qty);
  });

  fundList.addEventListener('click', e => {
    const btn = e.target.closest('.addfund');
    if(!btn) return;
    const name = btn.dataset.name;
    const qtyEl = btn.parentElement.querySelector('.qty');
    const qty = Math.max(1, parseInt(qtyEl.value || 1, 10));
    buyFund(name, qty);
  });

  portfolioList.addEventListener('click', e => {
    const sell = e.target.closest('.sell');
    const details = e.target.closest('.details');
    const redeem = e.target.closest('.redeem');
    if(sell){
      const name = sell.dataset.name;
      sellStock(name);
    } else if(redeem){
      const name = redeem.dataset.name;
      redeemFund(name);
    } else if(details){
      const name = details.dataset.name;
      showDetailsAndChart(name);
    }
  });

  // ---------- buy / sell logic ----------
  function buyStock(name, qty){
    const price = stocks[name] || 0;
    const prev = portfolio.stocks[name] || {qty:0, avg:0};
    const newQty = prev.qty + qty;
    const newAvg = newQty ? ((prev.qty*prev.avg) + qty*price) / newQty : price;
    portfolio.stocks[name] = { qty: newQty, avg: +newAvg.toFixed(2) };
    save(); showToast(`Bought ${qty} × ${name}`); renderPortfolio();
  }

  function buyFund(name, units){
    const price = funds[name] || 0;
    const prev = portfolio.funds[name] || {units:0, avg:0};
    const newUnits = prev.units + units;
    const newAvg = newUnits ? ((prev.units*prev.avg) + units*price) / newUnits : price;
    portfolio.funds[name] = { units: newUnits, avg: +newAvg.toFixed(2) };
    save(); showToast(`Added ${units} unit(s) of ${name}`); renderPortfolio();
  }

  function sellStock(name){
    if(!portfolio.stocks[name]) return;
    portfolio.stocks[name].qty--;
    if(portfolio.stocks[name].qty <= 0) delete portfolio.stocks[name];
    save(); showToast(`Sold 1 × ${name}`); renderPortfolio();
  }

  function redeemFund(name){
    if(!portfolio.funds[name]) return;
    portfolio.funds[name].units--;
    if(portfolio.funds[name].units <= 0) delete portfolio.funds[name];
    save(); showToast(`Redeemed 1 unit of ${name}`); renderPortfolio();
  }

  // ---------- portfolio render & totals ----------
  function renderPortfolio(){
    portfolioList.innerHTML = '';
    detailArea.innerHTML = '';

    // compute totals
    let holdingsVal = 0, invested = 0;
    Object.keys(portfolio.stocks).forEach(s => {
      const {qty, avg} = portfolio.stocks[s];
      const cur = stocks[s] || 0;
      holdingsVal += cur * qty;
      invested += avg * qty;
    });
    Object.keys(portfolio.funds).forEach(f => {
      const {units, avg} = portfolio.funds[f];
      const cur = funds[f] || 0;
      holdingsVal += cur * units;
      invested += avg * units;
    });
    const cash = portfolio.cash || 0;
    const total = holdingsVal + cash;
    totalAmountEl.textContent = `₹${total.toLocaleString(undefined,{maximumFractionDigits:2})}`;
    oneDayChangeEl.textContent = `1 Day Change: ₹${(Math.random()*60-30).toFixed(2)}`;

    // summary card
    portfolioSummary.innerHTML = `
      <div style="font-weight:800">Total: ₹${total.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
      <div style="color:var(--muted);margin-top:6px">Invested: ₹${invested.toLocaleString(undefined,{maximumFractionDigits:2})} • Cash: ₹${cash.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
      <div style="margin-top:8px"><button id="showChartBtn" class="btn ghost">Show 6-Month Chart</button></div>
    `;

    // show holdings
    if(Object.keys(portfolio.stocks).length === 0 && Object.keys(portfolio.funds).length === 0){
      portfolioList.innerHTML = `<div class="card">No holdings yet. Buy some stocks or add fund units.</div>`;
    } else {
      Object.keys(portfolio.stocks).forEach(s=>{
        const {qty, avg} = portfolio.stocks[s];
        const cur = stocks[s] || 0;
        const plPct = avg ? ((cur-avg)/avg*100).toFixed(2) : '0.00';
        const card = document.createElement('div'); card.className='card row';
        card.innerHTML = `
          <div>
            <div class="title">${s}</div>
            <div class="price">Qty ${qty} • ₹${cur.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
            <div class="muted">Avg ₹${avg.toLocaleString(undefined,{maximumFractionDigits:2})} • ${plPct}%</div>
          </div>
          <div class="controls">
            <button class="btn ghost sell" data-name="${escapeHtml(s)}">Sell</button>
            <button class="btn ghost details" data-name="${escapeHtml(s)}">Details</button>
          </div>
        `;
        portfolioList.appendChild(card);
      });
      Object.keys(portfolio.funds).forEach(f=>{
        const {units, avg} = portfolio.funds[f];
        const cur = funds[f] || 0;
        const plPct = avg ? ((cur-avg)/avg*100).toFixed(2) : '0.00';
        const card = document.createElement('div'); card.className='card row';
        card.innerHTML = `
          <div style="max-width:65%">
            <div class="title">${f}</div>
            <div class="price">Units ${units} • NAV ₹${cur.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
            <div class="muted">Avg ₹${avg.toLocaleString(undefined,{maximumFractionDigits:2})} • ${plPct}%</div>
          </div>
          <div class="controls">
            <button class="btn ghost redeem" data-name="${escapeHtml(f)}">Redeem</button>
            <button class="btn ghost details" data-name="${escapeHtml(f)}">Details</button>
          </div>
        `;
        portfolioList.appendChild(card);
      });
    }

    const showChartBtn = document.getElementById('showChartBtn');
    if(showChartBtn) showChartBtn.addEventListener('click', () => renderPortfolioChart());
  }

  // ---------- charts: generate 6-month synthetic history ----------
  let chartInstance = null;
  function genHistory(current) {
    // produce 6 values (oldest -> newest)
    const arr = [];
    let v = current;
    for(let i=5;i>=0;i--){
      // small month-to-month variation
      const change = (Math.random()*10 - 5)/100; // -5%..+5%
      v = +(v / (1 + change)); // go back
      arr.unshift(+v.toFixed(2));
    }
    arr[arr.length-1] = +current.toFixed(2);
    return arr;
  }

  function labelsLast6() {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const labels = [];
    for(let i=5;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      labels.push(months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2));
    }
    return labels;
  }

  function renderPortfolioChart(){
    detailArea.innerHTML = '';
    const wrapper = document.createElement('div'); wrapper.className='card';
    wrapper.innerHTML = `<h4 style="margin:0 0 8px">Portfolio — Last 6 months</h4><canvas id="historyChart"></canvas>`;
    detailArea.appendChild(wrapper);

    const ctx = document.getElementById('historyChart').getContext('2d');
    const holdings = buildSeries();
    const labels = labelsLast6();

    const datasets = [];
    const palette = ['#16a085','#2f7ecf','#e76f51','#8d99ae','#f4a261','#7b2cbf','#06d6a0','#00b4d8'];
    let idx=0;
    const total = [0,0,0,0,0,0];
    for(const k in holdings){
      const data = holdings[k].map(v => +v.toFixed(2));
      data.forEach((v,i)=> total[i]+=v);
      datasets.push({
        label: k,
        data,
        borderColor: palette[idx % palette.length],
        backgroundColor: 'transparent',
        tension:0.35,
        borderWidth:1.5,
        pointRadius:2
      });
      idx++;
    }
    datasets.push({
      label:'Total',
      data: total.map(v=>+v.toFixed(2)),
      borderColor:'#ffffff',
      backgroundColor:'transparent',
      borderWidth:3.5,
      tension:0.3,
      pointRadius:3
    });

    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type:'line',
      data:{labels, datasets},
      options:{
        maintainAspectRatio:false,
        responsive:true,
        plugins:{legend:{position:'bottom',labels:{boxWidth:10}}},
        scales:{ y:{ ticks:{callback:v=>'₹'+Number(v).toLocaleString()} } },
        interaction:{mode:'index',intersect:false}
      }
    });
  }

  function showDetailsAndChart(name){
    detailArea.innerHTML = '';
    const wrapper = document.createElement('div'); wrapper.className='card';
    wrapper.innerHTML = `<h4 style="margin:0 0 8px">${name} — Last 6 months</h4><canvas id="historyChart"></canvas>`;
    detailArea.appendChild(wrapper);

    const ctx = document.getElementById('historyChart').getContext('2d');
    const curPrice = (stocks[name] || funds[name] || 0);
    let qty = 0;
    if(portfolio.stocks[name]) qty = portfolio.stocks[name].qty || 0;
    if(portfolio.funds[name]) qty = portfolio.funds[name].units || 0;

    const pseries = genHistory(curPrice);
    const vseries = pseries.map(p => +(p*qty).toFixed(2));
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type:'line',
      data:{ labels: labelsLast6(), datasets:[
        { label: name+' value', data: vseries, borderColor:'#16a085', backgroundColor:'transparent', tension:0.3, borderWidth:2.5 }
      ]},
      options:{ maintainAspectRatio:false, responsive:true, scales:{y:{ticks:{callback:v=>'₹'+Number(v).toLocaleString()}}}}
    });
  }

  // builds series of values per holding (6 points each)
  function buildSeries(){
    const out = {};
    Object.keys(portfolio.stocks).forEach(s=>{
      const qty = portfolio.stocks[s].qty || 0;
      const cur = stocks[s] || 0;
      const priceSeries = genHistory(cur);
      out[s] = priceSeries.map(p => p * qty);
    });
    Object.keys(portfolio.funds).forEach(f=>{
      const units = portfolio.funds[f].units || 0;
      const cur = funds[f] || 0;
      const priceSeries = genHistory(cur);
      out[f] = priceSeries.map(p => p * units);
    });
    return out;
  }

  // ---------- utilities ----------
  function random(a,b){ return +(Math.random()*(b-a)+a).toFixed(2) }
  function escapeHtml(s){ return s.replace(/"/g,'&quot;') }
  function showToast(txt){ const t=document.getElementById('toast'); t.textContent=txt; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1300) }

  // ---------- init ----------
  renderStocks(); renderFunds(); renderPortfolio();
});
