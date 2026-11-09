# Snake Maze 2026

A retro Nokia-style snake game featuring maze obstacles, bonus foods, dynamic career ranks, 19 unlockable achievements, customizable themes, and multiple control modes.

Ported from the original Android application (`com.example.snakemaze2026`) to a responsive, high-performance **React + TypeScript + Tailwind CSS** web application.

## Features

- **Classic Nokia LCD Aesthetic**: Authentic monochrome grid styling with configurable themes (Nokia Classic, Gameboy, Cyberpunk Neon, Matrix Dark, Sunset Arcade).
- **Core Gameplay Mechanics**:
  - Grid wrapping borders.
  - Progressive speed acceleration (300ms down to 80ms min speed).
  - 2x2 Maze obstacle generation at score thresholds.
  - Timed Bonus Food with 5-second lifespan (+3 points, +2 segments growth).
  - 5-second countdown on new game & resume with pre-direction selection.
  - State autosave and resume functionality.
- **Multiple Control Modes**:
  - **Classic (Zik-zak)**: Authentic 2-button relative turning (Left/Down and Right/Up).
  - **D-Pad**: 4-way direct directional buttons.
  - **Swipe**: Touch/pointer gesture controls.
  - **Keyboard**: Arrow keys and WASD with Space to pause.
- **Career & Achievements**:
  - Tracks High Score, Total Food Eaten, Total Play Time, and Games Started.
  - 7 Dynamic Ranks: Worm, Rookie Snake, Rattler, Maze Master, Cobra King, Lord of Serpents, Mythical Leviathan.
  - 19 Achievements across Milestones, Skill, Cumulative, and Hidden categories with toast notifications.
- **Audio & Haptics**:
  - Web Audio API 8-bit sound synthesis and sound file fallbacks for eat, bonus eat, crash, and button clicks.
  - Mobile touch vibration support.
- **Full Localization**:
  - English (EN) and Turkish (TR) language toggle.

## Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build
```
