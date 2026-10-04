const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const QUIZ_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'CRM', 'Dars_Testlari.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

async function generateClassroomQuiz(topic) {
  const prompt = `Sen — Samar (TECH BRIDGE Academy va Zamin o'quv markazining 16 yoshli iqtidorli ustozi)ning Shaxsiy Metodisti va Test Generatorisan.
Samar o'quvchilariga bugungi dars uchun quyidagi mavzuda test yoki amaliy topshiriq tuzib berishingni so'radi:
"${topic}"

Ushbu mavzuda o'quvchilar (10-16 yosh oralig'idagi yoshlar) uchun 5 ta qiziqarli, mantiqiy va amaliy test savollarini tuzib ber:

Tuzilishi:
📝 DARS MAVZUSI: [Mavzu nomi]
Daraja: Boshlang'ichdan o'rtachagacha

1-5 gacha savollar:
- Har bir savolda 4 ta variant (A, B, C, D)
- Hayotiy va dasturchilik amaliyotiga yaqin misollar

Oxirida:
🔑 TO'G'RI JAVOBLAR VA IZOHLAR (O'qituvchi uchun):
- Har bir to'g'ri javobning qisqa tushuntirishi.
💡 Ustoz Samar uchun darsda o'tkazishga 1 ta interaktiv o'yin yoki metodik tavsiya.`;

  let quizText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        quizText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!quizText) {
    quizText = `📝 Test: ${topic}\n1. Savol...`;
  }

  try {
    const dir = path.dirname(QUIZ_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const entry = `\n\n## 📝 Test: ${topic} (${dateStr})\n${quizText}\n\n---\n`;
    fs.appendFileSync(QUIZ_FILE, entry, 'utf8');
  } catch (err) {
    console.error('Quiz save error:', err.message);
  }

  rpg.addXp('intellect', 40, `O'quvchilar uchun test tuzildi: ${topic.slice(0, 30)}`);

  return {
    quizText,
  };
}

module.exports = {
  generateClassroomQuiz,
};
