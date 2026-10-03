const { Bot, Keyboard, InlineKeyboard, InputFile } = require('grammy');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const ai = require('./services/ai');
const obsidian = require('./services/obsidian');
const streak = require('./services/streak');
const media = require('./services/media');
const debts = require('./services/debts');
const crm = require('./services/crm');
const weather = require('./services/weather');
const charts = require('./services/charts');
const webSummary = require('./services/web_summary');
const timer = require('./services/timer');
const profile = require('./services/profile');
const books = require('./services/books');
const tts = require('./services/tts');
const review = require('./services/review');
const english = require('./services/english');
const coder = require('./services/coder');
const backup = require('./services/backup');

require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('XATOLIK: TELEGRAM_BOT_TOKEN yo\'q!');
  process.exit(1);
}

const bot = new Bot(token);

// State management for interactive flows
const userStates = {};

// Save User Chat ID
const CONFIG_FILE = path.join(__dirname, 'user_config.json');

function saveChatId(chatId) {
  let cfg = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try { cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (_) {}
  }
  cfg.chatId = chatId;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

function getChatId() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return cfg.chatId;
    } catch (_) {}
  }
  return null;
}

// 4 Ta Eng Asosiy va Tushunarli Tugma
const mainKeyboard = new Keyboard()
  .text('📋 Bugun').text('💰 Hamyon')
  .row()
  .text('📸 Xotira').text('🎯 Maqsadlar')
  .resized();

// Helper: Time blocking text
function getTimeBlockingSchedule() {
  const d = new Date();
  const day = d.getDay(); // 1 = Dush, 2 = Sesh
  const isEarlySchool = day === 1 || day === 2;
  const schoolTime = isEarlySchool ? '08:00 - 12:50' : '08:00 - 13:30';

  return `⏱️ **Bugungi Time-Blocking (Vaqt Taqsimlagich):**

🌅 **06:00 - 07:30** — Uyg'onish, suv, sport (turnik, anjimaniya)
🏫 **${schoolTime}** — Maktab (Diqqat markazida)
🍲 **13:30 - 15:00** — Tushlik va quvvat to'plash
👨‍🏫 **15:00 - 17:00** — O'quv markazi (Dars berish)
💻 **17:30 - 19:30** — Deep Work: IT & Ingliz tili
📚 **20:00 - 21:30** — Kitob mutolaasi va oila
😴 **22:00** — Uxlash va to'liq dam olish`;
}

// /start command
bot.command('start', async (ctx) => {
  saveChatId(ctx.chat.id);

  const welcome = `Salom, ${ctx.from.first_name || 'do\'stim'}! 🦁

Men **Samara AI** — shaxsiy yordamchingizman.

Menga oddiy so'zlashuv tilida yozing:
• *«15 ming tushlikka»* (xarajat)
• *«Sport qildim»* (zanjir)
• *«Ali menga 100 ming qarz berishi kerak»* (qarz)
• *«Yangi o'quvchi: Jasur, 14 yosh, Dush-Chor-Juma 16:00, 300 ming»* (CRM)
• *«20 daqiqadan keyin choynakni eslat»* (taymer)
• *YouTube yoki maqola havolasi* (3 ta amaliy xulosa)
• *Rasm yoki video* (umrbod xotira)

Quyidagi tugmalardan ham foydalanishingiz mumkin: 👇`;

  await ctx.reply(welcome, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /chart command (Visual Pie Chart)
bot.command('chart', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.replyWithChatAction('upload_photo');
  try {
    const chartBuf = await charts.generateMonthlyExpenseChart();
    if (chartBuf) {
      await ctx.replyWithPhoto(new InputFile(chartBuf), {
        caption: '📊 **Ushbu oydagi xarajatlar diagrammasi (Pie Chart)**',
      });
    } else {
      await ctx.reply('📊 Hozircha bu oyda xarajatlar qayd etilmagan.');
    }
  } catch (err) {
    await ctx.reply(`Grafik yaratishda xatolik: ${err.message}`);
  }
});

// /qarz command
bot.command('qarz', async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = debts.getDebtsSummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /crm command
bot.command('crm', async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = crm.getStudentsSummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /obhavo command
bot.command('obhavo', async (ctx) => {
  saveChatId(ctx.chat.id);
  const w = await weather.getWeather();
  await ctx.reply(w ? w.summary : 'Ob-havo ma\'lumotini olib bo\'lmadi.', {
    parse_mode: 'Markdown',
    reply_markup: mainKeyboard,
  });
});

// /timeblock command
bot.command('timeblock', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply(getTimeBlockingSchedule(), {
    parse_mode: 'Markdown',
    reply_markup: mainKeyboard,
  });
});

// /search command
bot.command('search', async (ctx) => {
  saveChatId(ctx.chat.id);
  const query = ctx.message.text.replace('/search', '').trim();
  if (!query) {
    await ctx.reply('Qidirish uchun so\'z yozing. Masalan: `/search ingliz tili`', { parse_mode: 'Markdown' });
    return;
  }
  const matches = obsidian.searchVault(query);
  if (matches.length === 0) {
    await ctx.reply(`🔍 «${query}» bo'yicha hech qanday qayd topilmadi.`);
    return;
  }
  let res = `🔍 **Qidiruv natijalari («${query}»):**\n\n`;
  for (const m of matches) {
    res += `📄 **${m.file}**\n${m.snippet}\n\n`;
  }
  await ctx.reply(res.trim(), { parse_mode: 'Markdown' });
});

// /profil command
bot.command('profil', async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = profile.getProfileSummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /kitob command
bot.command('kitob', async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = books.getReadingSummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /haftalik command (Weekly Strategic Audit)
bot.command('haftalik', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('📊 **Haftalik Strategik Audit tayyorlanmoqda...**');
  try {
    const reviewText = await review.generateWeeklyReview(ai, ctx.from.id);
    await ctx.reply(`📊 **HAFTALIK STRATEGIK AUDIT:**\n\n${reviewText}`, { reply_markup: mainKeyboard });
  } catch (err) {
    await ctx.reply(`Audit tayyorlashda xatolik: ${err.message}`);
  }
});

// /backup command (Obsidian Cloud Backup)
bot.command(['backup', 'zaxira'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('☁️ Obsidian Vault arxivlanmoqda va Telegram bulutiga yuklanmoqda...');
  const res = await backup.sendBackupToTelegram(bot, ctx.chat.id);
  if (!res.success) {
    await ctx.reply(`Zaxiralashda xatolik: ${res.error}`);
  }
});

// /english command (Speaking & Vocabulary Coach)
bot.command(['english', 'ingliz'], async (ctx) => {
  saveChatId(ctx.chat.id);
  english.startEnglishMode(ctx.from.id);
  const msg = `🇬🇧 **English Speaking & Vocabulary Coach activated!** 🎙️\n\nHello Samar! Tell me about your day, your goals, or your coding projects in English.\n\n*(Mashg'ulotni tugatish uchun "stop" yoki "chiqish" deb yozing)*`;
  await ctx.reply(msg, { parse_mode: 'Markdown' });
  try {
    const voice = await tts.textToVoice("Hello Samar! I'm ready. Let's practice English!", 'en');
    if (voice) await ctx.replyWithVoice(voice);
  } catch (_) {}
});

// /kod command (Code Review & Mentor)
bot.command(['kod', 'debug'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('💻 Xatolik berayotgan kodni, xatolik matnini yoki dasturlash bo\'yicha savolingizni yuboring — darhol tahlil qilib to\'g\'irlab beraman!');
});

// Callback queries for School Check-in
bot.callbackQuery('school_yes', async (ctx) => {
  await ctx.answerCallbackQuery();
  const schedule = `🎉 **Zo'r! Kuningiz unumli o'tgan bo'lsin.**

Kunning 2-qismi (Time Blocking):
🍲 **13:30 - 15:00** — Tushlik va dam olish
👨‍🏫 **15:00 - 17:00** — O'quv markazi (Dars berish)
💻 **17:30 - 19:30** — Deep Work: IT & Ingliz tili
📚 **20:00 - 21:30** — Kitob mutolaasi
😴 **22:00** — Uxlash

Kuch to'plab, oldinga davom etamiz! 💪`;

  await ctx.editMessageText(schedule, { parse_mode: 'Markdown' });
});

bot.callbackQuery('school_no', async (ctx) => {
  await ctx.answerCallbackQuery();
  userStates[ctx.chat.id] = 'waiting_school_reason';
  await ctx.editMessageText(
    'Tushunarli! Nega ushlanib qoldingiz? (Qo\'shimcha darsmi yoki to\'garakmi?)\nMenga sababini qisqa yozib yuboring, kunlik daftarga belgilab qo\'yaman. ✍️'
  );
});

// Photo handler (Save to Media Archive & Analyze)
bot.on('message:photo', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.replyWithChatAction('typing');

  try {
    const photos = ctx.message.photo;
    const bestPhoto = photos[photos.length - 1];
    const file = await ctx.api.getFile(bestPhoto.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const photoBuffer = Buffer.from(arrayBuffer);

    const caption = ctx.message.caption || '';

    // 1. Save to Obsidian Media Archive
    const saved = await media.saveMediaFile({
      buffer: photoBuffer,
      originalExt: 'jpg',
      caption: caption || 'surat',
      fileType: 'photo',
    });

    // 2. Process with AI Vision
    const { replyText } = await ai.processUserMessage(
      ctx.from.id,
      caption || 'Ushbu fotosuratni qisqa tahlil qil.',
      null,
      photoBuffer,
      bot
    );

    const response = `📸 Xotiralarga saqlandi: "${saved.desc}"\n\n${replyText}`;
    await ctx.reply(response, { reply_markup: mainKeyboard });
  } catch (err) {
    console.error('Foto xatosi:', err);
    await ctx.reply(`Rasmni saqlashda xatolik: ${err.message}`);
  }
});

// Video handler (Save to Media Archive)
bot.on('message:video', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.replyWithChatAction('typing');

  try {
    const video = ctx.message.video;
    const caption = ctx.message.caption || 'Video chiqish';

    if (video.file_size > 20 * 1024 * 1024) {
      await ctx.reply('⚠️ Video hajmi 20MB dan oshmasligi kerak.');
      return;
    }

    const file = await ctx.api.getFile(video.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    const saved = await media.saveMediaFile({
      buffer: videoBuffer,
      originalExt: 'mp4',
      caption,
      fileType: 'video',
    });

    await ctx.reply(`🎥 Video arxivga saqlandi: "${saved.desc}"\nKelajakda istalgan payt so'rasangiz, topib beraman!`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    console.error('Video xatosi:', err);
    await ctx.reply(`Videoni saqlashda xatolik: ${err.message}`);
  }
});

// Voice & Audio message handler
bot.on(['message:voice', 'message:audio'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.replyWithChatAction('typing');

  try {
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // If English coach mode is active
    if (english.isEnglishMode(ctx.from.id)) {
      const { replyText } = await ai.processUserMessage(
        ctx.from.id,
        "Samar is speaking in English for speaking practice. Listen carefully. Converse back in English, gently correct grammar if needed, introduce 1 new word with Uzbek meaning, and ask 1 question in English.",
        audioBuffer,
        null,
        bot
      );
      await ctx.reply(replyText);
      try {
        const enVoice = await tts.textToVoice(replyText, 'en');
        if (enVoice) await ctx.replyWithVoice(enVoice);
      } catch (_) {}
      return;
    }

    const { replyText, foundMediaPath } = await ai.processUserMessage(
      ctx.from.id,
      "Samarning ovozli xabari (Qashqadaryo, Yakkabog' shevasida). Diqqat bilan tingla. Agar qarz (masalan: ukamga, akamga, do'stimga), xarajat, sport yoki kitob aytilgan bo'lsa, mos funksiyani chaqir.",
      audioBuffer,
      null,
      bot
    );

    await ctx.reply(replyText, { reply_markup: mainKeyboard });

    // Send natural voice reply in Uzbek
    try {
      const uzVoice = await tts.textToVoice(replyText, 'uz');
      if (uzVoice) {
        await ctx.replyWithVoice(uzVoice);
      }
    } catch (_) {}

    if (foundMediaPath && fs.existsSync(foundMediaPath)) {
      if (foundMediaPath.endsWith('.mp4')) {
        await ctx.replyWithVideo(new InputFile(foundMediaPath));
      } else {
        await ctx.replyWithPhoto(new InputFile(foundMediaPath));
      }
    }
  } catch (err) {
    console.error('Audio xatosi:', err);
    await ctx.reply(`Xatolik: ${err.message}`);
  }
});

// Text message handler
bot.on('message:text', async (ctx) => {
  saveChatId(ctx.chat.id);
  const text = ctx.message.text.trim();
  const lower = text.toLowerCase();

  // 1. Check if user is answering the school reason question
  if (userStates[ctx.chat.id] === 'waiting_school_reason') {
    delete userStates[ctx.chat.id];
    obsidian.addNote({ content: text, topic: 'Maktabda qolish sababi' });
    await ctx.reply(`✍️ Qayd etildi: "${text}". Darslar tugagach, uyga sog'-omon yetib oling!`, {
      reply_markup: mainKeyboard,
    });
    return;
  }

  // 2. English Coach mode interceptor
  if (english.isEnglishMode(ctx.from.id)) {
    if (lower === 'stop' || lower === 'chiqish' || lower === 'exit') {
      english.stopEnglishMode(ctx.from.id);
      await ctx.reply('🇬🇧 Ingliz tili mashg\'uloti to\'xtatildi. Asosiy rejimga qaytdik!', { reply_markup: mainKeyboard });
      return;
    }
    await ctx.replyWithChatAction('typing');
    try {
      const { replyText, voiceFile } = await english.processEnglishTurn(ai, ctx.from.id, text);
      await ctx.reply(replyText);
      if (voiceFile) {
        try { await ctx.replyWithVoice(voiceFile); } catch (_) {}
      }
    } catch (err) {
      await ctx.reply(`English coach error: ${err.message}`);
    }
    return;
  }

  // 3. Code Debugger / Reviewer interceptor
  if (coder.isCodeQuery(text)) {
    await ctx.replyWithChatAction('typing');
    try {
      const solution = await coder.debugCode(ai, ctx.from.id, text);
      await ctx.reply(solution, { reply_markup: mainKeyboard });
      return;
    } catch (err) {
      console.error('Code review error:', err);
    }
  }

  // 4. Haftalik Audit / Sarhisob
  if (lower === 'haftalik hisobot' || lower === 'sarhisob' || lower === 'haftalik audit' || lower === 'haftalik') {
    await ctx.reply('📊 **Haftalik Strategik Audit tayyorlanmoqda...**');
    try {
      const reviewText = await review.generateWeeklyReview(ai, ctx.from.id);
      await ctx.reply(`📊 **HAFTALIK STRATEGIK AUDIT:**\n\n${reviewText}`, { reply_markup: mainKeyboard });
    } catch (err) {
      await ctx.reply(`Audit tayyorlashda xatolik: ${err.message}`);
    }
    return;
  }

  // 5. Zaxira / Backup
  if (lower === 'zaxira' || lower === 'backup' || lower === 'arxivla' || lower === 'zaxiralash') {
    await ctx.reply('☁️ Obsidian Vault arxivlanmoqda va Telegram bulutiga yuklanmoqda...');
    const res = await backup.sendBackupToTelegram(bot, ctx.chat.id);
    if (!res.success) {
      await ctx.reply(`Zaxiralashda xatolik: ${res.error}`);
    }
    return;
  }

  // 6. Tugma: 📋 Bugun
  if (text === '📋 Bugun') {
    await ctx.replyWithChatAction('typing');
    try {
      const { replyText } = await ai.processUserMessage(
        ctx.from.id,
        'Bugungi rejam va vazifalarimni juda ixcham, toza va oddiy qilib ko\'rsat (3-5 qatordan oshmasin, "###" yoki "---" ishlatma).',
        null,
        null,
        bot
      );
      await ctx.reply(replyText, { reply_markup: mainKeyboard });
    } catch (err) {
      await ctx.reply(`Xatolik: ${err.message}`);
    }
    return;
  }

  // 3. Tugma: 💰 Hamyon
  if (text === '💰 Hamyon') {
    await ctx.replyWithChatAction('typing');
    try {
      const { replyText } = await ai.processUserMessage(
        ctx.from.id,
        'Bugungi xarajat, daromad va qoldiq pulni 2-3 qatorda qisqa ko\'rsat.',
        null,
        null,
        bot
      );
      await ctx.reply(replyText, { reply_markup: mainKeyboard });
    } catch (err) {
      await ctx.reply(`Xatolik: ${err.message}`);
    }
    return;
  }

  // 4. Tugma: 📸 Xotira
  if (text === '📸 Xotira') {
    const msg = `📸 **Xotiralar va Media Arxiv:**\n\nMenga xohlagan **surat** yoki **video** tashlang — ularni kelajak uchun saqlab qo'yaman.\n\nKeyinchalik istalgan payt:\n*«Falonchi rasmni top»* yoki *«Videomni tashla»* deb so'rashingiz mumkin!`;
    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 5. Tugma: 🎯 Maqsadlar
  if (text === '🎯 Maqsadlar') {
    const s = streak.getStreakSummary();
    const goals = obsidian.getGoalsContent();
    const msg = `🎯 **Maqsadlar va Zanjir:**\n\n${s}\n\n${goals.substring(0, 300)}`;
    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 6. Natural Language Timer detection ("20 daqiqadan keyin...", "10 minutdan keyin...")
  const timerInfo = timer.parseTimerText(text);
  if (timerInfo) {
    timer.startTimer(bot, ctx.chat.id, timerInfo.durationMs, timerInfo.note);
    await ctx.reply(`⏰ **Taymer o'rnatildi:**\n${timerInfo.durationMinutes} daqiqadan keyin *«${timerInfo.note}»* eslataman!`, {
      parse_mode: 'Markdown',
      reply_markup: mainKeyboard,
    });
    return;
  }

  // 7. YouTube or Web Link detection
  const detectedUrl = webSummary.extractUrl(text);
  if (detectedUrl && (text === detectedUrl || text.length < detectedUrl.length + 20)) {
    await ctx.reply('🔍 Havola o\'rganilmoqda, 3 ta eng muhim amaliy xulosa tayyorlanmoqda...');
    try {
      const { title, replyText } = await webSummary.summarizeUrl(detectedUrl, ai, ctx.from.id, bot);
      await ctx.reply(`🎥 **«${title}»**\n\n💡 **Asosiy xulosalar:**\n${replyText}\n\n*(Obsidian Knowledge bo'limiga saqlandi)*`, {
        reply_markup: mainKeyboard,
      });
    } catch (err) {
      await ctx.reply(`Havolani tahlil qilishda xatolik: ${err.message}`);
    }
    return;
  }

  // 8. Visual Chart requests ("grafik", "diagramma", "pie chart")
  if (lower.includes('grafik') || lower.includes('diagramma') || lower.includes('pie chart') || lower.includes('moliya grafigi')) {
    await ctx.replyWithChatAction('upload_photo');
    try {
      const chartBuf = await charts.generateMonthlyExpenseChart();
      if (chartBuf) {
        await ctx.replyWithPhoto(new InputFile(chartBuf), {
          caption: '📊 **Ushbu oydagi xarajatlar diagrammasi**',
          reply_markup: mainKeyboard,
        });
        return;
      }
    } catch (_) {}
  }

  // 9. Debts queries ("qarzlar", "qarz daftari")
  if (lower === 'qarzlarim' || lower === 'qarz daftari' || lower === 'qarzlar') {
    const s = debts.getDebtsSummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 10. CRM queries ("o'quvchilarim", "oquvchilar")
  if (lower === 'o\'quvchilarim' || lower === 'oquvchilarim' || lower === 'o\'quvchilar' || lower === 'oquvchilar') {
    const s = crm.getStudentsSummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 11. Profil queries ("profilim", "men haqimda")
  if (lower === 'profilim' || lower === 'men haqimda' || lower === 'profil') {
    const s = profile.getProfileSummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 12. Kitob queries ("kitoblarim", "kitoblar")
  if (lower === 'kitoblarim' || lower === 'kitoblar' || lower === 'mutolaa') {
    const s = books.getReadingSummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 13. General text message & AI processing
  await ctx.replyWithChatAction('typing');
  try {
    const { replyText, foundMediaPath } = await ai.processUserMessage(
      ctx.from.id,
      text,
      null,
      null,
      bot
    );
    await ctx.reply(replyText, { reply_markup: mainKeyboard });

    // Voice response if requested in text
    if (lower.includes('ovozda ayt') || lower.includes('ovozli javob') || lower.includes('gapir') || lower.includes('audio')) {
      try {
        const uzVoice = await tts.textToVoice(replyText, 'uz');
        if (uzVoice) await ctx.replyWithVoice(uzVoice);
      } catch (_) {}
    }

    // If AI found media requested by user
    if (foundMediaPath && fs.existsSync(foundMediaPath)) {
      if (foundMediaPath.endsWith('.mp4')) {
        await ctx.replyWithVideo(new InputFile(foundMediaPath));
      } else {
        await ctx.replyWithPhoto(new InputFile(foundMediaPath));
      }
    }
  } catch (err) {
    console.error('Xabar xatosi:', err);
    await ctx.reply(`Kechirasiz, xatolik yuz berdi: ${err.message}`);
  }
});

// Error handler
bot.catch((err) => {
  console.error('Bot xatosi:', err);
});

// ── Avtomatik Eslatmalar (Vaqtlar - Asia/Tashkent) ─────

// 06:00 - Tongi Sport, Ob-havo & Kun Boshlanishi
cron.schedule('0 6 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const w = await weather.getWeather();
    const weatherTxt = w ? `${w.summary}\n` : '';
    const msg = `🌅 **Xayrli tong, Samar!**\n\n${weatherTxt}💧 1 stakan toza suv iching.\n💪 **10 ta turnik va 20 ta anjimaniya vaqti!**\nBajarib bo'lgach, "sport qildim" deb yozing.`;
    await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
  } catch (e) {
    console.error('06:00 cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 14:00 - CRM O'quvchilar to'lov eslatmasi (Maktabdan so'ng, darslardan oldin)
cron.schedule('0 14 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const dueStudents = crm.getPendingBillingNotifications();
    if (dueStudents.length > 0) {
      let msg = `📢 **O'quv markazi — Bugungi to'lovlar:**\n\n`;
      for (const s of dueStudents) {
        msg += `• **${s.name}**: ${obsidian.formatMoney(s.monthlyFee)}\n`;
      }
      msg += `\nTo'lov qabul qilingach, «Falonchi to'ladi» deb yozsangiz, moliya daromadiga qo'shiladi.`;
      await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    console.error('08:30 cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// Maktab rejimi check-in:
// Dushanba va Seshanba kunlari soat 12:50 da
cron.schedule('50 12 * * 1,2', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const kb = new InlineKeyboard()
      .text('✅ Ha, chiqdim', 'school_yes')
      .text('❌ Yo\'q, maktabdaman', 'school_no');

    await bot.api.sendMessage(chatId, '🏫 **Maktabdan chiqdingizmi?**', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  } catch (e) {
    console.error('12:50 school cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// Chorshanba - Shanba kunlari soat 13:30 da
cron.schedule('30 13 * * 3,4,5,6', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const kb = new InlineKeyboard()
      .text('✅ Ha, chiqdim', 'school_yes')
      .text('❌ Yo\'q, maktabdaman', 'school_no');

    await bot.api.sendMessage(chatId, '🏫 **Maktabdan chiqdingizmi?**', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  } catch (e) {
    console.error('13:30 school cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 19:30 - Daily 5-min English Boost
cron.schedule('30 19 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const msg = `🇬🇧 **Hey Samar! 5-Minute English Boost Time!** 🎙️\n\nHow was your day? Tell me in English about one thing you did or learned today!\n\n*(Inglizcha ovozli yoki matnli javob berishingiz mumkin)*`;
    await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('19:30 english cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 20:00 Yakshanba - Haftalik Strategik Audit (Weekly Review)
cron.schedule('0 20 * * 0', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    await bot.api.sendMessage(chatId, '📊 **Yakshanba oqshomi — Haftalik Strategik Audit tayyorlanmoqda...**');
    const reviewText = await review.generateWeeklyReview(ai, chatId);
    await bot.api.sendMessage(chatId, `📊 **HAFTALIK STRATEGIK AUDIT:**\n\n${reviewText}`, {
      reply_markup: mainKeyboard,
    });
  } catch (e) {
    console.error('Sunday review cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 21:30 - Kechki Xulosa
cron.schedule('30 21 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const msg = `🌙 **Kechki sarhisob:**\nBugun qaysi rejalar bajarildi? Qolib ketgan ishlar bormi? Menga qisqa hisobot bering.`;
    await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
  } catch (e) {
    console.error('21:30 cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 23:00 - Har kecha avtomatik Obsidian Cloud Backup
cron.schedule('0 23 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    await backup.sendBackupToTelegram(bot, chatId);
  } catch (e) {
    console.error('23:00 backup cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// Start bot
console.log('🚀 Samara AI barcha aqlli modullar bilan ishga tushmoqda...');
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Samara AI muvaffaqiyatli faol: @${botInfo.username}`);
  },
});
