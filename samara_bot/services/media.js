const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const MEDIA_DIR = path.join(VAULT_PATH, 'Media');

function ensureMediaDirs() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().substring(0, 10);
}

// Save downloaded buffer to Obsidian Vault
async function saveMediaFile({ buffer, originalExt = 'jpg', caption = '', fileType = 'photo' }) {
  ensureMediaDirs();

  const today = getTodayString();
  const year = today.substring(0, 4);
  const targetFolder = path.join(MEDIA_DIR, year);
  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

  const safeCaption = (caption || fileType).replace(/[^a-zA-Z0-9_\u0400-\u04FF\s-]/g, '').trim().substring(0, 40).replace(/\s+/g, '_');
  const filename = `${today}_${safeCaption || 'xotira'}_${Date.now()}.${originalExt}`;
  const fullPath = path.join(targetFolder, filename);

  fs.writeFileSync(fullPath, buffer);

  // Record in Media Index Markdown file
  const indexFile = path.join(MEDIA_DIR, 'Xotiralar_Indeksi.md');
  const desc = caption || 'Nomsiz xotira';
  const entry = `- **${today}** | \`${filename}\` | ${fileType === 'video' ? '🎥' : '📸'} ${desc}\n`;

  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, `# 📸 Xotiralar Arxivi (Suratlar va Videolar)\n\n| Sana | Fayl | Izoh |\n|---|---|---|\n`, 'utf8');
  }
  fs.appendFileSync(indexFile, `| ${today} | \`${filename}\` | ${desc} |\n`, 'utf8');

  return { filename, fullPath, desc };
}

// Search for media by keyword or year
function findMediaFile(query) {
  ensureMediaDirs();
  const indexFile = path.join(MEDIA_DIR, 'Xotiralar_Indeksi.md');
  if (!fs.existsSync(indexFile)) return null;

  const content = fs.readFileSync(indexFile, 'utf8');
  const lines = content.split('\n').filter(l => l.startsWith('|'));

  const q = query.toLowerCase().trim();
  const matchedLine = lines.reverse().find(l => l.toLowerCase().includes(q));

  if (!matchedLine) return null;

  // Extract filename: e.g. | 2026-10-03 | `2026-10-03_rasm_123.jpg` | izoh |
  const match = matchedLine.match(/`([^`]+)`/);
  if (!match) return null;

  const filename = match[1];
  const year = filename.substring(0, 4);
  const fullPath = path.join(MEDIA_DIR, year, filename);

  if (fs.existsSync(fullPath)) {
    return { fullPath, filename, line: matchedLine };
  }
  return null;
}

module.exports = {
  saveMediaFile,
  findMediaFile,
};
