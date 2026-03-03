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

2. Configure API URL (optional). By default the app uses `http://localhost:3000`. For a physical device or emulator, set:

   - **Android emulator**: use `http://10.0.2.2:3000` (alias for host machine).
   - **iOS simulator**: `http://localhost:3000` works.
   - **Physical device**: use your computer’s LAN IP, e.g. `http://192.168.1.10:3000`.

   Create a `.env` file in `mobile/`:

   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
   ```

   Or run with env:

   ```bash
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npm start
   ```

3. Start the backend from the repo root:

   ```bash
   cd backend && npm run start:dev
   ```

4. Start Expo:

   ```bash
   npm start
   ```

   Then press `a` for Android or `i` for iOS in the terminal, or scan the QR code with Expo Go.

## Features (aligned with web)

- **Home (Events)**: Feed of approved news with “My school” / “All schools” tabs (when logged in); same dark tab bar and white active underline as web.
- **Search**: Placeholder (search UI can be added later).
- **Settings**: Log in / Log out; account info when logged in.
- **Auth**: Login uses same backend (`/user/auth/login`); token stored in AsyncStorage and sent with API requests.

## Scripts

- `npm start` — Start Expo dev server
- `npm run android` — Run on Android
- `npm run ios` — Run on iOS
- `npm run web` — Run in browser (Expo web)

## Tech stack

- **Expo** ~55
- **React Navigation** (bottom tabs + native stack)
- **Axios** for API calls
- **AsyncStorage** for auth token
- **TypeScript**
