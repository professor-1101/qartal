# قارتال - پلتفرم ویرایش تست BDD

پلتفرم مدرن و کاربردی برای طراحی و ویرایش تست‌های BDD (Behavior Driven Development) با پشتیبانی کامل از زبان فارسی و RTL.

## 🚀 ویژگی‌ها

- ✨ ویرایشگر Gherkin پیشرفته با پشتیبانی از RTL
- 📱 رابط کاربری مدرن و واکنش‌گرا
- 🔐 احراز هویت امن با NextAuth.js
- 📊 مدیریت پروژه‌ها و ویژگی‌ها
- 📤 خروجی HTML و ZIP
- 🌐 پشتیبانی کامل از زبان فارسی
- 📱 PWA (Progressive Web App)

## 🛠️ تکنولوژی‌ها

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL با Prisma ORM
- **Authentication**: NextAuth.js
- **Package Manager**: pnpm

## 📋 پیش‌نیازها

- Ubuntu 20.04 یا بالاتر
- Node.js 18 یا بالاتر
- PostgreSQL 12 یا بالاتر
- Git

## 🚀 نصب و راه‌اندازی روی Ubuntu

### مرحله 1: به‌روزرسانی سیستم

```bash
sudo apt update && sudo apt upgrade -y
```

### مرحله 2: نصب Node.js

```bash
# نصب Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# بررسی نسخه
node --version
npm --version
```

### مرحله 3: نصب pnpm

```bash
# نصب pnpm
npm install -g pnpm

# بررسی نسخه
pnpm --version
```

### مرحله 4: نصب PostgreSQL

```bash
# نصب PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# شروع سرویس
sudo systemctl start postgresql
sudo systemctl enable postgresql

# بررسی وضعیت
sudo systemctl status postgresql
```

### مرحله 5: تنظیم دیتابیس

```bash
# ورود به PostgreSQL
sudo -u postgres psql

# ایجاد کاربر و دیتابیس
CREATE USER qartal_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE qartal_db OWNER qartal_user;
GRANT ALL PRIVILEGES ON DATABASE qartal_db TO qartal_user;
\q
```

### مرحله 6: نصب Git و کلون کردن پروژه

```bash
# نصب Git
sudo apt install git -y

# کلون کردن پروژه
git clone https://github.com/your-username/qartal.git
cd qartal
```

### مرحله 7: تنظیم متغیرهای محیطی

```bash
# ایجاد فایل .env
cp .env.example .env

# ویرایش فایل .env
nano .env
```

محتوای فایل `.env`:

```env
# Database
DATABASE_URL="postgresql://qartal_user:your_secure_password@localhost:5432/qartal_db"

# NextAuth
NEXTAUTH_URL="http://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email (اختیاری)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# Google OAuth (اختیاری)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### مرحله 8: نصب وابستگی‌ها

```bash
# نصب وابستگی‌ها
pnpm install

# نصب Prisma CLI
pnpm add -D prisma
```

### مرحله 9: تنظیم دیتابیس

```bash
# تولید Prisma Client
pnpm prisma generate

# اجرای مایگریشن‌ها
pnpm prisma db push

# بررسی دیتابیس
pnpm prisma studio
```

### مرحله 10: ساخت پروژه

```bash
# ساخت پروژه برای تولید
pnpm build
```

### مرحله 11: راه‌اندازی با PM2

```bash
# نصب PM2
npm install -g pm2

# ایجاد فایل ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'qartal',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/path/to/your/qartal',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
}
EOF

# شروع اپلیکیشن
pm2 start ecosystem.config.js

# تنظیم PM2 برای شروع خودکار
pm2 startup
pm2 save
```

### مرحله 12: تنظیم Nginx (اختیاری)

```bash
# نصب Nginx
sudo apt install nginx -y

# ایجاد فایل کانفیگ
sudo nano /etc/nginx/sites-available/qartal
```

محتوای فایل Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# فعال‌سازی سایت
sudo ln -s /etc/nginx/sites-available/qartal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### مرحله 13: تنظیم فایروال

```bash
# نصب UFW
sudo apt install ufw -y

# تنظیم قوانین
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔧 دستورات مفید

### مدیریت اپلیکیشن
```bash
# مشاهده لاگ‌ها
pm2 logs qartal

# راه‌اندازی مجدد
pm2 restart qartal

# توقف
pm2 stop qartal

# شروع
pm2 start qartal
```

### مدیریت دیتابیس
```bash
# مشاهده دیتابیس
pnpm prisma studio

# ریست کردن دیتابیس
pnpm prisma db push --force-reset

# بکاپ گرفتن
pg_dump -U qartal_user qartal_db > backup.sql

# بازگردانی بکاپ
psql -U qartal_user qartal_db < backup.sql
```

### به‌روزرسانی اپلیکیشن
```bash
# دریافت تغییرات جدید
git pull origin main

# نصب وابستگی‌های جدید
pnpm install

# ساخت مجدد
pnpm build

# راه‌اندازی مجدد
pm2 restart qartal
```

## 🐛 عیب‌یابی

### مشکل پورت 80
اگر پورت 80 در دسترس نیست:
```bash
# تغییر پورت در ecosystem.config.js
env: {
  NODE_ENV: 'production',
  PORT: 3000
}
```

### مشکل دیتابیس
```bash
# بررسی اتصال دیتابیس
psql -U qartal_user -d qartal_db -h localhost

# بررسی لاگ‌های PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### مشکل PM2
```bash
# پاک کردن لاگ‌ها
pm2 flush

# راه‌اندازی مجدد کامل
pm2 delete qartal
pm2 start ecosystem.config.js
```

## 📞 پشتیبانی

برای گزارش مشکلات یا درخواست ویژگی‌های جدید، لطفاً یک Issue در GitHub ایجاد کنید.

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.
