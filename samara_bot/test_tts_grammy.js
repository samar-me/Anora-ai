const { InputFile } = require('grammy');
const googleTTS = require('google-tts-api');

async function getVoiceInputFile(text, lang = 'uz') {
  const url = googleTTS.getAudioUrl(text.substring(0, 190), {
    lang,
    slow: false,
    host: 'https://translate.google.com',
  });
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  return new InputFile(buf, 'voice.mp3');
}

async function test() {
  const file = await getVoiceInputFile('Salom chempion!');
  console.log('Voice InputFile created:', file.filename);
}

test().catch(console.error);
