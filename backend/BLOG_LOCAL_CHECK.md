# Check blogs locally (approved posts public)

## 1. Start services

**Terminal 1 — API (needs MySQL running and `DATABASE_URL` in `.env`)**

```bash
cd backend
npm install
npx prisma migrate deploy
npm run start:dev
```

**Terminal 2 — Web**

```bash
cd web
npm install
npm run dev
```

## 2. Verify public blog list (no login)

Returns JSON array of **approved** blogs (same as shown on `/events` feed + `/blogs`):

```bash
# All schools (canonical)
curl -s "http://localhost:3000/public/blogs" | python3 -m json.tool

# Legacy alias (same data)
curl -s "http://localhost:3000/events/blogs" | python3 -m json.tool

# One school
curl -s "http://localhost:3000/public/blogs?schoolId=YOUR_SCHOOL_ID" | python3 -m json.tool
```

**Production nginx:** proxy `/public/blogs` and `/public/blog/` to the Nest API (same as `/events/approved`).

If the array is empty but you approved blogs, confirm the blog’s **school** matches the `schoolId` you pass (or omit `schoolId` to list all schools).

## 3. Category admin “approved blogs” (browser)

1. Open `http://localhost:5173` (or your Vite URL).
2. Log in as **category admin** → **Blogs** → tab **View approved blogs**.
3. You should see the same posts you approved. Use the **trash** icon to delete (confirm in the modal).

**curl (optional)** — needs a JWT from login:

```bash
export TOKEN="paste_category_admin_jwt_here"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/category-admin/blogs/approved" | python3 -m json.tool
```

## 4. Public pages in the browser

- **Events feed (blogs mixed in):** `http://localhost:5173/events`
- **Blogs only:** `http://localhost:5173/blogs`
