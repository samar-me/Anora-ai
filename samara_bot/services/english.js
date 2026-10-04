const fs = require('fs');
const path = require('path');
const tts = require('./tts');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

// Store active English training state per chat
const activeEnglishUsers = new Set();

function isEnglishMode(userId) {
  return activeEnglishUsers.has(userId);
}

function startEnglishMode(userId) {
  activeEnglishUsers.add(userId);
}

function stopEnglishMode(userId) {
  activeEnglishUsers.delete(userId);
}

/**
 * Saves newly practiced words to Obsidian Knowledge
 */
function recordVocabulary(word, meaning, example = '') {
  try {
    const kDir = path.join(VAULT_PATH, 'Knowledge');
    if (!fs.existsSync(kDir)) fs.mkdirSync(kDir, { recursive: true });
    const file = path.join(kDir, 'Ingliz_Tili_Lugat.md');

    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        '# 🇬🇧 Ingliz Tili — Shaxsiy Lug\'at va Iboralar\n\n| Sana | So\'z / Ibora | Ma\'nosi | Misol |\n|---|---|---|---|\n',
        'utf8'
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const row = `| ${today} | **${word}** | ${meaning} | ${example || '-'} |\n`;
    fs.appendFileSync(file, row, 'utf8');
  } catch (err) {
    console.warn('Vocab record error:', err.message);
  }
}

/**
 * Returns today's proactive English mission and vocabulary set
 */
function getDailyEnglishMission() {
  const d = new Date();
  const day = d.getDay();

  const lessons = {
    1: {
      topic: 'Software Development & Architecture',
      words: [
        { word: 'Implement', meaning: 'Amalga oshirish, kodda bajarish', ex: 'I implemented a new caching layer.' },
        { word: 'Scalable', meaning: 'Kengaytiriladigan, katta yuklamaga bardoshli', ex: 'Our bot architecture is scalable.' },
        { word: 'Refactor', meaning: 'Kodni qayta tozalash va yaxshilash', ex: 'I refactored the database logic.' },
      ],
      challenge: 'Tell me: What feature in your Telegram bot did you implement or refactor recently?',
    },
    2: {
      topic: 'Problem Solving & Debugging',
      words: [
        { word: 'Troubleshoot', meaning: 'Muammo va xatolikni aniqlash', ex: 'Let us troubleshoot this API error.' },
        { word: 'Bottleneck', meaning: 'Tizimni sekinlashtiruvchi to\'siq', ex: 'Database queries were the main bottleneck.' },
        { word: 'Resolve', meaning: 'Muammoni hal qilish', ex: 'We resolved the memory issue.' },
      ],
      challenge: 'Describe a difficult coding bug or problem you resolved recently.',
    },
    3: {
      topic: 'Habits, Discipline & Calisthenics',
      words: [
        { word: 'Consistency', meaning: 'Davomiylik, uzluksizlik', ex: 'Consistency is the key to athletic mastery.' },
        { word: 'Endurance', meaning: 'Chidamlilik, toqat', ex: 'Running 5km builds incredible endurance.' },
        { word: 'Breakthrough', meaning: 'Katta sakrash, yangi pog\'ona', ex: 'Hitting 20 pull-ups was a real breakthrough.' },
      ],
      challenge: 'How does physical training and consistency help you become a better engineer?',
    },
    4: {
      topic: 'Tech Ambitions & Cadillac Escalade Dream',
      words: [
        { word: 'Aspire', meaning: 'Intilmoq, orzu qilmoq', ex: 'I aspire to build global tech products.' },
        { word: 'Achievement', meaning: 'Katta yutuq', ex: 'Buying my dream car will be a milestone achievement.' },
        { word: 'Dedication', meaning: 'Fidoyilik, jon kuydirish', ex: 'Dedication transforms dreams into reality.' },
      ],
      challenge: 'Tell me about your long-term dream car and how you plan to achieve it through technology.',
    },
    5: {
      topic: 'Teaching & Mentorship (Your Students)',
      words: [
        { word: 'Inspire', meaning: 'Ilhomlantirmoq', ex: 'A great tutor inspires students to think critically.' },
        { word: 'Guidance', meaning: 'Yo\'l-yo\'riq, ustozlik', ex: 'Students need clear practical guidance.' },
        { word: 'Progress', meaning: 'O\'sish, siljish', ex: 'Tracking weekly progress motivates the kids.' },
      ],
      challenge: 'What is the most rewarding part of teaching programming to your students?',
    },
    6: {
      topic: 'Job Interviews & Professional Pitch',
      words: [
        { word: 'Passionate', meaning: 'Qiziqishi baland, ishtiyoqli', ex: 'I am passionate about full-stack engineering.' },
        { word: 'Efficient', meaning: 'Samarali, tejovchi', ex: 'I write clean and efficient JavaScript.' },
        { word: 'Impact', meaning: 'Ta\'sir, natija', ex: 'I want to build software with real-world impact.' },
      ],
      challenge: 'Imagine a top tech company asks: "Why should we hire you, Samar?" Give your pitch in 2-3 sentences.',
    },
    0: {
      topic: 'Weekly Retrospective & Growth',
      words: [
        { word: 'Reflection', meaning: 'O\'ylash, sarhisob', ex: 'Sunday is for strategic reflection.' },
        { word: 'Accomplish', meaning: 'Muvaffaqiyat bilan bajarmoq', ex: 'What did you accomplish this week?' },
        { word: 'Sharpen', meaning: 'O\'tkirlamoq, charxlamoq', ex: 'Sharpen your skills every single day.' },
      ],
      challenge: 'What was your single biggest win or lesson learned this past week?',
    },
  };

  return lessons[day] || lessons[1];
}

/**
 * Handles English conversation turn with strategic coaching
 */
async function processEnglishTurn(aiService, userId, userMessage, isVoice = false) {
  const mission = getDailyEnglishMission();

  const prompt = `You are "Coach Anora", a world-class English & Tech Career Coach working with Samar, a 16-year-old high-potential software engineer from Uzbekistan.
Today's Theme: "${mission.topic}".

User's English input:
"${userMessage}"

Respond proactively as a top mentor. Provide your response in English structured EXACTLY as follows:
1. 💬 **Coach Feedback & Reply:** (1-2 encouraging, sharp sentences engaging with what he actually said).
2. 💡 **Native Phrasing / Polish:** (If he made a grammar/vocab mistake, show the natural native way. If great, praise his fluency).
3. 🔑 **Key Vocabulary in Action:** (Show how to use one of today's target words in this context, with short Uzbek meaning).
4. 🚀 **Next Challenge / Step:** (Ask 1 compelling follow-up question related to today's topic to push his fluency forward).

Keep it under 80 words. Be commanding, motivating, and energetic!`;

  const { replyText } = await aiService.processUserMessage(userId, prompt);

  // Generate English Voice for the conversation response
  const cleanSpeech = replyText
    .replace(/💡.*?(\n|$)/gs, '')
    .replace(/🔑.*?(\n|$)/gs, '')
    .replace(/[*_#`~]/g, '')
    .trim();

  let voiceFile = null;
  try {
    voiceFile = await tts.textToVoice(cleanSpeech || replyText, 'en');
  } catch (_) {}

  // Save new vocab word if present
  const vocabMatch = replyText.match(/🔑.*?\*\*([^*]+)\*\*[:\s—-]+([^\n]+)/);
  if (vocabMatch) {
    recordVocabulary(vocabMatch[1].trim(), vocabMatch[2].trim());
  }

  return { replyText, voiceFile };
}

module.exports = {
  isEnglishMode,
  startEnglishMode,
  stopEnglishMode,
  processEnglishTurn,
  recordVocabulary,
  getDailyEnglishMission,
};
