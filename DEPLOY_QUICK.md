# Quick deploy: Git → VPS

Paths on VPS: **`/var/www/Sembuzz`** · API: **PM2 `sembuzz-api`** from **`/var/www/Sembuzz/backend`** · Web: nginx **`root /var/www/Sembuzz/web/dist`** · API domain: **api.sembuzz.com** → port **3000**.

---

## A. On your machine (before deploy)

```bash
cd /path/to/sembuzz

# See what changed
git status
git diff

# Commit and push (required — VPS only pulls from GitHub)
git add -A
git commit -m "your message"
git push origin main
```

Use your real branch if not `main`.

---

## B. On the VPS (every deploy)

SSH in, then **one shot** (stops if any step fails):

```bash
cd /var/www/Sembuzz && git pull origin main && \
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && \
NODE_OPTIONS="--max-old-space-size=4096" npm run build && \
pm2 restart sembuzz-api && pm2 save && \
cd ../web && npm install && NODE_OPTIONS="--max-old-space-size=4096" npm run build && \
sudo systemctl reload nginx
```

### Same steps, split (easier to debug)

```bash
# 1) Code
cd /var/www/Sembuzz
git pull origin main

# 2) Backend
cd /var/www/Sembuzz/backend
npm install
npx prisma generate
npx prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 restart sembuzz-api
pm2 save

# 3) Frontend (nginx already points at web/dist — no nginx edit needed)
cd /var/www/Sembuzz/web
npm install
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 4) Reload nginx (optional if only API changed)
sudo systemctl reload nginx
```

---

## C. Checklist (don’t skip)

| Step | Why |
|------|-----|
| **Push from laptop first** | VPS only has what’s on `origin/main` |
| **`npm run build` in `web/`** | Browsers load `dist/` — source updates alone do nothing |
| **PM2 runs `/var/www/Sembuzz/backend`** | Not `/root/Sembuzz/backend` |
| **`.env` only on server** | Edit in `backend/` if keys/DB URL change, then `pm2 restart sembuzz-api` |

---

## D. Verify

```bash
# Same commit as GitHub?
cd /var/www/Sembuzz && git log -1 --oneline

# API process + path
pm2 show sembuzz-api
# Expect: script path …/var/www/Sembuzz/backend/dist/main.js, cwd …/backend

# Logs if something breaks
pm2 logs sembuzz-api --lines 50
```

---

## E. If web build runs out of memory

Already using `NODE_OPTIONS="--max-old-space-size=4096"`. If it still fails, try `8192` or build on your Mac and upload `web/dist/` to the server.

---

## G. Images / uploads (news, blogs, posts)

Files live on disk under **`backend/uploads/`** (not in Git). The API serves them at **`https://api.sembuzz.com/uploads/...`**.

If you moved the app from another path (e.g. `/root/Sembuzz` → `/var/www/Sembuzz`), **copy uploads** or images 404:

```bash
# If old backend still exists:
rsync -av /root/Sembuzz/backend/uploads/ /var/www/Sembuzz/backend/uploads/
chown -R root:root /var/www/Sembuzz/backend/uploads   # or www-data if you run as that user
```

After deploy, **`npm run build`** in `web/` so `VITE_API_URL` and image URL logic match production (see `web/.env.production`).

Optional: on **sembuzz.com** nginx, proxy `/uploads/` to port 3000 so wrong host still loads images:

```nginx
location /uploads/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## F. Nginx (one-time; already set for Sembuzz)

- **sembuzz.com** → `root /var/www/Sembuzz/web/dist;` + `try_files … /index.html`
- **api.sembuzz.com** → `proxy_pass http://127.0.0.1:3000;`

Edit: `sudo nano /etc/nginx/sites-enabled/sembuzz` then `sudo nginx -t && sudo systemctl reload nginx`.
