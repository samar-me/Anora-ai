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
  const dayIndex = now.getDay();
  const dayName = DAYS_UZ[dayIndex];
  const isSunday = dayIndex === 0;
  const isAcademyDay = dayIndex === 1 || dayIndex === 3 || dayIndex === 5; // Dush, Chor, Juma
  const isLongSchool = dayIndex === 1 || dayIndex === 2; // Dush, Sesh 12:50 da tugaydi
  const schoolEndTime = isLongSchool ? '12:50' : '12:05'; // Chor, Pay, Juma, Shanba 12:05 da tugaydi

  if (isSunday) {
    scheduleNote = "Bugun yakshanba — maktab yo'q! Haftalik strategik audit, chuqur loyihalar va oila kuni.";
    speechSchedule = "Bugun yakshanba, maktab yo‘q. Haftalik audit va oilangiz bilan dam olish kuni.";
  } else if (isAcademyDay) {
    scheduleNote = `Maktab 08:00 dan ${schoolEndTime} gacha (07:40 da chiqish). Soat 14:00 da TECH BRIDGE Academy (13:20 da yo'lga chiqish), soat 18:00 da Zamin o'quv markazida darsingiz bor.`;
    speechSchedule = `Soat 08:00 dan ${schoolEndTime} gacha maktab. Soat 14:00 da Tech Bridge, soat 18:00 da Zamin o‘quv markazida darsingiz bor.`;
  } else {
    // Sesh, Pay, Shan
    scheduleNote = `Maktab 08:00 dan ${schoolEndTime} gacha (07:40 da chiqish). Tushdan keyin: Deep Work IT (Node.js & LeetCode), Calisthenics va kitob mutolaasi.`;
    speechSchedule = `Soat 08:00 dan ${schoolEndTime} gacha maktab. Tushdan keyin esa chuqur dasturlash, Leetcode va turnik mashqlari vaqti.`;
  }

  // 3. Calisthenics goal
  const fitnessGoal = "10-15 ta turnik va 25 ta anjimaniya bilan qon aylanishini kuchaytiramiz.";

  // 4. TTS audio script
  const audioScript = `Xayrli tong, Samar! Bugun ${dayName}. ${weatherText}. Bugungi jadvalimiz: ${speechSchedule} Sportda: ${fitnessGoal} 07:40 da maktabga yo‘lga chiqamiz. O‘rningizdan tetik turing, bir stakan toza suv iching. Qora Cadillac Escalade va moliyaviy erkinlik sari yana bir g‘alabali kun boshlandi. Kuningiz barakali o‘tsin, chempion!`;

  // 5. Formatted Markdown text
  let text = `🌅 **XAYRLI TONG, SAMAR! (TONGI BRİFİNG)** 🦁\n\n`;
  text += `📅 **Bugun:** ${dayName}\n`;
  text += `🌤 **Ob-havo:** ${weatherText}\n\n`;
  text += `🎯 **Bugungi aniq jadval va nishonlar:**\n`;
  text += `1. 🏫 **Maktab:** 07:40 yo'lga chiqish, dars 08:00 — **${schoolEndTime}** gacha\n`;
  if (isAcademyDay) {
    text += `2. 🚀 **TECH BRIDGE Academy:** 14:00 — 16:00 (13:20 da yo'lga chiqish, 40 min yo'l)\n`;
    text += `3. 👨‍🏫 **Zamin O'quv Markazi:** 18:00 — 19:30 (Bolalarga dars berish)\n`;
  } else if (!isSunday) {
    text += `2. 💻 **Deep Work & Kod:** 14:00 — 16:30 (Node.js, full-stack & LeetCode)\n`;
    text += `3. 🏋️ **Calisthenics:** 16:30 — 17:30 (Turnik, anjimaniya, brusya)\n`;
  }
  text += `\n💧 **Birinchi vazifa:** 1 stakan toza suv ichib, miyani uyg'oting!\n`;
  text += `🚗 **Katta orzu:** Cadillac Escalade jamg'arma fondi kutmoqda.\n\n`;
  text += `🎙 _Quyidagi 45 soniyalik shaxsiy ovozli brifingni tinglang:_ 👇`;

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
