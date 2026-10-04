const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const IDEAS_DIR = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Ideas');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

function ensureDir() {
  if (!fs.existsSync(IDEAS_DIR)) {
    fs.mkdirSync(IDEAS_DIR, { recursive: true });
  }
}

function cleanFilename(str) {
  return str
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

async function analyzeAndSaveIdea(userIdeaText) {
  ensureDir();

  const prompt = `Sen — Anora AI, Samar (16 yoshli iqtidorli dasturchi va bo'lajak startap asoschisi)ning Startap Inkubatori va Texnologik Maslahatchisisan.

Samar senga quyidagi startap yoki loyiha g'oyasini aytdi:
"${userIdeaText}"

Ushbu g'oyani professional startap inkubator (Y Combinator uslubida, lekin 16 yoshli O'zbekistonlik iqtidorli dasturchi imkoniyatlariga moslab) tahlil qilib ber.

Javobingni quyidagi qat'iy tuzilmada va samimiy, ruhlantiruvchi o'zbek tilida ber:

📌 Loyiha nomi: [Qisqa va jozibador nom]
🎯 Muammo (Problem): [Bu loyiha kimning qanday og'riqli muammosini hal qiladi?]
💡 Yechim & MVP (Solution): [Birinchi 1-2 hafta ichida ishlab chiqish kerak bo'lgan eng asosiy minimal funksiyalar (MVP)]
🛠 Tavsiya etilgan Tech Stack: [Node.js, Telegram Bot, Next.js, Supabase, Tailwind, AI API va h.k.]
💰 Monetizatsiya (Daromad modeli): [Qanday yo'llar bilan pul topish mumkin? Obuna, komissiya, B2B...]
🚀 Bugungi birinchi 3 ta amaliy qadam:
1. ...
2. ...
3. ...
💬 Anora maslahati: [Samarga samimiy professional maslahat va daldang]`;

  let analysisText = '';
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        analysisText = response.text.trim();
        break;
      }
    } catch (e) {
      console.warn(`Incubator ${model} xatosi:`, e.message);
    }
  }

  if (!analysisText) {
    analysisText = `📌 Loyiha: Yangi g'oya\n\n🎯 G'oya matni: ${userIdeaText}\n\n💡 MVP: Dastlabki prototipni yaratish tavsiya etiladi.`;
  }

  // Extract title or use timestamp
  const titleMatch = analysisText.match(/Loyiha nomi:\s*([^\n\r]+)/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : 'Yangi_Goya';
  const fileName = `${cleanFilename(rawTitle)}_${Date.now().toString().slice(-4)}.md`;
  const filePath = path.join(IDEAS_DIR, fileName);

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const mdContent = `---
type: startup_idea
status: incubation
date: ${dateStr}
tags: [startup, idea, tech, mvp]
---

# 💡 ${rawTitle}

**Kiritilgan sana:** ${dateStr}
**Asl g'oya:**
> "${userIdeaText}"

---

${analysisText}

---
*Ushbu g'oya Anora AI Startap Inkubatori tomonidan avtomatik tahlil qilindi va Obsidian xotirasiga kiritildi.*
`;

  fs.writeFileSync(filePath, mdContent, 'utf8');

  return {
    title: rawTitle,
    analysisText,
    fileName,
    filePath,
  };
}

function getIdeasSummary() {
  ensureDir();
  const files = fs.readdirSync(IDEAS_DIR).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    return `💡 **G'oyalar Inkubatori:**\nHozircha saqlangan startap g'oyalari yo'q.\n\nYangi g'oya kiritish uchun: «Anora, yangi g'oya: ...» deb yozing yoki \`/goya <g'oya>\` buyrug'idan foydalaning!`;
  }

  let text = `💡 **STARTAP VA G'OYALAR INKUBATORI (Obsidian Ideas):**\n\n`;
  text += `Jami saqlangan g'oyalar: **${files.length} ta**\n\n`;

  for (const f of files.slice(-5)) {
    const clean = f.replace('.md', '').replace(/_\d{4}$/, '').replace(/_/g, ' ');
    text += `• 📄 **${clean}** (\`Obsidian_Vault/Ideas/${f}\`)\n`;
  }

  text += `\n_Yangi g'oyani kiritish uchun: «Anora, yangi g'oya keldi: ...» deb yozing!_`;
  return text;
}

module.exports = {
  analyzeAndSaveIdea,
  getIdeasSummary,
};
