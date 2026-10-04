const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'dream_data.json');
const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Finance', 'Escalade_Orzu_Fond.md');

// Standart Cadillac Escalade maqsadi: $120,000 (taxminan 1 500 000 000 so'm)
const DEFAULT_TARGET_UZS = 1500000000;
const USD_RATE = 12800; // Taxminiy kurs (1$ = 12 800 so'm)

function loadData() {
  const defaultData = {
    targetName: 'Cadillac Escalade',
    targetUzs: DEFAULT_TARGET_UZS,
    targetUsd: Math.round(DEFAULT_TARGET_UZS / USD_RATE),
    totalSavedUzs: 0,
    allocationPercent: 30, // Standart 30% har bir daromaddan
    history: [],
  };

  if (!fs.existsSync(DATA_FILE)) {
    return defaultData;
  }

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (_) {
    return defaultData;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  syncToObsidian(data);
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + " so'm";
}

function formatUsd(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US');
}

function renderProgressBar(percent, length = 15) {
  const filled = Math.min(length, Math.max(0, Math.round((percent / 100) * length)));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function syncToObsidian(data) {
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const percent = ((data.totalSavedUzs / data.targetUzs) * 100).toFixed(2);
    const bar = renderProgressBar(percent, 20);
    const currentUsd = Math.round(data.totalSavedUzs / USD_RATE);

    const content = `# 🚗 Katta Orzu Fondi: ${data.targetName}

Maqsad: **${data.targetName}**
Mo'ljal: **${formatMoney(data.targetUzs)}** (~${formatUsd(data.targetUsd)})
Joriy jamg'arma: **${formatMoney(data.totalSavedUzs)}** (~${formatUsd(currentUsd)})
Progress: **[${bar}] ${percent}%**

---

## 📈 Jamg'arish Qoidasi:
Har bir sof daromaddan (o'quvchilar to'lovi, dasturchilik buyurtmalari) **${data.allocationPercent}%** ushbu orzu fondiga yo'naltiriladi.

---

## 📜 Tarix va Tushumlar:
${data.history.length === 0 ? '_Hozircha jamg\'arma tushumlari qayd etilmagan._' : data.history.map((h) => `- **${h.date}**: +${formatMoney(h.amount)} — _${h.note}_`).join('\n')}

---
> 🦁 *"Katta orzular mayda va intizomli harakatlar jamlanmasidan hosil bo'ladi. Har bir ajratilgan so'm — qora Cadillac Escalade ruliga borgan sari yaqinlashtiradi!"*
`;

    fs.writeFileSync(OBSIDIAN_FILE, content, 'utf8');
  } catch (err) {
    console.error('Dream Obsidian sync xatosi:', err.message);
  }
}

function contribute(amountUzs, note = 'Daromaddan ajratma') {
  const data = loadData();
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  data.totalSavedUzs += Number(amountUzs);
  data.history.push({
    date: dateStr,
    amount: Number(amountUzs),
    note,
  });

  saveData(data);

  const percent = ((data.totalSavedUzs / data.targetUzs) * 100).toFixed(2);
  const bar = renderProgressBar(percent, 12);
  const currentUsd = Math.round(data.totalSavedUzs / USD_RATE);

  return {
    added: Number(amountUzs),
    totalSavedUzs: data.totalSavedUzs,
    totalSavedUsd: currentUsd,
    percent,
    bar,
  };
}

function getDreamSummary() {
  const data = loadData();
  const percent = ((data.totalSavedUzs / data.targetUzs) * 100).toFixed(2);
  const bar = renderProgressBar(percent, 14);
  const currentUsd = Math.round(data.totalSavedUzs / USD_RATE);
  const leftUzs = Math.max(0, data.targetUzs - data.totalSavedUzs);

  let text = `🚗 **KATTA ORZU JAMG'ARMASI: CADILLAC ESCALADE** ✨\n\n`;
  text += `🎯 Mo'ljal: **${formatMoney(data.targetUzs)}** (~${formatUsd(data.targetUsd)})\n`;
  text += `💰 To'plangan: **${formatMoney(data.totalSavedUzs)}** (~${formatUsd(currentUsd)})\n`;
  text += `📊 Progress: **[${bar}] ${percent}%**\n\n`;
  text += `🏁 Qolgan summa: **${formatMoney(leftUzs)}**\n`;
  text += `💡 Har bir daromadingizdan **${data.allocationPercent}%** ajratib boriladi.\n\n`;
  text += `_Fondga pul qo'shish uchun: «Escalade fondiga 100 ming» deb yozing yoki daromad tushganda avtomatik tasdiqlang!_`;

  return text;
}

function suggestAllocation(incomeAmount) {
  const data = loadData();
  const amount = Math.round(Number(incomeAmount) * (data.allocationPercent / 100));
  return {
    percent: data.allocationPercent,
    amount,
    formatted: formatMoney(amount),
  };
}

module.exports = {
  contribute,
  getDreamSummary,
  suggestAllocation,
  loadData,
  formatMoney,
};
