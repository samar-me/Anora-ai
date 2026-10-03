const googleTTS = require('google-tts-api');

async function test() {
  const url = googleTTS.getAudioUrl('Xayrli tong, chempion! Bugun yangi marralarni zabt etamiz.', {
    lang: 'uz',
    slow: false,
    host: 'https://translate.google.com',
  });
  console.log('Audio URL:', url);
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  console.log('Fetched audio bytes:', buf.byteLength);
}

test().catch(console.error);
