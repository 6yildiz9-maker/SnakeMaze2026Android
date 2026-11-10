import { STORAGE_KEYS, storage } from './storage.ts';
import { GameOverData } from '../types.ts';

export interface DetailedCareerStats {
  totalGames: number;
  totalFoodEaten: number;
  totalPlayTimeSeconds: number;
  highScore: number;
  longestSnake: number;
  highestLevel: number;
  bonusFoodsCaught: number;
  averageGameDurationSeconds: number;
  modeHighScores: {
    maze: number;
    classic: number;
    time_attack: number;
    survival: number;
  };
}

const DEFAULT_CAREER_STATS: DetailedCareerStats = {
  totalGames: 0,
  totalFoodEaten: 0,
  totalPlayTimeSeconds: 0,
  highScore: 0,
  longestSnake: 3,
  highestLevel: 1,
  bonusFoodsCaught: 0,
  averageGameDurationSeconds: 0,
  modeHighScores: {
    maze: 0,
    classic: 0,
    time_attack: 0,
    survival: 0,
  },
};

export class CareerManager {
  public getStats(): DetailedCareerStats {
    const stored = storage.getJson<DetailedCareerStats | null>(STORAGE_KEYS.careerData, null);
    if (!stored) {
      // Migrate from standard keys if present
      const hs = storage.getNumber(STORAGE_KEYS.highScore, 0);
      const tf = storage.getNumber(STORAGE_KEYS.totalFood, 0);
      const tt = storage.getNumber(STORAGE_KEYS.totalPlayTime, 0);
      const tg = storage.getNumber(STORAGE_KEYS.totalGamesStarted, 0);
      return {
        ...DEFAULT_CAREER_STATS,
        highScore: hs,
        totalFoodEaten: tf,
        totalPlayTimeSeconds: tt,
        totalGames: tg,
        modeHighScores: {
          maze: hs,
          classic: 0,
          time_attack: 0,
          survival: 0,
        },
      };
    }
    return stored;
  }

  public recordSession(
    data: GameOverData,
    durationSeconds: number,
    finalSnakeLength: number,
    levelReached: number
  ): DetailedCareerStats {
    const current = this.getStats();
    const newTotalGames = current.totalGames + 1;
    const newTotalTime = current.totalPlayTimeSeconds + durationSeconds;
    const newTotalFood = current.totalFoodEaten + data.sessionFoodEaten;
    const newHighScore = Math.max(current.highScore, data.score);
    const newLongest = Math.max(current.longestSnake, finalSnakeLength);
    const newHighestLevel = Math.max(current.highestLevel, levelReached);
    const newBonusCount = current.bonusFoodsCaught + data.bonusFoodEatenInGame;
    const newAvgDuration = Math.round(newTotalTime / newTotalGames);

    const mode = data.mode || 'maze';
    const modeScores = {
      ...current.modeHighScores,
      [mode]: Math.max(current.modeHighScores[mode] || 0, data.score),
    };

    const updated: DetailedCareerStats = {
      totalGames: newTotalGames,
      totalFoodEaten: newTotalFood,
      totalPlayTimeSeconds: newTotalTime,
      highScore: newHighScore,
      longestSnake: newLongest,
      highestLevel: newHighestLevel,
      bonusFoodsCaught: newBonusCount,
      averageGameDurationSeconds: newAvgDuration,
      modeHighScores: modeScores,
    };

    storage.setItem(STORAGE_KEYS.careerData, JSON.stringify(updated));
    return updated;
  }
}

export const careerManager = new CareerManager();
