const fs = require('fs');
const path = require('path');
const { InlineKeyboard } = require('grammy');
const tts = require('./tts');
const obsidian = require('./obsidian');

const EVENTS_FILE = path.join(__dirname, 'events_data.json');

function loadEvents() {
  if (fs.existsSync(EVENTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    } catch (_) {}
  }
  return [];
}

function saveEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');

  // Sync to Obsidian Vault
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
    const plansDir = path.join(vaultPath, 'Plans');
    if (!fs.existsSync(plansDir)) fs.mkdirSync(plansDir, { recursive: true });
    const mdFile = path.join(plansDir, 'Muhim_Tadbirlar.md');

    let rows = '';
    for (const ev of events) {
      const statusIcon = ev.acknowledged ? '✅ Tasdiqlangan' : (ev.status === 'completed' ? '🏁 Tugagan' : '⏳ Kutilmoqda');
      rows += `| **${ev.title}** | ${ev.location || '-'} | ${ev.dateTimeStr} | ${ev.importance} | ${statusIcon} |\n`;
    }

    const md = `# 🎯 Muhim Tadbirlar va Maxsus Voqealar

Oxirgi yangilanish: ${obsidian.getTodayString()}

| Tadbir Nomi | Joylashuvi | Sana va Vaqt | Muhimlik | Holat |
|---|---|---|---|---|
${rows || '| Hozircha muhim tadbirlar yo\'q | - | - | - | - |\n'}
`;
    fs.writeFileSync(mdFile, md, 'utf8');
  } catch (err) {
    console.warn('Obsidian events sync error:', err.message);
  }
}

/**
 * Register a new mission-critical event
 */
function addCriticalEvent({
  title,
  location = '',
  dateTime, // Date object or ISO string (Asia/Tashkent)
  dateTimeStr = '',
  notes = '',
}) {
  const events = loadEvents();
  const id = 'evt_' + Date.now();

  const targetDate = new Date(dateTime);

  const event = {
    id,
    title,
    location,
    targetTimestamp: targetDate.getTime(),
    dateTimeStr: dateTimeStr || targetDate.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
    notes,
    importance: 'critical',
    status: 'upcoming',
    acknowledged: false,
    createdAt: new Date().toISOString(),
    notified: {
      dayBefore: false,
      morningOf: false,
      twoHoursBefore: false,
      oneHourBefore: false,
      urgentEscalation: false,
    },
  };

  events.push(event);
  saveEvents(events);
  return event;
}

/**
 * Acknowledge an event
 */
function acknowledgeEvent(eventId) {
  const events = loadEvents();
  const ev = events.find(e => e.id === eventId);
  if (!ev) return null;

  ev.acknowledged = true;
  saveEvents(events);
  return ev;
}

/**
 * Intelligent Countdown Checker (Runs every minute)
 */
async function checkEventCountdowns(bot, chatId) {
  if (!chatId) return;
  const events = loadEvents();
  const now = Date.now();
  let changed = false;

  for (const ev of events) {
    if (ev.status !== 'upcoming') continue;

    const diffMs = ev.targetTimestamp - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    // If event has passed by more than 3 hours, mark as completed
    if (diffMs < -3 * 60 * 60 * 1000) {
      ev.status = 'completed';
      changed = true;
      continue;
    }

    // 1. T-24 Soat (Bir kun oldin: 22 - 26 soat qolganda)
    if (diffHours <= 26 && diffHours >= 22 && !ev.notified.dayBefore) {
      ev.notified.dayBefore = true;
      changed = true;

      const msg = `🗓️ **ERTAGA O'TA MUHIM TADBIR!**\n\n🎯 **«${ev.title}»**\n📍 Joylashuv: ${ev.location || 'Belgilangan joy'}\n⏰ Vaqt: **${ev.dateTimeStr}**\n\n_Ertaga kechikmaslik va chalg'imaslik uchun barcha kiyim, narsalaringiz va yo'l rejangizni bugun kechqurun tayyorlab qo'ying, Samar!_`;

      try {
        await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch (e) {
        console.error('Event T-24 notification error:', e.message);
      }
    }

    // 2. Tadbir kuni ertalab (agar tadbir bugun bo'lsa va 3 soatdan ko'p vaqt bo'lsa)
    const tashkentNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const tHour = new Date(tashkentNow).getHours();
    if (diffHours <= 16 && diffHours >= 3 && tHour >= 7 && tHour <= 9 && !ev.notified.morningOf) {
      ev.notified.morningOf = true;
      changed = true;

      const msg = `🌅 **BUGUN MUHIM TADBIR KUNI!**\n\n🎯 **«${ev.title}»**\n📍 Joy: ${ev.location || 'Belgilangan manzil'}\n⏰ Soat: **${ev.dateTimeStr}**\n\n_Bugungi eng asosiy voqea shu! Tayyorgarlikni ko'rib, tetik holda yo'lga chiqing, Samar!_`;

      try {
        await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch (e) {
        console.error('Event morning notification error:', e.message);
      }
    }

    // 3. T-2 Soat (110 - 130 daqiqa qolganda)
    if (diffMinutes <= 130 && diffMinutes >= 110 && !ev.notified.twoHoursBefore) {
      ev.notified.twoHoursBefore = true;
      changed = true;

      const kb = new InlineKeyboard().text('✅ Tayyorman, ketyapman', `event_ack_${ev.id}`);

      const msg = `⏳ **TADBIRGA 2 SOAT QOLDI!**\n\n🎯 **«${ev.title}»**\n📍 Joy: ${ev.location || '-'}\n⏰ Boshlanish vaqti: **${ev.dateTimeStr}**\n\n🚗 Yo'l va tirbandlikni hisobga olib, sekin hozirlik ko'ring, Samar!`;

      try {
        await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: kb });
      } catch (e) {
        console.error('Event T-2h error:', e.message);
      }
    }

    // 4. T-1 Soat (50 - 70 daqiqa qolganda)
    if (diffMinutes <= 70 && diffMinutes >= 50 && !ev.notified.oneHourBefore) {
      ev.notified.oneHourBefore = true;
      changed = true;

      const kb = new InlineKeyboard().text('✅ Yo\'ldaman / Joyidaman', `event_ack_${ev.id}`);

      const msg = `⏱️ **DIQQAT: TADBIRGA 1 SOAT QOLDI!**\n\n🎯 **«${ev.title}»**\n📍 ${ev.location || ''}\n\n_Borishni unutmadingizmi, Samar? Hozir yo'lga chiqish ayni vaqti!_`;

      try {
        const sent = await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: kb });

        // 5. CRITICAL ESCALATION: Agar Samar shu paytgacha umuman tasdiqlamagan bo'lsa
        if (!ev.acknowledged && !ev.notified.urgentEscalation) {
          ev.notified.urgentEscalation = true;

          // Pin the message loudly in chat
          try {
            await bot.api.pinChatMessage(chatId, sent.message_id, { disable_notification: false });
          } catch (_) {}

          // Send direct loud voice call audio
          const voiceFile = await tts.textToVoice(
            `Samar, diqqat! «${ev.title}» tadbiri boshlanishiga 1 soat qoldi! Iltimos, zudlik bilan yo'lga chiqing, kechikmaslik kerak!`,
            'uz'
          );
          if (voiceFile) {
            await bot.api.sendVoice(chatId, voiceFile);
          }
        }
      } catch (e) {
        console.error('Event T-1h error:', e.message);
      }
    }
  }

  if (changed) {
    saveEvents(events);
  }
}

/**
 * Summary of all registered critical events
 */
function getEventsSummary() {
  const events = loadEvents();
  const upcoming = events.filter(e => e.status === 'upcoming');
  if (upcoming.length === 0) {
    return '🎯 Hozircha rejalashtirilgan o\'ta muhim tadbirlar yo\'q.\nMenga masalan: *"Keyingi yakshanba Qarshi IT Parkdagi tadbirni belgilab qo\'y"* deb aytsangiz, aniq zanjir bo\'yicha eslatib boraman!';
  }

  let text = '🎯 **O\'ta Muhim Tadbirlar va Voqealar Rejasi:**\n\n';
  for (const ev of upcoming) {
    const ack = ev.acknowledged ? ' (✅ Tasdiqlangan)' : ' (⏳ Kutilmoqda)';
    text += `• **${ev.title}**${ack}\n  📍 Joy: ${ev.location || 'Ko\'rsatilmagan'}\n  ⏰ Vaqt: ${ev.dateTimeStr}\n\n`;
  }
  return text.trim();
}

module.exports = {
  loadEvents,
  saveEvents,
  addCriticalEvent,
  acknowledgeEvent,
  checkEventCountdowns,
  getEventsSummary,
};
