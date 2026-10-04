const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const RESUME_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Profile', 'Samar_Resume.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

async function generateHarvardResume() {
  const prompt = `Sen — Silicon Valley va Harvard karyera markazining etakchi IT rezyume (CV) ekspertisan.
Samar ismli 16 yoshli iqtidorli o'zbek dasturchisi uchun xalqaro darajadagi 1 sahifalik kuchli Rezyume (CV) tayyorlab berishing kerak.

Samar haqida ma'lumotlar:
- Ismi: Samar Baxtiyorov
- Yoshi: 16 yoshda
- Joylashuv: Qashqadaryo, O'zbekiston
- Kasbi: Full-Stack Developer, AI Engineer va O'qituvchi (Tutor)
- O'qituvchilik: TECH BRIDGE Academy va Zamin o'quv markazida bolalarga dasturlash va kompyuter fanlaridan dars beradi.
- Texnologiyalar: JavaScript, Node.js, Express, Python, Google Gemini AI API, PostgreSQL, Supabase, Telegram Bot API, Git, TailwindCSS.
- Sport & Intizom: Calisthenics atleti (15+ pull-ups, 30+ push-ups), temir intizom.
- Ingliz tili: C1 darajasi (Faol o'rganmoqda).
- Loyihalari: Anora AI (Personal Second Brain System), Solo Leveling RPG Engine, FAANG LeetCode Arena.

Rezyume talablari:
1. Harvard / Silicon Valley toza 1-sahifalik strukturasida bo'lsin.
2. Har bir tajriba faqat vazifani emas, natijani (Action Verb + Metric + Result) ko'rsatsin.
3. Ingliz tilida (Global bozor uchun) va O'zbek tilidagi qisqa tarjimasi bilan bo'lsin.
4. Professional, ixcham va hayratlanarli darajada kuchli yozilsin.`;

  let cvText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        cvText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!cvText) {
    cvText = `# SAMAR BAXTIYOROV\nFull-Stack Developer & AI Engineer\nNode.js, JavaScript, Python, Gemini API`;
  }

  try {
    const dir = path.dirname(RESUME_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(RESUME_FILE, cvText, 'utf8');
  } catch (err) {
    console.error('Resume save error:', err.message);
  }

  rpg.addXp('intellect', 50, 'Xalqaro standartdagi CV yaratildi');

  return {
    cvText,
    filePath: RESUME_FILE,
  };
}

module.exports = {
  generateHarvardResume,
};
