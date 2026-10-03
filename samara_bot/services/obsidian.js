const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayFilePath() {
  const dailyDir = path.join(VAULT_PATH, 'Daily_Notes');
  if (!fs.existsSync(dailyDir)) fs.mkdirSync(dailyDir, { recursive: true });
  return path.join(dailyDir, `${getTodayString()}.md`);
}

function ensureTodayNote() {
  const filePath = getTodayFilePath();
  if (!fs.existsSync(filePath)) {
    const today = getTodayString();
    const template = `# 📅 ${today} — Kunlik Reja va Qaydlar

## ⏰ Tongi Rejim va Sport (06:00 - 08:00)
- [ ] 06:00 — Uyg'onish va 1 stakan suv
- [ ] 🏋️‍♂️ Tongi sport: 10 ta turnik, 20 ta anjimaniya, yugurish, o'tirib-turish
- [ ] 07:30 — 📚 Kitob mutolaasi (kamida 30 daqiqa)

## 🏫 Maktab va Ta'lim (08:30 - 13:30)
- [ ] Maktab darslarida faol bo'lish
- [ ] Uyga vazifalarni bajarish

## 🎯 Rivojlanish va Ko'nikmalar (15:00 - 17:00)
- [ ] 🇬🇧 Ingliz tili (10 ta yangi so'z + qoida + ovozli o'qish)
- [ ] 💻 Deep Work (Dasturlash / IT amaliyoti)

## 📌 Qo'shimcha Vazifalar

## 💰 Moliya (Xarajat & Daromad)

## ⚠️ Bajarilmagan Ishlar va Sabablari (Tergov)

## 🏆 Kunlik Kichik G'alaba (Win of the Day)

## 📝 Fikrlar va Eslatmalar

## 🤖 Samara AI Murabbiy Xulosasi
`;
    fs.writeFileSync(filePath, template, 'utf8');
  }
  return filePath;
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('uz-UZ') + ' so\'m';
}

function addTask({ title, time = '', priority = '' }) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let content = fs.readFileSync(filePath, 'utf8');

  const timeStr = time ? `${time} — ` : '';
  const prioStr = priority ? ` [${priority}]` : '';
  const taskLine = `- [ ] ${timeStr}${title}${prioStr}`;

  if (content.includes('## 📌 Qo\'shimcha Vazifalar')) {
    content = content.replace(
      '## 📌 Qo\'shimcha Vazifalar',
      `## 📌 Qo\'shimcha Vazifalar\n${taskLine}`
    );
  } else {
    content += `\n\n## 📌 Qo\'shimcha Vazifalar\n${taskLine}`;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { success: true, task: taskLine };
}

function completeTask(query) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let completed = false;
  let matchedLine = '';

  const q = query.toLowerCase();

  const newLines = lines.map(line => {
    if (!completed && line.includes('- [ ]')) {
      const l = line.toLowerCase();
      // Match keywords: sport, kitob, ingliz, etc.
      if (l.includes(q) || (q.includes('sport') && l.includes('sport')) ||
          (q.includes('kitob') && l.includes('kitob')) ||
          (q.includes('ingliz') && l.includes('ingliz')) ||
          (q.includes('turnik') && l.includes('turnik')) ||
          (q.includes('anjimaniya') && l.includes('anjimaniya')) ||
          (q.includes('deep work') && l.includes('deep work')) ||
          (q.includes('kod') && l.includes('dasturlash'))) {
        completed = true;
        matchedLine = line.replace('- [ ]', '- [x]');
        return matchedLine;
      }
    }
    return line;
  });

  if (completed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  }
  return { success: completed, matchedLine, query };
}

function addTransaction({ type = 'expense', amount, category = 'boshqa', description = '' }) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let content = fs.readFileSync(filePath, 'utf8');

  const sign = type === 'income' ? '➕' : '➖';
  const desc = description || category;
  const line = `- ${sign} ${formatMoney(amount)} — ${desc} (${category})`;

  if (content.includes('## 💰 Moliya (Xarajat & Daromad)')) {
    content = content.replace(
      '## 💰 Moliya (Xarajat & Daromad)',
      `## 💰 Moliya (Xarajat & Daromad)\n${line}`
    );
  } else {
    content += `\n\n## 💰 Moliya (Xarajat & Daromad)\n${line}`;
  }

  fs.writeFileSync(filePath, content, 'utf8');

  // Record in Monthly finance ledger
  try {
    const finDir = path.join(VAULT_PATH, 'Finance');
    if (!fs.existsSync(finDir)) fs.mkdirSync(finDir, { recursive: true });
    const monthStr = getTodayString().substring(0, 7);
    const finFile = path.join(finDir, `Moliya_${monthStr}.md`);
    if (!fs.existsSync(finFile)) {
      fs.writeFileSync(finFile, `# 💳 Moliya Hisoboti — ${monthStr}\n\n| Sana | Tur | Miqdor | Kategoriya | Izoh |\n|---|---|---|---|---|\n`, 'utf8');
    }
    const tableRow = `| ${getTodayString()} | ${type === 'income' ? 'Daromad' : 'Xarajat'} | ${formatMoney(amount)} | ${category} | ${desc} |\n`;
    fs.appendFileSync(finFile, tableRow, 'utf8');
  } catch (err) {
    console.error('Finance ledger error:', err);
  }

  return { success: true, transaction: line };
}

function addNote({ content: noteText, topic = 'Qayd' }) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let fileContent = fs.readFileSync(filePath, 'utf8');

  const noteLine = `- 💡 **${topic}**: ${noteText}`;

  if (fileContent.includes('## 📝 Fikrlar va Eslatmalar')) {
    fileContent = fileContent.replace(
      '## 📝 Fikrlar va Eslatmalar',
      `## 📝 Fikrlar va Eslatmalar\n${noteLine}`
    );
  } else {
    fileContent += `\n\n## 📝 Fikrlar va Eslatmalar\n${noteLine}`;
  }

  fs.writeFileSync(filePath, fileContent, 'utf8');
  return { success: true, note: noteLine };
}

function logUnfinishedReason({ task, reason }) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let content = fs.readFileSync(filePath, 'utf8');

  const line = `- ⚠️ **${task}**: ${reason} *(Kechiktirildi/Bajarilmadi)*`;

  if (content.includes('## ⚠️ Bajarilmagan Ishlar va Sabablari (Tergov)')) {
    content = content.replace(
      '## ⚠️ Bajarilmagan Ishlar va Sabablari (Tergov)',
      `## ⚠️ Bajarilmagan Ishlar va Sabablari (Tergov)\n${line}`
    );
  } else {
    content += `\n\n## ⚠️ Bajarilmagan Ishlar va Sabablari (Tergov)\n${line}`;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { success: true, log: line };
}

function logWin(winText) {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  let content = fs.readFileSync(filePath, 'utf8');

  const line = `- 🏆 ${winText}`;

  if (content.includes('## 🏆 Kunlik Kichik G\'alaba (Win of the Day)')) {
    content = content.replace(
      '## 🏆 Kunlik Kichik G\'alaba (Win of the Day)',
      `## 🏆 Kunlik Kichik G\'alaba (Win of the Day)\n${line}`
    );
  } else {
    content += `\n\n## 🏆 Kunlik Kichik G\'alaba (Win of the Day)\n${line}`;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { success: true, win: line };
}

// ── Long-Term Goals ──────────────────────────────────────────
function getGoalsFilePath() {
  const goalsDir = path.join(VAULT_PATH, 'Goals');
  if (!fs.existsSync(goalsDir)) fs.mkdirSync(goalsDir, { recursive: true });
  return path.join(goalsDir, 'Uzoq_Muddatli_Maqsadlar.md');
}

function setLongTermGoal({ title, deadline, target, current = '0', unit = '' }) {
  const filePath = getGoalsFilePath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `# 🎯 Uzoq Muddatli Maqsadlar va Ortga Hisoblash\n\n`, 'utf8');
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const goalEntry = `### 🎯 ${title}
- **Muddat (Deadline):** ${deadline}
- **Maqsad:** ${target} ${unit}
- **Hozirgi natija:** ${current} ${unit}
- **Qayd etilgan sana:** ${getTodayString()}

`;
  content += goalEntry;
  fs.writeFileSync(filePath, content, 'utf8');
  return { success: true, title, deadline, target };
}

function getGoalsContent() {
  const filePath = getGoalsFilePath();
  if (!fs.existsSync(filePath)) {
    return 'Hozircha uzoq muddatli maqsadlar kiritilmagan. Maqsadlaringizni botga aytib qo\'ying (masalan: "Ingliz tilida 90 kunda C1 olish", "Turnikda 25 taga chiqish").';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function getTodayNoteContent() {
  ensureTodayNote();
  const filePath = getTodayFilePath();
  return fs.readFileSync(filePath, 'utf8');
}

function getRecentSummary(days = 7) {
  const dailyDir = path.join(VAULT_PATH, 'Daily_Notes');
  if (!fs.existsSync(dailyDir)) return 'Kunlik qaydlar topilmadi.';

  const files = fs.readdirSync(dailyDir).filter(f => f.endsWith('.md')).sort().reverse().slice(0, days);
  if (files.length === 0) return 'Hozircha qaydlar yo\'q.';

  let summary = '';
  for (const file of files) {
    summary += `\n--- ${file} ---\n` + fs.readFileSync(path.join(dailyDir, file), 'utf8') + '\n';
  }
  return summary;
}

function searchVault(query) {
  const q = query.toLowerCase().trim();
  const results = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes(q)) {
            const relPath = path.relative(VAULT_PATH, fullPath);
            // Extract snippet around match
            const lowerContent = content.toLowerCase();
            const idx = lowerContent.indexOf(q);
            const start = Math.max(0, idx - 60);
            const end = Math.min(content.length, idx + 120);
            const snippet = content.substring(start, end).replace(/\n/g, ' ');
            results.push({ file: relPath, snippet: `...${snippet}...` });
          }
        } catch (_) {}
      }
    }
  }

  walkDir(VAULT_PATH);
  return results.slice(0, 5);
}

module.exports = {
  VAULT_PATH,
  getTodayString,
  ensureTodayNote,
  addTask,
  completeTask,
  addTransaction,
  addNote,
  logUnfinishedReason,
  logWin,
  setLongTermGoal,
  getGoalsContent,
  getTodayNoteContent,
  getRecentSummary,
  searchVault,
  formatMoney,
};
