export const STORAGE_KEYS = {
  language: 'My_Lang',
  soundEnabled: 'sound_on',
  controlMode: 'control_preference',
  customSnakeHeadColor: 'custom_snake_head_color',
  customSnakeBodyColor: 'custom_snake_body_color',
  customFoodColor: 'custom_food_color',
  customMapColor: 'custom_map_color',
  lcdEffectsEnabled: 'lcd_effects_enabled',
  smoothMotionEnabled: 'smooth_motion_enabled',
  musicEnabled: 'music_enabled',
  musicHintShown: 'music_hint_shown',
  rankDecorationsEnabled: 'rank_decorations_enabled',
  highScore: 'high_score',
  totalFood: 'total_food',
  totalPlayTime: 'total_play_time',
  totalGamesStarted: 'total_games_started',
  savedVersion: 'saved_v',
  savedSnake: 'saved_snake_body',
  savedObstacles: 'saved_obstacles',
  savedDirection: 'saved_direction',
  savedFoodX: 'saved_food_x',
  savedFoodY: 'saved_food_y',
  savedScore: 'saved_score',
  savedGameSpeed: 'saved_game_speed',
  savedBonusFoodX: 'saved_bonus_food_x',
  savedBonusFoodY: 'saved_bonus_food_y',
  savedBonusFoodRemaining: 'saved_bonus_food_remaining',
  savedGameRunning: 'saved_is_game_running',
  vibrationEnabled: 'vibration_enabled',
  buttonSize: 'button_size',
  handOrientation: 'hand_orientation',
  difficultyProfile: 'difficulty_profile',
  selectedMode: 'selected_mode',
  careerData: 'career_data',
  dailyQuests: 'daily_quests',
  customMazes: 'custom_mazes',
  usedAllThemes: 'used_all_themes',
  usedCustomTheme: 'used_custom_theme',
  usedPresetThemes: 'used_preset_themes',
  achievementPrefix: 'achievement_',
} as const;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.error('Browser storage is unavailable:', error);
    return null;
  }
}

export const storage = {
  getItem(key: string): string | null {
    return getStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string): void {
    const store = getStorage();
    if (!store) throw new Error('Browser storage is unavailable.');
    store.setItem(key, value);
  },
  removeItem(key: string): void {
    getStorage()?.removeItem(key);
  },
  getNumber(key: string, fallback: number): number {
    const value = Number(this.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  },
  getJson<T>(key: string, fallback: T): T {
    const value = this.getItem(key);
    if (value === null) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Invalid stored JSON for "${key}":`, error);
      return fallback;
    }
  },
};

export function achievementStorageKey(id: string): string {
  return `${STORAGE_KEYS.achievementPrefix}${id}`;
}
