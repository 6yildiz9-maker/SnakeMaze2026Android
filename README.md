# Pixelfang: Snake Maze

A retro Nokia-style snake game featuring maze obstacles, bonus foods, dynamic career ranks, 25 unlockable achievements, customizable themes, and multiple game modes.

## Android app scope

This repository builds the Android/Tablet Google Play application. The Capacitor/Gradle project is in `apps/android`; the shared React game source and npm build configuration remain at the repository root because Capacitor packages their output into the native app. The standalone, ad-free PWA is maintained separately at [SnakeMaze2026Web](https://github.com/6yildiz9-maker/SnakeMaze2026Web).

Never commit `.env` files or credentials. If a real secret is accidentally committed, revoke and rotate it immediately with its provider, replace it in every affected environment, then remove it from repository history only through the repository's approved secret-removal procedure.

## Game Modes & Balance Profiles

- **Game Modes**:
  - **Maze (Labirent)**: Dynamic 2x2 obstacles spawn after the configured score threshold, with reachability checked against the next food cell. Supports custom user mazes.
  - **Classic (Klasik)**: Obstacle-free retro snake with wrapping borders; specialized food is disabled.
  - **Time Attack (Zamana Karşı)**: 60-second timer rush with HUD countdown; specialized food is disabled.
  - **Survival (Hayatta Kalma)**: High initial speed (220ms) and aggressive acceleration (+4 speed increment).
- **Balance Profiles (DifficultyManager)**:
  - **Modern (Balanced)**: Obstacles start at 40 points so early play is smooth.
  - **Retro (Classic v1.0)**: Obstacles start at 10 points (original steep curve).

## Features

- **Classic Nokia LCD Aesthetic**: Desktop console casing and optional LCD scanline/glare effects, with ten preset themes (including Nokia 3310, GameBoy 1989, Cyberpunk 2077, Pip-Boy, and Paper/Sketch).
- **Core Gameplay Mechanics**:
  - Grid wrapping borders.
  - Progressive speed acceleration (300ms down to 80ms min speed).
  - 2x2 Maze obstacle generation at score thresholds with BFS path accessibility.
  - 6 Distinct Food Types: Regular, Bonus (+3), Golden (+5), Ice (Slows down), Poison (Removes segment), Mystery (Surprise effect).
  - Timed Bonus Food with 5-second lifespan and rotating guide sparklers.
  - 3-second countdown on new game and resume; the first direction input skips it without turning.
  - State autosave and resume functionality across tab closures (beforeunload/pagehide).
  - Saved games retain food type, mode, balance profile, speed, and remaining time.
- **Multiple Control Modes**:
  - **Classic (Zik-zak)**: Authentic 2-button relative turning (Left/Down and Right/Up).
  - **D-Pad**: 4-way direct directional buttons.
  - **Swipe**: Touch/pointer gesture controls.
  - **Keyboard**: Arrow keys always choose absolute directions. In Classic mode, A/D turn relative to the snake (left/down or right/up); W/S remain absolute up/down. Space pauses or resumes.
- **Career & Achievements**:
  - Tracks High Score, Total Food Eaten, Total Play Time, and Games Started.
  - 7 Dynamic Ranks with progress indicators and optional rank-based snake decorations.
  - 25 Achievements across Milestones, Skill, Cumulative, and Hidden categories with pixel-art icons and queued toast notifications.
- **Audio & Haptics**:
  - Web Audio API sound effects, optional chiptune background music that pauses when the app is backgrounded, and sound-file fallback when Web Audio is unavailable.
  - Android haptics and touch vibration support.
- **Android Advertising**: Rewarded and interstitial ads are Android-only; user rewards are granted only after AdMob reports the earned-reward event. EEA/UK consent is requested through Google's UMP flow before loading ads.
- **Safe Ad Testing**: Google demo ad units are the default, including for Android debug APKs. Production units are selected only with `VITE_ADMOB_USE_TEST_IDS=false` for a reviewed Play release build.
- **Responsive Canvas & Motion**: Retina-aware canvas rendering, optional smooth movement, and reduced-motion preference support.
- **Full Localization**:
  - English (EN) and Turkish (TR) language toggle.
- **Offline gameplay**: Game assets are bundled into the Android app; ad requests require an internet connection.

## Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Type-check and lint
npm run lint

# Run reducer and utility tests
npm test

# Build the web assets bundled into the Android app (AdMob test IDs are selected by default)
npm run build
```

### Android test builds

The Android Gradle project and native source are tracked separately under `apps/android/`. The root `src/`, `public/`, `index.html`, `package.json`, and Vite/Capacitor configuration are required to build the game's Android WebView content. Generated web assets, local SDK configuration, build outputs, and signing files remain ignored:

```bash
npm ci
npm run build
npx cap sync android
node scripts/configure-android-admob.mjs
node scripts/configure-android-immersive.mjs
```

Build with JDK 21 from the `apps/android` directory (`.\gradlew.bat assembleDebug` on Windows or `./gradlew assembleDebug` on macOS/Linux). Capacitor sync regenerates web/plugin assets; the checked-in native source retains the app identity and branding. The debug APK uses Google's demo ad units; never test with production ad-unit IDs.

### Signed Play release builds

The Android workflow creates a debug APK on CI. A signed Play AAB is an explicit manual workflow action and requires the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`. The Play build switches to this app's production AdMob unit IDs only for that release job. Keep the upload keystore private and back it up securely; do not commit it.
