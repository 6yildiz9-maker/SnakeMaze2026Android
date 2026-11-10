import { GameMode } from '../types.ts';
import { TranslationKey } from '../utils/translations.ts';

export interface GameModeConfig {
  id: GameMode;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  hasObstacles: boolean;
  hasBonusFood: boolean;
  timeLimitSeconds?: number;
  speedIncrement: number;
  initialSpeed: number;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  maze: {
    id: 'maze',
    nameKey: 'mode_maze',
    descKey: 'mode_maze_desc',
    hasObstacles: true,
    hasBonusFood: true,
    speedIncrement: 2,
    initialSpeed: 300,
  },
  classic: {
    id: 'classic',
    nameKey: 'mode_classic',
    descKey: 'mode_classic_desc',
    hasObstacles: false,
    hasBonusFood: true,
    speedIncrement: 2,
    initialSpeed: 300,
  },
  time_attack: {
    id: 'time_attack',
    nameKey: 'mode_time_attack',
    descKey: 'mode_time_attack_desc',
    hasObstacles: false,
    hasBonusFood: true,
    timeLimitSeconds: 60,
    speedIncrement: 3,
    initialSpeed: 250,
  },
  survival: {
    id: 'survival',
    nameKey: 'mode_survival',
    descKey: 'mode_survival_desc',
    hasObstacles: true,
    hasBonusFood: true,
    speedIncrement: 4,
    initialSpeed: 220,
  },
};
