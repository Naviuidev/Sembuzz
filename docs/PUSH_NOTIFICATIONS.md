# Push notifications (FCM + category prefs)

## Behavior

- Users choose **subcategories** in the mobile app (first-login modal or Settings). Preferences sync to `PUT /user/notifications/subcategories`.
- **Empty selection** (skip / clear) → **no** push notifications for new news.
- When a **news event** is **approved** by a category admin, the API notifies users who:
  - belong to the **same school**,
  - have **status** `active`,
  - have that event’s **subcategory** in their prefs,
  - have registered a **device token** via `POST /user/notifications/push-token`.

## Backend

1. Run migration: `cd backend && npx prisma migrate deploy` (or `migrate dev` in dev).
2. Add Firebase credentials to **`backend/.env`** (the same file your API already uses for `DATABASE_URL`, `JWT_SECRET`, etc.—loaded at startup, not committed to git). Use **one** of:
   - `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to the Firebase service account JSON file.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — single-line JSON string of that service account (common on PaaS).
3. Restart the API. If these are unset, approval still works; push is skipped (warning in logs).

## Mobile (Expo)

1. Add **Firebase** to your project: Android `google-services.json`, iOS APNs key uploaded to Firebase (for FCM on iOS).
2. Use a **development/production build** (Expo Go has limits for push).
3. The app registers the device token after login when notification permission is granted (`useRegisterPushToken`).

## API (Bearer user JWT)

| Method | Path | Body |
|--------|------|------|
| POST | `/user/notifications/push-token` | `{ "token": "<fcm token>", "platform": "android" \| "ios" }` |
| DELETE | `/user/notifications/push-token?token=...` | — |
| GET | `/user/notifications/subcategories` | — |
| PUT | `/user/notifications/subcategories` | `{ "subCategoryIds": ["uuid", ...] }` |

Payload data on news approval: `eventId`, `type: news_approved`.
