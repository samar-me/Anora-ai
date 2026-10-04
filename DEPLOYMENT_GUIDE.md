# 🚀 Anora AI Botni Serverga Yuklash va 24/7 Ishga Tushirish Qo'llanmasi

Ushbu qo'llanmada **Anora AI** botini istalgan serverga o'rnatish va kompyuteringiz o'chiq bo'lsa ham 24/7 uzluksiz ishlashini ta'minlashning 3 ta eng qulay va professional usuli keltirilgan.

---

## 🌟 1-USUL: Eng Oson va Bepul Xosting (Render.com yoki Railway.app)
> **Tavsiya:** Linux terminalini bilish shart emas. Kodni GitHub'ga yuklab, Render/Railway orqali 2 daqiqada ulab qo'yasiz.

### Qadamlar:
1. Loyihani GitHub profilingizga yuklang (masalan, `https://github.com/samar/Samar_PRO`).
2. [Render.com](https://render.com) saytiga kiring va **Sign in with GitHub** qiling.
3. **New +** tugmasini bosib, **Background Worker** (yoki Web Service) ni tanlang.
4. GitHub repozitoriyangizni tanlang.
5. Sozlamalar:
   - **Root Directory:** `samara_bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
6. **Environment Variables** (Maxfiy kalitlar) bo'limiga `.env` dagi qiymatlarni kiriting:
   - `TELEGRAM_BOT_TOKEN` = `sizning_bot_tokeningiz`
   - `GEMINI_API_KEY` = `sizning_gemini_kalitingiz`
   - `SUPABASE_URL` = `sizning_supabase_url`
   - `SUPABASE_ANON_KEY` = `sizning_supabase_kalitingiz`
   - `OBSIDIAN_VAULT_PATH` = `./Obsidian_Vault`
7. **Create** tugmasini bosing. Bot darhol bulutda ishga tushadi va 24/7 ishlaydi!

---

## ⚡ 2-USUL: Shaxsiy Linux VPS Server (Ubuntu + PM2)
> **Tavsiya:** Agar shaxsiy VPS serveringiz (Timeweb, Hetzner, VDSina, DigitalOcean) bo'lsa, bu eng tez va barqaror usul.

### 1. Serverga ulanish (SSH):
```bash
ssh root@server_ip_manzili
```

### 2. Node.js va PM2 o'rnatish:
```bash
# Node.js 20 LTS o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# PM2 jarayon boshqaruvchisini o'rnatish
npm install -g pm2
```

### 3. Loyihani serverga ko'chirish:
```bash
git clone https://github.com/samar/Samar_PRO.git
cd Samar_PRO/samara_bot
npm install
```

### 4. `.env` faylini yaratish:
```bash
nano .env
```
_(U yerga bot tokeni va Gemini API kalitingizni yozib, `Ctrl + O` va `Enter`, so'ng `Ctrl + X` qilib saqlang)_

### 5. Botni PM2 bilan 24/7 fonda ishga tushirish:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

> **Foydali buyruqlar:**
> - Bot holatini ko'rish: `pm2 status`
> - Bot loglarini (konsol xabarlarini) ko'rish: `pm2 logs anora-ai-bot`
> - Botni qayta ishga tushirish: `pm2 restart anora-ai-bot`
> - To'xtatish: `pm2 stop anora-ai-bot`

---

## 🐳 3-USUL: Docker orqali 1 ta Buyruqda Ishga Tushirish
> **Tavsiya:** Agar serverda Docker o'rnatilgan bo'lsa:

```bash
cd Samar_PRO/samara_bot
docker compose up -d --build
```
Bot o'z konteynerida fon rejimida ishga tushadi, server o'chib-yonsa ham avtomatik tiklanadi!

---

## 🔐 Xavfsizlik Eslatmasi
Hech qachon `.env` faylingizni ochiq holda GitHub'ga push qilmang! `.gitignore` faylida `.env` allaqachon himoyalangan.
