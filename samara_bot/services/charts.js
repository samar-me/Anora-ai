const fs = require('fs');
const path = require('path');
const obsidian = require('./obsidian');

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, '..', '..', 'Obsidian_Vault');

async function generateMonthlyExpenseChart() {
  const monthStr = obsidian.getTodayString().substring(0, 7);
  const finFile = path.join(VAULT_PATH, 'Finance', `Moliya_${monthStr}.md`);

  const categoryTotals = {};

  if (fs.existsSync(finFile)) {
    const lines = fs.readFileSync(finFile, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.includes('| Xarajat |')) continue;
      const parts = line.split('|').map(p => p.trim());
      // parts: ['', '2026-10-03', 'Xarajat', '19 000 so\'m', 'ovqat', 'non olishga', '']
      if (parts.length >= 6) {
        const rawAmount = parts[3].replace(/[^0-9]/g, '');
        const amount = parseInt(rawAmount, 10) || 0;
        const category = parts[4] || 'boshqa';
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      }
    }
  }

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (labels.length === 0) {
    return null;
  }

  const chartConfig = {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { fontSize: 14 } },
        title: { display: true, text: `Moliya Xarajatlari (${monthStr})`, fontSize: 16 },
      },
    },
  };

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  const res = await fetch(chartUrl);
  if (!res.ok) return null;

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  generateMonthlyExpenseChart,
};
