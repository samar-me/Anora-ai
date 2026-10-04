const { exec } = require('child_process');
const path = require('path');
const rpg = require('./rpg');

const REPO_ROOT = path.join(__dirname, '..', '..');

function runGitCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: REPO_ROOT }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, output: stderr || error.message });
      }
      resolve({ success: true, output: stdout.trim() });
    });
  });
}

async function autoCommitAndSync(commitMessage) {
  const statusRes = await runGitCommand('git status -s');
  if (!statusRes.success) {
    return { success: false, message: `Git xatosi: ${statusRes.output}` };
  }

  if (!statusRes.output) {
    return { success: true, committed: false, message: 'Hech qanday yangi o\'zgarish yo\'q, hamma fayllar saqlangan va toza!' };
  }

  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const msg = commitMessage || `feat(streak): Samar's daily code, notes and system progress [${dateStr}]`;

  await runGitCommand('git add .');
  const commitRes = await runGitCommand(`git commit -m "${msg.replace(/"/g, '\\"')}"`);

  if (!commitRes.success) {
    return { success: false, message: `Commit qilishda xatolik: ${commitRes.output}` };
  }

  // Try git push if remote is configured
  let pushed = false;
  const pushRes = await runGitCommand('git push');
  if (pushRes.success) {
    pushed = true;
  }

  const xpRes = rpg.addXp('engineering', 50, 'GitHub avtomatik commit va streak yangilandi');

  return {
    success: true,
    committed: true,
    pushed,
    message: `✅ **GitHub'ga saqlandi!** Yashil streak faol!\nCommit: _${msg}_`,
    xpRes,
  };
}

module.exports = {
  autoCommitAndSync,
};
