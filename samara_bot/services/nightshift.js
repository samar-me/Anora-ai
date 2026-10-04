const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Knowledge', 'Tungi_Tahlil.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

async function runNightShift() {
  const prompt = `Sen — 16 yoshli iqtidorli dasturchi Samarning Tungi Sun'iy Intellekt Avtopilotisan (Autonomous Night Shift Agent).
Samar uxlayotgan paytda dunyo texnologiya olamida (Silicon Valley, Node.js, AI, Calisthenics va Dasturchilik) yuz berayotgan eng muhim 3 ta amaliy trendni tahlil qilib, ertalabki stoliga tayyorlab qo'yishing kerak.

Tungi hisobot tuzilishi:
🌙 TUNGI AVTOPILOT HISOBOTI (NIGHT SHIFT INTELLIGENCE)
1. 💻 Backend & Node.js Insight: [Bugungi kunda har bir Senior dasturchi bilishi shart bo'lgan 1 ta muhim texnik tavsiya / pattern]
2. 🤖 AI & Engineering Trend: [Sun'iy intellekt agentlari yoki LLM bilan ishlashda 1 ta amaliy yutuq]
3. 🦾 Sport & Recovery: [Calisthenics mashqlaridan so'ng mushaklarni tiklash va asab tizimi quvvati bo'yicha 1 ta tavsiya]
4. 💡 Samar uchun bugungi kunlik "Super-Kuch" (Bir jumla daldasi).

Juda ixcham, lo'nda, professional va ilhomlantiruvchi o'zbek tilida yoz.`;

  let reportText = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        reportText = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!reportText) {
    reportText = `🌙 Tungi tahlil: Node.js tizimlarida arxitekturani toza saqlash va bugungi 8 soatlik to'liq uyqu orqali quvvat to'plash tavsiya etiladi.`;
  }

  // Save to Obsidian
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const content = `# 🌙 Tungi Avtopilot Tahlili (${dateStr})\n\n${reportText}\n\n---\n*Anora AI Night Shift tomonidan avtomatik tayyorlandi.*\n`;
    fs.writeFileSync(OBSIDIAN_FILE, content, 'utf8');
  } catch (err) {
    console.error('Tungi tahlil saqlash xatosi:', err.message);
  }

  rpg.addXp('engineering', 50, 'Tungi avtopilot tahlili bajarildi');

  return {
    reportText,
  };
}

module.exports = {
  runNightShift,
};
