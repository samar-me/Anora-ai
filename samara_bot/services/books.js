const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');
const streak = require('./streak');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const BOOKS_FILE = path.join(__dirname, 'books_data.json');

function loadBooks() {
  if (fs.existsSync(BOOKS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));
    } catch (_) {}
  }
  return [];
}

function saveBooks(list) {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify(list, null, 2), 'utf8');

  // Sync to Obsidian Books/Kitoblarim.md
  try {
    const booksDir = path.join(VAULT_PATH, 'Books');
    if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });
    const mdPath = path.join(booksDir, 'Kitoblarim.md');

    let rows = '';
    let details = '';

    for (const b of list) {
      const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : '?';
      const statusIcon = b.status === 'completed' ? '✅ Tugatildi' : '📖 O\'qilmoqda';
      rows += `| **${b.title}** | ${b.author || '-'} | ${b.currentPage} / ${b.totalPages || '?'} | ${pct}% | ${b.lastReadDate || '-'} | ${statusIcon} |\n`;

      if (b.quizHistory && b.quizHistory.length > 0) {
        details += `\n### 📚 ${b.title} — Sinov va Tushunish Tarixi:\n`;
        for (const q of b.quizHistory.slice(-5)) {
          details += `- **Sana:** ${q.date} (Sahifa: ${q.page})\n  ❓ *Savol:* ${q.question}\n  💬 *Javob:* ${q.answer}\n  ⭐ *Baho va tahlil:* ${q.feedback}\n\n`;
        }
      }
    }

    const md = `# 📚 Kitoblarim va Mutolaa Maqsadlari

Oxirgi yangilanish: ${obsidian.getTodayString()}

## 📊 Hozirgi Holat:
| Kitob | Muallif | Sahifa | Progress | Oxirgi mutolaa | Holat |
|---|---|---|---|---|---|
${rows || '| - | Hozircha kitoblar yo\'q | - | - | - | - |\n'}

---
${details}
`;
    fs.writeFileSync(mdPath, md, 'utf8');
  } catch (err) {
    console.warn('Obsidian books sync error:', err.message);
  }
}

function updateReadingProgress({ bookTitle, currentPage, totalPages = 0, author = '', notes = '' }) {
  const list = loadBooks();
  const cleanTitle = (bookTitle || '').trim();
  const today = obsidian.getTodayString();

  let book = list.find(b => b.title.toLowerCase().includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(b.title.toLowerCase()));

  if (!book) {
    book = {
      id: Date.now(),
      title: cleanTitle,
      author: author.trim(),
      currentPage: Number(currentPage) || 0,
      totalPages: Number(totalPages) || 0,
      startDate: today,
      lastReadDate: today,
      status: 'reading',
      notes: notes ? [notes] : [],
      quizHistory: [],
    };
    list.push(book);
  } else {
    book.currentPage = Number(currentPage) || book.currentPage;
    if (totalPages) book.totalPages = Number(totalPages);
    if (author) book.author = author;
    book.lastReadDate = today;
    if (notes) {
      if (!book.notes) book.notes = [];
      book.notes.push(notes);
    }
    if (book.totalPages && book.currentPage >= book.totalPages) {
      book.status = 'completed';
    }
  }

  saveBooks(list);

  // Update reading habit streak
  const s = streak.updateHabitStreak('reading');

  // Also log into Daily Notes
  obsidian.completeTask('kitob');
  obsidian.addNote({
    topic: `Kitob mutolaasi (${book.title})`,
    content: `${book.currentPage}-betgacha o'qildi.`,
  });

  return { book, streakCount: s.count };
}

function recordQuizResult({ bookTitle, page, question, answer, feedback, score = '' }) {
  const list = loadBooks();
  const cleanTitle = (bookTitle || '').trim();
  const today = obsidian.getTodayString();

  let book = list.find(b => b.title.toLowerCase().includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(b.title.toLowerCase()));

  if (!book && list.length > 0) {
    book = list[list.length - 1]; // default to latest
  }

  if (book) {
    if (!book.quizHistory) book.quizHistory = [];
    book.quizHistory.push({
      date: today,
      page: page || book.currentPage,
      question,
      answer,
      feedback,
      score,
    });
    saveBooks(list);
  }
}

function getActiveBook() {
  const list = loadBooks();
  const active = list.filter(b => b.status === 'reading');
  return active.length > 0 ? active[active.length - 1] : null;
}

function getReadingSummary() {
  const list = loadBooks();
  if (list.length === 0) {
    return '📚 Hozircha birorta ham kitob kiritilmagan. Menga masalan: *"Atom Odatlari kitobini 45-betgacha o\'qidim"* deb yozing!';
  }

  let text = '📚 **Mening Kitoblarim va Mutolaa Holati:**\n\n';
  for (const b of list) {
    const pct = b.totalPages ? ` (${Math.round((b.currentPage / b.totalPages) * 100)}%)` : '';
    text += `• **${b.title}** — ${b.currentPage}/${b.totalPages || '?'} bet${pct}\n  Oxirgi mutolaa: ${b.lastReadDate || '-'}\n\n`;
  }
  return text.trim();
}

module.exports = {
  loadBooks,
  saveBooks,
  updateReadingProgress,
  recordQuizResult,
  getActiveBook,
  getReadingSummary,
};
