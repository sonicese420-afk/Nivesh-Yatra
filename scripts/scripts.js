/* ============================================================
   MARKET DATA (COMPRESSED REALISTIC 6-MONTH HISTORY)
============================================================ */

const STOCKS = [
    {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd",
        price: 1556.50,
        change: +1.2,
        history6M: [1420, 1455, 1470, 1500, 1525, 1540, 1556],
        history3M: [1500, 1520, 1530, 1540, 1556],
        history1M: [1530, 1540, 1556]
    },
    {
        symbol: "TATAMOTORS",
        name: "Tata Motors Ltd",
        price: 373.45,
        change: -0.8,
        history6M: [310, 325, 330, 345, 350, 360, 373],
        history3M: [340, 350, 360, 370, 373],
        history1M: [360, 365, 373]
    },
    {
        symbol: "HDFCBANK",
        name: "HDFC Bank Ltd",
        price: 1000.20,
        change: +0.45,
        history6M: [910, 930, 950, 960, 980, 995, 1000],
        history3M: [950, 960, 975, 995, 1000],
        history1M: [980, 990, 1000]
    },
    {
        symbol: "WIPRO",
        name: "Wipro Ltd",
        price: 260.55,
        change: -0.25,
        history6M: [230, 240, 245, 250, 255, 258, 260],
        history3M: [245, 250, 255, 258, 260],
        history1M: [255, 258, 260]
    },
    {
        symbol: "AFFLE",
        name: "Affle India Ltd",
        price: 1685.80,
        change: +2.1,
        history6M: [1500, 1530, 1580, 1600, 1630, 1670, 1685],
        history3M: [1580, 1600, 1650, 1670, 1685],
        history1M: [1650, 1670, 1685]
    },
    {
        symbol: "ADANIGREEN",
        name: "Adani Green Energy Ltd",
        price: 1040.20,
        change: +3.1,
        history6M: [860, 900, 920, 950, 980, 1020, 1040],
        history3M: [920, 950, 1000, 1020, 1040],
        history1M: [1000, 1020, 1040]
    },
    {
        symbol: "MRF",
        name: "MRF Ltd",
        price: 98000,
        change: +0.9,
        history6M: [88000, 90000, 93000, 95000, 96000, 97500, 98000],
        history3M: [94000, 95500, 97000, 97500, 98000],
        history1M: [97000, 97500, 98000]
    }
];

/* MUTUAL FUNDS */
const FUNDS = [
    {
        symbol: "EDMID150",
        name: "Edelweiss Nifty Midcap150 Momentum 50 Index Fund",
        nav: 18.39,
        history6M: [15.2, 15.8, 16.3, 17.0, 17.8, 18.1, 18.39],
        history3M: [16.8, 17.2, 18.0, 18.39],
        history1M: [17.8, 18.1, 18.39]
    },
    {
        symbol: "HDFCMID",
        name: "HDFC Mid Cap Fund",
        nav: 114.21,
        history6M: [104, 106, 108, 110, 111, 113, 114],
        history3M: [110, 112, 114],
        history1M: [112, 113, 114]
    },
    {
        symbol: "HDFCSMALL",
        name: "HDFC Small Cap Fund",
        nav: 162.41,
        history6M: [150, 152, 155, 157, 160, 161, 162],
        history3M: [157, 160, 162],
        history1M: [160, 161, 162]
    },
    {
        symbol: "NIPPLARGE",
        name: "Nippon India Large Cap Fund",
        nav: 74.33,
        history6M: [66, 68, 70, 71, 72, 73, 74],
        history3M: [71, 72, 74],
        history1M: [72, 73, 74]
    },
    {
        symbol: "SBILARGE",
        name: "SBI Large Cap Fund",
        nav: 35.12,
        history6M: [30, 31, 32, 33, 34, 34.7, 35.1],
        history3M: [33, 34, 35.1],
        history1M: [34.5, 34.7, 35.1]
    },
    {
        symbol: "NIPPMID",
        name: "Nippon India Growth Mid Cap Fund",
        nav: 129.83,
        history6M: [115, 118, 120, 122, 124, 128, 129],
        history3M: [122, 126, 129],
        history1M: [126, 128, 129]
    },
    {
        symbol: "NIPPSMALL",
        name: "Nippon India Small Cap Fund",
        nav: 102.11,
        history6M: [89, 92, 94, 97, 99, 101, 102],
        history3M: [97, 100, 102],
        history1M: [100, 101, 102]
    },
    {
        symbol: "HDFCLARGE",
        name: "HDFC Large Cap Fund",
        nav: 32.55,
        history6M: [28, 29, 30, 31, 31.5, 32, 32.55],
        history3M: [31, 31.8, 32.55],
        history1M: [31.8, 32, 32.55]
    }
];

/* ============================================================
   APP STATE
============================================================ */
let wallet = 10000;
let portfolio = {};
let orders = [];
let activeAsset = null;
let activeType = null;
let chart = null;
let currentRange = "6M";

/* ============================================================
   UI ELEMENTS
============================================================ */
const navButtons = document.querySelectorAll(".nav-btn");
const screens = document.querySelectorAll(".screen");
const stocksList = document.getElementById("stocksList");
const fundsList = document.getElementById("fundsList");

const tradeBox = document.getElementById("tradeBox");
const tradeInput = document.getElementById("tradeInput");
const confirmTrade = document.getElementById("confirmTrade");
const tradeTitle = document.getElementById("tradeTitle");

const toast = document.getElementById("toast");

/* ============================================================
   TOAST POPUP
============================================================ */
function showToast(message, isError = false) {
    toast.textContent = message;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    if (isError) toast.classList.add("error");
    else toast.classList.remove("error");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* ============================================================
   RENDER STOCK / FUND LISTS
============================================================ */
function renderStocks() {
    stocksList.innerHTML = "";
    STOCKS.forEach(stock => {
        const card = document.createElement("div");
        card.className = "stock-card";
        card.onclick = () => openDetail(stock, "stock");

        card.innerHTML = `
            <div class="card-left">
                <div class="card-logo"></div>
                <div>
                    <div class="card-name">${stock.name}</div>
                    <div class="card-symbol">${stock.symbol}</div>
                </div>
            </div>

            <div class="card-price">
                ₹${stock.price}
                <div class="card-change ${stock.change >= 0 ? "green" : "red"}">
                    ${stock.change >= 0 ? "+" : ""}${stock.change}%
                </div>
            </div>
        `;
        stocksList.appendChild(card);
    });
}

function renderFunds() {
    fundsList.innerHTML = "";
    FUNDS.forEach(fund => {
        const card = document.createElement("div");
        card.className = "fund-card";
        card.onclick = () => openDetail(fund, "fund");

        card.innerHTML = `
            <div class="card-left">
                <div class="card-logo"></div>
                <div>
                    <div class="card-name">${fund.name}</div>
                    <div class="card-symbol">${fund.symbol}</div>
                </div>
            </div>

            <div class="card-price">
                ₹${fund.nav}
            </div>
        `;
        fundsList.appendChild(card);
    });
}

renderStocks();
renderFunds();

/* ============================================================
   NAVIGATION
============================================================ */
navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.screen;

        navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        screens.forEach(s => s.classList.remove("active-screen"));
        document.getElementById(target).classList.add("active-screen");

        detailScreen.classList.add("hidden");
    });
});

/* ============================================================
   DETAIL SCREEN 
============================================================ */
function openDetail(asset, type) {
    activeAsset = asset;
    activeType = type;

    detailName.textContent = asset.name;
    detailPrice.textContent = type === "stock" ? `₹${asset.price}` : `NAV: ₹${asset.nav}`;

    switchChartRange("6M");

    detailScreen.classList.remove("hidden");
    screens.forEach(s => s.classList.remove("active-screen"));
}

document.querySelectorAll(".time-buttons button").forEach(btn => {
    btn.onclick = () => {
        document.querySelector(".time-buttons .active").classList.remove("active");
        btn.classList.add("active");

        switchChartRange(btn.dataset.time);
    };
});

/* ============================================================
   CHART RENDERING
============================================================ */
function switchChartRange(range) {
    currentRange = range;

    let data =
        range === "1M" ? activeAsset.history1M :
        range === "3M" ? activeAsset.history3M :
        activeAsset.history6M;

    drawChart(data);
}

function drawChart(history) {
    if (chart) chart.destroy();

    chart = new Chart(
        document.getElementById("detailChart").getContext("2d"),
        {
            type: "line",
            data: {
                labels: history.map((_, idx) => `Point ${idx + 1}`),
                datasets: [{
                    data: history,
                    borderColor: "#1fa46e",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                plugins: { legend: { display: false }},
                scales: {
                    x: { ticks: { color: "white" }},
                    y: { ticks: { color: "white" }}
                }
            }
        }
    );
}

/* ============================================================
   BUY / SELL / SIP
============================================================ */
buyBtn.onclick = () => openTrade("BUY");
sellBtn.onclick = () => openTrade("SELL");
sipBtn.onclick = () => openTrade("SIP");

function openTrade(type) {
    tradeBox.classList.remove("hidden");

    if (type === "BUY") {
        tradeTitle.textContent = "Buy Quantity";
        confirmTrade.textContent = "Buy Now";
        confirmTrade.onclick = handleBuy;
    }
    else if (type === "SELL") {
        tradeTitle.textContent = "Sell Quantity";
        confirmTrade.textContent = "Sell Now";
        confirmTrade.onclick = handleSell;
    }
    else {
        tradeTitle.textContent = "SIP Monthly Amount";
        confirmTrade.textContent = "Start SIP";
        confirmTrade.onclick = handleSIP;
    }
}

/* ================== BUY ================== */
function handleBuy() {
    let qty = Number(tradeInput.value);
    if (qty <= 0) return showToast("Enter valid quantity!", true);

    let cost = activeType === "stock" ? qty * activeAsset.price : qty;

    if (wallet < cost)
        return showToast("Insufficient funds!", true);

    wallet -= cost;
    walletBalance.textContent = wallet;

    if (!portfolio[activeAsset.symbol])
        portfolio[activeAsset.symbol] = { type: activeType, qty: 0, invested: 0 };

    portfolio[activeAsset.symbol].qty += qty;
    portfolio[activeAsset.symbol].invested += cost;

    showToast(`Bought ${qty} units of ${activeAsset.symbol}`);

    tradeInput.value = "";
    tradeBox.classList.add("hidden");
    updatePortfolio();
}

/* ================== SELL ================== */
function handleSell() {
    let qty = Number(tradeInput.value);
    if (qty <= 0) return showToast("Enter valid quantity!", true);

    let holding = portfolio[activeAsset.symbol];
    if (!holding || holding.qty < qty)
        return showToast("Not enough quantity!", true);

    let credit = activeType === "stock" ? qty * activeAsset.price : qty;

    wallet += credit;
    walletBalance.textContent = wallet;

    holding.qty -= qty;
    holding.invested -= credit;

    if (holding.qty === 0)
        delete portfolio[activeAsset.symbol];

    showToast(`Sold ${qty} units of ${activeAsset.symbol}`);

    tradeInput.value = "";
    tradeBox.classList.add("hidden");
    updatePortfolio();
}

/* ================== SIP ================== */
function handleSIP() {
    let amount = Number(tradeInput.value);
    if (amount <= 0) return showToast("Enter valid amount!", true);
    if (wallet < amount) return showToast("Insufficient funds!", true);

    wallet -= amount;
    walletBalance.textContent = wallet;

    let units = amount / activeAsset.nav;

    if (!portfolio[activeAsset.symbol])
        portfolio[activeAsset.symbol] = { type: activeType, qty: 0, invested: 0 };

    portfolio[activeAsset.symbol].qty += units;
    portfolio[activeAsset.symbol].invested += amount;

    showToast(`SIP: Bought units worth ₹${amount}`);

    tradeInput.value = "";
    tradeBox.classList.add("hidden");
    updatePortfolio();
}

/* ============================================================
   PORTFOLIO
============================================================ */
function updatePortfolio() {
    holdingsList.innerHTML = "";

    let totalValue = 0;
    let invested = 0;

    for (let symbol in portfolio) {
        let item = portfolio[symbol];

        let asset =
            STOCKS.find(s => s.symbol === symbol) ||
            FUNDS.find(f => f.symbol === symbol);

        let price = item.type === "stock" ? asset.price : asset.nav;
        let value = price * item.qty;

        totalValue += value;
        invested += item.invested;

        let div = document.createElement("div");
        div.className = "holding";
        div.innerHTML = `
            <strong>${asset.name}</strong><br>
            Qty: ${item.qty.toFixed(2)}<br>
            Value: ₹${value.toFixed(2)}<br>
            P/L:
            <span class="${value >= item.invested ? "green" : "red"}">
                ₹${(value - item.invested).toFixed(2)}
            </span>
        `;
        holdingsList.appendChild(div);
    }

    portfolioSummary.innerHTML = `
        <strong>Total Value:</strong> ₹${totalValue.toFixed(2)}<br>
        <strong>Invested:</strong> ₹${invested.toFixed(2)}<br>
        <strong>Overall P/L:</strong>
        <span class="${totalValue >= invested ? "green" : "red"}">
            ₹${(totalValue - invested).toFixed(2)}
        </span>
    `;
}

/* ============================================================
   BACK BUTTON
============================================================ */
backToMain.onclick = () => {
    detailScreen.classList.add("hidden");
    document.getElementById("stocksScreen").classList.add("active-screen");
};
