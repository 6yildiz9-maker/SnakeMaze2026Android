import { Achievement, GameData, Language } from '../types.ts';
import { AchievementThresholds, RankThresholds } from '../constants/gameConstants.ts';
import { t } from './translations.ts';
import { achievementStorageKey, storage } from './storage.ts';

export interface AchievementItem {
  id: string;
  nameKey: keyof typeof import('./translations.ts').translations['en'];
  descKey: keyof typeof import('./translations.ts').translations['en'];
  category: 'milestone' | 'skill' | 'cumulative' | 'hidden';
}

export const ALL_ACHIEVEMENTS: AchievementItem[] = [
  // Milestones
  { id: 'egg_breaker', nameKey: 'ach_egg_breaker', descKey: 'ach_desc_egg_breaker', category: 'milestone' },
  { id: 'crawling_started', nameKey: 'ach_crawling_started', descKey: 'ach_desc_crawling_started', category: 'milestone' },
  { id: 'fast_crawler', nameKey: 'ach_fast_crawler', descKey: 'ach_desc_fast_crawler', category: 'milestone' },
  { id: 'python_path', nameKey: 'ach_python_path', descKey: 'ach_desc_python_path', category: 'milestone' },
  { id: 'legendary_dragon', nameKey: 'ach_legendary_dragon', descKey: 'ach_desc_legendary_dragon', category: 'milestone' },

  // Skill
  { id: 'wall_phobia', nameKey: 'ach_wall_phobia', descKey: 'ach_desc_wall_phobia', category: 'skill' },
  { id: 'narrow_passer', nameKey: 'ach_narrow_passer', descKey: 'ach_desc_narrow_passer', category: 'skill' },
  { id: 'bonus_hunter', nameKey: 'ach_bonus_hunter', descKey: 'ach_desc_bonus_hunter', category: 'skill' },
  { id: 'light_speed', nameKey: 'ach_light_speed', descKey: 'ach_desc_light_speed', category: 'skill' },
  { id: 'survivor', nameKey: 'ach_survivor', descKey: 'ach_desc_survivor', category: 'skill' },
  { id: 'no_return', nameKey: 'ach_no_return', descKey: 'ach_desc_no_return', category: 'skill' },

  // Cumulative
  { id: 'glutton', nameKey: 'ach_glutton', descKey: 'ach_desc_glutton', category: 'cumulative' },
  { id: 'loyal_player', nameKey: 'ach_loyal_player', descKey: 'ach_desc_loyal_player', category: 'cumulative' },
  { id: 'time_traveler', nameKey: 'ach_time_traveler', descKey: 'ach_desc_time_traveler', category: 'cumulative' },
  { id: 'fashion_icon', nameKey: 'ach_fashion_icon', descKey: 'ach_desc_fashion_icon', category: 'cumulative' },
  { id: 'artist', nameKey: 'ach_artist', descKey: 'ach_desc_artist', category: 'cumulative' },

  // Hidden
  { id: 'ouroboros', nameKey: 'ach_ouroboros', descKey: 'ach_desc_ouroboros', category: 'hidden' },
  { id: 'so_close', nameKey: 'ach_so_close', descKey: 'ach_desc_so_close', category: 'hidden' },
  { id: 'fast_and_furious', nameKey: 'ach_fast_and_furious', descKey: 'ach_desc_fast_and_furious', category: 'hidden' },
];

export class AchievementsManager {
  public isUnlocked(id: string): boolean {
    return storage.getItem(achievementStorageKey(id)) === 'true';
  }

  public unlock(id: string, onUnlock?: (ach: AchievementItem) => void): boolean {
    if (!this.isUnlocked(id)) {
      storage.setItem(achievementStorageKey(id), 'true');
      const found = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (found && onUnlock) {
        onUnlock(found);
      }
      return true;
    }
    return false;
  }

  public getAllAchievements(): Achievement[] {
    return ALL_ACHIEVEMENTS.map((item) => ({
      id: item.id,
      nameKey: item.nameKey,
      descKey: item.descKey,
      isUnlocked: this.isUnlocked(item.id),
    }));
  }

  public checkAchievements(gameData: GameData, onUnlock?: (ach: AchievementItem) => void) {
    this.checkScoreAchievements(gameData.score, onUnlock);

    // Skill
    if (gameData.foodEatenWithoutWall >= AchievementThresholds.WALL_PHOBIA_FOOD) {
      this.unlock('wall_phobia', onUnlock);
    }
    if (gameData.mazePasses >= AchievementThresholds.NARROW_PASSER_PASSES) {
      this.unlock('narrow_passer', onUnlock);
    }
    if (gameData.bonusFoodEatenInGame >= AchievementThresholds.BONUS_HUNTER_FOOD) {
      this.unlock('bonus_hunter', onUnlock);
    }
    if (gameData.foodEatenAtMaxSpeed >= AchievementThresholds.LIGHT_SPEED_FOOD) {
      this.unlock('light_speed', onUnlock);
    }
    if (gameData.sessionPlayTime >= AchievementThresholds.SURVIVOR_TIME_SECONDS) {
      this.unlock('survivor', onUnlock);
    }
    if (gameData.usedSingleDirection) {
      this.unlock('no_return', onUnlock);
    }

    // Cumulative
    if (gameData.totalFoodEaten >= AchievementThresholds.GLUTTON_FOOD) {
      this.unlock('glutton', onUnlock);
    }
    if (gameData.totalGamesStarted >= AchievementThresholds.LOYAL_PLAYER_GAMES) {
      this.unlock('loyal_player', onUnlock);
    }
    if (gameData.totalPlayTime >= AchievementThresholds.TIME_TRAVELER_SECONDS) {
      this.unlock('time_traveler', onUnlock);
    }
    if (gameData.usedAllThemes) {
      this.unlock('fashion_icon', onUnlock);
    }
    if (gameData.usedCustomTheme) {
      this.unlock('artist', onUnlock);
    }

    // Hidden
    if (gameData.diedToOwnTail && gameData.score > 100) {
      this.unlock('ouroboros', onUnlock);
    }
    if (gameData.diedNearHighScore) {
      this.unlock('so_close', onUnlock);
    }
    if (gameData.diedFast) {
      this.unlock('fast_and_furious', onUnlock);
    }
  }

  public checkScoreAchievements(score: number, onUnlock?: (ach: AchievementItem) => void) {
    if (
      score >= AchievementThresholds.CRAWLING_SCORE_MIN &&
      score <= AchievementThresholds.CRAWLING_SCORE_MAX
    ) {
      this.unlock('crawling_started', onUnlock);
    }
    if (score >= AchievementThresholds.EGG_BREAKER_SCORE) {
      this.unlock('egg_breaker', onUnlock);
    }
    if (score >= AchievementThresholds.FAST_CRAWLER_SCORE) {
      this.unlock('fast_crawler', onUnlock);
    }
    if (score >= AchievementThresholds.PYTHON_PATH_SCORE) {
      this.unlock('python_path', onUnlock);
    }
    if (score >= AchievementThresholds.LEGENDARY_DRAGON_SCORE) {
      this.unlock('legendary_dragon', onUnlock);
    }
  }

  public getRankKey(score: number): keyof typeof import('./translations.ts').translations['en'] {
    if (score > RankThresholds.LEGENDARY) return 'rank_mythical_leviathan';
    if (score > RankThresholds.COBRA_KING) return 'rank_lord_of_serpents';
    if (score > RankThresholds.MAZE_MASTER) return 'rank_cobra_king';
    if (score > RankThresholds.RATTLER) return 'rank_maze_master';
    if (score > RankThresholds.ROOKIE) return 'rank_rattler';
    if (score > RankThresholds.WORM) return 'rank_rookie_snake';
    return 'rank_worm';
  }

  public getRank(score: number, lang: Language): string {
    const key = this.getRankKey(score);
    return t(lang, key);
  }
}

export const achievementsManager = new AchievementsManager();
