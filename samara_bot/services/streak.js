const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const STREAK_FILE = path.join(__dirname, 'streak_data.json');

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadStreaks() {
  if (fs.existsSync(STREAK_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STREAK_FILE, 'utf8'));
    } catch (_) {}
  }
  return {
    sport: { count: 0, lastDate: null },
    reading: { count: 0, lastDate: null },
    english: { count: 0, lastDate: null },
    deepwork: { count: 0, lastDate: null },
  };
}

function saveStreaks(data) {
  fs.writeFileSync(STREAK_FILE, JSON.stringify(data, null, 2), 'utf8');

  // Also sync to Obsidian Vault
  try {
    const habitsDir = path.join(VAULT_PATH, 'Habits');
    if (!fs.existsSync(habitsDir)) fs.mkdirSync(habitsDir, { recursive: true });
    const mdFile = path.join(habitsDir, 'Odatlar_Zanjiri.md');
    const mdContent = `# 🔥 Odatlar Zanjiri va Intizom (Habit Streaks)

Oxirgi yangilanish: ${getTodayString()}

| Odat turi | Uzluksiz kunlar (Streak) | Oxirgi bajarilgan sana | Holat |
|---|---|---|---|
| 🏋️‍♂️ Tongi Sport | **${data.sport.count} kun** | ${data.sport.lastDate || 'Hali yo\'q'} | ${data.sport.lastDate === getTodayString() ? '✅ Bugun bajarildi' : '⏳ Kutilmoqda'} |
| 📚 Kitob Mutolaasi | **${data.reading.count} kun** | ${data.reading.lastDate || 'Hali yo\'q'} | ${data.reading.lastDate === getTodayString() ? '✅ Bugun bajarildi' : '⏳ Kutilmoqda'} |
| 🇬🇧 Ingliz Tili | **${data.english.count} kun** | ${data.english.lastDate || 'Hali yo\'q'} | ${data.english.lastDate === getTodayString() ? '✅ Bugun bajarildi' : '⏳ Kutilmoqda'} |
| 💻 Deep Work (IT) | **${data.deepwork.count} kun** | ${data.deepwork.lastDate || 'Hali yo\'q'} | ${data.deepwork.lastDate === getTodayString() ? '✅ Bugun bajarildi' : '⏳ Kutilmoqda'} |

> *"Zanjirni uzma! Har bir o'tgan kun sizni chempion qiladi."*
`;
    fs.writeFileSync(mdFile, mdContent, 'utf8');
  } catch (err) {
    console.warn('Obsidian habit streak sync error:', err.message);
  }
}

function updateHabitStreak(habitKey) {
  const data = loadStreaks();
  if (!data[habitKey]) data[habitKey] = { count: 0, lastDate: null };

  const today = getTodayString();
  const yesterday = getYesterdayString();
  const habit = data[habitKey];

  if (habit.lastDate === today) {
    return { count: habit.count, isNew: false };
  }

  if (habit.lastDate === yesterday) {
    habit.count += 1;
  } else {
    habit.count = 1;
  }
  habit.lastDate = today;

  saveStreaks(data);
  return { count: habit.count, isNew: true };
}

function getStreakSummary() {
  const data = loadStreaks();
  const today = getTodayString();

  return `🔥 Odatlar Zanjiri (Streaks)

💪 Sport: ${data.sport.count} kun ${data.sport.lastDate === today ? '✅' : '⏳'}
📖 Kitob: ${data.reading.count} kun ${data.reading.lastDate === today ? '✅' : '⏳'}
🇬🇧 Ingliz tili: ${data.english.count} kun ${data.english.lastDate === today ? '✅' : '⏳'}
💻 Deep Work: ${data.deepwork.count} kun ${data.deepwork.lastDate === today ? '✅' : '⏳'}

Zanjirni uzmang, chempion! 🦁`;
}

module.exports = {
  updateHabitStreak,
  getStreakSummary,
};
