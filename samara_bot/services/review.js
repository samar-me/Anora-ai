const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');
const books = require('./books');
const streak = require('./streak');
const debts = require('./debts');
const crm = require('./crm');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}_W${String(weekNo).padStart(2, '0')}`;
}

async function generateWeeklyReview(aiService, userId = 'weekly_review') {
  const dailyNotes = obsidian.getRecentSummary(7);
  const goals = obsidian.getGoalsContent();
  const bookSummary = books.getReadingSummary();
  const streakSummary = streak.getStreakSummary();
  const debtsSummary = debts.getDebtsSummary();
  const studentsSummary = crm.getStudentsSummary();

  const prompt = `Sen Anora AI — Samarning shaxsiy boshqaruv Murabbiysisan.
Quyida Samarning so'nggi 7 kunlik barcha kunlik qaydlari, vazifalari, mutolaasi va moliyasi jamlangan:

${dailyNotes}

## MAQSADLAR VA ZANJIR:
${goals}
${streakSummary}

## KITOB MUTOLAASI:
${bookSummary}

## QARZLAR VA MOLIYA:
${debtsSummary}

## O'QUV MARKAZI (O'QUVCHILAR):
${studentsSummary}

Foydalanuvchi Samar (16 yosh, Qashqadaryo) ga samimiy, kuchli va professional "HAFTALIK STRATEGIK AUDIT" (Hisobot) tayyorlab ber:
1. 🏋️‍♂️ **Intizom va Sport:** Rejalar qanchalik bajarildi?
2. 💰 **Moliya & O'quvchilar:** Haftalik xarajat, tushgan to'lovlar va qarzlar holati qanday?
3. 📚 **Ilm va Dasturlash:** Kitob o'qish va rivojlanish natijalari.
4. ⚠️ **Oqsagan nuqtalar:** Qaysi kunlarda nimalar qolib ketdi yoki chalg'ish bo'ldi?
5. 🎯 **Kelgusi Hafta uchun 3 ta Oltin Maslahat / Reja!**

Javobing juda ixcham, motivatsion va amaliy bo'lsin. Keraksiz uzun gaplar qilma, aniq punktlar bilan yoz.`;

  const { replyText } = await aiService.processUserMessage(userId, prompt);

  // Save to Obsidian Reviews folder
  try {
    const reviewsDir = path.join(VAULT_PATH, 'Reviews');
    if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });
    const weekId = getWeekNumber(new Date());
    const filePath = path.join(reviewsDir, `Haftalik_Audit_${weekId}.md`);
    const mdContent = `# 👑 Haftalik Strategik Audit — ${weekId}\nSana: ${obsidian.getTodayString()}\n\n${replyText}\n`;
    fs.writeFileSync(filePath, mdContent, 'utf8');
  } catch (err) {
    console.warn('Reviews save notice:', err.message);
  }

  return replyText;
}

module.exports = {
  generateWeeklyReview,
};
