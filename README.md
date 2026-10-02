# Outfitted Mobile App (iOS & Android)

Native iOS and Android mobile applications for **Outfitted**, powered by **Capacitor 8** and **Vite**.

Outfitted is a social fit-sharing platform: post a look, get votes from friends, and try outfits on a 3D avatar with WebGL and `<model-viewer>`.

---

## Features

- **Native iOS & Android**: Native Xcode project (`ios/`) and Android Studio project (`android/`) with Capacitor bridges.
- **3D Interactive Fitting Room & Garment Viewer**: Three.js and Google `<model-viewer>` running smoothly in native WebViews.
- **Native Safe Areas & UI**: Status bar styling, splash screen handling, and dynamic island / notch safe area support.
- **Offline & Standalone Ready**: 3D assets and dependencies are bundled locally. Includes graceful local session fallback when running offline or without the backend server.
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
│   ├── fitting-stage.js    # Three.js 3D avatar & garment stage
│   ├── tryon.js            # Virtual try-on experience
│   ├── data.js             # Sample feed posts, passport data, and history
│   ├── pipeline.js         # Avatar rebuild pipeline stub
│   ├── styles.css          # Design tokens, mobile responsive & safe-area styles
│   ├── landing.css         # Landing page styles
│   └── tryon.css           # Try-on modal styles
├── assets/ / public/       # 3D GLB models (avatar.glb, leggings.glb, raglan-tee.glb) & images
├── scripts/                # Utility scripts & Python auth server
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

## Optional: Running the Auth Backend

The mobile app includes an offline/local session fallback, but you can also run the original Python backend:

```bash
npm run serve
# Or: python scripts/serve.py 5173
```

- **iOS Simulator**: connects to `http://localhost:5173` automatically.
- **Android Emulator**: connects to `http://10.0.2.2:5173` (the host machine address) automatically.
- **Physical Device**: set `localStorage.setItem('OUTFITTED_API_BASE', 'http://<your-host-ip>:5173')` or `window.__API_BASE__`.