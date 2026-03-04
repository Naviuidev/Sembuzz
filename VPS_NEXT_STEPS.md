# VPS Next Steps – From Where You Are Now

**Current location on server:** `/var/www/Sembuzz/backend`  
**Repo:** [Naviuidev/Sembuzz](https://github.com/Naviuidev/Sembuzz)

Do these in order. You're already in `/var/www/Sembuzz/backend` after step 9.

---

## Step 10: Create backend `.env` file

Still in `/var/www/Sembuzz/backend`, create the env file:

```bash
nano .env
```

Paste the block below. Then:

- Replace **`HOST`** with your MySQL host:
  - If MySQL is **on this VPS**: use `localhost`
  - If MySQL is on **Hostinger** (remote): use the host from hPanel → Databases → MySQL (e.g. `srv123.hostinger.com` or the one shown there). Ensure “Remote MySQL” allows your VPS IP `187.124.84.76` if required.
- Replace **`YOUR_JWT_SECRET`** with a long random string (see command below).
- Set **`SMTP_PASS`** to the real password for `admin@sembuzz.com` if you use that for emails.
- **If your DB password contains special characters** (e.g. `@`, `#`, `%`), URL-encode them in `DATABASE_URL`: `@` → `%40`, `#` → `%23`, `%` → `%25`. Example: password `Sembuzz@1998` → use `Sembuzz%401998` in the URL.

```env
# If password has @ use %40, e.g. Sembuzz@1998 → Sembuzz%401998
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

Generate a JWT secret (run on the VPS, then paste the output into `JWT_SECRET`):

```bash
openssl rand -base64 32
```

Save and exit nano: **Ctrl+O**, Enter, **Ctrl+X**.

---

## Step 11: Prisma generate, migrate, seed, build

Run these in `/var/www/Sembuzz/backend`:

```bash
cd /var/www/Sembuzz/backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

- If `prisma migrate deploy` fails (e.g. “Can’t reach database”), check `DATABASE_URL` in `.env` (host, user, password, database name) and that the MySQL server allows connections from the VPS.
- **Optional – create first Super Admin** (so you can log in to the super-admin panel): run `npm run seed:super-admin` and follow the prompts to set email and password.

---

## Step 12: Run backend with PM2

```bash
cd /var/www/Sembuzz/backend
pm2 start dist/main.js --name sembuzz-api
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (e.g. `sudo env PATH=... pm2 startup systemd -u root --hp /root`).

Check that the API responds:

```bash
curl -s http://localhost:3000
```

You should get some response (e.g. HTML or JSON), not “Connection refused”.

---

## Step 13: Build the frontend

```bash
cd /var/www/Sembuzz/web
VITE_API_URL="https://api.sembuzz.com" npm ci
VITE_API_URL="https://api.sembuzz.com" npm run build
```

This creates the `web/dist` folder.

---

## Step 14: Prepare frontend for Nginx

```bash
mkdir -p /var/www/Sembuzz/frontend
cp -r /var/www/Sembuzz/web/dist/* /var/www/Sembuzz/frontend/
chown -R www-data:www-data /var/www/Sembuzz/frontend
```

---

## Step 15: Configure Nginx

Create the site config:

```bash
nano /etc/nginx/sites-available/sembuzz.com
```

Paste this (then save: **Ctrl+O**, Enter, **Ctrl+X**):

```nginx
# API – api.sembuzz.com → Node.js (includes /uploads for file serving)
server {
    listen 80;
    server_name api.sembuzz.com;
    client_max_body_size 50M;
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
    root /var/www/Sembuzz/frontend;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and reload Nginx:

```bash
ln -sf /etc/nginx/sites-available/sembuzz.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Step 16: DNS (in Hostinger or your domain registrar)

Add **A** records pointing to **187.124.84.76**:

| Type | Name  | Value        |
|------|--------|--------------|
| A    | @      | 187.124.84.76 |
| A    | www    | 187.124.84.76 |
| A    | api    | 187.124.84.76 |

So: `sembuzz.com`, `www.sembuzz.com`, and `api.sembuzz.com` all resolve to your VPS. Wait a few minutes (up to 48h in rare cases) for DNS to propagate.

**Verify DNS before SSL:** Certbot will fail if the domain does not yet point to your server. Check with:

```bash
ping -c 2 sembuzz.com
ping -c 2 api.sembuzz.com
```

The IP in the response should be **187.124.84.76**. If not, wait for DNS to propagate before running Step 17.

---

## Step 17: SSL (HTTPS) with Let’s Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d sembuzz.com -d www.sembuzz.com -d api.sembuzz.com
```

Follow the prompts (email, agree to terms). Certbot will configure HTTPS and redirect HTTP to HTTPS. It will modify your Nginx config automatically (add SSL and redirects).

---

## Step 18: Restart API and verify

```bash
pm2 restart sembuzz-api
pm2 save
```

Then open in a browser:

- **https://sembuzz.com** – frontend (main site)  
- **https://api.sembuzz.com** – API (you may see a short message or “Cannot GET /”; that’s fine)
- **https://sembuzz.com/super-admin** – super-admin login (use credentials from `seed:super-admin` if you ran it)

**Ensure uploads directory exists** (for backend file uploads, e.g. images):

```bash
mkdir -p /var/www/Sembuzz/backend/uploads
chown -R root:root /var/www/Sembuzz/backend/uploads
```

The backend serves `/uploads/` from this folder; Nginx proxies all API traffic (including `/uploads/`) to the Node app.

---

## Quick reference – path summary

| What        | Path                          |
|-------------|-------------------------------|
| Repo        | `/var/www/Sembuzz`            |
| Backend     | `/var/www/Sembuzz/backend`    |
| Frontend    | `/var/www/Sembuzz/frontend`   |
| Nginx config| `/etc/nginx/sites-available/sembuzz.com` |

---

## If something fails

- **Prisma / DB:** Check `.env` `DATABASE_URL` (host, user, password, DB name). If DB is on Hostinger, enable Remote MySQL for IP `187.124.84.76`. If the password has `@`, `#`, or `%`, URL-encode it in the connection string (`@` → `%40`, etc.).
- **"Prisma schema not found" or "prisma generate" fails:** Run from the backend directory: `cd /var/www/Sembuzz/backend` and ensure `prisma/schema.prisma` exists (it's in the repo).
- **"tsx: command not found" on prisma:seed:** The seed script uses `tsx`; it runs via `npm run prisma:seed`, which uses the local `node_modules`. If it fails, run `npm install` again in the backend folder.
- **PM2:** `pm2 logs sembuzz-api` and `pm2 status`. If the app crashes, check logs for missing env or DB errors.
- **Nginx:** `nginx -t` and `systemctl status nginx`. After certbot, config is under `/etc/nginx/sites-available/`; check that both server blocks (api and frontend) are still present.
- **SSL:** Run `certbot` again or check `certbot certificates`. DNS must point to **187.124.84.76** before certbot can issue certificates.
- **502 Bad Gateway on api.sembuzz.com:** The backend is not running or not on port 3000. Run `pm2 status` and `pm2 restart sembuzz-api`.

---

## Optional: Update app after code changes

From your local machine, push to GitHub. Then on the VPS:

```bash
cd /var/www/Sembuzz
git pull origin main
cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart sembuzz-api
cd ../web && VITE_API_URL="https://api.sembuzz.com" npm ci && VITE_API_URL="https://api.sembuzz.com" npm run build
cp -r /var/www/Sembuzz/web/dist/* /var/www/Sembuzz/frontend/
chown -R www-data:www-data /var/www/Sembuzz/frontend
```
