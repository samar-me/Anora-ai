const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'telegram_user_config.json');

function loadConfig() {
  const defaultConfig = {
    busyModeEnabled: true,
    channelUsername: '@samar_tech', // Default channel or configurable
    autoReplyTemplate: "Assalomu alaykum! Samar hozir darsda (soat {END_TIME} gacha). Shoshilinch bo'lsa, xabar qoldiring, darsdan chiqishi bilan o'qib javob beradi. 🦁",
    customStatus: "Darsda (Offline)",
  };

  if (!fs.existsSync(CONFIG_FILE)) return defaultConfig;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (_) {
    return defaultConfig;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

function getCurrentBusyStatus() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hours * 60 + minutes;

  if (day === 0) {
    return { isBusy: false, reason: 'Dam olish kuni' };
  }

  // School check
  const schoolStart = 8 * 60; // 08:00
  const isLongSchool = day === 1 || day === 2;
  const schoolEnd = isLongSchool ? 12 * 60 + 50 : 12 * 60 + 5; // 12:50 or 12:05
  const schoolEndStr = isLongSchool ? '12:50' : '12:05';

  if (currentTimeVal >= schoolStart && currentTimeVal <= schoolEnd) {
    return { isBusy: true, activity: 'Maktabda', endTime: schoolEndStr };
  }

  // Academy check (Mon, Wed, Fri)
  const isAcademyDay = day === 1 || day === 3 || day === 5;
  if (isAcademyDay) {
    // Tech Bridge 14:00 - 16:00
    if (currentTimeVal >= 13 * 60 + 20 && currentTimeVal <= 16 * 60 + 40) {
      return { isBusy: true, activity: 'TECH BRIDGE Academy darsida', endTime: '16:00' };
    }
    // Zamin 18:00 - 19:30
    if (currentTimeVal >= 17 * 60 + 30 && currentTimeVal <= 19 * 60 + 30) {
      return { isBusy: true, activity: 'Zamin o\'quv markazida dars bermoqda (Ustoz)', endTime: '19:30' };
    }
  }

  return { isBusy: false, activity: 'Bo\'sh vaqt' };
}

function getAutoReplyMessage() {
  const cfg = loadConfig();
  const status = getCurrentBusyStatus();

  if (!cfg.busyModeEnabled || !status.isBusy) {
    return null;
  }

  return `Assalomu alaykum! Samar hozir ${status.activity} (soat ${status.endTime} gacha band). Shoshilinch bo'lsa, xabar qoldiring, darsdan chiqishi bilan darhol javob beradi. 🦁`;
}

function toggleBusyMode(enabled) {
  const cfg = loadConfig();
  cfg.busyModeEnabled = enabled;
  saveConfig(cfg);
  return cfg.busyModeEnabled;
}

function setChannel(channelUsername) {
  const cfg = loadConfig();
  cfg.channelUsername = channelUsername;
  saveConfig(cfg);
  return cfg.channelUsername;
}

function getTelegramManagerSummary() {
  const cfg = loadConfig();
  const status = getCurrentBusyStatus();

  let text = `📱 **TELEGRAM SHAXSIY AKKAUNT BOSHQARUVI** ⚡\n\n`;
  text += `⚙️ **Dars rejimi (Auto-Reply):** ${cfg.busyModeEnabled ? '✅ FAOL' : '❌ O\'CHIRILGAN'}\n`;
  text += `📍 **Hozirgi holat:** ${status.isBusy ? `🔴 BAND (${status.activity}, soat ${status.endTime} gacha)` : '🟢 BO\'SH'}\n`;
  text += `📢 **Bog'langan kanal:** ${cfg.channelUsername || 'Kiritilmagan'}\n\n`;
  text += `💬 **Avto-javob matni namunalari:**\n_${getAutoReplyMessage() || 'Hozir dars vaqti emas, avto-javob o\'chirilgan.'}_\n\n`;
  text += `Buyruqlar:\n• \`/tg_dars on\` yoki \`/tg_dars off\` — dars rejimini yoqish/o'chirish\n• \`/tg_kanal @kanal_nomi\` — kanalingizni ulash\n• \`/tg_post <matn>\` — kanalga to'g'ridan-to'g'ri post joylash`;

  return text;
}

module.exports = {
  loadConfig,
  saveConfig,
  getCurrentBusyStatus,
  getAutoReplyMessage,
  toggleBusyMode,
  setChannel,
  getTelegramManagerSummary,
};
