const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const PROFILE_JSON = path.join(__dirname, 'profile_data.json');

const DEFAULT_PROFILE = {
  name: 'Samar',
  age: '16',
  location: 'Toshkent, O\'zbekiston',
  school: 'Maktab o\'quvchisi',
  profession: 'Bo\'lajak kuchli dasturchi va o\'quv markazi ustozi',
  interests: ['Dasturlash (IT)', 'Boks / Sport', 'Biznes va moliya', 'Ingliz tili', 'Kitob mutolaasi'],
  strengths: ['Intizom', 'Mehnatsevarlik', 'Yangi bilimlarga chanqoqlik'],
  longTermDream: 'Yuqori darajadagi xalqaro dasturchi bo\'lish, shaxsiy loyihalar va IT bizneslarni yo\'lga qo\'yish',
  customFacts: [],
};

function loadProfile() {
  if (fs.existsSync(PROFILE_JSON)) {
    try {
      return JSON.parse(fs.readFileSync(PROFILE_JSON, 'utf8'));
    } catch (_) {}
  }
  return { ...DEFAULT_PROFILE };
}

function saveProfile(data) {
  fs.writeFileSync(PROFILE_JSON, JSON.stringify(data, null, 2), 'utf8');

  // Sync to Obsidian Profile/Mening_Profilim.md
  try {
    const profDir = path.join(VAULT_PATH, 'Profile');
    if (!fs.existsSync(profDir)) fs.mkdirSync(profDir, { recursive: true });
    const mdPath = path.join(profDir, 'Mening_Profilim.md');

    const interestsList = (data.interests || []).map(i => `- 🌟 ${i}`).join('\n');
    const strengthsList = (data.strengths || []).map(s => `- 💪 ${s}`).join('\n');
    const factsList = (data.customFacts || []).map(f => `- 📌 ${f}`).join('\n');

    const md = `# 👤 Shaxsiy Profilim — Samar

Oxirgi yangilanish: ${new Date().toISOString().substring(0, 10)}

## 📌 Asosiy Ma'lumotlar:
- **Ism:** ${data.name || 'Samar'}
- **Yosh:** ${data.age || '-'}
- **Yashash joyi:** ${data.location || '-'}
- **Mashg'ulot / Kasb:** ${data.profession || '-'}
- **O'qish joyi:** ${data.school || '-'}

## 🎯 Asosiy Orzu va Maqsadlar:
> "${data.longTermDream || '-'}"

## 💡 Qiziqishlar va Xobbilar:
${interestsList || '- Hozircha kiritilmagan'}

## ⚡ Kuchli Tomonlar:
${strengthsList || '- Hozircha kiritilmagan'}

## 📝 Qo'shimcha Faktlar va Qaydlar:
${factsList || '- Hozircha qo\'shimcha faktlar yo\'q'}
`;
    fs.writeFileSync(mdPath, md, 'utf8');
  } catch (err) {
    console.warn('Obsidian profile sync error:', err.message);
  }
}

function updateProfile(updates) {
  const current = loadProfile();

  if (updates.name) current.name = updates.name;
  if (updates.age) current.age = String(updates.age);
  if (updates.location) current.location = updates.location;
  if (updates.school) current.school = updates.school;
  if (updates.profession) current.profession = updates.profession;
  if (updates.longTermDream) current.longTermDream = updates.longTermDream;

  if (updates.newInterest) {
    if (!current.interests.includes(updates.newInterest)) {
      current.interests.push(updates.newInterest);
    }
  }

  if (updates.fact) {
    current.customFacts.push(updates.fact);
  }

  saveProfile(current);
  return current;
}

function getProfileSummary() {
  const p = loadProfile();
  return `👤 **${p.name} (${p.age} yosh)** | 📍 ${p.location}
💼 ${p.profession}
🌟 Qiziqishlar: ${(p.interests || []).join(', ')}
🎯 Asosiy maqsad: ${p.longTermDream}`;
}

// Initialize on first load if not created
if (!fs.existsSync(PROFILE_JSON)) {
  saveProfile(DEFAULT_PROFILE);
}

module.exports = {
  loadProfile,
  updateProfile,
  getProfileSummary,
};
