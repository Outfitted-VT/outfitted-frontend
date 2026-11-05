# Outfitted Mobile App (iOS & Android)

Native iOS and Android mobile applications for **Outfitted**, powered by **Capacitor 8** and **Vite**.

Outfitted is a social fit-sharing platform: post a look, get votes from friends, and try outfits on yourself with AI try-on. The API lives in [outfitted-backend](https://github.com/Outfitted-VT/outfitted-backend).

---

## Features

- **Native iOS & Android**: Native Xcode project (`ios/`) and Android Studio project (`android/`) with Capacitor bridges.
- **Native Safe Areas & UI**: Status bar styling, splash screen handling, and dynamic island / notch safe area support.
- **Offline & Standalone Ready**: Includes graceful local session fallback when running offline or without the backend server.
- **Dev Server & Live Reload**: Fast local development powered by Vite.

---

## Project Structure

```
outfitted-frontend/
├── ios/                    # Native iOS Xcode project (Swift Package Manager)
│   └── App/
│       ├── App.xcodeproj
│       └── App/            # Info.plist, AppDelegate.swift, public web assets
├── android/                # Native Android Studio Gradle project
│   └── app/                # AndroidManifest.xml, MainActivity.java, assets
├── src/                    # Application source code
│   ├── main.js             # UI rendering, interactions & Capacitor init
│   ├── auth.js             # Auth client with mobile base URL & offline fallback
│   ├── create.js           # Create sheet: post a fit and AI try-on
│   ├── feed.js             # Fit lists (feed, profile) backed by the API
│   ├── fits.js             # API calls for fits, users, and try-ons
│   ├── data.js             # Sample data for screens not yet on the API
│   ├── views/              # HTML templates (fit card, create sheet, profile)
│   ├── styles.css          # Design tokens, mobile responsive & safe-area styles
│   └── connected.css       # Styles for the API-backed screens
├── public/                 # Images served as-is (branding, feed, wardrobe)
├── capacitor.config.json   # Capacitor app and plugin configuration
├── vite.config.js          # Vite bundler configuration
└── package.json            # Scripts and dependencies
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Development (Web Browser)

Start the local dev server with hot module replacement:

```bash
npm run dev
```

Visit `http://localhost:5173`.

### 3. Sync Changes to iOS and Android

Whenever you modify web assets or code in `src/`, rebuild and sync to both platforms:

```bash
npm run cap:sync
```

---

## Running on iOS

### Requirements
- macOS with **Xcode** and Command Line Tools installed.
- CocoaPods (`pod`) or Swift Package Manager (default).

### Open in Xcode
```bash
npm run cap:ios
```
This opens `ios/App/App.xcodeproj` in Xcode. Select a simulator (e.g., iPhone 17) or a connected device and click **Play** (Cmd + R).

### Run from Command Line
```bash
npm run cap:run:ios
```

---

## Running on Android

### Requirements
- **Android Studio** and Android SDK installed.
- Java JDK 17 or 21.

### Open in Android Studio
```bash
npm run cap:android
```
This opens the `android/` project in Android Studio. Select an Android Virtual Device (AVD) or connected device and click **Run**.

### Build Debug APK from Command Line
```bash
cd android && ./gradlew assembleDebug
```
The resulting APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Running the Backend

The app talks to [outfitted-backend](https://github.com/Outfitted-VT/outfitted-backend). Start it on port 8000 and `npm run dev` forwards `/api` and `/media` to it (see `vite.config.js`).

- **iOS Simulator**: reaches the backend at `http://localhost:8000` automatically.
- **Android Emulator**: reaches it at `http://10.0.2.2:8000` (the host machine) automatically.
- **Physical Device**: build with `VITE_API_BASE=http://<your-host-ip>:8000/api/v1` (see `apiBase()` in `src/auth.js`).
