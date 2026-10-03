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
 * Handles English conversation turn
 */
async function processEnglishTurn(aiService, userId, userMessage, isVoice = false) {
  const prompt = `You are "Samara", a friendly, patient, and world-class English Coach speaking with Samar, a 16-year-old aspiring software engineer from Uzbekistan.

User's English input:
"${userMessage}"

Provide a warm, supportive response in English structured EXACTLY as follows:
1. 💬 **Response & Conversation:** A natural 1-2 sentence conversational answer to what he said, keeping the dialogue going.
2. 💡 **Grammar / Better phrasing:** (If there was a mistake or an awkward phrase, kindly show the native way to say it. If perfect, say "Your sentence is spot on!").
3. 📚 **New Word / Collocation:** Suggest 1 high-impact English word or phrase relevant to this topic with its Uzbek meaning.
4. ❓ **Question:** Ask 1 clear, engaging follow-up question for Samar to answer.

Keep the total response under 80 words. Be encouraging and energizing!`;

  const { replyText } = await aiService.processUserMessage(userId, prompt);

  // Generate English Voice for the conversation response
  // Extract the conversational response part or speak the whole clean text
  const cleanSpeech = replyText
    .replace(/💡.*?(\n|$)/gs, '')
    .replace(/📚.*?(\n|$)/gs, '')
    .replace(/[*_#`~]/g, '')
    .trim();

  let voiceFile = null;
  try {
    voiceFile = await tts.textToVoice(cleanSpeech || replyText, 'en');
  } catch (_) {}

  // Try extracting any new vocab word and saving to Obsidian
  const vocabMatch = replyText.match(/📚.*?\*\*([^*]+)\*\*[:\s—-]+([^\n]+)/);
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
};
