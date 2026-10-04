const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'water_data.json');
const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Habits', 'Suv_Balansi.md');

const DAILY_TARGET_GLASSES = 8;
const GLASS_ML = 250; // 1 stakan = 250ml
const DAILY_TARGET_ML = DAILY_TARGET_GLASSES * GLASS_ML; // 2000ml = 2 Litr

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadData() {
  const today = getTodayString();
  const defaultData = {
    date: today,
    glasses: 0,
    totalMl: 0,
    history: [],
    streak: 0,
  };

  if (!fs.existsSync(DATA_FILE)) {
    return defaultData;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (raw.date !== today) {
      const yesterdayTargetMet = raw.glasses >= DAILY_TARGET_GLASSES;
      return {
        date: today,
        glasses: 0,
        totalMl: 0,
        history: [],
        streak: yesterdayTargetMet ? (raw.streak || 0) + 1 : (raw.streak || 0),
      };
    }
    return raw;
  } catch (_) {
    return defaultData;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  syncToObsidian(data);
}

function syncToObsidian(data) {
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const percent = Math.min(100, Math.round((data.totalMl / DAILY_TARGET_ML) * 100));
    const content = `# 💧 Suv va Jismoniy Tetiklik Nazorati (Water Tracker)

Oxirgi yangilanish: ${data.date} (Bugun)
Kunlik me'yor: **${DAILY_TARGET_GLASSES} stakan** (${DAILY_TARGET_ML} ml / 2 Litr)
Joriy ko'rsatkich: **${data.glasses} stakan** (${data.totalMl} ml) — **${percent}%**
Uzluksiz me'yor bajarilgan kunlar (Streak): **${data.streak} kun** 🏆

---

## 📊 Bugungi ichilgan suvlar jurnali:
${data.history.length === 0 ? '_Bugun hali suv qayd etilmagan._' : data.history.map((h) => `- **${h.time}** — ${h.glasses} stakan (${h.ml} ml)`).join('\n')}

---
> 💡 *Eslatma: Inson miyasining 75% qismi suvdan iborat. Suv yetishmovchiligi diqqatni 20% ga pasaytiradi.*
`;

    fs.writeFileSync(OBSIDIAN_FILE, content, 'utf8');
  } catch (err) {
    console.error('Suv Obsidian sync xatosi:', err.message);
  }
}

function addWater(glasses = 1) {
  const data = loadData();
  const addedMl = glasses * GLASS_ML;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  data.glasses += glasses;
  data.totalMl += addedMl;
  data.history.push({
    time: timeStr,
    glasses,
    ml: addedMl,
  });

  saveData(data);
  return {
    glasses: data.glasses,
    totalMl: data.totalMl,
    targetGlasses: DAILY_TARGET_GLASSES,
    targetMl: DAILY_TARGET_ML,
    percent: Math.min(100, Math.round((data.totalMl / DAILY_TARGET_ML) * 100)),
    completedNow: data.glasses >= DAILY_TARGET_GLASSES,
    streak: data.streak,
  };
}

function getWaterSummary() {
  const data = loadData();
  const percent = Math.min(100, Math.round((data.totalMl / DAILY_TARGET_ML) * 100));

  // Visual glass bar
  let glassesIcons = '';
  for (let i = 1; i <= DAILY_TARGET_GLASSES; i++) {
    glassesIcons += i <= data.glasses ? '🥛' : '⬜';
  }

  let text = `💧 **SUV VA JISMONIY TETIKLIK NAZORATI**\n\n`;
  text += `Bugungi me'yor: **${data.glasses} / ${DAILY_TARGET_GLASSES} stakan** (${data.totalMl} / ${DAILY_TARGET_ML} ml)\n`;
  text += `Vizual ko'rsatkich: [${glassesIcons}] **${percent}%**\n\n`;

  if (data.glasses >= DAILY_TARGET_GLASSES) {
    text += `🌟 **Ajoyib, Samar! Kunlik me'yor (2 Litr) 100% to'ldi!** Miyangiz va tanangiz eng yuqori quvvatda ishlamoqda. 🦁`;
  } else {
    const left = DAILY_TARGET_GLASSES - data.glasses;
    text += `🎯 Me'yorgacha yana **${left} stakan** (${left * GLASS_ML} ml) qoldi.\n`;
    text += `_Har safar suv ichganingizda «suv ichdim» deb yozing yoki pastdagi tugmani bosing._ 👇`;
  }

  return text;
}

module.exports = {
  addWater,
  getWaterSummary,
  loadData,
  DAILY_TARGET_GLASSES,
  DAILY_TARGET_ML,
};
