const fs = require('fs');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function isYouTubeUrl(url) {
  return /youtube\.com\/watch|youtu\.be\//i.test(url);
}

async function fetchYouTubeInfo(url) {
  let title = '';
  let channel = '';
  let transcript = '';

  // 1. Fetch real video title & channel via official oEmbed
  try {
    const oRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (oRes.ok) {
      const data = await oRes.json();
      title = data.title || '';
      channel = data.author_name || '';
    }
  } catch (err) {
    console.warn('YouTube oembed error:', err.message);
  }

  // 2. Try fetching transcript (subtitles)
  try {
    const items = await YoutubeTranscript.fetchTranscript(url);
    if (items && items.length > 0) {
      transcript = items.map(i => i.text).join(' ').substring(0, 4000);
    }
  } catch (_) {
    // Transcript disabled or not available, fallback to title & topic
  }

  return { title, channel, transcript };
}

async function fetchPageText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const clean = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000);

    return { title, text: clean };
  } catch (err) {
    console.warn('Page fetch error:', err.message);
    return null;
  }
}

async function summarizeUrl(url, aiService, userId, botInstance = null) {
  let prompt = '';
  let displayTitle = '';

  if (isYouTubeUrl(url)) {
    const yt = await fetchYouTubeInfo(url);
    displayTitle = yt.title || 'YouTube Videosi';

    if (yt.transcript) {
      prompt = `Foydalanuvchi Samar YouTube videosi havolasini yubordi:
Video nomi: "${yt.title}"
Kanal: "${yt.channel}"
Videoning matni (subtitrlar):
"${yt.transcript}"

Iltimos, ushbu videoning eng muhim 3 ta amaliy va hayotga tatbiq qilsa bo'ladigan xulosasini juda qisqa (bullet points) qilib ber.`;
    } else {
      prompt = `Foydalanuvchi Samar YouTube videosi havolasini yubordi:
Video nomi: "${yt.title}"
Kanal: "${yt.channel}"
(Ushbu videoda subtitrlar o'chirilgan, lekin video nomi va mavzusi: "${yt.title}")

Iltimos, ushbu video mavzusi va g'oyasidan kelib chiqib, video nima haqidaligi va Samar uchun 3 ta eng muhim, foydali amaliy xulosani qisqa (bullet points) qilib ber.`;
    }
  } else {
    const page = await fetchPageText(url);
    displayTitle = page?.title || 'Veb Sahifa';
    prompt = `Foydalanuvchi havola yubordi:
Sarlavha: "${displayTitle}"
Matn:
"${page?.text || 'Matn to\'liq olinmadi'}"

Ushbu manbaning eng muhim 3 ta amaliy xulosasini juda qisqa va aniq (bullet points) qilib ber.`;
  }

  const { replyText } = await aiService.processUserMessage(userId, prompt, null, null, botInstance);

  // Save to Obsidian Knowledge
  try {
    const kDir = path.join(VAULT_PATH, 'Knowledge');
    if (!fs.existsSync(kDir)) fs.mkdirSync(kDir, { recursive: true });
    const kFile = path.join(kDir, 'Maqolalar_va_Videolar.md');
    const entry = `\n### 🎥 [${displayTitle}](${url})\nSana: ${obsidian.getTodayString()}\n${replyText}\n---\n`;
    fs.appendFileSync(kFile, entry, 'utf8');
  } catch (err) {
    console.warn('Knowledge save notice:', err.message);
  }

  return { title: displayTitle, replyText };
}

module.exports = {
  extractUrl,
  summarizeUrl,
};
