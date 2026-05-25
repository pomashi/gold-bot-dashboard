let accounts = [
  {
    id: "201101469",
    equity: 9432,
    broker: "MH",
    bots: [
      { name: "Gold Sniper", lot: 0.1 },
      { name: "Smart Gold", lot: 0.1 },
      { name: "Gold Slayer", lot: 0.03 },
      { name: "Gold Devil", lot: 0.02 },
    ],
  },
  {
    id: "201101470",
    equity: 10152,
    broker: "MH",
    bots: [
      { name: "Smart Gold", lot: 0.1 },
      { name: "Gold Devil", lot: 0.06 },
      { name: "Gold Slayer", lot: 0.03 },
      { name: "Gold Sniper", lot: 0.09 },
    ],
  },
  {
    id: "24892586",
    equity: 3429,
    broker: "VT",
    bots: [
      { name: "Grandma Gold", lot: 0.07 },
      { name: "Gold Devil", lot: 0.02 },
      { name: "Gold Slayer", lot: 0.01 },
    ],
  },
  {
    id: "201100915",
    equity: 17083,
    broker: "MH",
    bots: [
      { name: "Smart Gold", lot: 0.2 },
      { name: "Gold Slayer", lot: 0.05 },
      { name: "Gold Sniper", lot: 0.19 },
      { name: "Gold Devil", lot: 0.07 },
    ],
  },
  {
    id: "201100978",
    equity: 660,
    broker: "MH",
    note: "Wave",
    bots: [{ name: "Smart Gold", lot: 0.02 }],
  },
  {
    id: "201101468",
    equity: 439,
    broker: "MH",
    bots: [{ name: "Prince of Persia", lot: 0.01 }],
  },
  {
    id: "201100977",
    equity: 2596,
    broker: "MH",
    bots: [
      { name: "John Wick", lot: 0.04 },
      { name: "Gold Slayer", lot: 0.02 },
    ],
  },
  {
    id: "7012808",
    equity: 100,
    broker: "MH",
    bots: [
      { name: "Gold Devil", lot: 0.01 },
      { name: "Gold Sniper", lot: 0.03 },
    ],
  },
];

const configuredBotsByAccount = new Map(
  accounts.map((account) => [account.id, account.bots.map((bot) => ({ ...bot }))]),
);

const moneyFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const ACCOUNT_UNIT = "USC";
const WATCHLIST_USC = 100000;

function formatMoney(value) {
  return `${moneyFormat.format(Number(value || 0))} ${ACCOUNT_UNIT}`;
}

function parseArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const lotFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let accountChart;
let botChart;
let chartMode = "bar";
const chartColors = ["#1f7a4c", "#bd8b2f", "#275a8d", "#b94d43", "#5b8e7d", "#9c6b2e", "#496f9d", "#7a8a42"];

function accountLotTotal(account) {
  return account.bots.reduce((sum, bot) => sum + bot.lot, 0);
}

function botTotals() {
  return accounts
    .flatMap((account) => account.bots)
    .reduce((map, bot) => {
      map[bot.name] = (map[bot.name] || 0) + bot.lot;
      return map;
    }, {});
}

function accountPerformanceRows() {
  return accounts
    .map((account) => ({
      id: account.id,
      broker: account.broker,
      equity: account.equity,
      baselineEquity: account.baselineEquity,
      dailyProfit: account.dailyProfit,
      dailyProfitPct: account.dailyProfitPct,
      dailyDrawdownPct: account.dailyDrawdownPct,
      hasMetric: Number.isFinite(account.dailyProfitPct),
    }))
    .sort((a, b) => (b.dailyProfitPct || -999) - (a.dailyProfitPct || -999));
}

function setMetrics() {
  const totalEquity = accounts.reduce((sum, account) => sum + account.equity, 0);
  const totalLots = accounts.reduce((sum, account) => sum + accountLotTotal(account), 0);
  const largest = [...accounts].sort((a, b) => b.equity - a.equity)[0];
  const watchlist = accounts.filter((account) => account.equity < WATCHLIST_USC).length;

  document.getElementById("totalEquity").textContent = formatMoney(totalEquity);
  document.getElementById("totalLots").textContent = lotFormat.format(totalLots);
  document.getElementById("largestAccount").textContent = largest.id;
  document.getElementById("largestAccountMeta").textContent = `${largest.broker} - ${formatMoney(largest.equity)}`;
  document.getElementById("watchlistCount").textContent = String(watchlist);
}

function drawAccountChart() {
  const canvas = document.getElementById("accountChart");
  prepareCanvas(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (chartMode === "doughnut") {
    drawDoughnutChart(ctx, canvas, accounts.map((account) => account.equity), accounts.map((account) => account.id));
    return;
  }

  drawBarChart(ctx, canvas, accounts.map((account) => account.equity), accounts.map((account) => account.id));
}

function drawBotChart() {
  const totals = botTotals();
  const labels = Object.keys(totals);
  const canvas = document.getElementById("botChart");
  prepareCanvas(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDoughnutChart(ctx, canvas, labels.map((label) => totals[label]), labels, true);
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * scale);
  canvas.height = Math.floor(rect.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  canvas.widthCss = rect.width;
  canvas.heightCss = rect.height;
}

function drawBarChart(ctx, canvas, values, labels) {
  const width = canvas.widthCss;
  const height = canvas.heightCss;
  const padding = { top: 20, right: 18, bottom: 52, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...values) * 1.12;
  const barGap = 10;
  const barWidth = Math.max(18, (chartWidth - barGap * (values.length - 1)) / values.length);

  ctx.strokeStyle = "#dfe4dc";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#647067";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + chartHeight * (i / 4);
    const value = max - max * (i / 4);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(value / 1000)}k`, padding.left - 8, y + 4);
  }

  values.forEach((value, index) => {
    const x = padding.left + index * (barWidth + barGap);
    const barHeight = (value / max) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    roundRect(ctx, x, y, barWidth, barHeight, 6, "#1f7a4c");

    ctx.save();
    ctx.translate(x + barWidth / 2, height - 12);
    ctx.rotate(-0.35);
    ctx.fillStyle = "#17201b";
    ctx.textAlign = "right";
    ctx.font = "11px Arial";
    ctx.fillText(labels[index], 0, 0);
    ctx.restore();
  });
}

function drawDoughnutChart(ctx, canvas, values, labels, isLotChart = false) {
  const width = canvas.widthCss;
  const height = canvas.heightCss;
  const radius = Math.min(width, height) * 0.28;
  const centerX = width * 0.38;
  const centerY = height * 0.45;
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    ctx.fillStyle = "#647067";
    ctx.textAlign = "center";
    ctx.font = "14px Arial";
    ctx.fillText("No data", width / 2, height / 2);
    return;
  }
  let start = -Math.PI / 2;

  values.forEach((value, index) => {
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, start + angle);
    ctx.arc(centerX, centerY, radius * 0.58, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = chartColors[index % chartColors.length];
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = "#17201b";
  ctx.textAlign = "center";
  ctx.font = "800 18px Arial";
  ctx.fillText(isLotChart ? lotFormat.format(total) : formatMoney(total), centerX, centerY + 4);
  ctx.font = "12px Arial";
  ctx.fillStyle = "#647067";
  ctx.fillText(isLotChart ? "total lot" : "total equity", centerX, centerY + 24);

  const legendX = width * 0.68;
  const firstY = Math.max(26, centerY - labels.length * 12);
  labels.forEach((label, index) => {
    const y = firstY + index * 24;
    ctx.fillStyle = chartColors[index % chartColors.length];
    ctx.fillRect(legendX, y - 9, 10, 10);
    ctx.fillStyle = "#17201b";
    ctx.textAlign = "left";
    ctx.font = "12px Arial";
    const value = isLotChart ? lotFormat.format(values[index]) : formatMoney(values[index]);
    ctx.fillText(`${label} - ${value}`, legendX + 16, y);
  });
}

function roundRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function renderAccounts(filter = "") {
  const normalized = filter.trim().toLowerCase();
  const rows = accounts.filter((account) => {
    const haystack = `${account.id} ${account.broker} ${account.note || ""} ${account.bots.map((bot) => bot.name).join(" ")}`;
    return haystack.toLowerCase().includes(normalized);
  });

  document.getElementById("accountsBody").innerHTML = rows
    .map((account) => {
      const isWatch = account.equity < WATCHLIST_USC;
      const tags = account.bots
        .map((bot) => `<span class="tag">${bot.name} ${lotFormat.format(bot.lot)}</span>`)
        .join("");

      return `
        <tr>
          <td>
            <span class="account-id">${account.id}</span>
            ${account.note ? `<span class="account-note">${account.note}</span>` : ""}
          </td>
          <td>${account.broker}</td>
          <td>${formatMoney(account.equity)}</td>
          <td><div class="bot-tags">${tags}</div></td>
          <td>${lotFormat.format(accountLotTotal(account))}</td>
          <td><span class="status-pill ${isWatch ? "watch" : "ok"}">${isWatch ? "Watch" : "OK"}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderBotMatrix() {
  const totals = botTotals();
  const maxLot = Math.max(...Object.values(totals));

  if (!Number.isFinite(maxLot) || maxLot <= 0) {
    document.getElementById("botMatrix").innerHTML = '<div class="empty-state">No bot exposure data</div>';
    return;
  }

  document.getElementById("botMatrix").innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([bot, lot]) => {
      const width = Math.max(4, (lot / maxLot) * 100);
      return `
        <div class="bot-row">
          <strong>${bot}</strong>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <span>${lotFormat.format(lot)}</span>
        </div>
      `;
    })
    .join("");
}

function renderAccountPerformance() {
  const rows = accountPerformanceRows();
  const target = document.getElementById("accountPerformance");

  if (!target) return;

  if (!rows.length) {
    target.innerHTML = '<div class="empty-state">No account data</div>';
    return;
  }

  target.innerHTML = rows
    .map((row) => {
      const isReady = row.hasMetric;
      const profitClass = isReady && row.dailyProfitPct >= 0 ? "positive" : "negative";
      return `
        <div class="performance-row ${isReady ? "" : "pending"}">
          <strong>${row.id}</strong>
          <span class="${profitClass}">${isReady ? `${row.dailyProfitPct.toFixed(2)}%` : "Need history"}</span>
          <span>${isReady ? `${row.dailyDrawdownPct.toFixed(2)}% DD` : "รอ baseline"}</span>
        </div>
      `;
    })
    .join("");
}

function exportCsv() {
  const header = ["account", "broker", "equity_usc", "note", "bot", "lot"];
  const rows = accounts.flatMap((account) =>
    account.bots.map((bot) => [account.id, account.broker, account.equity, account.note || "", bot.name, bot.lot]),
  );
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mt5-gold-bot-dashboard.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function copySchema() {
  const schema = {
    account: "201101469",
    broker: "MH",
    balance: 9432,
    equity: 9432,
    floating_pl: 0,
    margin_level: 0,
    updated_at: new Date().toISOString(),
    bots: [{ name: "Gold Sniper", lot: 0.1, open_orders: 0, floating_pl: 0 }],
  };

  const payload = JSON.stringify(schema, null, 2);
  try {
    if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(payload);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = payload;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  const button = document.getElementById("copySchemaBtn");
  const oldText = button.innerHTML;
  button.innerHTML = '<i data-lucide="check"></i> Copied schema';
  setTimeout(() => {
    button.innerHTML = oldText;
  }, 1600);
}

function bindEvents() {
  document.querySelectorAll("[data-chart-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      chartMode = button.dataset.chartMode;
      document.querySelectorAll("[data-chart-mode]").forEach((item) => item.classList.toggle("active", item === button));
      drawAccountChart();
    });
  });

  document.getElementById("searchInput").addEventListener("input", (event) => renderAccounts(event.target.value));
  document.getElementById("exportBtn").addEventListener("click", exportCsv);
  document.getElementById("copySchemaBtn").addEventListener("click", copySchema);
  document.getElementById("refreshBtn").addEventListener("click", refreshDashboard);

  window.addEventListener("resize", () => {
    drawAccountChart();
    drawBotChart();
  });
}

function normalizeLiveAccount(account) {
  const id = String(account.account || account.id || "");
  const liveBotsSource = parseArray(account.bots);
  const botMetricsSource = parseArray(account.bot_metrics || account.botMetrics);
  const liveBots = liveBotsSource.length
    ? liveBotsSource
        .map((bot) => ({ name: String(bot.name || ""), lot: Number(bot.lot || 0) }))
        .filter((bot) => bot.name)
    : [];
  const configuredBots = configuredBotsByAccount.get(id) || [];
  const hasPlaceholderBots =
    liveBots.length === 0 || liveBots.every((bot) => bot.name === id || bot.name === account.account || bot.lot <= 0);

  return {
    id,
    equity: Number(account.equity || 0),
    balance: Number(account.balance || 0),
    broker: String(account.broker || ""),
    note: String(account.note || ""),
    floatingPl: Number(account.floating_pl || account.floatingPl || 0),
    openPositions: Number(account.open_positions || account.openPositions || 0),
    openLots: Number(account.open_lots || account.openLots || 0),
    marginLevel: Number(account.margin_level || account.marginLevel || 0),
    updatedAt: account.updated_at || account.updatedAt || "",
    baselineEquity: Number(account.baseline_equity || account.baselineEquity || 0),
    dailyProfit: Number(account.daily_profit || account.dailyProfit || 0),
    dailyProfitPct:
      account.daily_profit_pct === "" || account.dailyProfitPct === ""
        ? Number.NaN
        : Number(account.daily_profit_pct ?? account.dailyProfitPct ?? Number.NaN),
    dailyDrawdownPct:
      account.daily_drawdown_pct === "" || account.dailyDrawdownPct === ""
        ? Number.NaN
        : Number(account.daily_drawdown_pct ?? account.dailyDrawdownPct ?? Number.NaN),
    botMetrics: botMetricsSource.map((metric) => ({
      name: String(metric.name || ""),
      profit: Number(metric.profit || 0),
      profitPct: Number(metric.profit_pct || metric.profitPct || 0),
      drawdownPct: Number(metric.drawdown_pct || metric.drawdownPct || 0),
    })),
    bots: configuredBots.length ? configuredBots.map((bot) => ({ ...bot })) : liveBots,
  };
}

async function loadLiveData() {
  const liveDataUrl = window.GOLD_DASHBOARD_CONFIG?.liveDataUrl;
  if (!liveDataUrl) return;

  try {
    document.getElementById("connectionStatus").textContent = "Loading live data";
    const url = new URL(liveDataUrl);
    url.searchParams.set("mode", "live");
    url.searchParams.set("_", Date.now().toString());
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.accounts)) throw new Error("Missing accounts array");
    accounts = payload.accounts.map(normalizeLiveAccount).filter((account) => account.id);
    document.getElementById("connectionStatus").textContent = `Live ${new Date().toLocaleTimeString("th-TH")}`;
  } catch (error) {
    document.getElementById("connectionStatus").textContent = "Live data failed";
    console.warn("Could not load live MT5 data", error);
  }
}

async function refreshDashboard() {
  await loadLiveData();
  setMetrics();
  renderAccounts(document.getElementById("searchInput")?.value || "");
  renderBotMatrix();
  renderAccountPerformance();
  drawAccountChart();
  drawBotChart();
}

bindEvents();
refreshDashboard();
