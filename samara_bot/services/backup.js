const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { InputFile } = require('grammy');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

/**
 * Creates a zip backup of the Obsidian Vault and returns the zip file path
 */
async function createVaultBackup() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const zipName = `Obsidian_Backup_${dateStr}.zip`;
  const zipPath = path.join(BACKUPS_DIR, zipName);

  return new Promise((resolve, reject) => {
    // Use PowerShell Compress-Archive
    const cmd = `powershell -Command "Compress-Archive -Path '${VAULT_PATH}\\*' -DestinationPath '${zipPath}' -Force"`;
    exec(cmd, (err) => {
      if (err) {
        return reject(err);
      }
      if (fs.existsSync(zipPath)) {
        const stats = fs.statSync(zipPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        resolve({ zipPath, zipName, sizeMb, sizeBytes: stats.size });
      } else {
        reject(new Error('Backup zip fayli topilmadi.'));
      }
    });
  });
}

/**
 * Sends the backup directly to the user's Telegram chat
 */
async function sendBackupToTelegram(bot, chatId) {
  try {
    const { zipPath, zipName, sizeMb } = await createVaultBackup();
    const caption = `☁️ **Obsidian Vault Zaxirasi (Backup)**\n\n📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}\n📦 Hajmi: ${sizeMb} MB\n\nUshbu faylni xohlagan payt yuklab olib, qayta tiklashingiz mumkin. Telegram bulutida doimiy va xavfsiz saqlanadi! 🔐`;

    await bot.api.sendDocument(chatId, new InputFile(zipPath, zipName), {
      caption,
      parse_mode: 'Markdown',
    });

    return { success: true, zipName, sizeMb };
  } catch (err) {
    console.error('Backup error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  createVaultBackup,
  sendBackupToTelegram,
};
