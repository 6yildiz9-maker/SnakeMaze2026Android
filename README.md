# Snake Maze 2026

A retro Nokia-style snake game featuring maze obstacles, bonus foods, dynamic career ranks, 19 unlockable achievements, customizable themes, and multiple game modes.

## Platform Matrix

| Platform | Target Runtime | Ad & Monetization | Offline / PWA |
| :--- | :--- | :--- | :--- |
| **Google Play (Birincil)** | Android App / AAB (Capacitor Native) | Optional Rewarded AdMob | Full offline cache |
| **PWA (Paralel)** | Mobile Web Browser (Vite PWA) | Ad-free (No-op) | Service Worker + Manifest |
| **Masaüstü Tarayıcı** | Desktop Web (Chrome, Firefox, Safari) | Ad-free (No-op) | Keyboard WASD & Arrows |

The viewport keeps pinch zoom disabled to prevent mobile browser zoom gestures from interfering with the game's full-screen directional touch controls. This limits a browser accessibility feature; players who need page zoom should use browser-level accessibility controls.

Never commit `.env` files or credentials. If a real secret is accidentally committed, revoke and rotate it immediately with its provider, replace it in every affected environment, then remove it from repository history only through the repository's approved secret-removal procedure.

## Game Modes & Balance Profiles

- **Game Modes**:
  - **Maze (Labirent)**: Dynamic 2x2 obstacles spawn as you level up, verified by BFS pathfinding. Supports custom user mazes.
  - **Classic (Klasik)**: Authentic obstacle-free retro snake experience with wrapping borders.
  - **Time Attack (Zamana Karşı)**: 60-second timer rush with HUD countdown timer.
  - **Survival (Hayatta Kalma)**: High initial speed (220ms) and aggressive acceleration (+4 speed increment).
- **Balance Profiles (DifficultyManager)**:
  - **Modern (Balanced)**: Obstacles start at 40 points so early play is smooth.
  - **Retro (Classic v1.0)**: Obstacles start at 10 points (original steep curve).

## Features

- **Classic Nokia LCD Aesthetic**: Desktop console casing and optional LCD scanline/glare effects, with ten 9-color preset themes (including Nokia 3310, GameBoy 1989, Cyberpunk 2077, Pip-Boy, and Paper/Sketch).
- **Core Gameplay Mechanics**:
  - Grid wrapping borders.
  - Progressive speed acceleration (300ms down to 80ms min speed).
  - 2x2 Maze obstacle generation at score thresholds with BFS path accessibility.
  - 6 Distinct Food Types: Regular, Bonus (+3), Golden (+5), Ice (Slows down), Poison (Removes segment), Mystery (Surprise effect).
  - Timed Bonus Food with 5-second lifespan and rotating guide sparklers.
  - 3-second countdown on new game and resume; the first direction input skips it without turning.
  - State autosave and resume functionality across tab closures (beforeunload/pagehide).
- **Multiple Control Modes**:
  - **Classic (Zik-zak)**: Authentic 2-button relative turning (Left/Down and Right/Up).
  - **D-Pad**: 4-way direct directional buttons.
  - **Swipe**: Touch/pointer gesture controls.
  - **Keyboard**: Arrow keys always choose absolute directions. In Classic mode, A/D turn relative to the snake (left/down or right/up); W/S remain absolute up/down. Space pauses or resumes.
- **Career & Achievements**:
  - Tracks High Score, Total Food Eaten, Total Play Time, and Games Started.
  - 7 Dynamic Ranks with progress indicators and optional rank-based snake decorations.
  - 19 Achievements across Milestones, Skill, Cumulative, and Hidden categories with pixel-art icons and queued toast notifications.
- **Audio & Haptics**:
  - Web Audio API sound effects, optional chiptune background music, and sound-file fallback when Web Audio is unavailable.
  - Mobile touch vibration support.
- **Responsive Canvas & Motion**: Retina-aware canvas rendering, optional smooth movement, and reduced-motion preference support.
- **Full Localization**:
  - English (EN) and Turkish (TR) language toggle.
- **Installable and Offline**: Bundled fonts, app manifest, and cache-first service worker keep the game available without a network after the first visit.

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

# Build for production
npm run build
```
