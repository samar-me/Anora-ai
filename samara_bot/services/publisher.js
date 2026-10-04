const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

async function generateTechPost(topicOrInsight) {
  const prompt = `Sen — 16 yoshli iqtidorli dasturchi va kelajakdagi yirik texnologik lider Samarning shaxsiy Tech Influencer va Content Strategisisan.
Samar bugun o'rgangan bilim yoki erishgan yutug'i haqida shunday dedi:
"${topicOrInsight}"

Ushbu mavzu asosida Samarning shaxsiy Telegram kanali yoki LinkedIn profili uchun juda jozibador, ilhomlantiruvchi, professional va amaliy texnik post yozib ber.

Post talablari:
1. Sarlavha: E'tiborni tortuvchi va intriga bilan (masalan: "Dasturchilar ko'p adashadigan 1 ta narsa...", "Bugun o'zimni sinab ko'rdim...")
2. Asosiy mag'iz: Texnik yoki amaliy jihatni oddiy, tushunarli va qiziqarli tilda ochib berish.
3. Kichik kod namunasi yoki hayotiy misol (agar texnik mavzu bo'lsa).
4. Xulosa va savol (obunachilarni fikr bildirishga undovchi Call To Action).
5. Teglar: #tech #programming #javascript #growth va h.k.

Samimiy, intizomli va intiluvchan o'zbek yigiti uslubida bo'lsin.`;

  let postText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        postText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!postText) {
    postText = `🚀 Bugungi texnik xulosa:\n\n${topicOrInsight}\n\nDoimiy o'rganishda davom etamiz!`;
  }

  const xpRes = rpg.addXp('intellect', 40, `Texnik post tayyorlandi: ${topicOrInsight.slice(0, 30)}`);

  return {
    postText,
    xpRes,
  };
}

module.exports = {
  generateTechPost,
};
