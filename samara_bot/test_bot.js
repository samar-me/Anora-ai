const { Bot } = require('grammy');
require('dotenv').config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

async function testBot() {
  const me = await bot.api.getMe();
  console.log('Bot info:', me.first_name, '@' + me.username, 'ID:', me.id);
}

testBot().catch(console.error);
