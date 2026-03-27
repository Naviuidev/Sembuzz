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
2. **Expo Push (required for iOS TestFlight / EAS builds):** No extra env is required for basic sending. Optional: `EXPO_ACCESS_TOKEN` from [expo.dev](https://expo.dev) for higher limits / automation.
3. **FCM (Android native tokens):** Add Firebase credentials to **`backend/.env`**. Use **one** of:
   - `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to the Firebase service account JSON file.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — single-line JSON string of that service account (common on PaaS).
4. Restart the API. Tokens starting with `ExponentPushToken[` are sent via **Expo**; other tokens are sent via **FCM** if Firebase is configured.

## Mobile (Expo)

1. The app registers an **Expo push token** (`getExpoPushTokenAsync` + EAS `projectId` from `app.json`) after login when notification permission is granted (`useRegisterPushToken`). **iOS does not use a raw APNs token with Firebase FCM** — that path fails; Expo Push is the supported pipeline for EAS iOS builds.
2. Add **Firebase** to the project for Android (`google-services.json`); iOS uses `GoogleService-Info.plist` for other features as needed.
3. Use a **development/production build** (Expo Go has limits for push). After changing push registration, ship a **new TestFlight build** and open the app once so the new token is stored.

## API (Bearer user JWT)

| Method | Path | Body |
|--------|------|------|
| POST | `/user/notifications/push-token` | `{ "token": "<fcm token>", "platform": "android" \| "ios" }` |
| DELETE | `/user/notifications/push-token?token=...` | — |
| GET | `/user/notifications/subcategories` | — |
| PUT | `/user/notifications/subcategories` | `{ "subCategoryIds": ["uuid", ...] }` |

Payload data on news approval: `eventId`, `type: news_approved`.
