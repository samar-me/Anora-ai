const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const STRATEGY_FILE = path.join(__dirname, 'strategy_data.json');

function initStrategyFiles() {
  const goalsDir = path.join(VAULT_PATH, 'Goals');
  if (!fs.existsSync(goalsDir)) fs.mkdirSync(goalsDir, { recursive: true });

  // 1. Master Development Roadmap in Obsidian
  const masterFile = path.join(goalsDir, 'Rivojlanish_Strategiyasi.md');
  const masterContent = `# 🚀 Samar ning Katta Rivojlanish Strategiyasi (Master Roadmap)

> **Shior:** *"Har kuni 1% o'sish — 1 yilda 37 barobar ustunlik beradi!"*  
> **Asosiy maqsad:** 16 yoshdan boshlab xalqaro darajadagi Senior Dasturchi, C1 darajadagi Ingliz tili egasi, baquvvat sportchi va erkin tadbirkor bo'lish.

---

## 1. 🇬🇧 INGLIZ TILI STRATEGIYASI (A2 -> C1)
### 🎯 Maqsad: Xalqaro kompaniyalar bilan erkin gaplashish, texnik maqolalar yozish va xorijiy bozorga chiqish.
* **Bosqich 1 (1-30 kun) — Fonetika va Oltin 1000 So'z:**
  - Har kuni AI bilan 5 daqiqa jonli gaplashish (Speaking & Shadowing);
  - Dasturlash va kundalik hayotdagi eng kerakli 1000 ta so'z va iboralarni daftarga kiritish;
  - Qoidani yodlash emas, gaplar ichida faol ishlatish.
* **Bosqich 2 (31-60 kun) — Texnik Fikrlash va Mutolaa:**
  - Texnik hujjatlar (MDN, GitHub, IT maqolalar)ni faqat ingliz tilida o'qish;
  - O'zbekcha o'ylab tarjima qilishni to'xtatish — to'g'ridan-to'g'ri inglizcha fikrlash.
* **Bosqich 3 (61-90 kun) — Erkin Muloqot va Technical Interviews:**
  - O'z kodini va arxitekturasini inglizcha tushuntirib bera olish;
  - Xalqaro frilans (Upwork, Toptal) yoki masofaviy ish suhbatlariga tayyorlik.

---

## 2. 💻 DASTURLASH VA MUHANDISLIK (Junior -> Senior Blueprint)
### 🎯 Maqsad: Katta loyihalarni noldan arxitektura qila oladigan, muammolarni ildizidan hal qiluvchi kuchli muhandis.
* **1-Qadam (Asoslar & Clean Code):**
  - JavaScript / TypeScript chuqur mexanizmlari (Event Loop, Async/Await, Prototypes, Memory);
  - Clean Code, DRY, KISS prinsiplari.
* **2-Qadam (Algoritmlar & Tizim):**
  - Data Structures & Algorithms (LeetCode / Codeforces oson-o'rta masalalar);
  - Ma'lumotlar bazasi (PostgreSQL, Supabase) va API dizayni.
* **3-Qadam (Haqiqiy Mahsulotlar & Startaplar):**
  - Odamlar foydalanadigan real SaaS va AI ilovalarni yaratish;
  - GitHub portfoliosini xalqaro darajada yuritish.

---

## 3. 🏋️‍♂️ SPORT VA JISMONIY QUDRAT (Calisthenics & Vitality)
### 🎯 Maqsad: Charchamas tana, temir intizom va chempionona sog'liq.
* **Turnik:** 15 tadan 25 taga chiqish (Toza texnika);
* **Anjimaniya:** 30 tadan 60 taga yetkazish;
* **Brusya:** 15 tadan 30 taga oshirish;
* **Yugurish & Chidamlilik:** 3 km dan 5 km gacha yengil kross;
* **Uyqu & Tiklanish:** Har kuni soat 22:00 da uxlash, 06:00 da uyg'onish.

---

## 4. 💰 MOLIYA VA TADBIRKORLIK (Mustaqillik Poydevori)
### 🎯 Maqsad: Pulni boshqarish, o'quvchilar sonini sifatli ko'paytirish va Cadillac Escalade sari kapital yig'ish.
* O'quv markazi guruhlarini tizimli CRM orqali kengaytirish;
* Daromadning kamida 40-50% qismini daxlsiz jamg'arma va kelajak kapitaliga yo'naltirish;
* Qarz va xarajatlarni qat'iy nazorat qilish.

---
📅 *Yangilangan sana: ${obsidian.getTodayString()}*
`;
  fs.writeFileSync(masterFile, masterContent, 'utf8');

  // 2. English Specific Roadmap
  const enFile = path.join(goalsDir, 'Ingliz_Tili_Strategiyasi.md');
  const enContent = `# 🇬🇧 Samar ning 90 Kunlik Ingliz Tili Strategiyasi

## Haftalik Reja Strukturasi:
* **Dushanba:** Yangi texnik fe'llar va frazalar (deploy, scale, refactor, implement).
* **Seshanba:** Kundalik muloqot va shaxsiy fikr bildirish (Expressing opinions).
* **Chorshanba:** Ovozli trening va talaffuz (Pronunciation & Accent reduction).
* **Payshanba:** Texnik muammolarni inglizcha tasvirlash (Bug fixing & Problem solving).
* **Juma:** Hikoya qilish va o'tgan zamon (Storytelling & Daily recap).
* **Shanba:** Mini-intervyu (Mock Tech Interview with AI Coach).
* **Yakshanba:** Hafta davomida o'rganilgan barcha yangi so'zlarni takrorlash.

> *"Practice does not make perfect. Only perfect practice makes perfect!"*
`;
  fs.writeFileSync(enFile, enContent, 'utf8');
}

function loadStrategyData() {
  if (fs.existsSync(STRATEGY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STRATEGY_FILE, 'utf8'));
    } catch (_) {}
  }
  return {
    currentEnglishDay: 1,
    currentTechTopic: 'JavaScript chuqur mexanizmlari & Async Event Loop',
    currentSportTarget: 'Turnik: 18 ta, Anjimaniya: 35 ta',
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

function saveStrategyData(data) {
  fs.writeFileSync(STRATEGY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Returns today's active strategic mission assigned proactively by AI
 */
function getTodayMission() {
  const d = new Date();
  const day = d.getDay(); // 1 = Dush, 2 = Sesh, etc.

  const missions = {
    1: {
      topic: 'Hafta Boshlanishi — Yangi Marralar va Kuch!',
      english: 'Bugungi ingliz tili nishoni: Texnik iboralar (build, execute, optimize, debug). AI bilan suhbatda bularni qo\'llaymiz.',
      coding: 'Dasturlash: Kodni modullarga ajratish va arxitektura tozaligi.',
      sport: 'Sport: Ko\'krak + Triceps (Turnik va anjimaniyada yangi marraga intilish).',
    },
    2: {
      topic: 'Chuqur Mehnat (Deep Focus)',
      english: 'Bugungi ingliz tili nishoni: O\'zbekcha o\'ylamay, to\'g\'ridan-to\'g\'ri inglizcha javob berish (Instant reply).',
      coding: 'Dasturlash: Asinxronlik (Promises, Async/Await) va xatolarni to\'g\'ri ushlash (try/catch).',
      sport: 'Sport: Orqa + Biceps (Teskari turnik va chidamlilik).',
    },
    3: {
      topic: 'Hafta O\'rtasi — Intizom va Tezlik',
      english: 'Bugungi ingliz tili nishoni: Savol berish texnikasi (Why, How, What if?).',
      coding: 'Dasturlash: Ma\'lumotlar tuzilmasi (Arrays, Maps, Sets) va algoritmlar tezligi.',
      sport: 'Sport: Oyoq va 3 km kross (Chidamlilik kuni).',
    },
    4: {
      topic: 'Faol O\'sish va Tahlil',
      english: 'Bugungi ingliz tili nishoni: Qiyin muammolarni ingliz tilida tushuntirish.',
      coding: 'Dasturlash: Loyihada API va ma\'lumotlar oqimini tartibga solish.',
      sport: 'Sport: Bo\'g\'inlar va cho\'zilish (Stretching & Spine recovery).',
    },
    5: {
      topic: 'Hafta Zafari va Qat\'iyat',
      english: 'Bugungi ingliz tili nishoni: Erkin nutq (Fluency challenge) — 3 daqiqa to\'xtovsiz gapirish.',
      coding: 'Dasturlash: Loyihani testlash va refaktoring.',
      sport: 'Sport: Yelka va Qorin pressi (Plank & L-sit).',
    },
    6: {
      topic: 'Rekordlar va Challenge Kuni!',
      english: 'Bugungi ingliz tili nishoni: Texnik suhbat (Mini-interview) — AI bergan savollarga javob berish.',
      coding: 'Dasturlash: Haftalik loyihani GitHub\'ga yuklash va chiroyli README yozish.',
      sport: 'Sport: Maksimal natijalar sinovi (Turnik va Anjimaniyada yangi rekord!).',
    },
    0: {
      topic: 'Yakshanba — Strategik Sarhisob',
      english: 'Haftalik o\'rganilgan 15-20 ta yangi so\'zni takrorlash va mustahkamlash.',
      coding: 'Hafta davomida yozilgan kodlarni ko\'zdan kechirish.',
      sport: 'Tanani dam oldirish va quvvat to\'plash.',
    },
  };

  return missions[day] || missions[1];
}

/**
 * Returns formatted Strategy Overview for the user
 */
function getStrategySummary() {
  const mission = getTodayMission();
  const data = loadStrategyData();

  return `👑 **SAMAR NING SHAXSIY RIVOJLANISH STRATEGIYASI**

🎯 **Kunning Strategik Nishoni (${mission.topic}):**
• 🇬🇧 **Ingliz tili:** ${mission.english}
• 💻 **Dasturlash:** ${mission.coding}
• 🏋️‍♂️ **Sport:** ${mission.sport}

---
📚 **Uzoq muddatli bosqichlar:**
1. 🇬🇧 **Ingliz tili:** 90 kunda erkin muloqot va C1 texnik daraja.
2. 💻 **Dasturlash:** Xalqaro Senior Engineer poydevori.
3. 🏋️‍♂️ **Sport:** Turnik 25+, Anjimaniya 60+, Temir intizom.
4. 💰 **Moliya:** O'quv markazi rivoji va Cadillac Escalade kapitali.

> *"Murabbiy faqat tomoshabin emas — har kuni sizni ushbu nishonlar sari yetaklayman!"* 🦁`;
}

// Initialize files on startup
initStrategyFiles();

module.exports = {
  getTodayMission,
  getStrategySummary,
  initStrategyFiles,
  loadStrategyData,
  saveStrategyData,
};
