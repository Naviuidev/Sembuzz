# VPS Deploy Steps (Hostinger – Ubuntu 24.04)

**VPS IP:** `187.124.84.76`  
**Stack:** Node.js 20, PM2, Nginx (Git to be installed)

Do these steps in order on your VPS (SSH as `root` or a sudo user).

---

## Step 1: Install Git

```bash
apt install -y git
git --version
```

---

## Step 2: Create app directory and clone repo

Replace `YOUR_REPO_URL` with your actual Git repo (e.g. `https://github.com/yourusername/sembuzz.git` or SSH URL).

```bash
mkdir -p /var/www
cd /var/www
git clone YOUR_REPO_URL sembuzz
cd sembuzz
```

If your repo is private, use a deploy key or HTTPS with a personal access token.  
If you don’t use Git, upload the project via SFTP/SCP to `/var/www/sembuzz` (with `backend` and `web` folders inside).

---

## Step 3: Backend – install dependencies and env

```bash
cd /var/www/sembuzz/backend
npm ci
```

Create production `.env`:

```bash
nano .env
```

Paste (adjust values as needed; **set a strong JWT_SECRET**):

```env
DATABASE_URL="mysql://u500831783_Sembuzzz:Sembuzz@1998@localhost:3306/u500831783_Sembuzzz"
PORT=3000
NODE_ENV=production
JWT_SECRET="REPLACE_WITH_OPENSSL_RAND_BASE64_32"
CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"
API_URL="https://api.sembuzz.com"
FRONTEND_URL="https://sembuzz.com"
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=your-smtp-password
SMTP_FROM=admin@sembuzz.com
```

- If MySQL is **not** on this VPS (e.g. database is on Hostinger shared hosting), replace `localhost` in `DATABASE_URL` with the **remote MySQL host** from hPanel (e.g. `srv123.hostinger.com` or the host shown in Databases). Ensure “Remote MySQL” is enabled for your VPS IP in Hostinger if required.
- Generate JWT_SECRET: `openssl rand -base64 32` (run once and paste result).
- Save and exit: `Ctrl+O`, Enter, `Ctrl+X`.

---

## Step 4: Backend – Prisma and build

```bash
cd /var/www/sembuzz/backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

If `prisma migrate deploy` fails (e.g. “database not found”), install MySQL client and/or fix `DATABASE_URL` so it points to your Hostinger MySQL.

---

## Step 5: Backend – run with PM2

```bash
cd /var/www/sembuzz/backend
pm2 start dist/main.js --name sembuzz-api
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (e.g. `sudo env PATH=... pm2 startup systemd -u root --hp /root`).  
Check:

```bash
pm2 status
curl -s http://localhost:3000
```

You should get a response from the API.

---

## Step 6: Build the web (frontend) on the VPS

```bash
cd /var/www/sembuzz/web
VITE_API_URL="https://api.sembuzz.com" npm ci
VITE_API_URL="https://api.sembuzz.com" npm run build
```

This creates `web/dist`. We’ll serve it with Nginx next.

---

## Step 7: Nginx – site directories

```bash
mkdir -p /var/www/sembuzz/frontend
cp -r /var/www/sembuzz/web/dist/* /var/www/sembuzz/frontend/
chown -R www-data:www-data /var/www/sembuzz/frontend
```

---

## Step 8: Nginx – config for sembuzz.com and api.sembuzz.com

Create two configs (replace `sembuzz.com` with your domain if different):

```bash
nano /etc/nginx/sites-available/sembuzz.com
```

Paste (use your domain and IP if you prefer to test by IP first):

```nginx
# API – api.sembuzz.com → Node.js
server {
    listen 80;
    server_name api.sembuzz.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
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

# Frontend – sembuzz.com & www
server {
    listen 80;
    server_name sembuzz.com www.sembuzz.com;
    root /var/www/sembuzz/frontend;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /uploads {
        # If you serve uploads from backend later, proxy or alias here
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Save and exit. Enable and test:

```bash
ln -sf /etc/nginx/sites-available/sembuzz.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Step 9: DNS (at your domain registrar / Hostinger)

Point your domain to the VPS:

- **A record:** `sembuzz.com` → `187.124.84.76`
- **A record:** `www.sembuzz.com` → `187.124.84.76`
- **A record:** `api.sembuzz.com` → `187.124.84.76`

Wait 5–15 minutes (up to 48h in rare cases) for DNS to propagate.  
Check:

```bash
ping sembuzz.com
ping api.sembuzz.com
```

---

## Step 10: SSL with Let’s Encrypt (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d sembuzz.com -d www.sembuzz.com -d api.sembuzz.com
```

Follow prompts (email, agree). Certbot will adjust Nginx for HTTPS.

Test:

- https://sembuzz.com  
- https://api.sembuzz.com  

---

## Step 11: Backend .env for production URLs

After SSL is working, ensure backend `.env` uses HTTPS:

- `API_URL="https://api.sembuzz.com"`
- `FRONTEND_URL="https://sembuzz.com"`
- `CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"`

Then restart API:

```bash
pm2 restart sembuzz-api
pm2 save
```

---

## Optional: Update app later

```bash
cd /var/www/sembuzz
git pull
cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart sembuzz-api
cd ../web && VITE_API_URL="https://api.sembuzz.com" npm ci && VITE_API_URL="https://api.sembuzz.com" npm run build
cp -r dist/* /var/www/sembuzz/frontend/
```

---

## Quick checklist

| #  | Step |
|----|------|
| 1  | Install Git |
| 2  | Clone repo to `/var/www/sembuzz` (or upload code) |
| 3  | Backend: `npm ci`, create `.env` with production values |
| 4  | Backend: `prisma generate`, `migrate deploy`, `seed`, `build` |
| 5  | Backend: `pm2 start dist/main.js`, `pm2 save`, `pm2 startup` |
| 6  | Web: `VITE_API_URL="https://api.sembuzz.com" npm run build` |
| 7  | Copy `web/dist/*` to `/var/www/sembuzz/frontend/` |
| 8  | Nginx config for api.sembuzz.com (proxy) and sembuzz.com (static + SPA) |
| 9  | DNS: A records for sembuzz.com, www, api → `187.124.84.76` |
| 10 | certbot --nginx for SSL |
| 11 | Confirm .env URLs and `pm2 restart sembuzz-api` |

After this, **https://sembuzz.com** serves the app and **https://api.sembuzz.com** serves the API.
