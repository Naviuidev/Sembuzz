# Deploy SemBuzz to Hostinger (sembuzz.com)

This guide covers deploying the **backend** (NestJS) and **web** (Vite/React) to Hostinger with your existing database.

---

## Your Hostinger setup

- **Domain:** sembuzz.com  
- **Database:** already created  
  - **User:** `u500831783_Sembuzzz`  
  - **Database name:** `u500831783_Sembuzzz`  
  - **Password:** (use the one you set when creating the DB; do not commit it)  
  - **Host:** In Hostinger → **Databases** → **MySQL** → your database: use the host shown there (often `localhost` or e.g. `mysqlXX.hostinger.com`).  
  - **Port:** usually `3306`.

**Example `DATABASE_URL`** (replace `YOUR_DB_PASSWORD` and `HOST` with real values):

```text
mysql://u500831783_Sembuzzz:YOUR_DB_PASSWORD@HOST:3306/u500831783_Sembuzzz
```

---

## Option A: Hostinger VPS or Node.js hosting

If you have **VPS** or **Node.js** support (e.g. Node.js selector in cPanel):

### 1. Backend on the server

1. **Upload backend code** (e.g. via Git or FTP) to a folder on the server, e.g. `~/sembuzz/backend` or `domains/sembuzz.com/backend`.

2. **Create `.env`** in the backend folder (copy from `backend/.env.example` and fill real values):

```env
DATABASE_URL="mysql://u500831783_Sembuzzz:YOUR_ACTUAL_DB_PASSWORD@localhost:3306/u500831783_Sembuzzz"
PORT=3000
NODE_ENV=production
JWT_SECRET="generate-a-long-random-string-here"
CORS_ORIGIN="https://sembuzz.com,https://www.sembuzz.com"
API_URL="https://api.sembuzz.com"
FRONTEND_URL="https://sembuzz.com"
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=your-smtp-password
SMTP_FROM=admin@sembuzz.com
```

- Replace `YOUR_ACTUAL_DB_PASSWORD` with your real DB password.  
- Replace `localhost` in `DATABASE_URL` if Hostinger gives a different MySQL host.  
- Use a strong random string for `JWT_SECRET` (e.g. `openssl rand -base64 32`).

3. **Install, generate Prisma, run migrations, build and start:**

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run prisma:seed
PORT=3000 node dist/main.js
```

4. **Keep the process running:** use a process manager (e.g. **PM2**):

```bash
npm install -g pm2
pm2 start dist/main.js --name sembuzz-api
pm2 save
pm2 startup
```

5. **Point the domain to the API:**  
   - Either use a **subdomain** `api.sembuzz.com` and point it to the server/IP and reverse-proxy (e.g. Nginx) to `http://127.0.0.1:3000`.  
   - Or use the same domain with a path (e.g. `https://sembuzz.com/api`) and proxy that path to `http://127.0.0.1:3000`.

### 2. Web (frontend) on the server

1. **Build locally** (or on the server) with the **production API URL**:

```bash
cd web
# Use your real API URL (subdomain or same-domain path)
export VITE_API_URL="https://api.sembuzz.com"
npm ci
npm run build
```

2. **Upload the contents of `web/dist`** to the folder that serves your domain (e.g. `public_html` for sembuzz.com).

3. **Configure the web server** so that all routes (e.g. `/events`, `/super-admin/*`) serve `index.html` (SPA fallback).

---

## Option B: Shared hosting (no Node.js)

If you only have **shared hosting** (no Node.js):

- **Web:** Build as above and upload `web/dist` to `public_html`. You can still host the frontend on Hostinger.  
- **Backend:** You must run the NestJS API elsewhere, e.g.:  
  - A **Hostinger VPS** (then follow Option A for backend), or  
  - Another cloud (Railway, Render, Fly.io, etc.), then set `VITE_API_URL` and `API_URL`/`CORS_ORIGIN` to that API URL.

---

## Checklist

- [ ] Database created on Hostinger (you have: user `u500831783_Sembuzzz`, DB `u500831783_Sembuzzz`).  
- [ ] Backend `.env` on server with correct `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `API_URL`, `FRONTEND_URL`, SMTP.  
- [ ] Backend: `prisma generate`, `prisma migrate deploy`, `prisma:seed`, then `npm run build` and run with PM2 (or similar).  
- [ ] Web built with `VITE_API_URL` set to your live API URL.  
- [ ] Web `dist` uploaded to the document root for sembuzz.com and SPA fallback configured.  
- [ ] DNS: sembuzz.com (and www) point to the server; if you use api.sembuzz.com, add an A/CNAME record for it.

---

## URLs to use

- **Frontend:** `https://sembuzz.com` (and optionally `https://www.sembuzz.com`).  
- **API:** e.g. `https://api.sembuzz.com` (recommended) or `https://sembuzz.com/api` if you proxy under the same domain.  
- In **backend** `.env`: `API_URL` and `FRONTEND_URL` must match these.  
- In **web** build: `VITE_API_URL` must be the same as the API URL users will call from the browser.

---

## Security

- **Never** commit `.env` or put the real DB/SMTP password in the repo.  
- Use a strong `JWT_SECRET` in production.  
- Keep `CORS_ORIGIN` limited to your real frontend origins (e.g. `https://sembuzz.com,https://www.sembuzz.com`).
