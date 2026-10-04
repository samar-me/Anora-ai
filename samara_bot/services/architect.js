const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const PROJECTS_DIR = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Projects');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

function cleanFilename(str) {
  return str
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 45);
}

async function designSystemArchitecture(projectIdeaText) {
  const prompt = `Sen — Google va Netflix darajasidagi Principal Software Architectsan.
Samar ismli 16 yoshli iqtidorli o'zbek dasturchisi sayr qilayotganda quyidagi loyiha arxitekturasi g'oyasini aytib berdi:
"${projectIdeaText}"

Ushbu loyiha uchun professional dasturiy tizim arxitekturasini (System Design) ishlab chiq:
1. 📌 Loyiha nomi va qisqa xulosa
2. 📐 Tizim Arxitekturasi (Mermaid diagrammasi, graph TD):
\`\`\`mermaid
...
\`\`\`
3. 🗄 Ma'lumotlar Bazasi Tuzilishi (PostgreSQL / Supabase jadvallari, primary/foreign keys)
4. 🔌 Asosiy API Endpointlari (RESTful yoki WebSocket):
- GET /api/...
- POST /api/...
5. 📁 Tavsiya etilgan Loyiha Papka Tuzilishi (Clean Architecture):
6. ⚡ Masshtablash va Xavfsizlik (Caching, Rate Limiting, JWT Auth)
7. 🚀 Samar uchun Senior maslahati: Birinchi qaysi fayldan kod yozishni boshlash kerak?`;

  let archDoc = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        archDoc = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!archDoc) {
    archDoc = `# 📐 Loyiha Arxitekturasi\n\n${projectIdeaText}\n\nArxitektura tayyorlanmoqda.`;
  }

  // Extract title
  const titleMatch = archDoc.match(/Loyiha nomi[:\s]*([^\n\r]+)/i);
  const rawTitle = titleMatch ? titleMatch[1].replace(/[*#]/g, '').trim() : 'Loyiha_Arxitekturasi';
  const fileName = `${cleanFilename(rawTitle)}_Architecture.md`;
  const filePath = path.join(PROJECTS_DIR, fileName);

  try {
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    fs.writeFileSync(filePath, archDoc, 'utf8');
  } catch (err) {
    console.error('Arxitektura saqlash xatosi:', err.message);
  }

  const xpRes = rpg.addXp('engineering', 80, `Tizim arxitekturasi loyihalandi: ${rawTitle}`);

  return {
    title: rawTitle,
    archDoc,
    fileName,
    filePath,
    xpRes,
  };
}

module.exports = {
  designSystemArchitecture,
};
