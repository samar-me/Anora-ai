const { GoogleGenAI, Type } = require('@google/genai');
const obsidian = require('./obsidian');
const supabase = require('./supabase');
const streak = require('./streak');
const media = require('./media');
const debts = require('./debts');
const crm = require('./crm');
const weather = require('./weather');
const profile = require('./profile');
const books = require('./books');
const timer = require('./timer');
const backup = require('./backup');
const fitness = require('./fitness');
const strategy = require('./strategy');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.6-flash'];

const tools = [
  {
    functionDeclarations: [
      {
        name: 'create_task',
        description: 'Yangi vazifa yoki reja qo\'shish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Vazifa nomi' },
            time: { type: Type.STRING, description: 'Vaqt (masalan: 14:00)' },
            priority: { type: Type.STRING, description: 'Muhimlik darajasi' },
          },
          required: ['title'],
        },
      },
      {
        name: 'complete_task',
        description: 'Vazifa yoki odatni bajarildi deb belgilash.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            task_query: { type: Type.STRING, description: 'Bajarilgan ish nomi' },
          },
          required: ['task_query'],
        },
      },
      {
        name: 'create_expense',
        description: 'Xarajat qayd qilish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Miqdor (so\'mda)' },
            category: { type: Type.STRING, description: 'Kategoriya' },
            description: { type: Type.STRING, description: 'Izoh' },
          },
          required: ['amount'],
        },
      },
      {
        name: 'create_income',
        description: 'Daromad qayd qilish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Miqdor' },
            description: { type: Type.STRING, description: 'Izoh' },
          },
          required: ['amount'],
        },
      },
      {
        name: 'add_debt',
        description: 'Qarz yozish. Kimgadir qarz berilganda (lent) yoki birovdan qarz olinganda (borrowed) chaqiriladi.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: 'lent (men berdim) yoki borrowed (men oldim)' },
            person: { type: Type.STRING, description: 'Shaxs ismi' },
            amount: { type: Type.NUMBER, description: 'Miqdor' },
            note: { type: Type.STRING, description: 'Izoh' },
          },
          required: ['person', 'amount'],
        },
      },
      {
        name: 'close_debt',
        description: 'Qarzni uzildi yoki qisman qaytarildi deb belgilash.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            person: { type: Type.STRING, description: 'Qarzini uzgan yoki qaytargan shaxs (masalan: Ukam, Ali)' },
            paid_amount: { type: Type.NUMBER, description: 'Qaytarilgan pul miqdori (agar to\'liq uzilgan bo\'lsa, kiritilmasligi mumkin)' },
          },
          required: ['person'],
        },
      },
      {
        name: 'get_debts',
        description: 'Qarz daftaridagi faol qarzlar va balansni ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'update_debt',
        description: 'Qarz yozuvidagi shaxsni (masalan: ukam, akam, do\'stim, Ali) to\'g\'irlash yoki aniqlashtirish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            person: { type: Type.STRING, description: 'To\'g\'ri shaxs nomi (masalan: Ukam, Akam, Ali)' },
            amount: { type: Type.NUMBER, description: 'Qarz miqdori (agar ma\'lum bo\'lsa)' },
          },
          required: ['person'],
        },
      },
      {
        name: 'add_student',
        description: 'O\'quv markaziga yangi o\'quvchi qo\'shish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'O\'quvchi ismi' },
            age: { type: Type.STRING, description: 'Yoshi' },
            days: { type: Type.STRING, description: 'Dars kunlari' },
            time: { type: Type.STRING, description: 'Dars soati' },
            monthlyFee: { type: Type.NUMBER, description: 'Oylik to\'lov miqdori' },
          },
          required: ['name'],
        },
      },
      {
        name: 'record_student_payment',
        description: 'O\'quvchi to\'lovini qayd qilish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'O\'quvchi ismi' },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_students',
        description: 'O\'quvchilar ro\'yxati va to\'lov kunlarini ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'update_student_status',
        description: 'O\'quvchining holatini o\'zgartirish (masalan: to\'xtatildi, ketdi yoki faol).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'O\'quvchi ismi' },
            status: { type: Type.STRING, description: 'paused (to\'xtatildi) yoki active (o\'qimoqda)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_weather',
        description: 'Bugungi ob-havo ma\'lumotlarini olish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'find_media',
        description: 'Ilgari saqlangan rasm yoki videoni qidirish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'Qidiruv so\'zi' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_today_plan',
        description: 'Bugungi rejalarni olish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'search_vault',
        description: 'Obsidian xotira va qaydlar daftarlaridan ma\'lumot yoki so\'zlarni qidirish (semantik qidiruv).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'Qidirilayotgan mavzu yoki so\'z' },
          },
          required: ['query'],
        },
      },
      {
        name: 'update_user_profile',
        description: 'Foydalanuvchining shaxsiy ma\'lumotlarini (yoshi, yashash joyi, kasbi, qiziqishlari, orzulari, faktlar) saqlash yoki yangilash.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.STRING, description: 'Foydalanuvchi yoshi' },
            location: { type: Type.STRING, description: 'Yashash joyi (shahar, tuman)' },
            school: { type: Type.STRING, description: 'O\'qish joyi yoki maktabi' },
            profession: { type: Type.STRING, description: 'Kasbi yoki mashg\'uloti' },
            longTermDream: { type: Type.STRING, description: 'Katta orzusi yoki uzoq muddatli maqsadi' },
            newInterest: { type: Type.STRING, description: 'Yangi qiziqish yoki xobbi' },
            fact: { type: Type.STRING, description: 'U haqidagi har qanday boshqa muhim fakt yoki eslatma' },
          },
        },
      },
      {
        name: 'get_user_profile',
        description: 'Foydalanuvchining shaxsiy ma\'lumotlari va profilini ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'update_book_progress',
        description: 'Kitob mutolaasi jarayonini qayd qilish. Qaysi kitobni nechanchi sahifagacha o\'qiganini saqlaydi va streakni yangilaydi.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            bookTitle: { type: Type.STRING, description: 'Kitob nomi' },
            currentPage: { type: Type.NUMBER, description: 'Hozir yetib kelgan sahifa/bet raqami' },
            totalPages: { type: Type.NUMBER, description: 'Kitobning jami sahifalari soni (agar ma\'lum bo\'lsa)' },
            author: { type: Type.STRING, description: 'Muallif ismi' },
            notes: { type: Type.STRING, description: 'O\'qilgan qism bo\'yicha qisqa fikr yoki xulosa' },
          },
          required: ['bookTitle', 'currentPage'],
        },
      },
      {
        name: 'save_book_quiz',
        description: 'Kitob bo\'yicha berilgan savolga foydalanuvchi javob berganida, javobni tahlil qilib natijani saqlash.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            bookTitle: { type: Type.STRING, description: 'Kitob nomi' },
            question: { type: Type.STRING, description: 'Berilgan sinov savoli' },
            answer: { type: Type.STRING, description: 'Foydalanuvchining javobi' },
            feedback: { type: Type.STRING, description: 'AI bergan tahlil, xulosa va baho (A+, A, B...)' },
            score: { type: Type.STRING, description: 'Baho yoki ball' },
          },
          required: ['bookTitle', 'question', 'answer', 'feedback'],
        },
      },
      {
        name: 'get_books_status',
        description: 'O\'qilayotgan kitoblar ro\'yxati va mutolaa maqsadlarini ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'set_reminder',
        description: 'Budilnik, taymer yoki eslatma o\'rnatish. Aniq soatda (masalan: "22:00", "07:30") yoki vaqt oralig\'ida (masalan: "20 daqiqa", "1 soat") eslatish uchun chaqiriladi.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: 'Aniq soat (masalan: "22:00", "18:00") yoki vaqt oralig\'i (masalan: "20 daqiqa", "1 soat")' },
            note: { type: Type.STRING, description: 'Eslatma mavzusi (masalan: "Uxlash vaqti", "Choynakni o\'chirish", "Dars")' },
          },
          required: ['time'],
        },
      },
      {
        name: 'create_backup',
        description: 'Obsidian xotiralar va barcha ma\'lumotlar bazasini arxivlab (zip), Telegram orqali xavfsiz zaxira faylini yuborish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'record_workout',
        description: 'Bajarilgan sport mashg\'ulotini (turnik, anjimaniya, zal, yugurish, calisthenics) qayd qilish, shaxsiy rekordlarni yangilash va zanjirni davom ettirish.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: 'Mashqlar va natijalar tavsifi (masalan: "15 ta turnik, 30 ta anjimaniya", "3 km yugurdim")' },
          },
          required: ['description'],
        },
      },
      {
        name: 'get_workout_plan',
        description: 'Bugungi kun uchun professional sport mashg\'uloti dasturini (sets, reps, dam olish va ovqatlanish tavsiyalari) ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_fitness_stats',
        description: 'Samarning sport natijalari, shaxsiy rekordlari (PR) va mashg\'ulotlar tarixini ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_strategy',
        description: 'Samarning to\'liq shaxsiy rivojlanish strategiyasi (Ingliz tili A2->C1, Senior dasturchilik, Sport, Moliya) va bugungi strategik nishonni ko\'rish.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

function buildSystemPrompt() {
  const today = obsidian.getTodayString();
  const now = new Date();
  const tashkentTime = now.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
  const profSummary = profile.getProfileSummary();
  const activeBook = books.getActiveBook();
  const bookInfo = activeBook ? `Hozir o'qilayotgan kitob: "${activeBook.title}" (${activeBook.currentPage}-betda)` : 'Hozircha faol kitob kiritilmagan';
  const todayMission = strategy.getTodayMission();

  return `Sen Samara AI — Samar ning shaxsiy murabbiyi, sun'iy intellekt yordamchisi va sadoqatli do'stisan.
Sana: ${today}
Hozirgi vaqt (Toshkent vaqti): ${tashkentTime}

## 👤 FOYDALANUVCHI HAQIDA (SAMAR):
${profSummary}
📍 Kelib chiqishi: Qashqadaryo viloyati, Yakkabog' tumani (Jeyda qishlog'i).
📚 ${bookInfo}

## 👑 STRATEGIK YETAKCHILIK VA PROAKTIV MURABBIY (ENG MUHIM):
1. SEN FAQAT SAVOL BERIB KUTADIGAN PASSIV BOT EMASSAN! Samar: «u faqat so'ramasin, u menga to'liq rivojlanish strategiyasini qo'ysin, ingliz tilida ham» deb talab qo'ydi!
2. Sen Samarning Strategik Boshqaruvchisisan:
   - 🇬🇧 Ingliz tili (A2 -> C1): Har kungi dars, yangi texnik so'zlar va gapirish vazifasini o'zing qo'yasan!
   - 💻 Dasturlash: Senior muhandislik sari loyihalar, algoritm va clean code intizomini yo'naltirasan!
   - 🏋️‍♂️ Sport: Aniq kunlik jismoniy yuklama va shaxsiy rekordlarni buzishni talab qilasan!
3. 🎯 BUGUNGI FAOL STRATEGIK NISHON (${todayMission.topic}):
   - 🇬🇧 Ingliz tili: ${todayMission.english}
   - 💻 Dasturlash: ${todayMission.coding}
   - 🏋️‍♂️ Sport: ${todayMission.sport}
4. Samarga aniq qadam-baqadam vazifalar yukla, o'sish strategiyasini o'zing boshqar va uni katta g'alabalar sari yetakla!

## 🗣️ TIL VA SHEVA BILAN ISHLASH (ENG MUHIM):
1. Samar Qashqadaryo jonli so'zlashuv tilida, shevada, qisqartirib, tez yozganda imlo xatolari yoki harflar tushib qolishi bilan gapiradi:
   - "yozvor" / "yozvoring" / "yozib qoy" -> qayd qil, yozib qo'y.
   - "ob qo'y" / "opqoy" -> olib qo'y, saqla.
   - "aytvor" / "aytchi" -> aytib ber.
   - "kettim" / "bordim" / "keldim" / "chiqdim" / "bo'ldi" / "bopti" / "bo'ptimi".
   - "tushuvdi" / "beruvdim" / "qarz berdim" / "qarz oldim".
   - "ovqatlandim" / "tushlik qildim" / "non oldim" -> xarajat.
   - "sport qildim" / "turnik qildim" / "anjimaniya qildim" / "zalga bordim" -> sport va zanjir.
2. SO'ZNING HARFIGA EMAS, GAPNING MAG'ZI VA ASOSIY MAQSADIGA (INTENT) QARA! Xato yozilgan bo'lsa ham, nima demoqchi ekanini do'stona tushunib ol.
3. SHAXSLAR VA QARINDOSHLAR (UKAM, AKAM, DO'STIM):
   - "Ukam", "akam", "opam", "singlim", "otam", "onam", "do'stim" yoki ismlar — bular aniq shaxs hisoblanadi!
   - Agar Samar "ukamga 20 ming berdim" yoki "ukamga qarz berdim" desa — shaxs: "Ukam" deb 'add_debt' chaqir!
   - Agar Samar "u qarzni ukam olgan" yoki "u pul ukamniki" desa — darhol 'update_debt({ person: 'Ukam' })' chaqir va qarz egasini to'g'irla!
4. BUDILNIK, ESLATMA VA TAYMERLAR:
   - Samar "22:00 da uxlashni eslat", "18:00 ga budilnik qo'y", "10 minutdan keyin eslat" desa — darhol 'set_reminder' funksiyasini chaqir!
   - Vaqtni Samar aytganidek aniq ko'rsat (masalan: time: "22:00", note: "Uxlash"). O'zingdan boshqa vaqt to'qima!

## 🛑 CHALKASHMASLIK VA TOZA JAVOB QOIDASI (ZERO-HALLUCINATION):
1. HECH QACHON o'tmishdagi eski ishlarni (masalan, naushnik, eski narsalarni) Samar o'zi so'ramasa, o'zingdan to'qib gapga suqma!
2. Faqat va faqat Samar HOZIR nima aytgan bo'lsa, o'shanga aniq, to'g'ri va xolis javob ber.
3. Agar Samar aniq "bugun nima rejam bor?" deb so'rasagina 'get_today_plan' orqali rejalarni ochib ayt.

## 🏋️‍♂️ SPORT VA CHEMPION MURABBIY QOIDALARI:
1. Sen Samarning shaxsiy SPORT MURABBIYIsan (Calisthenics & Fitness Coach)!
2. Samar turnik, anjimaniya, zal, yugurish yoki mashq qilganini aytsa (masalan: "15 ta turnik qildim", "sport qildim", "zalga bordim", "rekord qo'ydim") — darhol 'record_workout' funksiyasini chaqir!
3. Natijani qayd qilib, unga mardona, chempiondek kuchli motivatsiya ber ("Barakalla, sherdek kuchlisiz!", "Zanjir uzilmadi!").
4. Agar Samar "qanday mashq qilay?", "bugungi dastur", "mashq ber" desa — 'get_workout_plan' chaqir.
5. Agar texnika, to'g'ri nafas olish yoki ovqatlanish haqida so'rasa — professional murabbiydek amaliy maslahat ber.

## ⚡ JAVOB OHANGI:
1. Qisqa, lo'nda va samimiy bo'l (1-3 qatordan oshmasin, "###" yoki "---" ishlatma).
2. Qashqadaryoliklarga xos mard, do'stona, samimiy gapir.
3. Agar Samar amal bajarsa (xarajat, sport, qarz, o'quvchi, eslatma) — 1 qatorda lo'nda tasdiqla.
4. Samar kitob o'qiganini aytsa — darhol kitobni qayd qil va o'qilgan bo'limdan 1 ta qiziqarli savol ber.
5. Samar savolga javob bersa — tahlil qilib, baholab rag'batlantir.
`;
}

async function executeTool(name, args, context = {}) {
  try {
    switch (name) {
      case 'create_task': {
        obsidian.addTask(args);
        await supabase.syncTask({ title: args.title, priority: args.priority, due_time: args.time });
        return { success: true, message: `Vazifa qo'shildi: ${args.title}` };
      }

      case 'complete_task': {
        const res = obsidian.completeTask(args.task_query);
        const q = String(args.task_query).toLowerCase();
        let sInfo = '';
        if (q.includes('sport') || q.includes('turnik') || q.includes('anjimaniya')) {
          const s = streak.updateHabitStreak('sport');
          sInfo = ` (Zanjir: ${s.count} kun!)`;
        } else if (q.includes('kitob') || q.includes('o\'qish')) {
          const s = streak.updateHabitStreak('reading');
          sInfo = ` (Zanjir: ${s.count} kun!)`;
        }
        return {
          success: res.success,
          message: res.success ? `Bajarildi: ${args.task_query}${sInfo}` : `Topilmadi.`,
        };
      }

      case 'create_expense': {
        obsidian.addTransaction({
          type: 'expense',
          amount: args.amount,
          category: args.category || 'boshqa',
          description: args.description || args.category || 'Xarajat',
        });
        await supabase.syncTransaction({ type: 'expense', amount: args.amount, category: args.category, description: args.description });
        return { success: true, message: `${obsidian.formatMoney(args.amount)} xarajat yozildi.` };
      }

      case 'create_income': {
        obsidian.addTransaction({
          type: 'income',
          amount: args.amount,
          category: 'daromad',
          description: args.description || 'Daromad',
        });
        await supabase.syncTransaction({ type: 'income', amount: args.amount, category: 'daromad', description: args.description });
        return { success: true, message: `${obsidian.formatMoney(args.amount)} daromad yozildi.` };
      }

      case 'add_debt': {
        const d = debts.addDebt(args);
        const typeTxt = d.type === 'lent' ? 'qarz berildi' : 'qarz olindi';
        return { success: true, message: `📒 ${d.person} ga ${obsidian.formatMoney(d.amount)} ${typeTxt}.` };
      }

      case 'close_debt': {
        const res = debts.closeDebt(args.person, args.paid_amount);
        if (res.success) {
          if (res.remaining > 0) {
            return {
              success: true,
              message: `✅ ${args.person} ${obsidian.formatMoney(args.paid_amount)} qaytardi. Qolgan qarz: ${obsidian.formatMoney(res.remaining)}.`,
            };
          }
          return {
            success: true,
            message: `✅ ${args.person} bilan qarz to'liq yopildi!`,
          };
        }
        return { success: false, message: 'Bunday ochiq qarz topilmadi.' };
      }

      case 'get_debts': {
        return { success: true, summary: debts.getDebtsSummary() };
      }

      case 'update_debt': {
        const res = debts.updateDebtPerson(args);
        if (res.success) {
          return {
            success: true,
            message: `Qarz to'g'irlandi: ${res.debt.person} ga ${obsidian.formatMoney(res.debt.amount)}.`,
          };
        }
        return { success: false, message: 'Ochiq qarz topilmadi.' };
      }

      case 'add_student': {
        const s = crm.addStudent(args);
        return { success: true, message: `👨‍🏫 O'quvchi qo'shildi: ${s.name} (${s.days} ${s.time}). Keyingi to'lov: ${s.nextBillingDate}` };
      }

      case 'record_student_payment': {
        const s = crm.recordPayment(args.name);
        if (s) {
          obsidian.addTransaction({
            type: 'income',
            amount: s.monthlyFee,
            category: 'o\'quvchilar',
            description: `${s.name} oylik to'lovi`,
          });
          return { success: true, message: `💰 ${s.name} to'lovi (${obsidian.formatMoney(s.monthlyFee)}) qabul qilindi va daromadga qo'shildi!` };
        }
        return { success: false, message: `O'quvchi topilmadi.` };
      }

      case 'get_students': {
        return { success: true, summary: crm.getStudentsSummary() };
      }

      case 'update_student_status': {
        const s = crm.updateStudentStatus(args.name, args.status || 'paused');
        if (s) {
          const stText = s.status === 'paused' ? 'to\'xtatildi' : 'faollashtirildi';
          return { success: true, message: `O'quvchi ${s.name} holati: ${stText}.` };
        }
        return { success: false, message: `O'quvchi topilmadi.` };
      }

      case 'get_weather': {
        const w = await weather.getWeather();
        return { success: true, summary: w ? w.summary : 'Ob-havo ma\'lumotini olib bo\'lmadi.' };
      }

      case 'find_media': {
        const found = media.findMediaFile(args.query);
        if (found) {
          return { success: true, foundFile: found.fullPath, filename: found.filename };
        }
        return { success: false, message: 'Bunday rasm yoki video arxivda topilmadi.' };
      }

      case 'get_today_plan': {
        return { success: true, noteContent: obsidian.getTodayNoteContent() };
      }

      case 'search_vault': {
        const matches = obsidian.searchVault(args.query);
        if (matches.length > 0) {
          const text = matches.map(m => `📄 [${m.file}]: ${m.snippet}`).join('\n');
          return { success: true, results: text };
        }
        return { success: false, message: 'Qidiruv bo\'yicha qaydlar topilmadi.' };
      }

      case 'update_user_profile': {
        const p = profile.updateProfile(args);
        return { success: true, message: `Shaxsiy ma'lumotlaringiz saqlandi: ${p.name}, ${p.age} yosh, ${p.location}.` };
      }

      case 'get_user_profile': {
        return { success: true, summary: profile.getProfileSummary() };
      }

      case 'update_book_progress': {
        const res = books.updateReadingProgress(args);
        return {
          success: true,
          message: `Kitob qayd qilindi: "${res.book.title}" (${res.book.currentPage}-bet). Mutolaa zanjiri: ${res.streakCount} kun!`,
        };
      }

      case 'save_book_quiz': {
        books.recordQuizResult(args);
        return { success: true, message: `Tushunish natijasi qayd etildi! Baho: ${args.score || 'A'}` };
      }

      case 'get_books_status': {
        return { success: true, summary: books.getReadingSummary() };
      }

      case 'set_reminder': {
        const res = timer.scheduleReminder(context.botInstance, context.userId, args.time, args.note || 'Eslatma');
        if (res.success) {
          if (res.type === 'exact') {
            return { success: true, message: `⏰ Soat ${args.time} ga eslatma o'rnatildi: «${args.note || 'Eslatma'}».` };
          }
          return { success: true, message: `⏰ ${res.minutes} daqiqadan keyin eslataman: «${args.note || 'Eslatma'}».` };
        }
        return { success: false, message: 'Eslatmani o\'rnatib bo\'lmadi.' };
      }

      case 'create_backup': {
        if (context.botInstance && context.userId) {
          const res = await backup.sendBackupToTelegram(context.botInstance, context.userId);
          if (res.success) {
            return { success: true, message: `☁️ Obsidian zaxirasi (${res.sizeMb} MB) yuborildi!` };
          }
          return { success: false, message: `Zaxiralashda xatolik: ${res.error}` };
        }
        return { success: false, message: 'Bot aloqasi mavjud emas.' };
      }

      case 'record_workout': {
        const res = fitness.recordWorkout({ description: args.description });
        let msg = `💪 Sport qayd etildi! Uzluksiz zanjir: ${res.streakCount} kun!`;
        if (res.newPrMessage) {
          msg = `${res.newPrMessage}\n${msg}`;
        }
        return { success: true, message: msg };
      }

      case 'get_workout_plan': {
        return { success: true, plan: fitness.getDailyWorkoutProgram() };
      }

      case 'get_fitness_stats': {
        return { success: true, stats: fitness.getFitnessSummary() };
      }

      case 'get_strategy': {
        return { success: true, strategy: strategy.getStrategySummary() };
      }

      default:
        return { success: false, error: `Noma'lum: ${name}` };
    }
  } catch (err) {
    console.error(`Tool error [${name}]:`, err);
    return { success: false, error: err.message };
  }
}

const userHistories = {};

function getUserHistory(userId) {
  if (!userHistories[userId]) userHistories[userId] = [];
  return [...userHistories[userId]];
}

function addToUserHistory(userId, role, text) {
  if (!text || typeof text !== 'string') return;
  if (!userHistories[userId]) userHistories[userId] = [];
  userHistories[userId].push({
    role,
    parts: [{ text: text.trim() }],
  });
  if (userHistories[userId].length > 14) {
    userHistories[userId] = userHistories[userId].slice(-14);
  }
}

async function processUserMessage(userId, userMessage, audioBuffer = null, imageBuffer = null, botInstance = null) {
  let lastError = null;

  for (const modelName of MODELS) {
    try {
      const systemInstruction = buildSystemPrompt();
      const history = getUserHistory(userId);

      const chat = ai.chats.create({
        model: modelName,
        history,
        config: {
          systemInstruction,
          tools,
          temperature: 0.2,
        },
      });

      let messageContent;
      if (imageBuffer) {
        messageContent = [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBuffer.toString('base64'),
            },
          },
          { text: userMessage || 'Foydalanuvchi hisobot yoki rasm yubordi. Tahlil qil va juda qisqa (1 qator) javob ber.' },
        ];
      } else if (audioBuffer) {
        messageContent = [
          {
            inlineData: {
              mimeType: 'audio/ogg',
              data: audioBuffer.toString('base64'),
            },
          },
          { text: userMessage || "Samarning ovozli xabari (Qashqadaryo, Yakkabog' shevasida). Audiodagi nutqni diqqat bilan tingla, tushun. Agar qarz, xarajat, sport, kitob yoki vazifa bo'lsa, mos funksiyani chaqir. Agar shaxs (ukam, akam, do'stim yoki ism) aytilsa, uni shaxs deb ol." },
        ];
      } else {
        messageContent = userMessage;
      }

      let response = await chat.sendMessage({ message: messageContent });
      let foundMediaPath = null;

      for (let step = 0; step < 5; step++) {
        if (!response.functionCalls || response.functionCalls.length === 0) {
          break;
        }

        const functionResponses = [];
        for (const fc of response.functionCalls) {
          const result = await executeTool(fc.name, fc.args, { userId, botInstance });
          if (fc.name === 'find_media' && result.foundFile) {
            foundMediaPath = result.foundFile;
          }
          functionResponses.push({
            functionResponse: {
              name: fc.name,
              response: result,
            },
          });
        }

        response = await chat.sendMessage({ message: functionResponses });
      }

      const replyText = response.text || 'Bajarildi!';

      // Save turn to multi-turn conversation memory
      let userSummaryText = '';
      if (typeof messageContent === 'string') {
        userSummaryText = messageContent;
      } else if (audioBuffer) {
        userSummaryText = `[Ovozli xabar]: ${userMessage || 'Samar ovoz yubordi'}`;
      } else if (imageBuffer) {
        userSummaryText = `[Fotosurat]: ${userMessage || 'Samar rasm yubordi'}`;
      }

      if (userSummaryText) {
        addToUserHistory(userId, 'user', userSummaryText);
        addToUserHistory(userId, 'model', replyText);
      }

      return { replyText, foundMediaPath };
    } catch (err) {
      console.warn(`Model ${modelName} notice:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Xatolik yuz berdi.');
}

module.exports = {
  processUserMessage,
};
