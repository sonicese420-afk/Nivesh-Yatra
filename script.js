/* ==========================================================================
   script.js - Nivesh Yatra (recreated)
   - Single-file app behavior that runs without external libs
   - Local demo data + localStorage persistence for holdings
   - Robust canvas drawing (handles devicePixelRatio + resize) to avoid stretch
   - Clear separation: UI rendering, data model, charting logic, interactions
   ========================================================================== */

/* -------------------------
   Utility / Helper Functions
   ------------------------- */

/**
 * formatCurrency(num)
 * Formats a number into INR-style with ₹ prefix, rounding to 2 decimals.
 */
function formatCurrency(num) {
  if (num === null || num === undefined) return '—';
  const n = Number(num);
  if (Number.isNaN(n)) return '—';
  return '₹' + n.toFixed(2);
}

/**
 * clamp(x, a, b)
 */
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

/* -------------------------
   Demo Data (stocks + funds)
   ------------------------- */

/**
 * We'll include a modest list of demo stocks and funds for the app.
 * Each stock: { id, symbol, name, price, lastChangePerc, logoInitial }
 * For demo purpose prices are randomly generated and updated when "refresh" runs.
 */

const DEMO_STOCKS = [
  { id: 'RELI', symbol: 'RE', name: 'Reliance Industries Ltd', ticker:'RELIANCE', price: 1398.07 },
  { id: 'TATA', symbol: 'TM', name: 'Tata Motors', ticker:'TATAMOTORS', price: 1006.98 },
  { id: 'ADAN', symbol: 'AG', name: 'Adani Green', ticker:'ADANIGREEN', price: 1181.45 },
  { id: 'WIPR', symbol: 'W', name: 'Wipro', ticker:'WIPRO', price: 574.44 },
  { id: 'MRF', symbol: 'M', name: 'MRF', ticker:'MRF', price: 1898.78 },
  { id: 'HDFC', symbol: 'H', name: 'HDFC', ticker:'HDFC', price: 1846.28 },
  { id: 'AFFL', symbol: 'AF', name: 'Affle 3i Ltd', ticker:'AFFLE', price: 410.22 }
];

const DEMO_FUNDS = [
  { id: 'EDEL', code:'EDEL', name: 'Edelweiss Nifty Midcap150 Momentum 50 Index Fund', price:232.40 },
  { id: 'HDFC_MID', code:'HDFCMID', name: 'HDFC Mid Cap Fund', price:132.76 },
  { id: 'HDFC_SM', code:'HDFCSM', name: 'HDFC Small Cap Fund', price:276.12 },
  { id: 'NIP_L', code:'NIPLCAP', name: 'Nippon India Large Cap Fund', price:210.45 },
  { id: 'SBI_L', code:'SBILARM', name: 'SBI Large Cap Fund', price:187.20 },
  { id: 'NIP_M', code:'NIPMID', name: 'Nippon India Mid Cap Fund', price:142.30 },
  { id: 'NIP_S', code:'NIPSM', name: 'Nippon India Small Cap Fund', price:98.45 },
  { id: 'HDFC_L', code:'HDFCL', name: 'HDFC Large Cap Fund', price:220.12 }
];

/* -------------------------
   Data Persistence (localStorage)
   - holdings: { [id]: { qty, avgPrice, type: 'stock'|'fund' } }
   ------------------------- */

const STORAGE_KEY = 'ny_holdings_v1';

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to load holdings', e);
    return {};
  }
}

function saveHoldings(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to save holdings', e);
  }
}

/* current in-memory model */
let holdings = loadHoldings();

/* -------------------------
   App UI wiring & rendering
   ------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const stocksList = document.getElementById('stocksList');
  const fundsList = document.getElementById('fundsList');
  const portfolioList = document.getElementById('portfolioList');
  const portfolioSection = document.getElementById('portfolioSection');
  const assetsAmount = document.getElementById('assetsAmount');
  const assetsHoldings = document.getElementById('assetsHoldings');
  const assetsChange = document.getElementById('assetsChange');

  const tabStocks = document.getElementById('tabStocks');
  const tabFunds = document.getElementById('tabFunds');
  const tabPortfolio = document.getElementById('tabPortfolio');
  const pillStocks = document.getElementById('pillStocks');
  const pillFunds = document.getElementById('pillFunds');
  const pillPortfolio2 = document.getElementById('pillPortfolio2');

  const stocksSection = document.getElementById('stocksSection');
  const fundsSection = document.getElementById('fundsSection');
  const portfolioSec = document.getElementById('portfolioSection');

  // detail panel controls
  const detailPanel = document.getElementById('detailPanel');
  const closeDetail = document.getElementById('closeDetail');
  const detailName = document.getElementById('detailName');
  const detailTicker = document.getElementById('detailTicker');
  const detailAvatar = document.getElementById('detailAvatar');
  const detailPrice = document.getElementById('detailPrice');
  const detailChangeSmall = document.getElementById('detailChangeSmall');
  const statVolume = document.getElementById('statVolume');
  const statLow = document.getElementById('statLow');
  const statHigh = document.getElementById('statHigh');
  const statCap = document.getElementById('statCap');
  const tradeQty = document.getElementById('tradeQty');
  const btnBuy = document.getElementById('btnBuy');
  const btnSell = document.getElementById('btnSell');
  const btnSip = document.getElementById('btnSip');

  // range buttons
  const rangeButtons = Array.from(document.querySelectorAll('.range-btn'));

  // toggles
  const toggleVisibility = document.getElementById('toggleVisibility');

  // internal state
  let selectedItem = null;
  let currentRange = '1D';

  // initial render
  function renderAll() {
    renderStocks();
    renderFunds();
    renderPortfolio();
    updateAssetsSummary();
  }

  /* ---------- Render Stocks ---------- */
  function renderStocks() {
    stocksList.innerHTML = '';
    for (const s of DEMO_STOCKS) {
      const li = document.createElement('div');
      li.className = 'item';
      li.dataset.id = s.id;
      li.dataset.type = 'stock';

      // avatar + meta area
      const left = document.createElement('div');
      left.className = 'item-left';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = s.symbol.substring(0,2).toUpperCase();

      const meta = document.createElement('div');
      meta.className = 'item-meta';

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = s.name;

      const sub = document.createElement('div');
      sub.className = 'item-sub';
      sub.textContent = 'Stock | ' + s.ticker;

      meta.appendChild(title);
      meta.appendChild(sub);
      left.appendChild(avatar);
      left.appendChild(meta);

      // right area (price + owned indicator if owned)
      const right = document.createElement('div');
      right.className = 'item-right';

      const price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = formatCurrency(s.price);

      right.appendChild(price);

      // owned arrow/percentage should appear only if stock is owned
      const own = holdings[s.id];
      if (own && own.qty > 0) {
        const ownedPill = document.createElement('div');
        ownedPill.className = 'owned-pill';
        // compute P/L % for demo: current vs avg
        const avg = own.avgPrice || s.price;
        const diff = s.price - avg;
        const diffPerc = (diff / avg) * 100;
        const arrow = diff >= 0 ? '▲' : '▼';
        ownedPill.innerHTML = `<span class="owned-arrow">${arrow}</span> ${Math.abs(diffPerc).toFixed(2)}%`;
        // color
        ownedPill.style.background = diff>=0 ? 'rgba(47,213,159,0.10)' : 'rgba(232,77,77,0.07)';
        ownedPill.style.color = diff>=0 ? 'var(--accent)' : '#ff6b6b';
        right.appendChild(ownedPill);
      }

      // combine the item
      li.appendChild(left);
      li.appendChild(right);

      // click opens detail panel
      li.addEventListener('click', () => {
        openDetail('stock', s.id);
      });

      stocksList.appendChild(li);
    }
  }

  /* ---------- Render Funds ---------- */
  function renderFunds() {
    fundsList.innerHTML = '';
    for (const f of DEMO_FUNDS) {
      const li = document.createElement('div');
      li.className = 'item';
      li.dataset.id = f.id;
      li.dataset.type = 'fund';

      const left = document.createElement('div');
      left.className = 'item-left';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = (f.code||'F').substring(0,2).toUpperCase();

      const meta = document.createElement('div');
      meta.className = 'item-meta';

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = f.name;

      const sub = document.createElement('div');
      sub.className = 'item-sub';
      sub.textContent = 'Fund | ' + f.code;

      meta.appendChild(title);
      meta.appendChild(sub);
      left.appendChild(avatar);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'item-right';
      const price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = formatCurrency(f.price);
      right.appendChild(price);

      // only show owned arrow if in holdings
      const own = holdings[f.id];
      if (own && own.qty > 0) {
        const ownedPill = document.createElement('div');
        ownedPill.className = 'owned-pill';
        const avg = own.avgPrice || f.price;
        const diff = f.price - avg;
        const diffPerc = (diff / avg) * 100;
        const arrow = diff >= 0 ? '▲' : '▼';
        ownedPill.innerHTML = `<span class="owned-arrow">${arrow}</span> ${Math.abs(diffPerc).toFixed(2)}%`;
        ownedPill.style.background = diff>=0 ? 'rgba(47,213,159,0.10)' : 'rgba(232,77,77,0.07)';
        ownedPill.style.color = diff>=0 ? 'var(--accent)' : '#ff6b6b';
        right.appendChild(ownedPill);
      }

      li.appendChild(left);
      li.appendChild(right);

      li.addEventListener('click', () => {
        openDetail('fund', f.id);
      });

      fundsList.appendChild(li);
    }
  }

  /* ---------- Render Portfolio ---------- */
  function renderPortfolio() {
    portfolioList.innerHTML = '';
    const keys = Object.keys(holdings);
    if (keys.length === 0) {
      portfolioList.innerHTML = '<div class="empty">No holdings yet. Buy a stock or fund to populate your portfolio.</div>';
      document.getElementById('portfolioSummary').innerHTML = '';
      return;
    }

    let totalValue = 0;
    let totalCost = 0;

    for (const id of keys) {
      const h = holdings[id];
      if (!h || h.qty <= 0) continue;
      // find price in stocks or funds
      let item = DEMO_STOCKS.find(s => s.id === id) || DEMO_FUNDS.find(f => f.id === id);
      const currPrice = item ? item.price : 0;
      const value = currPrice * h.qty;
      totalValue += value;
      totalCost += (h.avgPrice * h.qty);

      // create row
      const li = document.createElement('div');
      li.className = 'item';
      li.dataset.id = id;

      const left = document.createElement('div');
      left.className = 'item-left';
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = id.substring(0,2).toUpperCase();
      const meta = document.createElement('div');
      meta.className = 'item-meta';
      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item ? item.name : id;
      const sub = document.createElement('div');
      sub.className = 'item-sub';
      sub.textContent = `${h.qty} × ${formatCurrency(h.avgPrice)} (avg)`;

      meta.appendChild(title);
      meta.appendChild(sub);
      left.appendChild(avatar);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'item-right';
      const price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = formatCurrency(currPrice);
      const pl = document.createElement('div');
      const diff = value - (h.avgPrice * h.qty);
      pl.className = 'item-arrow';
      pl.textContent = (diff >= 0 ? '▲' : '▼') + ' ' + Math.abs(diff).toFixed(2);
      pl.style.color = diff>=0 ? 'var(--accent)' : '#ff6b6b';

      right.appendChild(price);
      right.appendChild(pl);

      li.appendChild(left);
      li.appendChild(right);

      portfolioList.appendChild(li);

      // click to open detail
      li.addEventListener('click', () => {
        const type = DEMO_STOCKS.some(s => s.id === id) ? 'stock' : 'fund';
        openDetail(type, id);
      });
    }

    const summary = document.getElementById('portfolioSummary');
    const gain = totalValue - totalCost;
    const gainPerc = totalCost ? (gain / totalCost) * 100 : 0;
    summary.innerHTML = `<strong>Total Value:</strong> ${formatCurrency(totalValue)} &nbsp;&nbsp; <span style="color:${gain>=0 ? 'var(--accent)' : '#ff6b6b'}">${gain>=0?'+':'-'}${formatCurrency(Math.abs(gain))} (${gainPerc.toFixed(2)}%)</span>`;
  }

  /* ---------- assets summary ---------- */
  function updateAssetsSummary() {
    // compute total assets = holdings current value
    let total = 0; let totalCost = 0; let count = 0;
    for (const id in holdings) {
      const h = holdings[id];
      if (!h || h.qty <= 0) continue;
      count += h.qty;
      const s = DEMO_STOCKS.find(x => x.id === id) || DEMO_FUNDS.find(x => x.id === id);
      if (s) total += s.price * h.qty;
      totalCost += h.avgPrice * h.qty;
    }
    assetsAmount.textContent = formatCurrency(total);
    assetsHoldings.textContent = `Holdings: ${count}`;
    const diff = total - totalCost;
    const diffPerc = totalCost ? (diff/totalCost)*100 : 0;
    assetsChange.textContent = `${diff>=0?'+':''}${formatCurrency(diff)} (${diffPerc.toFixed(2)}%)`;
    assetsChange.style.color = diff>=0 ? 'var(--accent)' : '#ff6b6b';
  }

  /* -------------------------
     Open / Close Detail Panel
     ------------------------- */
  function openDetail(type, id) {
    selectedItem = { type, id };
    // populate header
    const item = (type === 'stock') ? (DEMO_STOCKS.find(s => s.id === id)) : (DEMO_FUNDS.find(f => f.id === id));
    if (!item) return;
    detailName.textContent = item.name;
    const ticker = item.ticker ? item.ticker : (item.code || item.id);
    detailTicker.textContent = `${type === 'stock' ? 'Stock | ' : 'Fund | '}${ticker}`;
    detailAvatar.textContent = (item.symbol || item.code || item.id).substring(0,2).toUpperCase();
    detailPrice.textContent = formatCurrency(item.price);
    // small change: compute a demo change
    detailChangeSmall.textContent = '▲ 0.53%';
    statVolume.textContent = Math.floor(100000 + Math.random()*900000).toLocaleString('en-IN');
    statLow.textContent = formatCurrency(item.price - (Math.random()*20));
    statHigh.textContent = formatCurrency(item.price + (Math.random()*20));
    statCap.textContent = `₹${(Math.random()*200000).toFixed(2)} Cr`;

    // open panel
    detailPanel.classList.remove('hidden');

    // set qty default to 1
    tradeQty.value = 1;

    // draw initial chart
    drawChartForItem(item, currentRange);
  }

  function closeDetailPanel() {
    detailPanel.classList.add('hidden');
    // destroy chart safely
    safeDestroyChart();
  }

  closeDetail.addEventListener('click', () => {
    closeDetailPanel();
  });

  // close by clicking overlay (if you want)
  detailPanel.addEventListener('click', (ev) => {
    if (ev.target === detailPanel) closeDetailPanel();
  });

  /* -------------------------
     Trade actions (buy / sell / sip)
     ------------------------- */
  btnBuy.addEventListener('click', () => {
    if (!selectedItem) return;
    const qty = Math.max(1, Number(tradeQty.value || 1));
    performTrade('buy', selectedItem.type, selectedItem.id, qty);
  });
  btnSell.addEventListener('click', () => {
    if (!selectedItem) return;
    const qty = Math.max(1, Number(tradeQty.value || 1));
    performTrade('sell', selectedItem.type, selectedItem.id, qty);
  });
  btnSip.addEventListener('click', () => {
    if (!selectedItem) return;
    const qty = Math.max(1, Number(tradeQty.value || 1));
    performTrade('sip', selectedItem.type, selectedItem.id, qty);
  });

  function performTrade(action, type, id, qty) {
    // find current price
    let item = (type === 'stock') ? DEMO_STOCKS.find(s => s.id === id) : DEMO_FUNDS.find(f => f.id === id);
    if (!item) return;
    const price = item.price;

    // if not in holdings create
    const existing = holdings[id] || { qty: 0, avgPrice: 0, type };

    if (action === 'buy' || action === 'sip') {
      // new average formula: (existing.qty * existing.avg + qty*price) / (existing.qty+qty)
      const newQty = existing.qty + qty;
      const newAvg = ((existing.avgPrice * existing.qty) + (price * qty)) / newQty;
      holdings[id] = { qty: newQty, avgPrice: newAvg, type };
      saveHoldings(holdings);
      renderAll();
      // keep the detail open
      drawChartForItem(item, currentRange);
    } else if (action === 'sell') {
      if (qty >= existing.qty) {
        // remove holding
        delete holdings[id];
      } else {
        holdings[id].qty = existing.qty - qty;
        // average price remains same on sell
      }
      saveHoldings(holdings);
      renderAll();
      drawChartForItem(item, currentRange);
    }
  }

  /* -------------------------
     Tabs behavior
     ------------------------- */
  function switchTab(tab) {
    // clear active classes
    tabStocks.classList.remove('active');
    tabFunds.classList.remove('active');
    tabPortfolio.classList.remove('active');
    pillStocks.classList.remove('active');
    pillFunds.classList.remove('active');
    pillPortfolio2.classList.remove('active');

    stocksSection.classList.add('hidden');
    fundsSection.classList.add('hidden');
    portfolioSec.classList.add('hidden');

    if (tab === 'stocks') {
      tabStocks.classList.add('active'); pillStocks.classList.add('active');
      stocksSection.classList.remove('hidden');
    } else if (tab === 'funds') {
      tabFunds.classList.add('active'); pillFunds.classList.add('active');
      fundsSection.classList.remove('hidden');
    } else if (tab === 'portfolio') {
      tabPortfolio.classList.add('active'); pillPortfolio2.classList.add('active');
      portfolioSec.classList.remove('hidden');
    }
  }

  tabStocks.addEventListener('click', () => switchTab('stocks'));
  tabFunds.addEventListener('click', () => switchTab('funds'));
  tabPortfolio.addEventListener('click', () => switchTab('portfolio'));

  pillStocks.addEventListener('click', () => switchTab('stocks'));
  pillFunds.addEventListener('click', () => switchTab('funds'));
  pillPortfolio2.addEventListener('click', () => switchTab('portfolio'));

  /* -------------------------
     Toggle hiding numbers
     ------------------------- */
  let valuesHidden = false;
  toggleVisibility.addEventListener('click', () => {
    valuesHidden = !valuesHidden;
    if (valuesHidden) {
      assetsAmount.textContent = '▮▮▮';
      document.querySelectorAll('.item-price').forEach(n => n.textContent = '▮▮▮');
    } else {
      renderAll();
    }
  });

  /* -------------------------
     Dummy updater: refresh prices (demo)
     ------------------------- */
  function randomizePrices() {
    for (const s of DEMO_STOCKS) {
      const change = (Math.random() - 0.5) * 20;
      s.price = Math.max(6, +(s.price + change).toFixed(2));
    }
    for (const f of DEMO_FUNDS) {
      const change = (Math.random() - 0.5) * 6;
      f.price = Math.max(1, +(f.price + change).toFixed(2));
    }
    renderAll();
  }
  // run on interval for liveliness
  setInterval(randomizePrices, 6000);

  /* -------------------------
     Charting subsystem (custom canvas draw)
     - dra
