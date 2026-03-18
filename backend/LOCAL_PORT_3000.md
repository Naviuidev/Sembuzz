# Port 3000 already in use (`EADDRINUSE`)

Only **one** process can listen on 3000. If `npm run start:dev` fails with this error, an old API is still running (often **without** newer routes like blogs).

**Free the port (macOS/Linux), then start again:**

```bash
lsof -ti :3000 | xargs kill -9
cd backend && npm run start:dev
```

**Windows (PowerShell):**

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

After restart, blog **create** uses `POST /subcategory-admin/events/blog` (same prefix as events). List pages still need `GET /subcategory-admin/blogs/*` — those require this backend build running with the blogs module.

---

## “Internal server error” when saving a blog

Almost always the **`blog_posts` table is missing**. Apply migrations once:

```bash
cd backend
npx prisma migrate deploy
```

Then restart the API. If the UI still shows an error, the message should now say to run migrate (instead of a generic 500).
