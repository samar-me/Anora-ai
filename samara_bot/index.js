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
const fitness = require('./services/fitness');
const strategy = require('./services/strategy');
const water = require('./services/water');
const dream = require('./services/dream');
const incubator = require('./services/incubator');
const briefing = require('./services/briefing');
const rpg = require('./services/rpg');
const arena = require('./services/arena');
const deepwork = require('./services/deepwork');
const crm2 = require('./services/crm2');
const architect = require('./services/architect');
const publisher = require('./services/publisher');
const vaultRag = require('./services/vault_rag');
const nightshift = require('./services/nightshift');

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

Men **Anora AI** — shaxsiy yordamchingiz va murabbiyingizman. 🌸

Menga oddiy so'zlashuv tilida yozing:
• *«15 ming tushlikka»* (xarajat)
• *«Sport qildim»* (calisthenics zanjiri & PR)
• *«Suv ichdim»* (💧 suv balansi)
• *«Yangi g'oya: ...»* (💡 startap inkubatori)
• *«Escalade fondi»* (🚗 orzu jamg'armasi)
• *«Brifing»* (🎙 tongi audio brifing)
• *«Ali menga 100 ming qarz berishi kerak»* (qarz)
• *«Yangi o'quvchi: Jasur, 14 yosh...»* (CRM)
• *«20 daqiqadan keyin choynakni eslat»* (taymer)

Buyruqlar: /brifing, /suv, /orzu, /goya, /sport, /english, /ovoz`;

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

// /strategiya command (Master Development Roadmap)
bot.command(['strategiya', 'roadmap'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = strategy.getStrategySummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /english command (Strategic Speaking & Vocabulary Coach)
bot.command(['english', 'ingliz'], async (ctx) => {
  saveChatId(ctx.chat.id);
  english.startEnglishMode(ctx.from.id);
  const mission = english.getDailyEnglishMission();

  let msg = `🇬🇧 **ENGLISH ACCELERATOR: TODAY'S STRATEGIC MISSION** 🚀\n\n`;
  msg += `📌 **Mavzu:** *${mission.topic}*\n\n`;
  msg += `🔑 **Bugungi o'zlashtiriladigan so'zlar:**\n`;
  for (const w of mission.words) {
    msg += `• **${w.word}** — ${w.meaning}\n  *(Misol: ${w.ex})*\n`;
  }
  msg += `\n🎯 **Bugungi Challenge / Topshiriq:**\n"${mission.challenge}"\n\n`;
  msg += `*(Ushbu savolga inglizcha ovozli yoki matnli javob bering. Chiqish uchun: "stop" yoki "chiqish")*`;

  await ctx.reply(msg, { parse_mode: 'Markdown' });
  try {
    const voice = await tts.textToVoice(`Hello Samar! Today's mission is ${mission.topic}. ${mission.challenge}`, 'en');
    if (voice) await ctx.replyWithVoice(voice);
  } catch (_) {}
});

// /kod command (Code Review & Mentor)
bot.command(['kod', 'debug'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('💻 Xatolik berayotgan kodni, xatolik matnini yoki dasturlash bo\'yicha savolingizni yuboring — darhol tahlil qilib to\'g\'irlab beraman!');
});

// /sport command (Fitness stats & Personal Records)
bot.command('sport', async (ctx) => {
  saveChatId(ctx.chat.id);
  const s = fitness.getFitnessSummary();
  await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /mashq command (Daily workout routine from coach)
bot.command('mashq', async (ctx) => {
  saveChatId(ctx.chat.id);
  const p = fitness.getDailyWorkoutProgram();
  await ctx.reply(p, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /ovoz command (Voice selection for female voices)
bot.command(['ovoz', 'voice'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const current = tts.getActiveVoiceProfile();

  const kb = new InlineKeyboard()
    .text('🌸 Madina (Mayin & Shirin)', 'set_voice_sweet')
    .row()
    .text('🌺 Madina (Klassik)', 'set_voice_classic')
    .row()
    .text('🌟 Emel (Turkiy mayin)', 'set_voice_soft_turk')
    .row()
    .text('👑 Jenny (Inglizcha go\'zal)', 'set_voice_jenny');

  let msg = `🎙️ **OVOZ SOZLAMALARI (QIZLAR OVOZI)**\n\n`;
  msg += `Hozirgi faol ovoz: **${current.name}**\n\n`;
  msg += `Quyidagi variantlardan birini tanlang. Tanlashingiz bilan bot yangi ovozda sizga audio salom yo'llaydi: 👇`;

  await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: kb });
});

bot.callbackQuery(/^set_voice_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const voiceId = ctx.match[1];
  const profile = tts.setActiveVoiceProfile(voiceId);

  if (profile) {
    await ctx.reply(`✅ **Ovoz o'zgartirildi:** ${profile.name}\n_${profile.desc}_`, {
      parse_mode: 'Markdown',
      reply_markup: mainKeyboard,
    });

    try {
      const sampleText = `Salom Samar! Men Anoraman, yangi ovozim sizga yoqdimi? Endi sizga doim shu mayin va chiroyli ovozda gapiraman.`;
      const voice = await tts.textToVoice(sampleText, 'uz', voiceId);
      if (voice) await ctx.replyWithVoice(voice);
    } catch (_) {}
  }
});

// /brifing or /tong command (Morning Audio Briefing)
bot.command(['brifing', 'tong'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('🌅 **Ertalabki Ovozli Brifing tayyorlanmoqda...**');
  try {
    const br = await briefing.generateMorningBriefing();
    await ctx.reply(br.text, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    if (br.voiceBuffer) {
      await ctx.replyWithVoice(new InputFile(br.voiceBuffer));
    }
  } catch (err) {
    await ctx.reply(`Brifingda xatolik: ${err.message}`);
  }
});

// /suv command (Water & Hydration Tracker)
bot.command('suv', async (ctx) => {
  saveChatId(ctx.chat.id);
  const kb = new InlineKeyboard()
    .text('+1 stakan (250 ml) 💧', 'water_add_1')
    .text('+2 stakan (500 ml) 💧💧', 'water_add_2');
  await ctx.reply(water.getWaterSummary(), { parse_mode: 'Markdown', reply_markup: kb });
});

bot.callbackQuery(/^water_add_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Suv qayd etildi! 💧' });
  const count = parseInt(ctx.match[1], 10) || 1;
  water.addWater(count);
  const kb = new InlineKeyboard()
    .text('+1 stakan (250 ml) 💧', 'water_add_1')
    .text('+2 stakan (500 ml) 💧💧', 'water_add_2');
  let msg = `✅ **${count} stakan toza suv ichildi!**\n\n${water.getWaterSummary()}`;
  await ctx.editMessageText(msg, { parse_mode: 'Markdown', reply_markup: kb });
});

// /escalade or /orzu command (Cadillac Escalade Dream Fund)
bot.command(['escalade', 'orzu'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const kb = new InlineKeyboard()
    .text('+50 000 so\'m 🚗', 'dream_add_50000')
    .text('+100 000 so\'m 🚗', 'dream_add_100000')
    .row()
    .text('+300 000 so\'m 🚗', 'dream_add_300000')
    .text('+500 000 so\'m 🚗', 'dream_add_500000');
  await ctx.reply(dream.getDreamSummary(), { parse_mode: 'Markdown', reply_markup: kb });
});

bot.callbackQuery(/^dream_add_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Orzu fondiga qo\'shildi! 🚗' });
  const amount = parseInt(ctx.match[1], 10);
  dream.contribute(amount, 'Tezkor tugma orqali');
  let msg = `✅ **Cadillac Escalade fondiga +${dream.formatMoney(amount)} qo'shildi!** 🚗\n\n${dream.getDreamSummary()}`;
  await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
});

// /goya command (Startup & Idea Incubator)
bot.command(['goya', 'startap'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const ideaText = ctx.message.text.replace(/^\/(goya|startap)\s*/i, '').trim();
  if (!ideaText) {
    await ctx.reply(
      `💡 **STARTAP VA G'OYALAR INKUBATORI**\n\nMenga yangi g'oyangizni yozing:\nMasalan: \`/goya Maktab o'quvchilari uchun sun'iy intellektli repetitor boti\`\n\nYoki shunchaki «Anora, yangi g'oya keldi: ...» deb yozing!\n\n${incubator.getIdeasSummary()}`,
      { parse_mode: 'Markdown', reply_markup: mainKeyboard }
    );
    return;
  }

  await ctx.reply('💡 **G\'oya professional tahlil qilinmoqda va Obsidian Ideas bo\'limiga kiritilmoqda...**');
  try {
    const res = await incubator.analyzeAndSaveIdea(ideaText);
    await ctx.reply(`🎉 **G'oya qabul qilindi va Obsidian'ga saqlandi!**\n📄 \`${res.fileName}\`\n\n${res.analysisText}`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`G'oyani tahlil qilishda xatolik: ${err.message}`);
  }
});

// /rpg or /level command (Solo Leveling RPG Status)
bot.command(['rpg', 'level'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply(rpg.getStatusCard(), { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /arena or /leetcode command (FAANG Algorithm Duel)
bot.command(['arena', 'leetcode', 'masala'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const p = arena.getDailyProblem();
  await ctx.reply(p.text, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /fokus or /deepwork command (Focus & Flow Shield)
bot.command(['fokus', 'deepwork'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const parts = ctx.message.text.replace(/^\/(fokus|deepwork)\s*/i, '').trim().split(/\s+/);
  const minutes = parseInt(parts[0], 10) || 45;
  const goal = parts.slice(1).join(' ') || 'Chuqur dasturlash va kod yozish';

  const res = deepwork.startFocusSession(bot, ctx.chat.id, minutes, goal);
  let msg = `🎯 **DEEP WORK SPRINTI BOSHLANDI!** 🚀\n\n`;
  msg += `⏱️ Vaqt: **${res.minutes} daqiqa** (Tugash vaqti: **${res.endTimeStr}**)\n`;
  msg += `🎯 Maqsad: *${res.goal}*\n\n`;
  msg += `🛡️ _Flow Shield faollashtirildi. Barcha chalg'ituvchi omillarni chetga suring va diqqatni 100% kodga qarating! Yakunlangach, hisobot olaman va +70 XP beraman._`;

  await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

// /dars command (CRM 2.0 Parent Reports)
bot.command('dars', async (ctx) => {
  saveChatId(ctx.chat.id);
  const notes = ctx.message.text.replace(/^\/dars\s*/i, '').trim();
  if (!notes) {
    await ctx.reply(
      `👨‍🏫 **REPETITORLIK CRM 2.0: OTA-ONALARGA HISOBOT**\n\nFoydalanish: \`/dars <o'quvchilar va bugungi dars haqida qayd>\`\n\nMisol:\n\`/dars Jasur va Rustam mavzuni a'lo darajada o'zlashtirdi, 100% bajardi. Ali esa kechikib keldi va uy vazifasini chala qildi.\``,
      { parse_mode: 'Markdown', reply_markup: mainKeyboard }
    );
    return;
  }

  await ctx.reply('👨‍🏫 **Ota-onalar uchun professional hisobotlar tayyorlanmoqda...**');
  try {
    const res = await crm2.generateParentReports(notes);
    await ctx.reply(`📱 **OTA-ONALARGA YUBORISH UCHUN TAYYOR XABARLAR:**\n\n${res.reportsText}\n\n🎮 +50 XP (Aql & Muloqot) qo'shildi!`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`Hisobot tayyorlashda xatolik: ${err.message}`);
  }
});

// /arxitektura command (Voice/Text to System Architecture)
bot.command(['arxitektura', 'arch'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const idea = ctx.message.text.replace(/^\/(arxitektura|arch)\s*/i, '').trim();
  if (!idea) {
    await ctx.reply(
      `📐 **SAYR QILUVCHI ARXITEKTOR (SYSTEM DESIGN)**\n\nFoydalanish: \`/arxitektura <loyiha g'oyasi>\`\n\nMisol:\n\`/arxitektura O'quvchilar test ishlaydigan SaaS, unda Telegram bot, PostgreSQL bazasi, Node.js va Supabase bo'ladi.\``,
      { parse_mode: 'Markdown', reply_markup: mainKeyboard }
    );
    return;
  }

  await ctx.reply('📐 **Tizim arxitekturasi va Mermaid diagrammasi ishlab chiqilmoqda...**');
  try {
    const res = await architect.designSystemArchitecture(idea);
    await ctx.reply(`🎉 **Arxitektura tayyor va saqlandi!** (\`${res.fileName}\`)\n\n${res.archDoc}\n\n🎮 +80 XP (Muhandislik 💻) qo'shildi!`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`Arxitektura tuzishda xatolik: ${err.message}`);
  }
});

// /post command (Tech Influencer Post Generator)
bot.command(['post', 'maqola'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const topic = ctx.message.text.replace(/^\/(post|maqola)\s*/i, '').trim();
  if (!topic) {
    await ctx.reply('📢 Foydalanish: `/post <mavzu yoki o\'rganilgan bilim>`\nMisol: `/post Bugun Node.js da cluster va worker threadslar haqida o\'rgandim`', { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply('📢 **Kanal va LinkedIn uchun texnik post tayyorlanmoqda...**');
  try {
    const res = await publisher.generateTechPost(topic);
    await ctx.reply(`📱 **KANAL YOKI LINKEDIN UCHUN POST:**\n\n${res.postText}\n\n🎮 +40 XP qo'shildi!`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`Post tayyorlashda xatolik: ${err.message}`);
  }
});

// /esla command (Semantic Memory Recall)
bot.command(['esla', 'recall'], async (ctx) => {
  saveChatId(ctx.chat.id);
  const query = ctx.message.text.replace(/^\/(esla|recall)\s*/i, '').trim();
  if (!query) {
    await ctx.reply('🧠 Foydalanish: `/esla <savol yoki eslash kerak bo\'lgan narsa>`\nMisol: `/esla o\'quvchilarimning to\'lovlari haqida nima bor?`', { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply('🧠 **Obsidian xotiradan qidirilmoqda...**');
  try {
    const res = await vaultRag.recallFromVault(query);
    await ctx.reply(`🧠 **IKKINCHI MIYA XULOSASI:**\n\n${res.answer}`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`Xotirani o'qishda xatolik: ${err.message}`);
  }
});

// /tungi command (Run night shift on demand)
bot.command(['tungi', 'nightshift'], async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('🌙 **Tungi Avtopilot tahlili ishga tushirildi...**');
  try {
    const res = await nightshift.runNightShift();
    await ctx.reply(`${res.reportText}\n\n🎮 +50 XP (Muhandislik 💻) qo'shildi!`, {
      reply_markup: mainKeyboard,
    });
  } catch (err) {
    await ctx.reply(`Tungi tahlilda xatolik: ${err.message}`);
  }
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

  // Strategiya / Roadmap
  if (lower === 'strategiya' || lower === 'roadmap' || lower === 'strategiyam' || lower === 'rivojlanish rejasi') {
    const s = strategy.getStrategySummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // Ovoz sozlamalari
  if (lower.includes('ovozni ozgartir') || lower.includes('ovoz almashtir') || lower.includes('boshqa ovoz') || lower === 'ovoz' || lower === 'ovozlar') {
    const current = tts.getActiveVoiceProfile();
    const kb = new InlineKeyboard()
      .text('🌸 Madina (Mayin & Shirin)', 'set_voice_sweet')
      .row()
      .text('🌺 Madina (Klassik)', 'set_voice_classic')
      .row()
      .text('🌟 Emel (Turkiy mayin)', 'set_voice_soft_turk')
      .row()
      .text('👑 Jenny (Inglizcha go\'zal)', 'set_voice_jenny');

    let msg = `🎙️ **OVOZ SOZLAMALARI (QIZLAR OVOZI)**\n\n`;
    msg += `Hozirgi faol ovoz: **${current.name}**\n\n`;
    msg += `O'zingizga yoqqan ovozni tanlang: 👇`;

    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: kb });
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

  // 6. Sport va Rekordlar
  if (lower === 'sport' || lower === 'rekordlarim' || lower === 'sportim' || lower === 'rekordlar') {
    const s = fitness.getFitnessSummary();
    await ctx.reply(s, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 7. Mashq dasturi
  if (lower === 'mashq' || lower === 'mashqlar' || lower === 'mashq dasturi' || lower === 'bugungi mashq' || lower === 'mashq ber') {
    const p = fitness.getDailyWorkoutProgram();
    await ctx.reply(p, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    return;
  }

  // 8. Tugma: 📋 Bugun
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

  // 13. Suv nazorati ("suv", "suv ichdim")
  if (lower === 'suv' || lower === '💧' || lower.includes('suv ichdim') || lower.includes('stakan suv')) {
    let glasses = 1;
    if (lower.includes('2') || lower.includes('ikki')) glasses = 2;
    else if (lower.includes('3') || lower.includes('uch')) glasses = 3;
    water.addWater(glasses);
    const kb = new InlineKeyboard()
      .text('+1 stakan (250 ml) 💧', 'water_add_1')
      .text('+2 stakan (500 ml) 💧💧', 'water_add_2');
    let msg = `✅ **${glasses} stakan toza suv ichildi!**\n\n${water.getWaterSummary()}`;
    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: kb });
    return;
  }

  // 14. Escalade Orzu fondi ("escalade", "orzu fondi")
  if (lower === 'escalade' || lower === 'orzu' || lower === 'escalade fondi' || lower === 'katta orzu' || lower === 'orzu fondi') {
    const kb = new InlineKeyboard()
      .text('+50 000 so\'m 🚗', 'dream_add_50000')
      .text('+100 000 so\'m 🚗', 'dream_add_100000')
      .row()
      .text('+300 000 so\'m 🚗', 'dream_add_300000')
      .text('+500 000 so\'m 🚗', 'dream_add_500000');
    await ctx.reply(dream.getDreamSummary(), { parse_mode: 'Markdown', reply_markup: kb });
    return;
  }

  // 15. Tongi brifing ("brifing", "tongi brifing")
  if (lower === 'brifing' || lower === 'tongi brifing' || lower === 'ertalabki brifing' || lower === 'audio brifing') {
    await ctx.reply('🌅 **Ertalabki Ovozli Brifing tayyorlanmoqda...**');
    try {
      const br = await briefing.generateMorningBriefing();
      await ctx.reply(br.text, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
      if (br.voiceBuffer) {
        await ctx.replyWithVoice(new InputFile(br.voiceBuffer));
      }
    } catch (err) {
      await ctx.reply(`Brifingda xatolik: ${err.message}`);
    }
    return;
  }

  // 16. Startap va G'oyalar Inkubatori ("yangi goya:", "startap goyasi:")
  if (lower.startsWith('yangi g\'oya:') || lower.startsWith('yangi goya:') || lower.startsWith('startap g\'oyasi:') || lower.startsWith('startap goyasi:') || lower.startsWith('menga yangi g\'oya keldi:')) {
    const ideaClean = text.replace(/^(yangi g['’`]?oya:|startap g['’`]?oyasi:|menga yangi g['’`]?oya keldi:)\s*/i, '').trim();
    if (ideaClean) {
      await ctx.reply('💡 **G\'oya professional tahlil qilinmoqda va Obsidian Ideas bo\'limiga saqlanmoqda...**');
      try {
        const res = await incubator.analyzeAndSaveIdea(ideaClean);
        await ctx.reply(`🎉 **G'oya qabul qilindi va Obsidian'ga saqlandi!**\n📄 \`${res.fileName}\`\n\n${res.analysisText}`, {
          reply_markup: mainKeyboard,
        });
      } catch (err) {
        await ctx.reply(`G'oyani tahlil qilishda xatolik: ${err.message}`);
      }
      return;
    }
  }

  // 17. General text message & AI processing
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

// 06:00 - Tongi 45 soniyalik Ovozli Brifing (Madina ovozida)
cron.schedule('0 6 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const br = await briefing.generateMorningBriefing();
    await bot.api.sendMessage(chatId, br.text, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
    if (br.voiceBuffer) {
      await bot.api.sendVoice(chatId, new InputFile(br.voiceBuffer));
    }
  } catch (e) {
    console.error('06:00 morning audio briefing error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// 10:30 & 16:30 - Suv va Tetiklik Eslatmasi
cron.schedule('30 10,16 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const wData = water.loadData();
    if (wData.glasses < water.DAILY_TARGET_GLASSES) {
      const kb = new InlineKeyboard()
        .text('+1 stakan (250 ml) 💧', 'water_add_1')
        .text('+2 stakan (500 ml) 💧💧', 'water_add_2');
      await bot.api.sendMessage(
        chatId,
        `💧 **Samarbek, bir stakan toza suv ichish vaqti!**\n\nMiyangiz to'liq quvvatda ishlashi uchun tanani namlab oling.\nJoriy holat: ${wData.glasses}/${water.DAILY_TARGET_GLASSES} stakan.`,
        { parse_mode: 'Markdown', reply_markup: kb }
      );
    }
  } catch (e) {
    console.error('Water reminder cron error:', e.message);
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

// 19:30 - Daily Strategic English Accelerator
cron.schedule('30 19 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    const mission = english.getDailyEnglishMission();
    let msg = `🇬🇧 **KUNLIK INGLIZ TILI STRATEGIK MISSIYASI** 🚀\n\n`;
    msg += `📌 **Mavzu:** *${mission.topic}*\n\n`;
    msg += `🔑 **Bugungi o'zlashtiriladigan 3 ta so'z:**\n`;
    for (const w of mission.words) {
      msg += `• **${w.word}** — ${w.meaning}\n`;
    }
    msg += `\n🎯 **Bugungi Challenge / Topshiriq:**\n"${mission.challenge}"\n\n`;
    msg += `*(Ovozli yoki matnli javob bering, darhol tahlil qilib audio yuboraman!)*`;

    await bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    try {
      const voice = await tts.textToVoice(`Hello Samar! Here is today's challenge: ${mission.challenge}`, 'en');
      if (voice) await bot.api.sendVoice(chatId, voice);
    } catch (_) {}
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

// 03:00 - Tungi Avtopilot (Autonomous Night Shift Intelligence)
cron.schedule('0 3 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;
  try {
    await nightshift.runNightShift();
    console.log('03:00 Night Shift tahlili muvaffaqiyatli bajarildi.');
  } catch (e) {
    console.error('03:00 night shift cron error:', e.message);
  }
}, { timezone: 'Asia/Tashkent' });

// Start bot
console.log('🚀 Anora AI barcha aqlli modullar bilan ishga tushmoqda...');
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Anora AI muvaffaqiyatli faol: @${botInfo.username}`);
  },
});
