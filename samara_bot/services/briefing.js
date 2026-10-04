const weather = require('./weather');
const tts = require('./tts');
const fitness = require('./fitness');
const english = require('./english');
const dream = require('./dream');
const water = require('./water');

const DAYS_UZ = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

async function generateMorningBriefing() {
  const now = new Date();
  const dayName = DAYS_UZ[now.getDay()];
  const isSunday = now.getDay() === 0;
  const isEarlySchool = now.getDay() === 1 || now.getDay() === 2;

  // 1. Fetch weather in Yakkabog'
  let weatherText = 'Yakkabog‘da havo musaffo';
  try {
    const w = await weather.getWeather();
    if (w && w.temp) {
      weatherText = `Yakkabog‘da havo ${w.temp} daraja, ${w.desc || 'ochiq'}`;
    }
  } catch (_) {}

  // 2. School & Teaching schedule
  let scheduleNote = '';
  if (isSunday) {
    scheduleNote = "Bugun yakshanba — chuqur IT loyihalar, mutolaa va oila bilan dam olish kuni.";
  } else {
    const schoolEnd = isEarlySchool ? '12:50' : '13:30';
    scheduleNote = `Soat 08:00 dan ${schoolEnd} gacha maktab, soat 15:00 da o‘quv markazida darsingiz bor.`;
  }

  // 3. Calisthenics goal
  const fitnessGoal = "10-15 ta turnik va 25 ta anjimaniya bilan qon aylanishini kuchaytiramiz.";

  // 4. TTS audio script (designed to sound natural, polite, and energetic when spoken)
  const audioScript = `Xayrli tong, Samarbek! Bugun ${dayName}. ${weatherText}. Bugungi asosiy rejamiz: ${scheduleNote} Sportda: ${fitnessGoal} O‘rningizdan tetik turing, bir stakan toza suv iching. Katta orzuyimiz — qora Cadillac Escalade va moliyaviy erkinlik sari yana bir g‘alabali kun boshlandi. Kuningiz barakali o‘tsin, chempion!`;

  // 5. Formatted Markdown text for Telegram message
  let text = `🌅 **XAYRLI TONG, SAMARBEK! (TONGI BRİFİNG)** 🦁\n\n`;
  text += `📅 **Bugun:** ${dayName}\n`;
  text += `🌤 **Ob-havo:** ${weatherText}\n\n`;
  text += `🎯 **Bugungi 3 ta asosiy nishon:**\n`;
  text += `1. 🏫 **Maktab & Dars:** ${scheduleNote}\n`;
  text += `2. 🏋️ **Calisthenics:** ${fitnessGoal}\n`;
  text += `3. 🇬🇧 **Ingliz tili & IT:** Yangi C1 so'zlar va toza kod yozish\n\n`;
  text += `💧 **Birinchi vazifa:** 1 stakan toza suv ichib, tanani uyg'oting!\n`;
  text += `🚗 **Orzu:** Cadillac Escalade fondi kutmoqda.\n\n`;
  text += `🎙 _Quyidagi 45 soniyalik ovozli brifingni tinglang:_ 👇`;

  // 6. Generate voice buffer
  let voiceBuffer = null;
  try {
    voiceBuffer = await tts.textToVoice(audioScript, 'uz');
  } catch (err) {
    console.error('Tongi brifing ovoz xatosi:', err.message);
  }

  return {
    text,
    audioScript,
    voiceBuffer,
  };
}

module.exports = {
  generateMorningBriefing,
};
