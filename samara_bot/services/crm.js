const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const CRM_FILE = path.join(__dirname, 'crm_students.json');

function loadStudents() {
  if (fs.existsSync(CRM_FILE)) {
    try { return JSON.parse(fs.readFileSync(CRM_FILE, 'utf8')); } catch (_) {}
  }
  return [];
}

function calculateNextBillingDate(fromDateStr) {
  const d = new Date(fromDateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().substring(0, 10);
}

function saveStudents(list) {
  fs.writeFileSync(CRM_FILE, JSON.stringify(list, null, 2), 'utf8');

  // Sync to Obsidian CRM/Oquvchilar.md
  try {
    const crmDir = path.join(VAULT_PATH, 'CRM');
    if (!fs.existsSync(crmDir)) fs.mkdirSync(crmDir, { recursive: true });
    const mdFile = path.join(crmDir, 'Oquvchilar.md');

    let totalMonthlyRevenue = 0;
    let rows = '';

    for (const s of list) {
      if (s.status === 'active') totalMonthlyRevenue += s.monthlyFee;
      const statusIcon = s.status === 'active' ? '🟢 O\'qimoqda' : '🔴 To\'xtatilgan';
      rows += `| **${s.name}** | ${s.age || '-'} yosh | ${s.days} (${s.time}) | **${obsidian.formatMoney(s.monthlyFee)}** | ${s.nextBillingDate} | ${statusIcon} |\n`;
    }

    const md = `# 👨‍🏫 O'quv Markazi — O'quvchilar CRM

Oxirgi yangilanish: ${obsidian.getTodayString()}

### 📊 Ko'rsatkichlar:
- 👥 **Jami faol o'quvchilar:** ${list.filter(s => s.status === 'active').length} nafar
- 💰 **Kutilayotgan oylik tushum:** ${obsidian.formatMoney(totalMonthlyRevenue)}

---

| Ism | Yosh | Dars kunlari va vaqti | Oylik to'lov | Keyingi to'lov sanasi | Holat |
|---|---|---|---|---|---|
${rows || '| - | Hozircha o\'quvchilar yo\'q | - | - | - | - |\n'}
`;
    fs.writeFileSync(mdFile, md, 'utf8');
  } catch (err) {
    console.warn('Obsidian CRM sync notice:', err.message);
  }
}

function addStudent({ name, age = '', days = 'Dush-Chor-Juma', time = '16:00', monthlyFee = 300000, startDate = '', phone = '' }) {
  const list = loadStudents();
  const start = startDate || obsidian.getTodayString();
  const nextBillingDate = calculateNextBillingDate(start);

  const newStudent = {
    id: Date.now(),
    name: name.trim(),
    age,
    days,
    time,
    monthlyFee: Number(monthlyFee) || 300000,
    startDate: start,
    nextBillingDate,
    phone,
    status: 'active',
    payments: [],
  };

  list.push(newStudent);
  saveStudents(list);
  return newStudent;
}

function recordPayment(studentQuery) {
  const list = loadStudents();
  const q = studentQuery.toLowerCase().trim();
  let foundStudent = null;

  for (const s of list) {
    if (s.status === 'active' && s.name.toLowerCase().includes(q)) {
      foundStudent = s;
      const payDate = obsidian.getTodayString();
      s.payments.push({ date: payDate, amount: s.monthlyFee });
      s.nextBillingDate = calculateNextBillingDate(s.nextBillingDate || payDate);
      break;
    }
  }

  if (foundStudent) {
    saveStudents(list);
  }
  return foundStudent;
}

function getStudentsSummary() {
  const list = loadStudents().filter(s => s.status === 'active');
  if (list.length === 0) {
    return '👨‍🏫 **O\'quvchilar:** Hozircha o\'quvchilar kiritilmagan. Yangi o\'quvchi qo\'shish uchun: *"Yangi o\'quvchi: Jasur, 14 yosh, Dush-Chor-Juma 16:00, 300 ming"* deb yozing.';
  }

  let text = `👨‍🏫 **Faol O'quvchilar (${list.length} nafar):**\n\n`;
  for (const s of list) {
    text += `• **${s.name}** (${s.age || ''} yosh) — ${s.days} ${s.time}\n  💰 To'lov: ${obsidian.formatMoney(s.monthlyFee)} | Keyingi sana: **${s.nextBillingDate}**\n\n`;
  }
  return text.trim();
}

function getPendingBillingNotifications() {
  const list = loadStudents().filter(s => s.status === 'active');
  const today = obsidian.getTodayString();
  return list.filter(s => s.nextBillingDate <= today);
}

function updateStudentStatus(studentQuery, newStatus = 'paused') {
  const list = loadStudents();
  const q = studentQuery.toLowerCase().trim();
  let found = null;
  for (const s of list) {
    if (s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase())) {
      s.status = newStatus;
      found = s;
      break;
    }
  }
  if (found) saveStudents(list);
  return found;
}

module.exports = {
  addStudent,
  recordPayment,
  getStudentsSummary,
  getPendingBillingNotifications,
  updateStudentStatus,
};
