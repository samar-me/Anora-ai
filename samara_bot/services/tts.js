const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const { InputFile } = require('grammy');
const fs = require('fs');
const path = require('path');

let edgeTtsInstance = null;
const CONFIG_FILE = path.join(__dirname, '..', 'user_config.json');

const VOICE_PROFILES = {
  sweet: {
    id: 'sweet',
    name: '🌸 Madina (Mayin & Shirin)',
    desc: 'O\'zbekcha, balandroq va juda muloyim, yosh qiz ovozi',
    voice: 'uz-UZ-MadinaNeural',
    options: { pitch: '+8Hz', rate: '+4%' },
  },
  classic: {
    id: 'classic',
    name: '🌺 Madina (Klassik)',
    desc: 'O\'zbekcha, rasmiyroq va vazmin qiz ovozi',
    voice: 'uz-UZ-MadinaNeural',
    options: { pitch: '+0Hz', rate: '+0%' },
  },
  soft_turk: {
    id: 'soft_turk',
    name: '🌟 Emel (Turkiy mayin ohang)',
    desc: 'Juda nafis va qo\'shiqdek jarangdor qiz ovozi',
    voice: 'tr-TR-EmelNeural',
    options: { pitch: '+4Hz', rate: '+3%' },
  },
  jenny: {
    id: 'jenny',
    name: '👑 Jenny (Inglizcha go\'zal)',
    desc: 'Xalqaro darajadagi eng chiroyli inglizcha qiz ovozi',
    voice: 'en-US-JennyNeural',
    options: { pitch: '+4Hz', rate: '+2%' },
  },
};

function getActiveVoiceProfile() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (cfg.voiceProfile && VOICE_PROFILES[cfg.voiceProfile]) {
        return VOICE_PROFILES[cfg.voiceProfile];
      }
    } catch (_) {}
  }
  return VOICE_PROFILES.sweet; // Default to sweet young voice
}

function setActiveVoiceProfile(profileId) {
  if (!VOICE_PROFILES[profileId]) return null;
  let cfg = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try { cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (_) {}
  }
  cfg.voiceProfile = profileId;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  return VOICE_PROFILES[profileId];
}

function getTts() {
  if (!edgeTtsInstance) {
    edgeTtsInstance = new MsEdgeTTS();
  }
  return edgeTtsInstance;
}

/**
 * Converts text into natural audio voice
 * @param {string} text 
 * @param {'uz' | 'en'} lang 
 * @param {string} overrideProfileId 
 * @returns {Promise<InputFile|null>}
 */
async function textToVoice(text, lang = 'uz', overrideProfileId = null) {
  try {
    if (!text || typeof text !== 'string') return null;

    const cleanText = text
      .replace(/[*_#`~>\[\]()—]/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return null;

    let speakable = cleanText;
    if (speakable.length > 350) {
      const dotIndex = speakable.indexOf('.', 200);
      speakable = dotIndex !== -1 ? speakable.substring(0, dotIndex + 1) : speakable.substring(0, 350);
    }

    let profile;
    if (overrideProfileId && VOICE_PROFILES[overrideProfileId]) {
      profile = VOICE_PROFILES[overrideProfileId];
    } else if (lang === 'en') {
      profile = VOICE_PROFILES.jenny;
    } else {
      profile = getActiveVoiceProfile();
    }

    const tts = getTts();
    await tts.setMetadata(profile.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(speakable, profile.options);
    const chunks = [];

    return new Promise((resolve) => {
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(new InputFile(buf, 'voice.mp3'));
      });
      audioStream.on('error', (err) => {
        console.warn('TTS stream error:', err.message);
        resolve(null);
      });
    });
  } catch (err) {
    console.warn('TTS error:', err.message);
    return null;
  }
}

module.exports = {
  textToVoice,
  VOICE_PROFILES,
  getActiveVoiceProfile,
  setActiveVoiceProfile,
};
