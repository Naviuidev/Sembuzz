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

   **API + images**: the app **always** uses **`https://api.sembuzz.com`** (`src/config/env.ts`). There is no env override — this avoids broken images on devices/emulators.

   Example `.env` (frontend URL only):

   ```env
   EXPO_PUBLIC_FRONTEND_URL=https://sembuzz.com
   ```

3. Start the backend from the repo root (only if you develop the backend locally):

   ```bash
   cd backend && npm run start:dev
   ```

4. Start Expo:

   ```bash
   npm start
   ```

   Then press `a` for Android or `i` for iOS in the terminal, or scan the QR code with Expo Go.

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
