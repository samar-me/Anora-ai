const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const { InputFile } = require('grammy');

let edgeTtsInstance = null;

function getTts() {
  if (!edgeTtsInstance) {
    edgeTtsInstance = new MsEdgeTTS();
  }
  return edgeTtsInstance;
}

/**
 * Converts text into natural audio voice (Uzbek or English)
 * @param {string} text 
 * @param {'uz' | 'en'} lang 
 * @returns {Promise<InputFile|null>}
 */
async function textToVoice(text, lang = 'uz') {
  try {
    if (!text || typeof text !== 'string') return null;

    const cleanText = text
      .replace(/[*_#`~>\[\]()—]/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return null;

    // Pick first 2-3 sentences or up to 350 chars for responsive Telegram voice reply
    let speakable = cleanText;
    if (speakable.length > 350) {
      const dotIndex = speakable.indexOf('.', 200);
      speakable = dotIndex !== -1 ? speakable.substring(0, dotIndex + 1) : speakable.substring(0, 350);
    }

    const voice = lang === 'en' ? 'en-US-JennyNeural' : 'uz-UZ-MadinaNeural';
    const tts = getTts();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(speakable);
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
};
