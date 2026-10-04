const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const INSTA_LOG = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Media', 'Instagram_Kontent.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

async function generateReelsScript(topic) {
  const prompt = `Sen — Samar (16 yoshli kuchli dasturchi va repetitor)ning Shaxsiy Instagram Reels va Shorts Ssenariynavisissan.
Samar Instagram uchun quyidagi mavzuda Reels olmoqchi:
"${topic}"

Ushbu mavzuda ko'p ko'riladigan (viral) va professional Reels ssenariysini tuzib ber:

Tuzilishi:
🎬 REELS NOMI: ...
⏱ Davomiyligi: 30-45 soniya

1. 🎣 HOOK (0-3 soniya): [Odamlarni to'xtatadigan qiziqarli so'z va kadr harakati]
2. ⚠️ MUAMMO (3-15 soniya): [Ko'pchilik qiladigan xato yoki qiyinchilik]
3. 💡 YECHIM (15-35 soniya): [Samarning professional maslahati / kod yoki uslub ko'rsatilishi]
4. 🚀 CTA / HARAKATGA CHAQIRUV (35-45 soniya): [Direct'ga "DARS" deb yozish yoki kuzatib borish]
5. 📝 TAYYOR CAPTION (POST MATNI) VA HASHTAGLAR (#dasturlash #it #javascript #tutor va h.k.).`;

  let reelsText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        reelsText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!reelsText) {
    reelsText = `🎬 Reels: ${topic}\n1. Hook: Bilasizmi?...\n2. Maslahat: ...`;
  }

  logToObsidian(`Reels Ssenariy: ${topic}`, reelsText);
  rpg.addXp('intellect', 40, `Instagram Reels ssenariysi tayyorlandi: ${topic.slice(0, 30)}`);

  return { reelsText };
}

async function generateCarouselPost(topic) {
  const prompt = `Sen — Samarning Instagram Karusel Post (Slide) Dizayneri va Muallifisan.
Mavzu: "${topic}"

Instagram uchun 5-6 slayddan iborat o'quvchi saqlab oladigan (Save & Share) foydali karusel post tuzib ber:
- Slayd 1: Muqova (Jozibali sarlavha)
- Slayd 2: Asosiy fikr 1
- Slayd 3: Asosiy fikr 2 / Kod namunasi
- Slayd 4: Asosiy fikr 3
- Slayd 5: Xulosa va Call to Action
- Post matni va Hashtaglar.`;

  let carouselText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        carouselText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  logToObsidian(`Karusel Post: ${topic}`, carouselText || topic);
  rpg.addXp('intellect', 40, `Instagram Karusel posti tayyorlandi: ${topic.slice(0, 30)}`);

  return { carouselText };
}

function handleDirectKeyword(keyword) {
  const clean = String(keyword || '').toUpperCase().trim();
  if (clean === 'DARS' || clean.includes('KURS')) {
    return `Assalomu alaykum! 🌟
Samarning dasturlash va IT kurslariga qiziqqaningiz uchun rahmat!
🏫 Darslarimiz TECH BRIDGE Academy va Zamin o'quv markazida o'tiladi.
📚 Yo'nalishlar: Dasturlash asoslari, JavaScript, Node.js, Veb-dasturlash va Algoritmlar.
⏰ Dars vaqtlari: Dushanba, Chorshanba, Juma kunlari.
Qo'shimcha savollaringiz bo'lsa yoki ro'yxatdan o'tish uchun telefon raqamingizni qoldiring, ustoz Samar shaxsan aloqaga chiqadi! 🚀`;
  }

  if (clean === 'INFO' || clean.includes('PORTFOLIO')) {
    return `Assalomu alaykum! Men Samar — 16 yoshli Full-Stack dasturchi va IT ustozi.
Loyihalarim, natijalarim va portfolio bilan tanishish uchun botimiz: @samara_my_ai_bot`;
  }

  return `Assalomu alaykum! Xabaringiz uchun rahmat. Samar tez orada sizga javob yozadi.`;
}

function logToObsidian(title, content) {
  try {
    const dir = path.dirname(INSTA_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const entry = `\n\n## 📸 ${title} (${dateStr})\n${content}\n\n---\n`;
    fs.appendFileSync(INSTA_LOG, entry, 'utf8');
  } catch (_) {}
}

module.exports = {
  generateReelsScript,
  generateCarouselPost,
  handleDirectKeyword,
};
