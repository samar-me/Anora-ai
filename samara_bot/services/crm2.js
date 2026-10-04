const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'CRM', 'Dars_Hisobotlari.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

async function generateParentReports(lessonNotes) {
  const prompt = `Sen — Samarbek (16 yoshli iqtidorli repetitor va dasturchi ustoz)ning shaxsiy yordamchisisan.
Samar bugungi o'tgan darsi haqida quyidagi xomaki qisqa qaydlarini yozdi:
"${lessonNotes}"

Ushbu qaydlar asosida har bir o'quvchining ota-onasi uchun alohida, juda samimiy, madaniyatli, hurmat bilan to'la va professional O'zbek tilidagi Telegram/SMS hisobot xabarini tuzib ber.

Format:
Har bir o'quvchi uchun alohida nusxalab olishga qulay blok ajrat:

---
👤 O'quvchi: [Ismi]
📱 Ota-onaga xabar (nusxalab yuborish uchun):
"Assalomu alaykum, hurmatli ota-ona!
Men Samarbek ustozman. Bugungi darsimiz bo'yicha farzandingiz [Ismi]ning qisqa hisoboti:
[Bajarilgan ishlar, mavzuni o'zlashtirishi, intizomi va amaliy maslahat].
Baho / Natija: ...
Kelgusi darsimiz: ...
Farzandingiz kelajagi uchun birgalikda mehnat qilishdan xursandmiz!"
---

Agar o'quvchi sust qatnashgan bo'lsa, ota-onani ranjitmasdan, lekin jiddiy e'tibor qaratish kerakligini muloyim tushuntir.`;

  let resultText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        resultText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!resultText) {
    resultText = `Assalomu alaykum! Bugungi dars hisoboti: ${lessonNotes}`;
  }

  // Award RPG XP
  const xpRes = rpg.addXp('intellect', 50, 'O\'quv markazi dars hisoboti tayyorlandi');

  // Log to Obsidian
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const entry = `\n\n## 👨‍🏫 Dars Hisoboti: ${dateStr}\n**Asl qayd:** ${lessonNotes}\n\n**Ota-onalar hisobotlari:**\n${resultText}\n\n---\n`;
    fs.appendFileSync(OBSIDIAN_FILE, entry, 'utf8');
  } catch (_) {}

  return {
    reportsText: resultText,
    xpRes,
  };
}

module.exports = {
  generateParentReports,
};
