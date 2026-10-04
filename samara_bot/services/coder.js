const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

/**
 * Checks if a message looks like code or a programming query
 */
function isCodeQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // Explicit keywords
  if (lower.startsWith('/kod') || lower.startsWith('/debug')) return true;
  if (lower.includes('kodimda xato') || lower.includes('nima xato') || lower.includes('kodni tekshir')) return true;

  // Code indicators
  if (text.includes('```')) return true;
  if (text.includes('function(') || text.includes('const ') || text.includes('def ') || text.includes('console.log')) return true;
  if (text.includes('TypeError') || text.includes('SyntaxError') || text.includes('ReferenceError') || text.includes('Exception:')) return true;

  return false;
}

/**
 * Saves code snippet and solution to Obsidian
 */
function recordCodeSnippet(title, solution) {
  try {
    const kDir = path.join(VAULT_PATH, 'Knowledge');
    if (!fs.existsSync(kDir)) fs.mkdirSync(kDir, { recursive: true });
    const file = path.join(kDir, 'Dasturlash_Qaydlari.md');

    const entry = `\n### 💻 ${title} (${obsidian.getTodayString()})\n${solution}\n---\n`;
    fs.appendFileSync(file, entry, 'utf8');
  } catch (err) {
    console.warn('Code snippet save error:', err.message);
  }
}

/**
 * Reviews and debugs code with senior-level clarity
 */
async function debugCode(aiService, userId, codeText) {
  const prompt = `Sen Anora AI — Samarning shaxsiy Katta Dasturchi Ustozisan (Senior Software Engineer & Mentor).
Samar 16 yoshda, u kelajakda kuchli dasturchi bo'lishga intilmoqda.

Foydalanuvchi quyidagi kod yoki xatolik bo'yicha yordam so'ramoqda:
\`\`\`
${codeText}
\`\`\`

Iltimos, juda aniq, sodda va professional tahlil ber:
1. 🐞 **Xatolik qayerda va nega ro'y bergan:** (1-2 gapda aniq sababi)
2. ✨ **To'g'rilangan toza kod:** (To'liq va to'g'ri ishlashga tayyor kod bloki)
3. 💡 **Senior Developer maslahati:** (Kodni yanada tez, toza yoki professional qilish bo'yicha 1 ta oltin qoida)

Javobing tushunarli, aniq va amaliy bo'lsin. Keraksiz uzun nazariyani chetga sur.`;

  const { replyText } = await aiService.processUserMessage(userId, prompt);

  // Extract a brief title and save to Obsidian
  const title = codeText.split('\n')[0].substring(0, 50).replace(/[`*#]/g, '') || 'Kod tahlili';
  recordCodeSnippet(title, replyText);

  return replyText;
}

module.exports = {
  isCodeQuery,
  debugCode,
};
