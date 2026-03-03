# Fix Prisma Client "Invalid invocation" Error

If you see an error like:
`Error in Prisma Client request: Invalid \`p=e.match(BAt)?.[1]...\` invocation in node_modules/prisma/build/index.js`

Try these steps in order:

## 1. Regenerate Prisma Client (already done)
```bash
cd backend
npx prisma generate
```

## 2. Clean reinstall (if error persists)
```bash
cd backend
rm -rf node_modules
npm install
npx prisma generate
```

## 3. Restart everything
- Stop Prisma Studio (Ctrl+C) and the backend if running.
- Start backend: `npm run start:dev`
- If using Prisma Studio: `npx prisma studio`

## 4. Node version
Prisma 5.20 works best with Node 18+. Check: `node -v`

If the error still appears after step 2, try clearing npm cache and reinstalling:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```
