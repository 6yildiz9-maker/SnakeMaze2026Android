import { STORAGE_KEYS, storage, getModeHighScore, setModeHighScore } from './storage.ts';
import { GameOverData, GameMode } from '../types.ts';

export interface DetailedCareerStats {
  totalGames: number;
  totalFoodEaten: number;
  totalPlayTimeSeconds: number;
  highScore: number;
  longestSnake: number;
  highestLevel: number;
  bonusFoodsCaught: number;
  bonusFoodsSpawned: number;
  bonusSuccessRate: number; // percentage (0 - 100)
  averageGameDurationSeconds: number;
  mostUsedTheme: string;
  themeUsage: Record<string, number>;
  dailyRecord: { date: string; score: number };
  weeklyRecord: { week: string; score: number };
  modeHighScores: {
    maze: number;
    classic: number;
    time_attack: number;
    survival: number;
  };
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDay.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  return `${year}-W${weekNum}`;
}

const DEFAULT_CAREER_STATS: DetailedCareerStats = {
  totalGames: 0,
  totalFoodEaten: 0,
  totalPlayTimeSeconds: 0,
  highScore: 0,
  longestSnake: 3,
  highestLevel: 1,
  bonusFoodsCaught: 0,
  bonusFoodsSpawned: 0,
  bonusSuccessRate: 0,
  averageGameDurationSeconds: 0,
  mostUsedTheme: 'Nokia 3310 (Original)',
  themeUsage: {},
  dailyRecord: { date: getTodayString(), score: 0 },
  weeklyRecord: { week: getWeekString(), score: 0 },
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
          maze: getModeHighScore('maze') || hs,
          classic: getModeHighScore('classic'),
          time_attack: getModeHighScore('time_attack'),
          survival: getModeHighScore('survival'),
        },
      };
    }

    // Ensure all modern fields exist with fallbacks
    return {
      ...DEFAULT_CAREER_STATS,
      ...stored,
      modeHighScores: {
        maze: stored.modeHighScores?.maze ?? getModeHighScore('maze') ?? stored.highScore,
        classic: stored.modeHighScores?.classic ?? getModeHighScore('classic'),
        time_attack: stored.modeHighScores?.time_attack ?? getModeHighScore('time_attack'),
        survival: stored.modeHighScores?.survival ?? getModeHighScore('survival'),
      },
      dailyRecord: stored.dailyRecord ?? { date: getTodayString(), score: 0 },
      weeklyRecord: stored.weeklyRecord ?? { week: getWeekString(), score: 0 },
      themeUsage: stored.themeUsage ?? {},
      mostUsedTheme: stored.mostUsedTheme ?? 'Nokia 3310 (Original)',
    };
  }

  public recordSession(
    data: GameOverData,
    durationSeconds: number,
    finalSnakeLength: number,
    levelReached: number,
    themeName?: string,
    bonusSpawnedCount: number = 0
  ): DetailedCareerStats {
    const current = this.getStats();
    const newTotalGames = current.totalGames + 1;
    const newTotalTime = current.totalPlayTimeSeconds + durationSeconds;
    const newTotalFood = current.totalFoodEaten + data.sessionFoodEaten;
    const newHighScore = Math.max(current.highScore, data.score);
    const newLongest = Math.max(current.longestSnake, finalSnakeLength);
    const newHighestLevel = Math.max(current.highestLevel, levelReached);
    const newBonusCount = current.bonusFoodsCaught + data.bonusFoodEatenInGame;
    const newBonusSpawned = current.bonusFoodsSpawned + Math.max(bonusSpawnedCount, data.bonusFoodEatenInGame);
    const newBonusSuccessRate = newBonusSpawned > 0 ? Math.round((newBonusCount / newBonusSpawned) * 100) : 0;
    const newAvgDuration = Math.round(newTotalTime / newTotalGames);

    // Theme usage tracking
    const themeUsage = { ...current.themeUsage };
    if (themeName) {
      themeUsage[themeName] = (themeUsage[themeName] || 0) + 1;
    }
    let mostUsedTheme = current.mostUsedTheme;
    let maxThemeCount = 0;
    for (const [tName, count] of Object.entries(themeUsage)) {
      if (count > maxThemeCount) {
        maxThemeCount = count;
        mostUsedTheme = tName;
      }
    }

    // Daily & Weekly record
    const today = getTodayString();
    const currentWeek = getWeekString();

    const dailyScore =
      current.dailyRecord.date === today
        ? Math.max(current.dailyRecord.score, data.score)
        : data.score;
    const dailyRecord = { date: today, score: dailyScore };

    const weeklyScore =
      current.weeklyRecord.week === currentWeek
        ? Math.max(current.weeklyRecord.score, data.score)
        : data.score;
    const weeklyRecord = { week: currentWeek, score: weeklyScore };

    // Per-mode record (FR-13-R)
    const mode: GameMode = data.mode || 'maze';
    const currentModeScore = current.modeHighScores[mode] || 0;
    const newModeScore = Math.max(currentModeScore, data.score);
    const modeScores = {
      ...current.modeHighScores,
      [mode]: newModeScore,
    };
    setModeHighScore(mode, newModeScore);

    const updated: DetailedCareerStats = {
      totalGames: newTotalGames,
      totalFoodEaten: newTotalFood,
      totalPlayTimeSeconds: newTotalTime,
      highScore: newHighScore,
      longestSnake: newLongest,
      highestLevel: newHighestLevel,
      bonusFoodsCaught: newBonusCount,
      bonusFoodsSpawned: newBonusSpawned,
      bonusSuccessRate: newBonusSuccessRate,
      averageGameDurationSeconds: newAvgDuration,
      mostUsedTheme,
      themeUsage,
      dailyRecord,
      weeklyRecord,
      modeHighScores: modeScores,
    };

    storage.setItem(STORAGE_KEYS.careerData, JSON.stringify(updated));
    return updated;
  }
}

export const careerManager = new CareerManager();
