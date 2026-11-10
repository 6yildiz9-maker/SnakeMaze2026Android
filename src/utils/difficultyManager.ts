export type DifficultyProfile = 'modern' | 'retro';

export interface DifficultyLevelInfo {
  level: number;
  nameKey: string;
  minScore: number;
  speed: number; // in ms
  maxObstacles: number;
  obstacleStartScore: number;
  bonusSpawnInterval: number; // e.g. every 10 or 8 foods
  bonusPoints: number;
}

export interface DifficultyConfig {
  profile: DifficultyProfile;
  initialSpeed: number;
  minSpeed: number;
  speedIncrement: number;
  obstacleStartScore: number;
  bonusSpawnInterval: number;
  bonusPoints: number;
  calculateSpeed: (score: number, currentSpeed: number) => number;
  calculateMaxObstacles: (score: number) => number;
  getLevel: (score: number) => number;
}

export const DIFFICULTY_PROFILES: Record<DifficultyProfile, DifficultyConfig> = {
  retro: {
    profile: 'retro',
    initialSpeed: 300,
    minSpeed: 80,
    speedIncrement: 2,
    obstacleStartScore: 10,
    bonusSpawnInterval: 10,
    bonusPoints: 3,
    calculateSpeed(score: number) {
      return Math.max(80, 300 - score * 2);
    },
    calculateMaxObstacles(score: number) {
      if (score < 10) return 0;
      const level = Math.floor(score / 10);
      return level * 4;
    },
    getLevel(score: number) {
      return Math.max(1, Math.floor(score / 10) + 1);
    },
  },
  modern: {
    profile: 'modern',
    initialSpeed: 300,
    minSpeed: 80,
    speedIncrement: 2,
    obstacleStartScore: 40, // Balanced: obstacles begin in intermediate speed zone
    bonusSpawnInterval: 8,
    bonusPoints: 3,
    calculateSpeed(score: number) {
      return Math.max(80, 300 - score * 2);
    },
    calculateMaxObstacles(score: number) {
      if (score < 40) return 0;
      // Start gradually after 40 points
      const level = Math.floor((score - 30) / 10);
      return Math.min(24, level * 4);
    },
    getLevel(score: number) {
      if (score < 20) return 1; // Novice
      if (score < 40) return 2; // Skilled
      if (score < 70) return 3; // Expert
      if (score < 110) return 4; // Master
      return 5; // Legendary
    },
  },
};

export class DifficultyManager {
  private currentProfile: DifficultyProfile = 'modern';

  constructor(profile: DifficultyProfile = 'modern') {
    this.currentProfile = profile;
  }

  public setProfile(profile: DifficultyProfile) {
    this.currentProfile = profile;
  }

  public getProfile(): DifficultyProfile {
    return this.currentProfile;
  }

  public getConfig(): DifficultyConfig {
    return DIFFICULTY_PROFILES[this.currentProfile];
  }

  public getSpeed(score: number): number {
    return this.getConfig().calculateSpeed(score, this.getConfig().initialSpeed);
  }

  public getMaxObstacles(score: number): number {
    return this.getConfig().calculateMaxObstacles(score);
  }

  public getObstacleThreshold(): number {
    return this.getConfig().obstacleStartScore;
  }

  public getBonusInterval(): number {
    return this.getConfig().bonusSpawnInterval;
  }

  public getBonusPoints(): number {
    return this.getConfig().bonusPoints;
  }

  public getLevel(score: number): number {
    return this.getConfig().getLevel(score);
  }

  public getMinSpeed(): number {
    return this.getConfig().minSpeed;
  }

  public rollFoodType(random: () => number, isClassic: boolean, score: number): 'regular' | 'golden' | 'ice' | 'poison' | 'mystery' {
    if (isClassic || score < 15) return 'regular';
    const r = random();
    if (r < 0.08) return 'golden';
    if (r < 0.16) return 'ice';
    if (r < 0.24) return 'poison';
    if (r < 0.32) return 'mystery';
    return 'regular';
  }
}

export const difficultyManager = new DifficultyManager('modern');
