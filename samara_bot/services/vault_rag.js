const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const VAULT_DIR = path.join(__dirname, '..', '..', 'Obsidian_Vault');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, fileList);
    } else if (item.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function recallFromVault(userQuestion) {
  const allFiles = getAllMarkdownFiles(VAULT_DIR);
  const words = userQuestion.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  // Score files by keyword match
  const scored = [];
  for (const f of allFiles) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const lower = content.toLowerCase();
      let matchCount = 0;
      for (const w of words) {
        if (lower.includes(w)) matchCount += 1;
      }
      if (matchCount > 0) {
        scored.push({ file: path.relative(VAULT_DIR, f), content: content.slice(0, 2000), score: matchCount });
      }
    } catch (_) {}
  }

  scored.sort((a, b) => b.score - a.score);
  const topDocs = scored.slice(0, 5);

  let contextText = '';
  for (const doc of topDocs) {
    contextText += `\n\n--- HUJJAT: ${doc.file} ---\n${doc.content}\n`;
  }

  const prompt = `Sen — Samarning shaxsiy Ikkinchi Miyasi (Second Brain AI) va Obsidian xotirasisan.
Samar sendan o'zining xotirasidagi ma'lumotni so'ramoqda:
Savol: "${userQuestion}"

Quyida Samarning Obsidian xotira bazasidan topilgan eng tegishli hujjatlar keltirilgan:
${contextText || 'Hech qanday to\'g\'ridan-to\'g\'ri mos keluvchi qayd topilmadi.'}

Ushbu ma'lumotlarga tayangan holda Samarga aniq, to'g'ri, samimiy va xolis javob ber. Qaysi fayldan olinganini ham muloyim eslatib o't.
Agar xotirada bu haqda ma'lumot topilmagan bo'lsa, yolg'on to'qimasdan "Bu haqda xotiramizda ma'lumot topilmadi" deb ayt.`;

  let answer = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        answer = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!answer) {
    answer = `🔍 Xotiradan topilgan natijalar:\n${topDocs.map((d) => `• ${d.file}`).join('\n')}`;
  }

  rpg.addXp('intellect', 30, 'Xotiradan ma\'lumot qidirildi');

  return {
    answer,
    matchedFiles: topDocs.map((d) => d.file),
  };
}

module.exports = {
  recallFromVault,
};
