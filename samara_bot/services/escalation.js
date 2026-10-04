const fs = require('fs');
const path = require('path');
const { InlineKeyboard, InputFile } = require('grammy');
const tts = require('./tts');
const rpg = require('./rpg');
const obsidian = require('./obsidian');

const ESCALATION_FILE = path.join(__dirname, 'escalation_tasks.json');

function loadTasks() {
  if (fs.existsSync(ESCALATION_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ESCALATION_FILE, 'utf8'));
    } catch (_) {}
  }
  return [];
}

function saveTasks(tasks) {
  fs.writeFileSync(ESCALATION_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

/**
 * Creates and triggers a new Multi-Level Escalation Task
 */
async function createEscalationTask(bot, chatId, {
  title,
  description = '',
  priority = 'normal', // 'normal' | 'high' | 'critical'
  category = 'general', // 'school' | 'academy' | 'water' | 'reading' | 'workout' | 'task'
}) {
  const tasks = loadTasks();
  const id = 'esc_' + Date.now();
  const now = Date.now();

  const level1Minutes = priority === 'critical' ? 10 : (priority === 'high' ? 15 : 20);

  const task = {
    id,
    chatId,
    title,
    description: description || title,
    priority,
    category,
    createdAt: new Date().toISOString(),
    status: 'pending', // 'pending' | 'resolved' | 'snoozed' | 'rescheduled' | 'excused'
    currentLevel: 1,
    messageIds: [],
    pinnedMessageId: null,
    lastAlertAt: now,
    nextEscalationAt: now + level1Minutes * 60 * 1000,
    needsRescue: false,
    history: [{ level: 1, time: new Date().toISOString() }],
  };

  // Keyboard for Level 1
  const kb = new InlineKeyboard()
    .text('✅ Bajarildi', `esc_done_${id}`)
    .text('⏰ +20 daqiqa', `esc_snooze_${id}`)
    .row()
    .text('🔄 Ertaga ko\'chirish', `esc_tomorrow_${id}`);

  let icon = '📌';
  if (category === 'water') icon = '💧';
  else if (category === 'academy') icon = '🚗';
  else if (category === 'school') icon = '🏫';
  else if (category === 'workout') icon = '🏋️';
  else if (category === 'reading') icon = '📚';

  const text = `${icon} **ESLATMA (Level 1):**\n\n🎯 **«${title}»**\n${description ? `_${description}_\n\n` : '\n'}Iltimos, vazifani bajargach tasdiqlang:`;

  try {
    const sent = await bot.api.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
    task.messageIds.push(sent.message_id);
  } catch (err) {
    console.error('Level 1 escalation send error:', err.message);
  }

  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Checks all active pending tasks and escalates if unanswered
 */
async function checkAndEscalate(bot) {
  const tasks = loadTasks();
  const now = Date.now();
  let changed = false;

  for (const task of tasks) {
    if (task.status !== 'pending') continue;

    if (now >= task.nextEscalationAt) {
      if (task.currentLevel === 1) {
        // ── LEVEL 2: Pinned Alert + Voice Note ──
        task.currentLevel = 2;
        task.lastAlertAt = now;
        task.nextEscalationAt = now + 25 * 60 * 1000; // Next escalation in 25 min
        task.history.push({ level: 2, time: new Date().toISOString() });
        changed = true;

        const kb = new InlineKeyboard()
          .text('✅ Bajarildi', `esc_done_${task.id}`)
          .text('⏰ +15 daqiqa', `esc_snooze_${task.id}`)
          .row()
          .text('🔄 Ertaga ko\'chirish', `esc_tomorrow_${task.id}`);

        const alertText = `📌 **OGOHLANTIRISH (Level 2 — Pinned Alert):**\n\n⚡ **«${task.title}»** vazifasi 20 daqiqadan beri kutilmoqda, Samar!\n\nIltimos, e'tibor bering — vaqt o'tmoqda!`;

        try {
          const sent = await bot.api.sendMessage(task.chatId, alertText, {
            parse_mode: 'Markdown',
            reply_markup: kb,
          });
          task.messageIds.push(sent.message_id);

          // Pin the message in Telegram chat (causes loud pin notification)
          try {
            await bot.api.pinChatMessage(task.chatId, sent.message_id, {
              disable_notification: false,
            });
            task.pinnedMessageId = sent.message_id;
          } catch (pinErr) {
            console.warn('Pin error:', pinErr.message);
          }

          // Generate spoken alert in Uzbek (Madina voice)
          const voiceFile = await tts.textToVoice(
            `Samar, diqqat! «${task.title}» vazifasi hali tasdiqlanmadi. Iltimos, e'tibor bering!`,
            'uz'
          );
          if (voiceFile) {
            await bot.api.sendVoice(task.chatId, voiceFile);
          }
        } catch (e) {
          console.error('Level 2 alert error:', e.message);
        }
      } else if (task.currentLevel === 2) {
        // ── LEVEL 3: Urgent Siren & Rescue Dashboard ──
        task.currentLevel = 3;
        task.needsRescue = true;
        task.lastAlertAt = now;
        task.nextEscalationAt = now + 60 * 60 * 1000;
        task.history.push({ level: 3, time: new Date().toISOString() });
        changed = true;

        const kb = new InlineKeyboard()
          .text('⚡ Hoziroq bajardim', `esc_done_${task.id}`)
          .row()
          .text('🔄 Kechga / Ertaga o\'tkazish', `esc_tomorrow_${task.id}`)
          .row()
          .text('🛡️ Streak Shield (Uzrli sabab)', `esc_shield_${task.id}`);

        const alertText = `🚨🚨 **FAVQULODDA ESKALATSIYA (Level 3 — Siren Alert)!** 🚨🚨\n\n⚠️ **«${task.title}»** vazifasi 45 daqiqadan buyon javobsiz qolmoqda, Samar!\n\n_Vazifa shunchaki o'chib ketmasligi va intizom buzilmasligi uchun quyidagilardan birini tanlang:_`;

        try {
          const sent = await bot.api.sendMessage(task.chatId, alertText, {
            parse_mode: 'Markdown',
            reply_markup: kb,
          });
          task.messageIds.push(sent.message_id);

          // Voice siren
          const voiceFile = await tts.textToVoice(
            `Samar, favqulodda ogohlantirish! «${task.title}» vazifasi 45 daqiqadan beri javobsiz qoldi. Iltimos, Telegramga kiring va tanlovni bosing!`,
            'uz'
          );
          if (voiceFile) {
            await bot.api.sendVoice(task.chatId, voiceFile);
          }
        } catch (e) {
          console.error('Level 3 alert error:', e.message);
        }
      }
    }
  }

  if (changed) {
    saveTasks(tasks);
  }
}

/**
 * Resolve task when user clicks Done
 */
async function resolveTask(bot, taskId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { success: false, message: 'Vazifa topilmadi.' };

  task.status = 'resolved';
  task.resolvedAt = new Date().toISOString();
  saveTasks(tasks);

  // Unpin messages if pinned
  if (task.pinnedMessageId) {
    try {
      await bot.api.unpinChatMessage(task.chatId, task.pinnedMessageId);
    } catch (_) {}
  }

  // Award RPG XP
  rpg.addXp('discipline', 25, `Eskalatsiya vazifasi bajarildi: ${task.title.slice(0, 30)}`);

  return {
    success: true,
    message: `🎉 **«${task.title}»** muvaffaqiyatli bajarildi va tasdiqlandi, Samar! Intizom uchun **+25 XP** qo'shildi! 🦁`,
  };
}

/**
 * Snooze task by minutes
 */
async function snoozeTask(bot, taskId, minutes = 20) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { success: false, message: 'Vazifa topilmadi.' };

  task.nextEscalationAt = Date.now() + minutes * 60 * 1000;
  saveTasks(tasks);

  return {
    success: true,
    message: `⏰ Tushundim, Samar! **«${task.title}»** vazifasini yana **${minutes} daqiqadan keyin** eslataman.`,
  };
}

/**
 * Reschedule task to tomorrow
 */
async function rescheduleTask(bot, taskId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { success: false, message: 'Vazifa topilmadi.' };

  task.status = 'rescheduled';
  task.rescheduledAt = new Date().toISOString();
  saveTasks(tasks);

  if (task.pinnedMessageId) {
    try {
      await bot.api.unpinChatMessage(task.chatId, task.pinnedMessageId);
    } catch (_) {}
  }

  // Log to Obsidian tasks for tomorrow
  obsidian.addTask({
    title: `[Ertaga ko'chirildi] ${task.title}`,
    time: '14:00',
  });

  return {
    success: true,
    message: `🔄 **«${task.title}»** ertangi kunga ko'chirildi va Obsidian rejangizga qo'shildi, Samar! Bugun xotirjam bo'ling. 🤝`,
  };
}

/**
 * Excuses task using Streak Shield without penalty
 */
async function shieldTask(bot, taskId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { success: false, message: 'Vazifa topilmadi.' };

  task.status = 'excused';
  task.excusedAt = new Date().toISOString();
  saveTasks(tasks);

  if (task.pinnedMessageId) {
    try {
      await bot.api.unpinChatMessage(task.chatId, task.pinnedMessageId);
    } catch (_) {}
  }

  return {
    success: true,
    message: `🛡️ **Streak Shield faollashdi!**\n\n«${task.title}» uzrli sabab bilan qoldirildi deb belgilandi. Odatlar zanjiringiz (streak) buzilmadi. O'zingizni ehtiyot qiling, Samar! 🌟`,
  };
}

/**
 * Get pending tasks that require nighttime rescue
 */
function getPendingRescueTasks() {
  const tasks = loadTasks();
  return tasks.filter(t => t.status === 'pending' || t.needsRescue);
}

/**
 * Nighttime Rescue Dashboard summary
 */
function getRescueDashboard() {
  const pending = getPendingRescueTasks();
  if (pending.length === 0) {
    return {
      hasPending: false,
      text: '🌙 **Bugungi barcha vazifalar to\'liq yakunlangan!** Hech qanday qarzdorlik yoki kechikkan ishlar yo\'q. Maroqli hordiq tilayman, Samar!',
    };
  }

  let text = `🌙 **KECHKI QUTQARUV VA SARHISOB (Rescue Mode):**\n\nBugun e'tibordan chetda qolgan **${pending.length} ta** vazifa bor:\n\n`;
  for (let i = 0; i < pending.length; i++) {
    const t = pending[i];
    text += `${i + 1}. **${t.title}** (Daraja: Level ${t.currentLevel})\n`;
  }
  text += `\n_Hech narsa yo'qolib ketmasligi uchun bularni hozir bir urinishda ertaga ko'chirishingiz yoki bajardim deb belgilashingiz mumkin!_`;

  return {
    hasPending: true,
    count: pending.length,
    text,
    tasks: pending,
  };
}

module.exports = {
  createEscalationTask,
  checkAndEscalate,
  resolveTask,
  snoozeTask,
  rescheduleTask,
  shieldTask,
  getPendingRescueTasks,
  getRescueDashboard,
  loadTasks,
};
