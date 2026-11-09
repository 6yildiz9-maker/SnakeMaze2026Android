# Snake Maze 2026

A retro Nokia-style snake game featuring maze obstacles, bonus foods, dynamic career ranks, 19 unlockable achievements, customizable themes, and multiple control modes.

## Platform

This repository contains the responsive **Web** port (React + TypeScript + Tailwind CSS), with installable PWA and offline support targeted. It does not contain a native Android application or Gradle build.

The viewport keeps pinch zoom disabled to prevent mobile browser zoom gestures from interfering with the game's full-screen directional touch controls. This limits a browser accessibility feature; players who need page zoom should use browser-level accessibility controls.

Never commit `.env` files or credentials. If a real secret is accidentally committed, revoke and rotate it immediately with its provider, replace it in every affected environment, then remove it from repository history only through the repository's approved secret-removal procedure.

## Features

- **Classic Nokia LCD Aesthetic**: Desktop console casing and optional LCD scanline/glare effects, with ten preset themes (including Nokia 3310, GameBoy 1989, Cyberpunk 2077, Pip-Boy, and Paper/Sketch).
- **Core Gameplay Mechanics**:
  - Grid wrapping borders.
  - Progressive speed acceleration (300ms down to 80ms min speed).
  - 2x2 Maze obstacle generation at score thresholds.
  - Timed Bonus Food with 5-second lifespan (+3 points, +2 segments growth).
  - 3-second countdown on new game and resume; the first direction input skips it without turning.
  - State autosave and resume functionality.
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
