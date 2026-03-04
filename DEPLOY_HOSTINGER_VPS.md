# Deploy Backend + Web on Hostinger VPS

**VPS IP:** 187.124.84.76  
**Domain:** sembuzz.com, api.sembuzz.com  
**Repo:** https://github.com/Naviuidev/Sembuzz

Do these steps **on the VPS** (SSH as root or your user). Replace `HOST` and `YOUR_JWT_SECRET` and SMTP password where noted.

---

## 1. Prerequisites (one-time)

If not already installed:

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
```

---

## 2. Clone or update code

```bash
mkdir -p /var/www
cd /var/www
# If first time:
git clone https://github.com/Naviuidev/Sembuzz.git
cd Sembuzz
# If already cloned, just update:
# cd /var/www/Sembuzz && git pull origin main
```

---

## 3. Backend: install deps and create `.env`

```bash
cd /var/www/Sembuzz/backend
npm ci
nano .env
```

Paste (then edit **HOST**, **JWT_SECRET**, **SMTP_PASS**; use `Sembuzz%401998` if password is `Sembuzz@1998`):

```env
DATABASE_URL="mysql://u500831783_Sembuzzz:Sembuzz%401998@HOST:3306/u500831783_Sembuzzz"
PORT=3000
NODE_ENV=production
JWT_SECRET="YOUR_JWT_SECRET"
CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"
API_URL="https://api.sembuzz.com"
FRONTEND_URL="https://sembuzz.com"
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=your-smtp-password
SMTP_FROM=admin@sembuzz.com
```

Generate JWT secret: `openssl rand -base64 32` → paste into `JWT_SECRET`.  
Save: **Ctrl+O**, Enter, **Ctrl+X**.

---

## 4. Backend: Prisma and build

```bash
cd /var/www/Sembuzz/backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Optional first Super Admin: `npm run seed:super-admin`

---

## 5. Backend: run with PM2

```bash
cd /var/www/Sembuzz/backend
pm2 start dist/main.js --name sembuzz-api
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints. Then:

```bash
curl -s http://localhost:3000
```

You should get a response (not "Connection refused").

---

## 6. Web: build frontend

```bash
cd /var/www/Sembuzz/web
VITE_API_URL="https://api.sembuzz.com" npm ci
VITE_API_URL="https://api.sembuzz.com" npm run build
```

---

## 7. Serve frontend with Nginx

```bash
mkdir -p /var/www/Sembuzz/frontend
cp -r /var/www/Sembuzz/web/dist/* /var/www/Sembuzz/frontend/
chown -R www-data:www-data /var/www/Sembuzz/frontend
```

---

## 8. Nginx: API + frontend config

```bash
nano /etc/nginx/sites-available/sembuzz.com
```

Paste:

```nginx
server {
    listen 80;
    server_name api.sembuzz.com;
    client_max_body_size 50M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server {
    listen 80;
    server_name sembuzz.com www.sembuzz.com;
    root /var/www/Sembuzz/frontend;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Save, then:

```bash
ln -sf /etc/nginx/sites-available/sembuzz.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 9. DNS (in Hostinger / registrar)

Add **A** records to **187.124.84.76**:

| Type | Name | Value         |
|------|------|----------------|
| A    | @    | 187.124.84.76 |
| A    | www  | 187.124.84.76 |
| A    | api  | 187.124.84.76 |

Wait until `ping sembuzz.com` and `ping api.sembuzz.com` show **187.124.84.76**.

---

## 10. SSL (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d sembuzz.com -d www.sembuzz.com -d api.sembuzz.com
```

Follow prompts (email, agree). Certbot will add HTTPS and redirects.

---

## 11. Final checks

```bash
mkdir -p /var/www/Sembuzz/backend/uploads
chown -R root:root /var/www/Sembuzz/backend/uploads
pm2 restart sembuzz-api
pm2 save
```

Open in browser:

- **https://sembuzz.com** — frontend  
- **https://api.sembuzz.com** — API  
- **https://sembuzz.com/super-admin** — super-admin (after `seed:super-admin`)

---

## Quick paths

| What       | Path                               |
|-----------|-------------------------------------|
| Repo      | `/var/www/Sembuzz`                 |
| Backend   | `/var/www/Sembuzz/backend`         |
| Frontend  | `/var/www/Sembuzz/frontend`        |
| Nginx     | `/etc/nginx/sites-available/sembuzz.com` |

## Troubleshooting

- **DB connection:** Fix `DATABASE_URL` in `.env` (HOST = MySQL host from hPanel; password with `@` → `%40`). Enable Remote MySQL for 187.124.84.76 if DB is on Hostinger.
- **502 on API:** `pm2 status` and `pm2 restart sembuzz-api`; check `pm2 logs sembuzz-api`.
- **Migration failed:** See `backend/prisma/migrations/20260124000000_cross_admin_queries/RECOVERY_IF_MIGRATION_FAILED.md`.
- **"Failed to load events" or GET /events/approved returns 500:** (1) On the server run `pm2 logs sembuzz-api` and reproduce the request; the log will show the real error (e.g. "Table 'events' doesn't exist"). (2) If the `events` table is missing, run the new migration: `cd /var/www/Sembuzz/backend && npx prisma migrate deploy` (this applies `20260128000000_add_events_table` which creates `events` with IF NOT EXISTS). (3) Rebuild web with `VITE_API_URL="https://api.sembuzz.com" npm run build` and redeploy. (4) Ensure backend `.env` has `CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"` and restart the API (`pm2 restart sembuzz-api`).
