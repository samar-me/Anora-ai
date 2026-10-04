const fs = require('fs');
const path = require('path');
const fitness = require('./fitness');
const profile = require('./profile');

const DATA_JSON = path.join(__dirname, '..', '..', 'samara_portfolio', 'data.json');
const IDEAS_DIR = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Ideas');
const PROJECTS_DIR = path.join(__dirname, '..', '..', 'Obsidian_Vault', 'Projects');

function syncPortfolio() {
  if (!fs.existsSync(DATA_JSON)) return null;

  try {
    const current = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));
    const fData = fitness.loadFitnessData();

    // 1. Update Fitness PR stats
    if (fData && fData.personalRecords) {
      if (fData.personalRecords.turnik) {
        current.stats.pullUpsPR = `${fData.personalRecords.turnik.value}+`;
      }
      if (fData.personalRecords.anjimaniya) {
        current.stats.pushUpsPR = `${fData.personalRecords.anjimaniya.value}+`;
      }
    }

    // 2. Scan Projects & Ideas from Obsidian
    const dynamicProjects = [
      {
        title: "Anora AI — Shaxsiy Murabbiy & Second Brain",
        desc: "Google Gemini 3.8 Flash, Node.js va Telegram Bot asosida qurilgan to'liq shaxsiy intellekt tizimi.",
        tags: ["Node.js", "AI", "Telegram", "Obsidian"],
        link: "https://t.me/samara_my_ai_bot"
      },
      {
        title: "Solo Leveling RPG Life Engine",
        desc: "Real hayotiy intizomni o'yinga aylantiruvchi, XP va darajalarni hisoblovchi geymifikatsiya moduli.",
        tags: ["Gamification", "Node.js", "Habits"],
        link: "#"
      },
      {
        title: "FAANG LeetCode Arena & Algoritmik Duelchi",
        desc: "Kunlik Google va Meta intervyu algoritmlarini tahlil qiluvchi va Big-O murakkabligini tekshiruvchi modul.",
        tags: ["DSA", "Big-O", "AI Evaluation"],
        link: "#"
      }
    ];

    if (fs.existsSync(IDEAS_DIR)) {
      const ideaFiles = fs.readdirSync(IDEAS_DIR).filter(f => f.endsWith('.md')).slice(-2);
      for (const f of ideaFiles) {
        const cleanTitle = f.replace('.md', '').replace(/_\d{4}$/, '').replace(/_/g, ' ');
        dynamicProjects.push({
          title: cleanTitle,
          desc: "Startap Inkubatori tomonidan ishlab chiqilgan va loyihalashtirilgan yangi IT tashabbusi.",
          tags: ["Startup", "MVP", "Product"],
          link: "#"
        });
      }
    }

    current.projects = dynamicProjects;
    fs.writeFileSync(DATA_JSON, JSON.stringify(current, null, 2), 'utf8');

    return current;
  } catch (err) {
    console.error('Portfolio sync error:', err.message);
    return null;
  }
}

function getPortfolioSummary() {
  const p = syncPortfolio();
  const filePath = path.resolve(DATA_JSON, '..', 'index.html');

  let text = `🌐 **SHAXSIY PORTFOLIO SAYTI YANGILANDI!** ✨\n\n`;
  text += `👤 **Ega:** Samar\n`;
  text += `💼 **Soha:** Full-Stack Dasturchi & O'quv Markazi Ustozi\n`;
  text += `📊 **Yutuqlar:** Turnik ${p.stats.pullUpsPR} | Anjimaniya ${p.stats.pushUpsPR} | LeetCode ${p.stats.leetcodeSolved}\n`;
  text += `🚀 **Loyihalar soni:** ${p.projects.length} ta\n\n`;
  text += `📁 **Mahalliy vebsayt fayli:**\n\`${filePath}\`\n\n`;
  text += `_Siz buni brauzerda ochishingiz yoki GitHub Pages / Vercel orqali bepul internetga ulashingiz mumkin!_`;

  return text;
}

module.exports = {
  syncPortfolio,
  getPortfolioSummary,
};
