const fs = require('fs');
const path = require('path');
const rpg = require('./rpg');

const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Habits', 'Deep_Work_Log.md');
const activeSessions = {};

function startFocusSession(bot, chatId, minutes = 45, goal = 'Dasturlash va chuqur ish') {
  if (activeSessions[chatId]) {
    clearTimeout(activeSessions[chatId].timer);
  }

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);
  const timeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

  const timer = setTimeout(async () => {
    delete activeSessions[chatId];
    const xpRes = rpg.addXp('discipline', 70, `${minutes} daqiqa Deep Work sprinti`);

    let msg = `⏰ **DEEP WORK VAQTI TUGADI!** 🎯\n\n`;
    msg += `Ajoyib, Samar! Siz **${minutes} daqiqa** davomida «${goal}» ustida 100% konsentratsiya bilan ishladingiz.\n\n`;
    msg += `❓ **Sarhisob savoli:**\nNimalarni bajardingiz? Git commit qildikmi?\n\n`;
    msg += `🎮 **+70 XP qo'shildi (Intizom 🎯)!**\n`;
    if (xpRes.leveledUp) {
      msg += `🌟 **LEVEL UP! Yangi daraja: Level ${xpRes.newLevel}!** 👑\n`;
    }

    try {
      await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    } catch (_) {}

    logToObsidian(minutes, goal, 'Muvaffaqiyatli yakunlandi');
  }, minutes * 60 * 1000);

  activeSessions[chatId] = {
    startTime,
    endTime,
    minutes,
    goal,
    timer,
  };

  return {
    minutes,
    goal,
    endTimeStr: timeStr,
  };
}

function stopFocusSession(chatId) {
  if (activeSessions[chatId]) {
    clearTimeout(activeSessions[chatId].timer);
    delete activeSessions[chatId];
    return true;
  }
  return false;
}

function getActiveSession(chatId) {
  if (!activeSessions[chatId]) return null;
  const now = new Date();
  const leftMs = activeSessions[chatId].endTime.getTime() - now.getTime();
  const leftMins = Math.max(0, Math.ceil(leftMs / 60000));
  return {
    ...activeSessions[chatId],
    leftMinutes: leftMins,
  };
}

function logToObsidian(minutes, goal, result) {
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (!fs.existsSync(OBSIDIAN_FILE)) {
      const header = `# ⚡ Deep Work & Kiber-Konsentratsiya Jurnali\n\nUshbu fayl Samarbekning chalg'imasdan kod yozish va chuqur ishlash (Deep Work) mashg'ulotlarini qayd etadi.\n\n---\n\n`;
      fs.writeFileSync(OBSIDIAN_FILE, header, 'utf8');
    }

    const entry = `- **${dateStr}** — **${minutes} daqiqa** | Maqsad: _${goal}_ | Holat: _${result}_\n`;
    fs.appendFileSync(OBSIDIAN_FILE, entry, 'utf8');
  } catch (err) {
    console.error('Deep work Obsidian log error:', err.message);
  }
}

module.exports = {
  startFocusSession,
  stopFocusSession,
  getActiveSession,
};
