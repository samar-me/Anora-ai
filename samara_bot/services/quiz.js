const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const SCORE_FILE = path.join(__dirname, 'quiz_score.json');

const VOCAB_BANK = [
  {
    word: 'Perseverance',
    pronunciation: '/ˌpɜː.sɪˈvɪə.rəns/',
    question: '🎯 **"Perseverance"** so\'zining to\'g\'ri ma\'nosini toping:',
    options: [
      { text: 'A) Sabr-toqat va qat\'iyat', id: 'A', correct: true },
      { text: 'B) Dangasalik va loqaydlik', id: 'B', correct: false },
      { text: 'C) Qo\'rquv va xavotir', id: 'C', correct: false },
    ],
    explanation: '✅ **Perseverance** — qiyinchiliklarga qaramay maqsad sari qat\'iyat bilan intilish degani.\nMisol: *"Through perseverance, he achieved IELTS 8.0."*',
  },
  {
    word: 'Resilience',
    pronunciation: '/rɪˈzɪl.jəns/',
    question: '🎯 **"Resilience"** so\'zining to\'g\'ri ma\'nosini toping:',
    options: [
      { text: 'A) Qiyinchilikdan so\'ng qayta oyoqqa turish (Chidamlilik)', id: 'A', correct: true },
      { text: 'B) Tez taslim bo\'lish', id: 'B', correct: false },
      { text: 'C) Pulni bekorga sarflash', id: 'C', correct: false },
    ],
    explanation: '✅ **Resilience** — zarbalarga chidab, qayta tiklanish qobiliyati.\nMisol: *"True champions show great mental resilience."*',
  },
  {
    word: 'Meticulous',
    pronunciation: '/məˈtɪk.jə.ləs/',
    question: '🎯 **"Meticulous"** so\'zining to\'g\'ri ma\'nosini toping:',
    options: [
      { text: 'A) Har bir detalga o\'ta e\'tiborli va aniq', id: 'A', correct: true },
      { text: 'B) Qo\'pol va e\'tiborsiz', id: 'B', correct: false },
      { text: 'C) Juda tez harakat qiluvchi', id: 'C', correct: false },
    ],
    explanation: '✅ **Meticulous** — ishni har bir mayda detaligacha sinchiklab qiladigan odam.\nMisol: *"A programmer must be meticulous with their code."*',
  },
  {
    word: 'Consistency',
    pronunciation: '/kənˈsɪs.tən.si/',
    question: '🎯 **"Consistency"** so\'zining to\'g\'ri ma\'nosini toping:',
    options: [
      { text: 'A) Doimiylik, bir maromda davom etish', id: 'A', correct: true },
      { text: 'B) Bir martalik kuchli harakat', id: 'B', correct: false },
      { text: 'C) Shoshqaloqlik', id: 'C', correct: false },
    ],
    explanation: '✅ **Consistency** — har kuni bir xil intizom bilan ishlash.\nMisol: *"Consistency is the key to success in habits."*',
  },
  {
    word: 'Endeavor',
    pronunciation: '/enˈdev.ər/',
    question: '🎯 **"Endeavor"** so\'zining to\'g\'ri ma\'nosini toping:',
    options: [
      { text: 'A) Katta sa\'y-harakat yoki jiddiy intilish', id: 'A', correct: true },
      { text: 'B) Bo\'sh vaqt o\'tkazish', id: 'B', correct: false },
      { text: 'C) Uxlash va dam olish', id: 'C', correct: false },
    ],
    explanation: '✅ **Endeavor** — buyuk maqsad yo\'lidagi jiddiy harakat.\nMisol: *"We wish you great success in all your future endeavors."*',
  },
];

function getRandomQuiz() {
  const index = Math.floor(Math.random() * VOCAB_BANK.length);
  return { ...VOCAB_BANK[index], index };
}

function getQuizByIndex(index) {
  return VOCAB_BANK[index] || VOCAB_BANK[0];
}

function loadScore() {
  if (fs.existsSync(SCORE_FILE)) {
    try { return JSON.parse(fs.readFileSync(SCORE_FILE, 'utf8')); } catch (_) {}
  }
  return { totalScore: 0, correctCount: 0, totalQuestions: 0 };
}

function addScore(isCorrect) {
  const score = loadScore();
  score.totalQuestions += 1;
  if (isCorrect) {
    score.correctCount += 1;
    score.totalScore += 10;
  }
  fs.writeFileSync(SCORE_FILE, JSON.stringify(score, null, 2), 'utf8');

  // Sync to Obsidian
  try {
    const englishDir = path.join(VAULT_PATH, 'English');
    if (!fs.existsSync(englishDir)) fs.mkdirSync(englishDir, { recursive: true });
    const mdFile = path.join(englishDir, 'Ingliz_Tili_Ballar.md');
    const md = `# 🇬🇧 Ingliz Tili Viktorina Natijalari

- **Jami To'plangan Ball:** 🏆 ${score.totalScore} ball
- **To'g'ri Javoblar:** ${score.correctCount} / ${score.totalQuestions}
- **Aniqlik Ko'rsatkichi:** ${score.totalQuestions > 0 ? Math.round((score.correctCount / score.totalQuestions) * 100) : 0}%

> *"Har bir yangi so'z — bu dunyoga ochilgan yangi deraza!"*
`;
    fs.writeFileSync(mdFile, md, 'utf8');
  } catch (e) {
    console.warn('Obsidian english score sync notice:', e.message);
  }

  return score;
}

module.exports = {
  getRandomQuiz,
  getQuizByIndex,
  addScore,
  loadScore,
};
