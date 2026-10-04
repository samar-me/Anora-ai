const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');
const streak = require('./streak');
const rpg = require('./rpg');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const FITNESS_FILE = path.join(__dirname, 'fitness_data.json');

function loadFitnessData() {
  if (fs.existsSync(FITNESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(FITNESS_FILE, 'utf8'));
    } catch (_) {}
  }
  return {
    personalRecords: {
      turnik: { name: 'Turnik (Pull-ups)', value: 15, unit: 'ta', date: '2026-10-01' },
      anjimaniya: { name: 'Anjimaniya (Push-ups)', value: 30, unit: 'ta', date: '2026-10-01' },
      brusya: { name: 'Brusya (Dips)', value: 15, unit: 'ta', date: '2026-10-01' },
      squats: { name: 'Prisidaniya (Squats)', value: 40, unit: 'ta', date: '2026-10-01' },
      yugurish: { name: 'Yugurish', value: 3, unit: 'km', date: '2026-10-01' },
    },
    workouts: [],
  };
}

function saveFitnessData(data) {
  fs.writeFileSync(FITNESS_FILE, JSON.stringify(data, null, 2), 'utf8');
  syncToObsidian(data);
}

function syncToObsidian(data) {
  try {
    const sDir = path.join(VAULT_PATH, 'Sports');
    if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });

    // 1. Shaxsiy Rekordlar
    const prFile = path.join(sDir, 'Shaxsiy_Rekordlar.md');
    let prContent = `# 🏆 Samar ning Shaxsiy Sport Rekordlari (PR)\n\n| Mashq turi | Rekord natija | Yangilangan sana |\n|---|---|---|\n`;
    for (const [key, pr] of Object.entries(data.personalRecords)) {
      prContent += `| **${pr.name}** | **${pr.value} ${pr.unit}** | ${pr.date || '-'} |\n`;
    }
    prContent += `\n> *"Chempionlar zallarda emas, iroda va intizomda tug'iladi!"* 🦁\n`;
    fs.writeFileSync(prFile, prContent, 'utf8');

    // 2. Mashg'ulotlar Daftari
    const logFile = path.join(sDir, 'Mashgulotlar_Daftari.md');
    let logContent = `# 🏋️‍♂️ Mashg'ulotlar Daftari (Workout Log)\n\n| Sana | Mashqlar / Tavsif | Natija |\n|---|---|---|\n`;
    const recent = data.workouts.slice(-15).reverse();
    for (const w of recent) {
      logContent += `| ${w.date} | ${w.description} | ${w.summary || 'Bajarildi'} |\n`;
    }
    fs.writeFileSync(logFile, logContent, 'utf8');
  } catch (err) {
    console.warn('Fitness sync error:', err.message);
  }
}

/**
 * Records a completed workout
 */
function recordWorkout({ description, rawText = '' }) {
  const data = loadFitnessData();
  const today = obsidian.getTodayString();

  // Check if any personal records were beaten
  let newPrMessage = '';
  const textToCheck = `${description} ${rawText}`.toLowerCase();

  for (const [key, pr] of Object.entries(data.personalRecords)) {
    // Regex e.g. "turnik 18 ta", "18 ta turnik", "turnik: 18"
    const regex1 = new RegExp(`${key}[^0-9]*(\\d+)`, 'i');
    const regex2 = new RegExp(`(\\d+)[^0-9a-z]*${key}`, 'i');
    const match = textToCheck.match(regex1) || textToCheck.match(regex2);

    if (match) {
      const num = parseInt(match[1], 10);
      if (num > pr.value) {
        const oldVal = pr.value;
        pr.value = num;
        pr.date = today;
        newPrMessage += `🔥 **YANGI REKORD!** ${pr.name}: avvalgi natija ${oldVal} ${pr.unit} edi, bugun **${num} ${pr.unit}** ga chiqardingiz!\n`;
      }
    }
  }

  const workoutEntry = {
    date: today,
    timestamp: new Date().toISOString(),
    description: description.trim(),
    summary: 'Muvaffaqiyatli yakunlandi 💪',
  };

  data.workouts.push(workoutEntry);
  saveFitnessData(data);

  // Update Habit Streak
  const sRes = streak.updateHabitStreak('sport');

  // Add task completed in today's daily note
  obsidian.addTask({
    title: `Sport mashg'uloti: ${description.substring(0, 40)}`,
    time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
  });
  obsidian.completeTask('sport');

  const xpRes = rpg.addXp('strength', 50, `Sport mashg'uloti: ${description.substring(0, 30)}`);

  return {
    success: true,
    streakCount: sRes.count,
    newPrMessage,
    workoutEntry,
    xpRes,
  };
}

/**
 * Returns structured Calisthenics & Strength Program for today
 */
function getDailyWorkoutProgram() {
  const d = new Date();
  const day = d.getDay(); // 0 = Yak, 1 = Dush, 2 = Sesh, 3 = Chor, 4 = Pay, 5 = Juma, 6 = Shan

  const programs = {
    1: {
      title: 'Dushanba — Ko\'krak, Triceps va Qorin Pressi (Kuch kuni)',
      exercises: [
        '1. Keng ushlab turnik (Pull-ups): 4 set × 8-12 ta',
        '2. Klassik anjimaniya (Push-ups): 4 set × 20-25 ta',
        '3. Brusya (Dips): 4 set × 10-15 ta',
        '4. Qorin pressi (Turnikda oyoqni ko\'tarish): 3 set × 15 ta',
        '5. Plank: 3 set × 1 daqiqa',
      ],
      rest: 'Setlar orasida: 60-90 soniya dam oling.',
      nutrition: 'Mashqdan so\'ng: 2-3 ta qaynatilgan tuxum, tvorog yoki sut iching.',
    },
    2: {
      title: 'Seshanba — Orqa, Biceps va Chidamlilik',
      exercises: [
        '1. Teskari ushlab turnik (Chin-ups - Biceps): 4 set × 10-12 ta',
        '2. Tor ushlab turnik: 3 set × 8-10 ta',
        '3. Olmos anjimaniya (Diamond push-ups): 4 set × 15 ta',
        '4. Gimnastik ko\'prikcha yoki orqa cho\'zilishlar: 3 set',
        '5. 15-20 daqiqa yengil kross yoki sakrashlar.',
      ],
      rest: 'Setlar orasida: 60 soniya dam oling.',
      nutrition: 'Ko\'p miqdorda toza suv iching (kamida 1.5-2 litr).',
    },
    3: {
      title: 'Chorshanba — Oyoq, Sakrash va Umumiy Tonus',
      exercises: [
        '1. Prisidaniya (Chuqur o\'tirib-turish): 4 set × 25-30 ta',
        '2. Sakrab prisidaniya (Jump squats): 3 set × 15 ta',
        '3. Vypadlar (Oldinga qadam): har bir oyoqqa 3 set × 15 ta',
        '4. Boldir (Ikra) mashqlari: 4 set × 30 ta',
        '5. 2-3 km ochiq havoda erkin yugurish.',
      ],
      rest: 'Setlar orasida: 90 soniya dam oling.',
      nutrition: 'Karbogidratlar (grechka, guruch, banan) quvvat beradi.',
    },
    4: {
      title: 'Payshanba — Faol Tiklanish va Bo\'g\'inlar Chiniqishi',
      exercises: [
        '1. To\'liq tanani cho\'zish (Stretching): 15 daqiqa',
        '2. Turnikda osilib turish (Umurtqa pog\'onasi uchun): 3 marta 45 soniya',
        '3. Yengil yurish yoki 15 daqiqa toza havoda aylanish',
        '4. Chuqur nafas mashqlari (Diafragma bilan nafas olish)',
      ],
      rest: 'Mushaklar o\'sishi aynan dam olish kunida ro\'y beradi!',
      nutrition: 'Yaxshi uxlash — mushaklarning eng katta do\'sti.',
    },
    5: {
      title: 'Juma — Yelka, Trapeziya va Qorin Pressi',
      exercises: [
        '1. Pike push-ups (Yelka uchun anjimaniya): 4 set × 12 ta',
        '2. Turnikda burchak ushlab tortilish (L-sit pull-up): 3 set × 6-8 ta',
        '3. Brusya (Triceps va ko\'krak): 4 set × 12-15 ta',
        '4. Skala climber (Tog\'chi mashqi): 3 set × 30 soniya',
        '5. Plank: 3 set × 70 soniya',
      ],
      rest: 'Setlar orasida: 60 soniya dam oling.',
      nutrition: 'Tuxum, go\'sht, grechka — baquvvat yigit taomnomasi.',
    },
    6: {
      title: 'Shanba — Full-Body Calisthenics Challenge (Kuch va Rekord)',
      exercises: [
        '1. Turnik MAX (Bitta urinishda maksimal natija uchun!): 1 set',
        '2. Anjimaniya MAX: 1 set',
        '3. Brusya MAX: 1 set',
        '4. 100 ta prisidaniya (bo\'lib-bo\'lib)',
        '5. Sovuq suvda yuvinish yoki kontrast dush.',
      ],
      rest: 'Har bir rekord urinish orasida 3 daqiqa to\'liq dam oling.',
      nutrition: 'Bugun yangi rekord qo\'yishga harakat qiling!',
    },
    0: {
      title: 'Yakshanba — To\'liq Tiklanish va Rejalashtirish',
      exercises: [
        'Bugun mushaklar dam oladi.',
        'Hafta davomida yig\'ilgan charchoqni chiqarish uchun 20 daqiqa yengil cho\'zilish kifoya.',
      ],
      rest: 'Ertaga yangi kuch bilan haftani boshlaymiz!',
      nutrition: 'Yetarlicha vitamin va mevalar iste\'mol qiling.',
    },
  };

  const plan = programs[day] || programs[1];
  let res = `🦁 **MURABBIY DASTURI: ${plan.title}**\n\n`;
  res += `📋 **Mashqlar ro'yxati:**\n`;
  for (const ex of plan.exercises) {
    res += `• ${ex}\n`;
  }
  res += `\n⏱️ **Dam olish:** ${plan.rest}\n`;
  res += `🥗 **Murabbiy taomnomasi:** ${plan.nutrition}\n\n`;
  res += `> *"Hech qachon to'xtama! Samar, Qashqadaryoning eng kuchli va intizomli yigiti bo'lasan!"* 💪`;

  return res;
}

/**
 * Returns summary of personal records and workout streak
 */
function getFitnessSummary() {
  const data = loadFitnessData();
  const streaks = streak.loadStreaks ? streak.loadStreaks() : null;
  const sportStreak = streaks?.sport?.count || 0;

  let res = `🏋️‍♂️ **SPORT VA JISMONIY INTIZOM KABINETI**\n\n`;
  res += `🔥 **Sport zanjiri:** ${sportStreak} kun ketma-ket\n\n`;
  res += `🏆 **Shaxsiy Rekordlar (PR):**\n`;
  for (const [key, pr] of Object.entries(data.personalRecords)) {
    res += `• **${pr.name}**: ${pr.value} ${pr.unit} (${pr.date || '-'})\n`;
  }

  const lastWorkout = data.workouts[data.workouts.length - 1];
  if (lastWorkout) {
    res += `\n📅 **Oxirgi mashg'ulot (${lastWorkout.date}):**\n«${lastWorkout.description}»`;
  }

  res += `\n\nBugungi mashq dasturini olish uchun: /mashq yoki "mashq ber" deb yozing!`;
  return res;
}

module.exports = {
  recordWorkout,
  getDailyWorkoutProgram,
  getFitnessSummary,
  loadFitnessData,
};
