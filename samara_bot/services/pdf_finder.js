const fs = require('fs');
const path = require('path');
require('dotenv').config();

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFileName(name) {
  let clean = name.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim().slice(0, 60);
  if (!clean.toLowerCase().endsWith('.pdf')) clean += '.pdf';
  return clean;
}

/**
 * Search Internet Archive (archive.org) for unrestricted, directly downloadable PDF books
 */
async function searchArchiveOrg(query) {
  try {
    const cleanQuery = query.replace(/[^\w\s]/gi, ' ').trim();
    // Exclude lending/borrow DRM items (access-restricted-item)
    const url = `https://archive.org/advancedsearch.php?q=(${encodeURIComponent(cleanQuery)})+AND+mediatype:(texts)+AND+NOT+access-restricted-item:*&fl[]=identifier,title,creator,year,description&rows=8&output=json`;

    const res = await fetch(url, { headers: { 'User-Agent': 'AnoraAI/2.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const docs = data?.response?.docs || [];
    if (docs.length === 0) return null;

    for (const doc of docs) {
      const filesUrl = `https://archive.org/metadata/${doc.identifier}/files`;
      const filesRes = await fetch(filesUrl, { headers: { 'User-Agent': 'AnoraAI/2.0' } });
      if (!filesRes.ok) continue;
      const filesData = await filesRes.json();
      const files = filesData?.result || [];

      // Filter PDF files
      const pdfFiles = files.filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length === 0) continue;

      // Prefer clean text or standard size over massive uncompressed scans
      const chosen = pdfFiles.find(f => {
        const s = parseInt(f.size, 10) || 0;
        return s > 50000 && s < 45 * 1024 * 1024 && !f.name.includes('_bw') && !f.name.includes('_jp2');
      }) || pdfFiles[0];

      const sizeBytes = parseInt(chosen.size, 10) || 0;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      const downloadUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(chosen.name)}`;

      // Test verify accessibility with a quick HEAD or GET request
      try {
        const testRes = await fetch(downloadUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-1024', 'User-Agent': 'Mozilla/5.0 AnoraBot/2.0' }
        });

        if (testRes.status === 200 || testRes.status === 206) {
          return {
            title: doc.title || query,
            author: Array.isArray(doc.creator) ? doc.creator.join(', ') : (doc.creator || 'Mashhur Muallif'),
            year: doc.year || 'Tarixiy nashr',
            fileName: sanitizeFileName(chosen.name),
            downloadUrl,
            sizeMB,
            sizeBytes,
            source: 'Internet Archive (Ochiq Raqamli Kutubxona)'
          };
        }
      } catch (_) {
        // Try next doc
      }
    }
    return null;
  } catch (err) {
    console.error('Archive.org search error:', err.message);
    return null;
  }
}

/**
 * Search arXiv for research papers and CS algorithms
 */
async function searchArxiv(query) {
  try {
    const cleanQuery = query.replace(/[^\w\s]/gi, ' ').trim();
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(cleanQuery)}&start=0&max_results=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const xml = await res.text();

    const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/g);
    const idMatch = xml.match(/<id>http:\/\/arxiv\.org\/abs\/(.*?)<\/id>/);
    const authorMatch = xml.match(/<author>[\s\S]*?<name>(.*?)<\/name>/);

    if (idMatch && idMatch[1]) {
      const arxivId = idMatch[1].trim();
      const title = (titleMatch && titleMatch[1]) ? titleMatch[1].replace(/<\/?title>/g, '').trim() : query;
      const author = authorMatch ? authorMatch[1].trim() : 'arXiv Tadqiqotchilari';
      const downloadUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

      return {
        title,
        author,
        year: new Date().getFullYear(),
        fileName: sanitizeFileName(`${title}.pdf`),
        downloadUrl,
        sizeMB: '1.5',
        sizeBytes: 1500000,
        source: 'arXiv Ilmiy Tadqiqot Kutubxonasi'
      };
    }
    return null;
  } catch (err) {
    console.error('arXiv search error:', err.message);
    return null;
  }
}

/**
 * Main function: Searches the web, downloads the PDF file, and logs to Obsidian
 */
async function findAndFetchBookPdf(searchQuery) {
  ensureDir(DOWNLOADS_DIR);

  // 1. Search Internet Archive
  let book = await searchArchiveOrg(searchQuery);

  // 2. Fallback to arXiv if query is technical/scientific
  if (!book) {
    book = await searchArxiv(searchQuery);
  }

  if (!book) {
    return {
      found: false,
      message: `Kechirasiz, internet kutubxonalaridan «${searchQuery}» bo'yicha to'g'ridan-to'g'ri ochiq PDF kitob topilmadi. Qidiruv so'zini aniqroq (masalan, muallif yoki inglizcha nomini) yozib ko'ring.`
    };
  }

  // Telegram upload limit check (50 MB)
  const isLarge = book.sizeBytes > 45 * 1024 * 1024;
  let fileBuffer = null;
  let localFilePath = null;

  if (!isLarge) {
    try {
      const res = await fetch(book.downloadUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 AnoraBot/2.0' }
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
        localFilePath = path.join(DOWNLOADS_DIR, book.fileName);
        fs.writeFileSync(localFilePath, fileBuffer);
      }
    } catch (downloadErr) {
      console.warn('PDF buffer download warning:', downloadErr.message);
    }
  }

  // Log book to Obsidian
  logToObsidianVault(book);

  return {
    found: true,
    title: book.title,
    author: book.author,
    year: book.year,
    source: book.source,
    fileName: book.fileName,
    sizeMB: book.sizeMB,
    downloadUrl: book.downloadUrl,
    fileBuffer,
    localFilePath,
    isLarge
  };
}

function logToObsidianVault(book) {
  try {
    const booksDir = path.join(VAULT_PATH, 'Books');
    ensureDir(booksDir);
    const mdPath = path.join(booksDir, 'Yuklangan_Kitoblar.md');

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (!fs.existsSync(mdPath)) {
      const header = `# 📥 Anora AI Orqali Qidirilgan va Yuklangan Kitoblar\n\nUshbu fayl internet kutubxonalaridan topilgan barcha kitoblar ro'yxatini jamlaydi.\n\n---\n\n`;
      fs.writeFileSync(mdPath, header, 'utf8');
    }

    const entry = `### 📖 ${book.title}\n- **Muallif:** ${book.author}\n- **Yil / Manba:** ${book.year} | ${book.source}\n- **Hajmi:** ${book.sizeMB} MB\n- **Havola:** [To'g'ridan-to'g'ri yuklab olish](${book.downloadUrl})\n- **Topilgan vaqt:** ${dateStr}\n\n---\n\n`;
    fs.appendFileSync(mdPath, entry, 'utf8');
  } catch (err) {
    console.error('Obsidian book log error:', err.message);
  }
}

module.exports = {
  findAndFetchBookPdf,
  searchArchiveOrg,
  searchArxiv
};
