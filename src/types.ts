export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Point = [number, number];

export type GameMode = 'classic' | 'maze' | 'time_attack' | 'survival';
export type FoodType = 'regular' | 'bonus' | 'golden' | 'ice' | 'poison' | 'mystery';
export type DifficultyProfile = 'modern' | 'retro';

export type ButtonSize = 'small' | 'medium' | 'large';
export type HandOrientation = 'right' | 'left';

export interface GameOverData {
  score: number;
  sessionFoodEaten: number;
  bonusFoodEatenInGame: number;
  foodEatenWithoutWall: number;
  foodEatenAtMaxSpeed: number;
  bonusEatenFast: boolean;
  diedToOwnTail: boolean;
  wallHit: boolean;
  mazePasses: number;
  usedSingleDirection: boolean;
  mode?: GameMode;
}

export interface GameData {
  score: number;
  sessionPlayTime: number; // in seconds
  totalPlayTime: number; // in seconds
  totalFoodEaten: number;
  totalGamesStarted: number;
  foodEatenWithoutWall: number;
  bonusFoodEatenInGame: number;
  foodEatenAtMaxSpeed: number;
  mazePasses: number;
  usedSingleDirection: boolean;
  usedAllThemes: boolean;
  usedCustomTheme: boolean;
  diedToOwnTail: boolean;
  diedNearHighScore: boolean;
  diedFast: boolean;
  mode?: GameMode;
}

export interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  isUnlocked: boolean;
}

export type ControlMode = 'classic' | 'alternative' | 'swipe';
export type Language = 'en' | 'tr';

export interface ThemeColors {
  snakeHead: string;
  snakeBody: string;
  food: string;
  map: string;
  obstacle: string;
  bonusOuter: string;
  bonusInner: string;
  grid: string;
  particle: string;
}

export interface SavedGameState {
  snake: Point[];
  obstacles: Point[];
  direction: Direction;
  food: Point;
  bonusFood: Point | null;
  score: number;
  gameSpeed: number;
  isGameRunning: boolean;
  mode?: GameMode;
}
