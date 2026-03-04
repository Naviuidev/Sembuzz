# Next Steps to Deploy SemBuzz to Live (Hostinger)

Do these in order. You need either **Hostinger VPS** or **Node.js hosting** to run the backend; the web can go on any Hostinger plan.

---

## 1. Confirm Hostinger plan

- **VPS or Node.js:** You can run the backend on the same server → follow steps 2–7.
- **Shared hosting only:** You can only deploy the **web** on Hostinger. Run the **backend** elsewhere (e.g. Railway, Render) and use its URL as your API URL in step 6 and 7.

---

## 2. Get MySQL host (if backend will run on Hostinger)

- In **hPanel** → **Databases** → **MySQL** → open your database `u500831783_Sembuzzz`.
- Note the **Host** (e.g. `localhost` or `mysqlXX.hostinger.com`). You’ll use it in `DATABASE_URL` on the server.

---

## 3. Upload backend to the server (if using VPS/Node)

- Via **Git:** SSH into the server, clone your repo, then use the `backend` folder.
- Or upload the `backend` folder via **FTP/File Manager** (e.g. to `~/sembuzz/backend` or `domains/sembuzz.com/backend`).

---

## 4. Create production `.env` on the server (backend folder)

On the server, in the **backend** folder, create `.env` with:

```env
DATABASE_URL="mysql://u500831783_Sembuzzz:Sembuzz@1998@HOST:3306/u500831783_Sembuzzz"
PORT=3000
NODE_ENV=production
JWT_SECRET="PUT_A_LONG_RANDOM_STRING_HERE"
CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"
API_URL="https://api.sembuzz.com"
FRONTEND_URL="https://sembuzz.com"
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=your-real-email-password
SMTP_FROM=admin@sembuzz.com
```

- Replace `HOST` with the MySQL host from step 2.
- Generate `JWT_SECRET`: run `openssl rand -base64 32` and paste the result.
- Set `SMTP_PASS` to the real password for `admin@sembuzz.com`.

---

## 5. Build and run the backend on the server

SSH into the server, go to the backend folder, then run:

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Start the API (replace path if different):

```bash
node dist/main.js
```

If it runs, stop it (Ctrl+C) and run it with **PM2** so it stays up:

```bash
npm install -g pm2
pm2 start dist/main.js --name sembuzz-api
pm2 save
pm2 startup
```

---

## 6. Expose the API with a URL

Choose one:

- **Option A – Subdomain (recommended):** Create subdomain **api.sembuzz.com** in Hostinger (DNS or Subdomains). Point it to this server. Configure **Nginx** (or Apache) to proxy `https://api.sembuzz.com` to `http://127.0.0.1:3000`. Enable SSL (e.g. Let’s Encrypt).
- **Option B – Same domain:** Point **sembuzz.com** to this server and add a reverse‑proxy rule so `https://sembuzz.com/api` forwards to `http://127.0.0.1:3000`. Then your API URL is `https://sembuzz.com/api` (use this in step 7 and in backend `API_URL`).

---

## 7. Build the web for production

On your **local machine** (or on the server if Node is installed there):

```bash
cd web
export VITE_API_URL="https://api.sembuzz.com"
npm ci
npm run build
```

- If you used Option B in step 6, set `VITE_API_URL="https://sembuzz.com/api"` instead.

The built files are in **`web/dist`**.

---

## 8. Upload the web to Hostinger

- In **hPanel** → **File Manager** (or FTP), go to the **document root** for **sembuzz.com** (often `public_html`).
- Upload **all contents** of `web/dist` (e.g. `index.html`, `assets/` folder) into that root. Do not upload the `dist` folder itself; only its contents.

---

## 9. SPA fallback (required for React Router)

So that routes like `/events`, `/super-admin/login` work on refresh:

- **Apache:** In the root of the site, add or edit `.htaccess` with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

- **Nginx:** In the server block for sembuzz.com, add `try_files $uri $uri/ /index.html;`

---

## 10. DNS and SSL

- **sembuzz.com** and **www.sembuzz.com** should point to the server (A record or CNAME as per Hostinger).
- Enable **SSL** for sembuzz.com (and api.sembuzz.com if used) in hPanel or your panel (Let’s Encrypt).

---

## Quick checklist

| Step | Task |
|------|------|
| 1 | Confirm you have VPS/Node (or plan to host backend elsewhere). |
| 2 | Get MySQL host from Hostinger. |
| 3 | Upload backend code to server. |
| 4 | Create backend `.env` on server with production values. |
| 5 | On server: `npm ci`, `prisma generate`, `migrate deploy`, `seed`, `build`, then run with PM2. |
| 6 | Set up api.sembuzz.com (or /api) and reverse proxy to port 3000. |
| 7 | Build web with `VITE_API_URL` = your API URL. |
| 8 | Upload contents of `web/dist` to site root. |
| 9 | Add SPA fallback (.htaccess or Nginx). |
| 10 | Point DNS and enable SSL. |

After this, **https://sembuzz.com** should load the app and talk to your API.
