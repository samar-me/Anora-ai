const obsidian = require('./obsidian');

// Active timers and alarms in memory
const activeTimers = [];

function getMsUntilTime(timeStr) {
  // Matches "22:00", "07:30", "18:00", etc.
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const targetHour = parseInt(match[1], 10);
  const targetMin = parseInt(match[2], 10);

  const now = new Date();
  const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
  const tDate = new Date(tashkentStr);

  const tNowHour = tDate.getHours();
  const tNowMin = tDate.getMinutes();
  const tNowSec = tDate.getSeconds();

  let diffMinutes = (targetHour * 60 + targetMin) - (tNowHour * 60 + tNowMin);
  if (diffMinutes <= 0) {
    // If time already passed today, set for tomorrow
    diffMinutes += 24 * 60;
  }
  const diffMs = (diffMinutes * 60 - tNowSec) * 1000;
  return Math.max(diffMs, 1000);
}

function parseTimerText(text) {
  // 1. Exact clock time e.g. "Soat 22:00 da uxlash", "18:00 ga eslatma", "22:00 da uxlashimni eslat"
  const exactMatch = text.match(/(?:soat\s*)?(\d{1,2}:\d{2})\s*(?:da|ga|uchun)?\s*(.*)/i);
  if (exactMatch && (text.includes('eslat') || text.includes('budilnik') || text.includes('uxlash') || text.includes(':'))) {
    const timeStr = exactMatch[1];
    const rawNote = exactMatch[2]
      ? exactMatch[2].replace(/ni eslat|eslat|budilnik qo'y|budilnik qoy|budilnik/gi, '').trim()
      : 'Eslatma vaqti bo\'ldi!';
    const ms = getMsUntilTime(timeStr);
    if (ms) {
      return {
        type: 'exact',
        timeStr,
        durationMs: ms,
        note: rawNote || 'Eslatma',
      };
    }
  }

  // 2. Relative minutes e.g. "20 daqiqadan keyin", "10 minutga"
  const minMatch = text.match(/(\d+)\s*(?:daqiqa|minut|min)(?:dan keyin|ga|dan so'ng|dan|da)?\s*(.*)/i);
  if (minMatch && (text.includes('taymer') || text.includes('eslat') || text.includes('keyin') || text.includes('so\'ng') || text.includes('ga'))) {
    const rawNote = minMatch[2]
      ? minMatch[2].replace(/ni eslat|eslat|taymer qo'y|taymer qoy|taymer|uchun/gi, '').trim()
      : '';
    return {
      type: 'relative',
      durationMinutes: parseInt(minMatch[1], 10),
      durationMs: parseInt(minMatch[1], 10) * 60 * 1000,
      note: rawNote || 'Eslatma vaqti bo\'ldi!',
    };
  }

  // 3. Relative hours e.g. "1 soatga", "2 soatdan keyin"
  const hourMatch = text.match(/(\d+)\s*soat(?:dan keyin|ga|dan so'ng|dan|da)?\s*(.*)/i);
  if (hourMatch && (text.includes('taymer') || text.includes('eslat') || text.includes('keyin') || text.includes('so\'ng') || text.includes('ga'))) {
    const rawNote = hourMatch[2]
      ? hourMatch[2].replace(/ni eslat|eslat|taymer qo'y|taymer qoy|taymer|uchun/gi, '').trim()
      : '';
    return {
      type: 'relative',
      durationMinutes: parseInt(hourMatch[1], 10) * 60,
      durationMs: parseInt(hourMatch[1], 10) * 60 * 60 * 1000,
      note: rawNote || 'Eslatma vaqti bo\'ldi!',
    };
  }

  return null;
}

function startTimer(bot, chatId, durationMs, note, label = '') {
  const timerId = setTimeout(async () => {
    try {
      await bot.api.sendMessage(chatId, `⏰ **ESLATMA VAQTI BO'LDI!**\n\n📌 ${note || 'Rejangizni unutmang!'}`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      console.error('Timer trigger error:', err.message);
    }
  }, durationMs);

  activeTimers.push({ timerId, note, label, finishTime: Date.now() + durationMs });
  return timerId;
}

function scheduleReminder(bot, chatId, timeOrDuration, note = 'Eslatma') {
  // Check if exact clock time: "22:00"
  if (/^\d{1,2}:\d{2}$/.test(timeOrDuration.trim())) {
    const ms = getMsUntilTime(timeOrDuration.trim());
    if (ms) {
      startTimer(bot, chatId, ms, note, timeOrDuration);
      obsidian.addTask({ title: note, time: timeOrDuration });
      return { success: true, type: 'exact', time: timeOrDuration, note };
    }
  }

  // Check if minutes
  const numMatch = timeOrDuration.match(/(\d+)/);
  if (numMatch) {
    let minutes = parseInt(numMatch[1], 10);
    if (timeOrDuration.includes('soat')) minutes *= 60;
    const ms = minutes * 60 * 1000;
    startTimer(bot, chatId, ms, note);
    return { success: true, type: 'relative', minutes, note };
  }

  return { success: false, message: 'Vaqtni aniqlab bo\'lmadi.' };
}

module.exports = {
  parseTimerText,
  startTimer,
  scheduleReminder,
  getMsUntilTime,
};
