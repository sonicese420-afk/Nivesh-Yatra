document.addEventListener("DOMContentLoaded", () => {

/* ============================================================
   MARKET DATA
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
    ...
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
    ...
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

/* ============================================================
   DOM ELEMENTS
============================================================ */

const navButtons = document.querySelectorAll(".nav-btn");
const screens = document.querySelectorAll(".screen");

const stocksList = document.getElementById("stocksList");
const fundsList = document.getElementById("fundsList");

const profilePanel = document.getElementById("profilePanel");
const profileBtn = document.getElementById("profileBtn");
const closeProfile = document.getElementById("closeProfile");
const walletBalance = document.getElementById("walletBalance");
const addMoneyBtn = document.getElementById("addMoneyBtn");

const detailScreen = document.getElementById("detailScreen");
const backToMain = document.getElementById("backToMain");

const detailName = document.getElementById("detailName");
const detailPrice = document.getElementById("detailPrice");

const tradeBox = document.getElementById("tradeBox");
const tradeInput = document.getElementById("tradeInput");
const confirmTrade = document.getElementById("confirmTrade");

const toast = document.getElementById("toast");

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, error = false) {
    toast.textContent = msg;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    if (error) toast.classList.add("error");
    else toast.classList.remove("error");

    setTimeout(() => toast.classList.remove("show"), 2000);
}

/* ============================================================
   RENDER STOCKS
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
            <div class="card-price">₹${fund.nav}</div>
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
   PROFILE PANEL
============================================================ */
profileBtn.onclick = () => profilePanel.classList.add("active");
closeProfile.onclick = () => profilePanel.classList.remove("active");
addMoneyBtn.onclick = () => {
    wallet += 1000;
    walletBalance.textContent = wallet;
};

/* ============================================================
   DETAIL SCREEN
============================================================ */
function openDetail(asset, type) {
    activeAsset = asset;
    activeType = type;

    detailName.textContent = asset.name;
    detailPrice.textContent = type === "stock" ? `₹${asset.price}` : `NAV: ₹${asset.nav}`;

    drawChart(asset.history6M);

    screens.forEach(s => s.classList.remove("active-screen"));
    detailScreen.classList.remove("hidden");
}

backToMain.onclick = () => {
    detailScreen.classList.add("hidden");
    document.getElementById("stocksScreen").classList.add("active-screen");
};

/* ============================================================
   CHART
============================================================ */

function drawChart(history) {
    if (chart) chart.destroy();

    chart = new Chart(
        document.getElementById("detailChart").getContext("2d"),
        {
            type: "line",
            data: {
                labels: history.map((_, i) => i + 1),
                datasets: [{
                    data: history,
                    borderColor: "#1fa46e",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false }} }
        }
    );
}

/* ============================================================
   BUY / SELL
============================================================ */

buyBtn.onclick = () => openTrade("BUY");
sellBtn.onclick = () => openTrade("SELL");

function openTrade(type) {
    tradeBox.classList.remove("hidden");
    confirmTrade.onclick = type === "BUY" ? handleBuy : handleSell;
}

function handleBuy() {
    let qty = Number(tradeInput.value);
    if (qty <= 0) return showToast("Enter valid", true);

    let cost = qty * activeAsset.price;
    if (wallet < cost) return showToast("Insufficient funds", true);

    wallet -= cost;
    walletBalance.textContent = wallet;

    if (!portfolio[activeAsset.symbol])
        portfolio[activeAsset.symbol] = { qty: 0, invested: 0, type: activeType };

    portfolio[activeAsset.symbol].qty += qty;
    portfolio[activeAsset.symbol].invested += cost;

    showToast("Bought!");
    tradeBox.classList.add("hidden");
}

/* ============================================================
   END DOMContentLoaded WRAPPER
============================================================ */
});
