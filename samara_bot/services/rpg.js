const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'rpg_data.json');
const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Habits', 'Solo_Leveling_Status.md');

function getRankTitle(level) {
  if (level < 5) return { rank: 'E-Rank', title: 'Yangi Qahramon (Novice Hunter)' };
  if (level < 10) return { rank: 'D-Rank', title: 'Intizomli Jangchi (Disciplined Coder)' };
  if (level < 20) return { rank: 'C-Rank', title: 'Calisthenics Beast & Dev' };
  if (level < 35) return { rank: 'B-Rank', title: 'Algoritm Slayer' };
  if (level < 50) return { rank: 'A-Rank', title: 'Senior Muhandis' };
  return { rank: 'S-Rank', title: 'Silicon Valley Titan & Monarx' };
}

function loadData() {
  const defaultData = {
    playerName: 'Samar',
    level: 1,
    currentXp: 0,
    totalXp: 0,
    stats: {
      strength: 10,   // Kuch (Sport)
      intellect: 10,  // Aql (Kitob & Ingliz tili)
      engineering: 10,// Muhandislik (Kod & LeetCode)
      discipline: 10, // Intizom (Suv & Deep Work)
    },
    questsCompleted: 0,
    history: [],
  };

  if (!fs.existsSync(DATA_FILE)) return defaultData;
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

function getXpNeeded(level) {
  return level * 100;
}

function renderProgressBar(current, total, length = 12) {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.min(length, Math.max(0, Math.round((percent / 100) * length)));
  const empty = length - filled;
  return {
    bar: '█'.repeat(filled) + '░'.repeat(empty),
    percent: Math.round(percent),
  };
}

function syncToObsidian(data) {
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const rankInfo = getRankTitle(data.level);
    const xpNeeded = getXpNeeded(data.level);
    const p = renderProgressBar(data.currentXp, xpNeeded, 15);

    const content = `# 🎮 Solo Leveling — Samarning Status Oynasi

**O'yinchi:** ${data.playerName}
**Daraja (Level):** **${data.level}** (${rankInfo.rank}: _${rankInfo.title}_)
**Tajriba (XP):** ${data.currentXp} / ${xpNeeded} XP [${p.bar}] ${p.percent}%
**Jami to'plangan XP:** ${data.totalXp} XP
**Bajarilgan kvestlar:** ${data.questsCompleted} ta

---

## 📊 Qahramon Xususiyatlari (Player Stats):
- 🦾 **Kuch (Strength):** ${data.stats.strength} pt *(Calisthenics, turnik, anjimaniya)*
- 🧠 **Aql (Intellect):** ${data.stats.intellect} pt *(Kitob mutolaasi, ingliz tili C1)*
- 💻 **Muhandislik (Engineering):** ${data.stats.engineering} pt *(LeetCode, toza kod, arxitektura)*
- 🎯 **Intizom (Discipline):** ${data.stats.discipline} pt *(Deep Work, suv balansi, ertalabki rejim)*

---

## 📜 Oxirgi Bajarilgan Kvestlar Tarixi:
${data.history.length === 0 ? '_Hozircha kvestlar tarixi bo\'sh._' : data.history.slice(-10).reverse().map((h) => `- **${h.date}**: +${h.xp} XP (${h.category}) — _${h.reason}_`).join('\n')}

---
> ⚔️ *"Tizim tanlagan yagona o'yinchi: Har kuni zaiflikni yengib, yangi cho'qqilarni zabt etish uning qonida bor!"*
`;

    fs.writeFileSync(OBSIDIAN_FILE, content, 'utf8');
  } catch (err) {
    console.error('RPG Obsidian sync error:', err.message);
  }
}

function addXp(category, xpAmount, reason = 'Kvest bajarildi') {
  const data = loadData();
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  data.currentXp += xpAmount;
  data.totalXp += xpAmount;
  data.questsCompleted += 1;

  // Stat boost
  if (category === 'strength') data.stats.strength += Math.round(xpAmount / 10);
  else if (category === 'intellect') data.stats.intellect += Math.round(xpAmount / 10);
  else if (category === 'engineering') data.stats.engineering += Math.round(xpAmount / 10);
  else if (category === 'discipline') data.stats.discipline += Math.round(xpAmount / 10);

  // Check Level Up
  let leveledUp = false;
  let oldLevel = data.level;
  let xpNeeded = getXpNeeded(data.level);

  while (data.currentXp >= xpNeeded) {
    data.currentXp -= xpNeeded;
    data.level += 1;
    leveledUp = true;
    xpNeeded = getXpNeeded(data.level);
  }

  data.history.push({
    date: dateStr,
    category,
    xp: xpAmount,
    reason,
  });

  saveData(data);

  return {
    leveledUp,
    oldLevel,
    newLevel: data.level,
    xpGained: xpAmount,
    currentXp: data.currentXp,
    xpNeeded,
    rankInfo: getRankTitle(data.level),
  };
}

function getStatusCard() {
  const data = loadData();
  const rankInfo = getRankTitle(data.level);
  const xpNeeded = getXpNeeded(data.level);
  const p = renderProgressBar(data.currentXp, xpNeeded, 12);

  let text = `🎮 **SOLO LEVELING: STATUS OYNASI** ⚡\n\n`;
  text += `👤 **O'yinchi:** Samar\n`;
  text += `🏆 **Rutba:** [${rankInfo.rank}] _${rankInfo.title}_\n`;
  text += `⭐ **Daraja (Level):** **${data.level}**\n`;
  text += `📈 **XP:** [${p.bar}] ${p.percent}% (${data.currentXp} / ${xpNeeded} XP)\n\n`;
  text += `📊 **QAHRAMON KO'RSATKICHLARI (STATS):**\n`;
  text += `🦾 **Kuch (Strength):** ${data.stats.strength} pt *(Sport)*\n`;
  text += `🧠 **Aql (Intellect):** ${data.stats.intellect} pt *(Kitob & Ingliz tili)*\n`;
  text += `💻 **Muhandislik:** ${data.stats.engineering} pt *(LeetCode & IT)*\n`;
  text += `🎯 **Intizom:** ${data.stats.discipline} pt *(Deep Work & Suv)*\n\n`;
  text += `⚔️ _Jami yutilgan kvestlar: ${data.questsCompleted} ta | Umumiy XP: ${data.totalXp}_\n`;
  text += `_Har bir foydali harakatingiz sizga XP va yangi daraja keltiradi!_`;

  return text;
}

module.exports = {
  addXp,
  getStatusCard,
  loadData,
};
