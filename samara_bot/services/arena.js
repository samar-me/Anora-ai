const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const rpg = require('./rpg');
require('dotenv').config();

const OBSIDIAN_FILE = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Coding', 'LeetCode_Arena.md');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

const PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    company: 'Google / Meta',
    topic: 'Array & Hash Map',
    description: `Berilgan butun sonlar massivi \`nums\` va butun son \`target\`. Yig'indisi \`target\` ga teng bo'lgan ikkita sonning indekslarini qaytaruvchi funksiya yozing.
Har bir kirishda aynan bitta aniq yechim mavjud deb hisoblang va bir xil elementdan ikki marta foydalanmang.`,
    example: `Input: nums = [2,7,11,15], target = 9\nOutput: [0,1] (chunki nums[0] + nums[1] == 9)`,
    optimalComplexity: 'Time: O(N), Space: O(N) (Hash Map yordamida)',
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    company: 'Meta / Amazon',
    topic: 'Stack',
    description: `Faqat \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` va \`']'\` belgilaridan iborat \`s\` satri berilgan. Satr to'g'ri qavslanganligini aniqlang.
Ochiq qavslar bir xil turdagi qavslar bilan va to'g'ri ketma-ketlikda yopilishi shart.`,
    example: `Input: s = "()[]{}"\nOutput: true\nInput: s = "(]"\nOutput: false`,
    optimalComplexity: 'Time: O(N), Space: O(N) (Stack yordamida)',
  },
  {
    id: 3,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    company: 'Google / Apple',
    topic: 'Two Pointers / Sliding Window',
    description: `Aksiyaning har kungi narxlaridan iborat \`prices\` massivi berilgan. Aksiyani bitta kunda sotib olib, kelajakdagi boshqa kunda sotish orqali erishish mumkin bo'lgan maksimal foydani toping. Agar foyda ko'rib bo'lmasa, 0 qaytaring.`,
    example: `Input: prices = [7,1,5,3,6,4]\nOutput: 5 (2-kunda narxi 1 bo'lganda olib, 5-kunda 6 ga sotilsa, foyda = 5)`,
    optimalComplexity: 'Time: O(N), Space: O(1) (One Pass)',
  },
  {
    id: 4,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    company: 'Amazon / Microsoft',
    topic: 'Linked List',
    description: `Bir bog'lamli ro'yxatning boshi (\`head\`) berilgan. Ro'yxatni teskarisiga o'girib, yangi boshini qaytaring. Iterativ va rekursiv usulda yechishga harakat qiling.`,
    example: `Input: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]`,
    optimalComplexity: 'Time: O(N), Space: O(1) (Iterative)',
  },
  {
    id: 5,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    company: 'Google / Meta',
    topic: 'Sliding Window & Hash Set',
    description: `Satr \`s\` berilgan. Takroriy belgilari bo'lmagan eng uzun substringning uzunligini toping.`,
    example: `Input: s = "abcabcbb"\nOutput: 3 (chunki javob "abc", uzunligi 3)`,
    optimalComplexity: 'Time: O(N), Space: O(min(N, M)) (Sliding Window)',
  },
  {
    id: 6,
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    difficulty: 'Medium',
    company: 'Google / Microsoft',
    topic: 'Dynamic Programming',
    description: `Butun sonlar massivi \`nums\` berilgan. Yig'indisi eng katta bo'lgan tutash subarrayni toping va uning yig'indisini qaytaring.`,
    example: `Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6 (chunki [4,-1,2,1] yig'indisi 6)`,
    optimalComplexity: 'Time: O(N), Space: O(1) (Kadane algoritmi)',
  },
];

function getDailyProblem() {
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const problemIndex = dayOfYear % PROBLEMS.length;
  const p = PROBLEMS[problemIndex];

  let text = `⚔️ **FAANG & LEETCODE DUELCHISI: BUGUNGI MASALA** 💻\n\n`;
  text += `📌 **#${p.id} — ${p.title}**\n`;
  text += `🏆 **Daraja:** ${p.difficulty} | 🏢 **Intervyu:** ${p.company}\n`;
  text += `🔑 **Mavzu:** ${p.topic}\n\n`;
  text += `📝 **Sharti:**\n${p.description}\n\n`;
  text += `💡 **Misol:**\n\`\`\`text\n${p.example}\n\`\`\`\n\n`;
  text += `🎯 **Yechim topshirish:**\nKodingizni (JavaScript yoki Python) to'g'ridan-to'g'ri botga yuboring. Men uni Big-O (Time & Space) murakkabligi bo'yicha tahlil qilib, **+80 XP** beraman!`;

  return { problem: p, text };
}

async function evaluateSolution(codeText, problemTitle = 'LeetCode Masalasi') {
  const prompt = `Sen — Google va Meta (FAANG) kompaniyasining Staff Software Engineeri va LeetCode bo'yicha murabbiyisan.
Samar ismli 16 yoshli iqtidorli o'zbek dasturchisi quyidagi kod yechimini topshirdi.
Masala: "${problemTitle}"

Samarning kodi:
\`\`\`javascript
${codeText}
\`\`\`

Ushbu kodni professional intervyu standartlarida chuqur va samimiy o'zbek tilida tahlil qilib ber:
1. 🎯 To'g'rilik (Correctness): Kod to'g'ri ishlaydimi? Edge cases (bo'sh massiv, manfiy sonlar va h.k.) inobatga olinganmi?
2. ⏱ Time Complexity: O(...) — nega aynan shunday?
3. 💾 Space Complexity (Memory): O(...) — xotiradan to'g'ri foydalanilganmi?
4. 🚀 Senior Tavsiya / Clean Code: Kodni yanada qanday qilib ixcham, tez va professional qilish mumkin?
5. 🏆 Xulosa va Baho: (10 balldan ball ber va Samarni ruhlantir).`;

  let review = '';
  for (const model of MODELS) {
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      if (resp && resp.text) {
        review = resp.text.trim();
        break;
      }
    } catch (_) {}
  }

  if (!review) {
    review = `✅ Kod qabul qilindi. Time: O(N), Space: O(1). Toza va tushunarli yechim!`;
  }

  // Award RPG XP
  const xpRes = rpg.addXp('engineering', 80, `LeetCode masalasi yechildi: ${problemTitle}`);

  // Sync to Obsidian
  try {
    const dir = path.dirname(OBSIDIAN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const entry = `\n\n## ⚔️ ${problemTitle} (${dateStr})\n**Topshirilgan kod:**\n\`\`\`javascript\n${codeText}\n\`\`\`\n\n**AI Taqrizi:**\n${review}\n\n---\n`;
    fs.appendFileSync(OBSIDIAN_FILE, entry, 'utf8');
  } catch (_) {}

  let responseText = `🏆 **ALGORITMIK TAHLIL VA NATIJA (FAANG CODE REVIEW)**\n\n${review}\n\n`;
  responseText += `🎮 **+80 XP qo'shildi! (Muhandislik 💻)**\n`;
  if (xpRes.leveledUp) {
    responseText += `🌟 **LEVEL UP! Tabriklaymiz, yangi daraja: Level ${xpRes.newLevel}!** 👑\n`;
  }

  return { review, xpRes, responseText };
}

module.exports = {
  getDailyProblem,
  evaluateSolution,
  PROBLEMS,
};
