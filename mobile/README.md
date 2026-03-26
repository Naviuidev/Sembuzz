# SemBuzz Mobile (React Native + Expo)

Cross-platform mobile app (Android & iOS) for SemBuzz, with the same UI and flow as the web app.

## Structure

- **Backend**: `../backend` — NestJS API (shared by web and mobile)
- **Web**: `../web` — Vite + React frontend
- **Mobile**: this folder — Expo (React Native) for Android & iOS

## Setup

1. Install dependencies (already done if you ran the project creation):

   ```bash
   npm install
   ```

2. Configure environment variables (optional).

   Copy env template:

   ```bash
   cp .env.example .env
   ```

   **API URL** (`src/config/env.ts`):

   - **Default (no `EXPO_PUBLIC_API_URL`):** `https://api.sembuzz.com` — same as production; use this in Expo Go if you only want to test UI against the live API.
   - **Local Nest backend:** set `EXPO_PUBLIC_API_URL=http://localhost:3000` (iOS Simulator) or `http://10.0.2.2:3000` (Android emulator). On a **physical phone**, use your computer’s LAN IP, not `localhost`.

   If you set a local URL, you **must** run the backend or every request will fail with **Axios “Network Error”**.

   **Images from production** (`/uploads/*` on the VPS): if `EXPO_PUBLIC_API_URL` is localhost, `imageSrc` used to point every image at your Mac — files are not there. Set **`EXPO_PUBLIC_ASSET_BASE_URL=https://api.sembuzz.com`** so images load from production while JSON/auth still hit your local API (optional).

   ```env
   EXPO_PUBLIC_FRONTEND_URL=https://sembuzz.com
   ```

3. Start the backend (required only when `EXPO_PUBLIC_API_URL` points at localhost):

   ```bash
   cd ../backend && npm run start:dev
   ```

4. Start Expo:

   ```bash
   npm start
   ```

   Then press `a` for Android or `i` for iOS in the terminal, or scan the QR code with Expo Go.

### Images not loading (remote `/uploads/*`)

- **Android + `http://` (localhost or LAN)** blocks cleartext by default. This project sets `expo-build-properties` → `usesCleartextTraffic: true` so **dev / EAS builds** can load HTTP images. **Expo Go** uses Expo’s prebuilt app — if HTTP images still fail there, point the app at HTTPS by **commenting out** `EXPO_PUBLIC_API_URL` in `.env` (uses `https://api.sembuzz.com`), or run a **development build** (`npx expo run:android` / EAS) after pulling this config.
- **iOS Simulator** to `http://localhost:3000` is allowed via `NSAllowsLocalNetworking` in the same plugin.
- Confirm the Metro log line `[SemBuzz API] base URL:` matches where your API (and static `/uploads`) is actually served.

## Features (Phase 1)

- **Home (Events)**: Feed of approved news with “My school” / “All schools” tabs (when logged in); same dark tab bar and white active underline as web.
- **Search**: School filter + search + result detail.
- **Settings**: Login/logout, account card, recent news, legal links.
- **Apps**: School social account listing with pull-to-refresh.
- **Auth**: Login uses same backend (`/user/auth/login`); token stored in AsyncStorage and sent with API requests.

## Scripts

- `npm start` — Start Expo dev server
- `npm run android` — Run on Android
- `npm run ios` — Run on iOS
- `npm run web` — Run in browser (Expo web)
- `npm run typecheck` — TypeScript check
- `npm run doctor` — Expo diagnostics

## Build / Release (iOS + Android)

`eas.json` is included for internal preview + production profiles.

1. Install EAS CLI:

   ```bash
   npm i -g eas-cli
   ```

2. Login and configure:

   ```bash
   eas login
   eas build:configure
   ```

3. Internal test builds:

   ```bash
   eas build --platform ios --profile preview
   eas build --platform android --profile preview
   ```

4. Production builds:

   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

5. Submit when ready:

   ```bash
   eas submit --platform ios --profile production
   eas submit --platform android --profile production
   ```

## Tech stack

- **Expo** ~55
- **React Navigation** (bottom tabs + native stack)
- **Axios** for API calls
- **AsyncStorage** for auth token
- **TypeScript**
