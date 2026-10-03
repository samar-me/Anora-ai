const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const DEBTS_FILE = path.join(__dirname, 'debts_data.json');

function loadDebts() {
  if (fs.existsSync(DEBTS_FILE)) {
    try { return JSON.parse(fs.readFileSync(DEBTS_FILE, 'utf8')); } catch (_) {}
  }
  return [];
}

function saveDebts(list) {
  fs.writeFileSync(DEBTS_FILE, JSON.stringify(list, null, 2), 'utf8');

  // Sync to Obsidian Finance/Qarz_Daftari.md
  try {
    const finDir = path.join(VAULT_PATH, 'Finance');
    if (!fs.existsSync(finDir)) fs.mkdirSync(finDir, { recursive: true });
    const mdFile = path.join(finDir, 'Qarz_Daftari.md');

    let totalLent = 0;
    let totalBorrowed = 0;

    let rows = '';
    for (const d of list) {
      if (d.status === 'open') {
        if (d.type === 'lent') totalLent += d.amount;
        if (d.type === 'borrowed') totalBorrowed += d.amount;
      }
      const typeLabel = d.type === 'lent' ? '🟢 Men berdim (Menga qaytaradi)' : '🔴 Men oldim (Qaytarishim kerak)';
      const statusLabel = d.status === 'open' ? '⏳ Faol' : '✅ Yopildi (Uzildi)';
      rows += `| ${d.date} | **${d.person}** | ${typeLabel} | **${obsidian.formatMoney(d.amount)}** | ${d.note || '-'} | ${statusLabel} |\n`;
    }

    const md = `# 📒 Qarz Daftari (Debts & Loans)

Oxirgi yangilanish: ${obsidian.getTodayString()}

### 📊 Umumiy Balans:
- 🟢 **Menga qaytarilishi kerak (Mening pulim):** ${obsidian.formatMoney(totalLent)}
- 🔴 **Men qaytarishim kerak (Mening qarzim):** ${obsidian.formatMoney(totalBorrowed)}
- 💵 **Sof farq:** ${obsidian.formatMoney(totalLent - totalBorrowed)}

---

| Sana | Shaxs | Turi | Miqdor | Izoh | Holat |
|---|---|---|---|---|---|
${rows || '| - | Hozircha qarzlar yo\'q | - | - | - | - |\n'}
`;
    fs.writeFileSync(mdFile, md, 'utf8');
  } catch (err) {
    console.warn('Obsidian debts sync notice:', err.message);
  }
}

function addDebt({ type = 'lent', person, amount, note = '', dueDate = '' }) {
  const list = loadDebts();
  const entry = {
    id: Date.now(),
    type, // 'lent' (berdim) or 'borrowed' (oldim)
    person: person.trim(),
    amount: Number(amount) || 0,
    note,
    dueDate,
    date: obsidian.getTodayString(),
    status: 'open',
  };
  list.push(entry);
  saveDebts(list);
  return entry;
}

function closeDebt(personQuery, paidAmount = null) {
  const list = loadDebts();
  const q = personQuery.toLowerCase().trim();
  let found = false;
  let settledItem = null;
  let remaining = 0;

  for (const d of list) {
    if (d.status === 'open' && (d.person.toLowerCase().includes(q) || q.includes(d.person.toLowerCase()))) {
      found = true;
      settledItem = d;
      const amt = Number(paidAmount);
      if (amt && amt > 0 && amt < d.amount) {
        // Qisman qaytarish (Partial repayment)
        d.amount -= amt;
        remaining = d.amount;
        d.note = (d.note ? d.note + '; ' : '') + `${obsidian.formatMoney(amt)} qaytarildi (${obsidian.getTodayString()})`;
      } else {
        // To'liq yopish (Full repayment)
        d.status = 'closed';
        d.closedDate = obsidian.getTodayString();
        remaining = 0;
      }
      break;
    }
  }

  if (found) {
    saveDebts(list);
  }
  return { success: found, debt: settledItem, remaining };
}

function getDebtsSummary() {
  const list = loadDebts();
  const openDebts = list.filter(d => d.status === 'open');

  if (openDebts.length === 0) {
    return '📒 **Qarz Daftari:** Hozircha hech qanday faol qarzlar yo\'q. Balans toza!';
  }

  let totalLent = 0;
  let totalBorrowed = 0;
  let lentList = '';
  let borrowedList = '';

  for (const d of openDebts) {
    if (d.type === 'lent') {
      totalLent += d.amount;
      lentList += `• **${d.person}**: ${obsidian.formatMoney(d.amount)} (${d.note || d.date})\n`;
    } else {
      totalBorrowed += d.amount;
      borrowedList += `• **${d.person}**: ${obsidian.formatMoney(d.amount)} (${d.note || d.date})\n`;
    }
  }

  let msg = `📒 **Qarz Daftari:**\n\n`;
  if (lentList) {
    msg += `🟢 **Menga qaytarilishi kerak (${obsidian.formatMoney(totalLent)}):**\n${lentList}\n`;
  }
  if (borrowedList) {
    msg += `🔴 **Men qaytarishim kerak (${obsidian.formatMoney(totalBorrowed)}):**\n${borrowedList}\n`;
  }

  msg += `💵 **Sof qoldiq:** ${obsidian.formatMoney(totalLent - totalBorrowed)}`;
  return msg;
}

function updateDebtPerson({ person, amount = null }) {
  const list = loadDebts();
  let target = null;
  for (let i = list.length - 1; i >= 0; i--) {
    const d = list[i];
    if (d.status === 'open') {
      if (d.person.toLowerCase().includes("noma'lum") || d.person.toLowerCase().includes('nomalum')) {
        target = d;
        break;
      }
      if (amount && d.amount === Number(amount)) {
        target = d;
        break;
      }
    }
  }

  if (!target) {
    const openDebts = list.filter(d => d.status === 'open');
    if (openDebts.length > 0) target = openDebts[openDebts.length - 1];
  }

  if (target) {
    target.person = person.trim();
    saveDebts(list);
    return { success: true, debt: target };
  }
  return { success: false };
}

module.exports = {
  addDebt,
  closeDebt,
  getDebtsSummary,
  updateDebtPerson,
};
