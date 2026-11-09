export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Point = [number, number];

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
}
